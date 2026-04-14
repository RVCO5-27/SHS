const db = require('../config/db');
const storageService = require('../services/storageService');
const securityService = require('../services/securityService');
const metadataService = require('../services/metadataService');

/**
 * Issuance Admin Controller - Document and Record management
 */
class IssuanceAdminController {
  /**
   * List issuances with filters and pagination
   */
  async listIssuances(req, res, next) {
    try {
      const { 
        q, category_id, status, folder_id, 
        start_date, end_date, 
        limit = 50, cursor 
      } = req.query;

      let sql = `
        SELECT i.*, c.name as category_name, f.name as folder_name
        FROM issuances i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN folders f ON i.folder_id = f.id
        WHERE i.deleted_at IS NULL
      `;
      const params = [];

      if (q) {
        sql += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.doc_number LIKE ?)`;
        const search = `%${q}%`;
        params.push(search, search, search);
      }

      if (category_id) {
        sql += ` AND i.category_id = ?`;
        params.push(category_id);
      }

      if (status) {
        sql += ` AND i.status = ?`;
        params.push(status);
      }

      if (folder_id) {
        sql += ` AND i.folder_id <=> ?`;
        params.push(folder_id === 'null' || folder_id === '' ? null : folder_id);
      }

      if (start_date && end_date) {
        sql += ` AND i.date_issued BETWEEN ? AND ?`;
        params.push(start_date, end_date);
      }

      // Cursor-based pagination (simple implementation using ID)
      if (cursor) {
        sql += ` AND i.id < ?`;
        params.push(cursor);
      }

      sql += ` ORDER BY i.id DESC LIMIT ?`;
      params.push(parseInt(limit));

      const [rows] = await db.execute(sql, params);
      
      const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : null;

      res.json({
        data: rows,
        pagination: {
          limit: parseInt(limit),
          nextCursor
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create issuance record and handle multi-file upload
   */
  async createIssuance(req, res, next) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      let { 
        title, description, doc_number, series_year, 
        date_issued, effective_date, expiry_date,
        category_id, folder_id, language, jurisdiction,
        status = 'published', signatory, tags
      } = req.body;

      // Deterministic doc_number generation if missing
      if (!doc_number || doc_number.trim() === '') {
        const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(100000 + Math.random() * 900000);
        doc_number = `ISS-${datePart}-${randomPart}`;
      }

      // Mandatory validation guard
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Issuance title is required' });
      }

      // 1. Insert Metadata
      const [result] = await connection.execute(
        `INSERT INTO issuances (
          title, description, doc_number, series_year, 
          date_issued, effective_date, expiry_date,
          category_id, folder_id, language, jurisdiction, status,
          signatory, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title || null, 
          description || null, 
          doc_number, 
          series_year || new Date().getFullYear(), 
          date_issued || new Date().toISOString().split('T')[0], 
          effective_date || null, 
          expiry_date || null,
          category_id || null, 
          folder_id === undefined ? null : (folder_id === 'null' ? null : folder_id), 
          language || 'en', 
          jurisdiction || 'Division', 
          status || 'published',
          signatory || null,
          tags || null
        ]
      );
      const issuanceId = result.insertId;

      // 2. Handle Files
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Virus Scan
          const isClean = await securityService.scanForMalware(file.buffer);
          if (!isClean) throw new Error(`Security threat detected in file: ${file.originalname}`);

          // Validate MIME
          if (!securityService.validateMimeType(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}`);
          }

          // Store
          const stored = await storageService.storeFile(file.buffer, file.originalname, file.mimetype);

          // Extract PDF content if applicable
          let fullText = null;
          if (file.mimetype === 'application/pdf') {
            const extracted = await metadataService.extractPdfContent(file.buffer);
            fullText = extracted.text;
          }

          // Insert into files table
          const [fileResult] = await connection.execute(
            'INSERT INTO files (filename, originalname, path, uploaded_by) VALUES (?, ?, ?, ?)',
            [stored.filename, file.originalname, stored.publicUrl, req.user ? req.user.id : null]
          );
          const fileId = fileResult.insertId;

          // Junction table
          await connection.execute(
            'INSERT INTO issuance_files (issuance_id, file_id, is_primary) VALUES (?, ?, ?)',
            [issuanceId, fileId, file === req.files[0] ? 1 : 0]
          );

          // Update full_text_content if PDF
          if (fullText) {
            await connection.execute(
              'UPDATE issuances SET full_text_content = ? WHERE id = ?',
              [fullText, issuanceId]
            );
          }
        }
      }

      await connection.commit();

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [req.user ? req.user.id : null, 'CREATE_ISSUANCE', issuanceId, null, JSON.stringify({ title, doc_number, status })]
        );
      } catch (logErr) {
        console.error('[IssuanceAdminController] Failed to log action:', logErr.message);
      }

      res.status(201).json({ id: issuanceId, message: 'Issuance created successfully' });
    } catch (err) {
      await connection.rollback();
      next(err);
    } finally {
      connection.release();
    }
  }

  /**
   * Update issuance record and handle multi-file upload
   */
  async updateIssuance(req, res, next) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const { id } = req.params;
      let { 
        title, description, doc_number, series_year, 
        date_issued, effective_date, expiry_date,
        category_id, folder_id, language, jurisdiction,
        status, signatory, tags
      } = req.body;

      // 1. Update Metadata
      await connection.execute(
        `UPDATE issuances SET 
          title = ?, description = ?, doc_number = ?, series_year = ?, 
          date_issued = ?, effective_date = ?, expiry_date = ?,
          category_id = ?, folder_id = ?, language = ?, jurisdiction = ?, status = ?,
          signatory = ?, tags = ?, updated_at = NOW()
        WHERE id = ?`,
        [
          title || null, 
          description || null, 
          doc_number, 
          series_year || new Date().getFullYear(), 
          date_issued || new Date().toISOString().split('T')[0], 
          effective_date || null, 
          expiry_date || null,
          category_id || null, 
          folder_id === undefined ? null : (folder_id === 'null' ? null : folder_id), 
          language || 'en', 
          jurisdiction || 'Division', 
          status || 'published',
          signatory || null,
          tags || null,
          id
        ]
      );

      // 2. Handle Files (if any)
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Virus Scan
          const isClean = await securityService.scanForMalware(file.buffer);
          if (!isClean) throw new Error(`Security threat detected in file: ${file.originalname}`);

          // Validate MIME
          if (!securityService.validateMimeType(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}`);
          }

          // Store
          const stored = await storageService.storeFile(file.buffer, file.originalname, file.mimetype);

          // Extract PDF content if applicable
          let fullText = null;
          if (file.mimetype === 'application/pdf') {
            const extracted = await metadataService.extractPdfContent(file.buffer);
            fullText = extracted.text;
          }

          // Insert into files table
          const [fileResult] = await connection.execute(
            'INSERT INTO files (filename, originalname, path, uploaded_by) VALUES (?, ?, ?, ?)',
            [stored.filename, file.originalname, stored.publicUrl, req.user ? req.user.id : null]
          );
          const fileId = fileResult.insertId;

          // Junction table
          await connection.execute(
            'INSERT INTO issuance_files (issuance_id, file_id, is_primary) VALUES (?, ?, ?)',
            [id, fileId, file === req.files[0] ? 1 : 0]
          );

          // Update full_text_content if PDF
          if (fullText) {
            await connection.execute(
              'UPDATE issuances SET full_text_content = ? WHERE id = ?',
              [fullText, id]
            );
          }
        }
      }

      await connection.commit();

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [req.user ? req.user.id : null, 'UPDATE_ISSUANCE', id, null, JSON.stringify({ title, doc_number, status })]
        );
      } catch (logErr) {
        console.error('[IssuanceAdminController] Failed to log action:', logErr.message);
      }

      res.json({ id, message: 'Issuance updated successfully' });
    } catch (err) {
      await connection.rollback();
      next(err);
    } finally {
      connection.release();
    }
  }

  /**
   * Soft-delete an issuance
   */
  async deleteIssuance(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await db.execute(
        'UPDATE issuances SET deleted_at = NOW(), status = "archived" WHERE id = ?',
        [id]
      );

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [req.user ? req.user.id : null, 'DELETE_ISSUANCE', id, JSON.stringify({ status: 'active' }), JSON.stringify({ status: 'archived', reason })]
        );
      } catch (logErr) {
        console.error('[IssuanceAdminController] Failed to log delete action:', logErr.message);
      }

      res.json({ message: 'Issuance archived successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk operations (publish, unpublish, delete)
   */
  async bulkUpdate(req, res, next) {
    try {
      const { ids, action, value } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDs are required' });

      if (action === 'status') {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(
          `UPDATE issuances SET status = ? WHERE id IN (${placeholders})`,
          [value, ...ids]
        );
      } else if (action === 'delete') {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(
          `UPDATE issuances SET deleted_at = NOW(), status = "archived" WHERE id IN (${placeholders})`,
          [...ids]
        );
      }

      res.json({ message: `Bulk ${action} completed successfully` });

      // Audit log
      try {
        await db.execute(
          'INSERT INTO audit_logs (user_id, action_type, old_value, new_value) VALUES (?, ?, ?, ?)',
          [req.user ? req.user.id : null, `BULK_${action.toUpperCase()}_ISSUANCE`, JSON.stringify({ ids }), JSON.stringify({ value })]
        );
      } catch (logErr) {
        console.error('[IssuanceAdminController] Failed to log bulk action:', logErr.message);
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IssuanceAdminController();
