-- Gallery Images Table Creation Script for MySQL 5.1
-- Table: gallery_images
-- Description: Stores individual images within galleries

CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `gallery_id` INT(11) NOT NULL COMMENT 'Foreign key to gallery table',
  `image_filename` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Original image filename',
  `thumbnail_filename` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Thumbnail image filename',
  `order` INT(11) NOT NULL DEFAULT 0 COMMENT 'Display order within gallery',
  `date_created` DATETIME NOT NULL,
  `added_by` INT(11) NULL DEFAULT NULL COMMENT 'User ID who uploaded the image',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, 2 = deleted',
  PRIMARY KEY (`id`),
  INDEX `idx_gallery_id` (`gallery_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order` (`order`),
  INDEX `idx_date_created` (`date_created`),
  FOREIGN KEY (`gallery_id`) REFERENCES `gallery`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Gallery images table for storing individual images within galleries';

