DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS prune_archived_audit_logs(IN retention_days INT)
BEGIN
  DELETE FROM audit_logs
  WHERE archived_at IS NOT NULL
  AND archived_at < DATE_SUB(NOW(), INTERVAL retention_days DAY);
  
  SELECT ROW_COUNT() AS deleted_rows;
END $$

CREATE PROCEDURE IF NOT EXISTS archive_old_audit_logs(IN archive_days INT)
BEGIN
  UPDATE audit_logs
  SET archived_at = NOW()
  WHERE archived_at IS NULL
  AND action_type NOT IN ('ROLE_CHANGE', 'ACCOUNT_STATUS_CHANGE', 'SECURITY_SETTING_CHANGE', 'BACKUP_CREATED', 'BACKUP_RESTORED', 'CRITICAL_ERROR')
  AND timestamp < DATE_SUB(NOW(), INTERVAL archive_days DAY)
  LIMIT 10000;
  
  SELECT ROW_COUNT() AS archived_rows;
END $$

DELIMITER ;
