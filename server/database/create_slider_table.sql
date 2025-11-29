-- Slider table for managing slider images
-- Compatible with MySQL 5.1

CREATE TABLE IF NOT EXISTS `slider` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `image_en` VARCHAR(255) NOT NULL COMMENT 'English image filename',
  `image_fr` VARCHAR(255) NOT NULL COMMENT 'French image filename',
  `link_en` VARCHAR(500) NULL DEFAULT NULL COMMENT 'English link URL (optional)',
  `link_fr` VARCHAR(500) NULL DEFAULT NULL COMMENT 'French link URL (optional)',
  `order` INT(11) NOT NULL DEFAULT 0 COMMENT 'Display order',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, 2 = deleted',
  `date_created` DATETIME NOT NULL,
  `added_by` INT(11) NULL DEFAULT NULL,
  `date_updated` DATETIME NULL DEFAULT NULL,
  `updated_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_order` (`order`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Slider images table';

