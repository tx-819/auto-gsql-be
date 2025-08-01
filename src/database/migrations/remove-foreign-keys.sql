-- 移除外键约束（如果存在）
-- 注意：这个迁移文件用于移除已存在的物理外键约束

-- 检查并移除chat_message表的外键约束
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'chat_message' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_chat_message_topic'
);

SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE chat_message DROP FOREIGN KEY ', @constraint_name), 
  'SELECT "Foreign key constraint fk_chat_message_topic does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 