const db = require('../config/db');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/security');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const attemptService = require('../services/loginAttemptService');
const {
  selectAdminByUsername,
  selectAdminById,
  updateAdminPasswordAndClearMustChange,
  setAdminMustChangePassword,
} = require('../utils/adminQuery');
const { logAuthEvent, clientIp } = require('../services/authAudit');

const MAX_PASSWORD_LENGTH = 72;

let attemptsTableAvailable = true;

async function probeAttemptsTable() {
  try {
    await db.execute('SELECT 1 FROM login_attempts LIMIT 1');
    attemptsTableAvailable = true;
  } catch (e) {
    attemptsTableAvailable = false;
    console.warn('[auth] login_attempts unavailable; run database/auth_login_security.sql —', e.code || e.message);
  }
}
probeAttemptsTable();

function buildPayload(admin, mustFlag) {
  return {
    sub: admin.id,
    id: admin.id,
    username: admin.username,
    role: admin.role || 'Editor',
    mustChangePassword: Boolean(mustFlag === true || Number(admin.must_change_password) === 1),
    principal: 'admins',
  };
}

function signJwt(admin, mustFlag) {
  return jwt.sign(buildPayload(admin, mustFlag), getJwtSecret(), { expiresIn: '8h' });
}

function signJwtFromPayload(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
}

exports.login = async (req, res, next) => {
  try {
    const rawUser = req.body.username;
    const password = req.body.password;
    const username = typeof rawUser === 'string' ? rawUser.trim() : '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const rows = await selectAdminByUsername(username);
    const ip = clientIp(req);

    if (!rows.length) {
      await logAuthEvent(`LOGIN_FAIL unknown_user=${username}`, { adminId: null, ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const depedEmail = admin.email && String(admin.email).trim() !== '' ? String(admin.email).trim() : null;

    if (attemptsTableAvailable) {
      const gate = await attemptService.checkLoginAllowed(admin.id);
      if (!gate.allowed && gate.code === 'BLOCKED') {
        await logAuthEvent('LOGIN_REJECTED_ACCOUNT_BLOCKED', { adminId: admin.id, ip });
        return res.status(403).json({
          code: 'ACCOUNT_BLOCKED',
          message:
            'Your account is blocked. If this address is on file, a recovery link was sent to your DepEd email.',
        });
      }
      if (!gate.allowed && gate.code === 'LOCKED') {
        await logAuthEvent('LOGIN_REJECTED_TEMP_LOCK', { adminId: admin.id, ip });
        return res.status(429).json({
          code: 'LOGIN_LOCKED',
          message: attemptService.lockMessage(gate.row?.attempt_count || 3),
          retryAfterSeconds: gate.retryAfterSeconds,
        });
      }
    }

    const hash = admin.password;
    if (!hash || typeof hash !== 'string') {
      await logAuthEvent('LOGIN_FAIL_NO_PASSWORD_HASH', { adminId: admin.id, ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      if (attemptsTableAvailable) {
        try {
          const fail = await attemptService.recordFailedAttempt(
            admin.id,
            depedEmail,
            admin.username,
            ip
          );
          if (fail.blocked) {
            await logAuthEvent('LOGIN_REJECTED_ACCOUNT_BLOCKED', { adminId: admin.id, ip });
            return res.status(403).json({
              code: 'ACCOUNT_BLOCKED',
              message: depedEmail
                ? 'Your account is blocked. A recovery link has been sent to your DepEd email.'
                : 'Your account is blocked. Contact ICT — no DepEd email is registered for recovery.',
            });
          }
          if (fail.attemptCount === 3) {
            return res.status(429).json({
              code: 'LOGIN_LOCKED',
              message: 'Too many attempts. Please wait 2 minutes.',
              retryAfterSeconds: 120,
            });
          }
          if (fail.attemptCount === 4) {
            return res.status(429).json({
              code: 'LOGIN_LOCKED',
              message: 'Too many attempts. Please wait 5 minutes.',
              retryAfterSeconds: 300,
            });
          }
        } catch (trackErr) {
          console.error(trackErr);
        }
      } else {
        await logAuthEvent('LOGIN_FAIL_WRONG_PASSWORD no_attempt_tracking', { adminId: admin.id, ip });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (attemptsTableAvailable) {
      try {
        await attemptService.resetAttempts(admin.id);
        await logAuthEvent('LOGIN_ATTEMPTS_RESET_AFTER_SUCCESS', { adminId: admin.id, ip });
      } catch (e) {
        /* ignore */
      }
    }

    await logAuthEvent('LOGIN_SUCCESS', { adminId: admin.id, ip });

    try {
      await db.execute('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);
    } catch (updateErr) {
      console.warn('Could not update admins.last_login:', updateErr.message);
    }

    const mustChange = Number(admin.must_change_password) === 1;
    let token;
    try {
      token = signJwt(admin, mustChange);
    } catch (configErr) {
      console.error(configErr);
      return res.status(500).json({ message: 'Authentication service misconfigured' });
    }

    res.json({
      token,
      expiresIn: '8h',
      mustChangePassword: mustChange,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role || 'Editor',
        email: depedEmail || undefined,
        full_name: admin.full_name || undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Exchange one-time recovery token for JWT (must change password). */
exports.consumeRecovery = async (req, res, next) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const rIp = clientIp(req);
    if (!token || token.length !== 64) {
      await logAuthEvent('RECOVERY_TOKEN_REJECTED invalid_format', { adminId: null, ip: rIp });
      return res.status(400).json({ message: 'Invalid recovery token' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM login_recovery WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    if (!rows.length) {
      await logAuthEvent('RECOVERY_TOKEN_REJECTED invalid_or_expired', { adminId: null, ip: rIp });
      return res.status(400).json({ message: 'Invalid or expired recovery link' });
    }
    const rec = rows[0];

    await db.execute('UPDATE login_recovery SET used = 1 WHERE id = ?', [rec.id]);
    await setAdminMustChangePassword(rec.admin_id, 1);
    if (attemptsTableAvailable) {
      await attemptService.resetAttempts(rec.admin_id);
    }
    await logAuthEvent('RECOVERY_TOKEN_CONSUMED', { adminId: rec.admin_id, ip: rIp });

    const admins = await selectAdminById(rec.admin_id);
    if (!admins.length) {
      return res.status(400).json({ message: 'Account not found' });
    }
    const admin = admins[0];
    admin.must_change_password = 1;

    let jwtToken;
    try {
      jwtToken = signJwt(admin, true);
    } catch (e) {
      return next(e);
    }

    res.json({
      token: jwtToken,
      mustChangePassword: true,
      message: 'Choose a new password to continue.',
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    const mustChange = req.user.mustChangePassword === true;
    const principal = req.user.principal || 'admins';

    const { ok, errors } = validatePasswordStrength(newPassword);
    if (!ok) {
      return res.status(422).json({ message: errors[0] || 'Password does not meet policy', errors });
    }

    if (principal === 'users') {
      const [urows] = await db.execute(
        'SELECT id, username, password, email, role FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (!urows.length) return res.status(404).json({ message: 'Account not found' });
      const u = urows[0];
      if (u.role !== 'admin') {
        return res.status(403).json({ message: 'Not allowed' });
      }
      if (!mustChange) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required' });
        }
        const match = await bcrypt.compare(currentPassword, u.password);
        if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
      await logAuthEvent('PASSWORD_CHANGED users_table', { adminId: null, ip: clientIp(req) });
      const payload = buildUsersAdminPayload({ ...u, password: newHash });
      const token = signJwtFromPayload(payload);
      return res.json({
        token,
        mustChangePassword: false,
        message: 'Password updated',
        user: {
          id: u.id,
          username: u.username,
          role: 'admin',
        },
      });
    }

    const rows = await selectAdminById(userId);
    if (!rows.length) return res.status(404).json({ message: 'Account not found' });
    const admin = rows[0];

    if (!mustChange) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const match = await bcrypt.compare(currentPassword, admin.password);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateAdminPasswordAndClearMustChange(userId, newHash);

    await logAuthEvent('PASSWORD_CHANGED', { adminId: userId, ip: clientIp(req) });

    admin.must_change_password = 0;
    const token = signJwt(admin, false);

    res.json({
      token,
      mustChangePassword: false,
      message: 'Password updated',
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role || 'Editor',
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.status(204).send();
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const principal = req.user.principal || 'admins';

    if (principal === 'users') {
      const [rows] = await db.execute(
        'SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (!rows.length) return res.status(404).json({ message: 'User not found' });
      return res.json(rows[0]);
    }

    const [rows] = await db.execute(
      'SELECT id, username, email, role, full_name FROM admins WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Admin not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const principal = req.user.principal || 'admins';
    
    const body = req.body || {};
    const { full_name, email } = body;

    if (principal === 'users') {
      const [current] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
      if (!current.length) return res.status(404).json({ message: 'User not found' });
      const user = current[0];
      
      await db.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [
          email !== undefined ? email : user.email, 
          userId
        ]
      );
    } else {
      const [current] = await db.execute('SELECT full_name, email FROM admins WHERE id = ?', [userId]);
      if (!current.length) return res.status(404).json({ message: 'Admin not found' });
      const admin = current[0];

      await db.execute(
        'UPDATE admins SET full_name = ?, email = ? WHERE id = ?',
        [
          full_name !== undefined ? full_name : admin.full_name, 
          email !== undefined ? email : admin.email, 
          userId
        ]
      );
    }

    const [updated] = await db.execute(
      principal === 'users' 
        ? 'SELECT id, username, email, role FROM users WHERE id = ?'
        : 'SELECT id, username, email, role, full_name FROM admins WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (err) {
    next(err);
  }
};
