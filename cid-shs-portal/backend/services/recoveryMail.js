/**
 * DepEd / SMTP recovery mail — set SMTP_* env vars in production.
 * Falls back to console log in development.
 */
require('dotenv').config();

function buildRecoveryLink(token) {
  const base = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/admin/reset-access?token=${encodeURIComponent(token)}`;
}

async function sendRecoveryEmail({ to, token, username }) {
  const link = buildRecoveryLink(token);
  const subject = 'SDO SHS Portal — Account recovery';
  const text = `Hello${username ? ` ${username}` : ''},

Someone requested recovery for your administrator account after multiple failed sign-in attempts.

Open this link within 15 minutes to reset access (you will be asked to choose a new password):
${link}

If you did not attempt to sign in, contact your division ICT office immediately.

— SDO Cabuyao SHS Portal`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
      });
      return { sent: true };
    } catch (err) {
      console.error('SMTP recovery send failed:', err.message);
      return { sent: false, link };
    }
  }

  console.warn('[recovery] SMTP not configured — recovery link (dev):');
  console.warn(link);
  return { sent: false, link };
}

module.exports = { sendRecoveryEmail, buildRecoveryLink };
