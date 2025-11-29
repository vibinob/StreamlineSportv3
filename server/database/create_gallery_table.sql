-- Gallery Table Creation Script for MySQL 5
-- Table: gallery
-- Description: Stores gallery information with bilingual support

CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `gallery_name_en` VARCHAR(255) NOT NULL DEFAULT '',
  `gallery_name_fr` VARCHAR(255) NOT NULL DEFAULT '',
  `description_en` TEXT NULL DEFAULT NULL,
  `description_fr` TEXT NULL DEFAULT NULL,
  `order` INT(11) NOT NULL DEFAULT 0,
  `member_only` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = public & members, 1 = members only',
  `date_created` DATETIME NOT NULL,
  `added_by` INT(11) NULL DEFAULT NULL COMMENT 'User ID who created the gallery',
  `date_updated` DATETIME NULL DEFAULT NULL,
  `updated_by` INT(11) NULL DEFAULT NULL COMMENT 'User ID who last updated the gallery',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, 2 = deleted',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order` (`order`),
  INDEX `idx_member_only` (`member_only`),
  INDEX `idx_date_created` (`date_created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Gallery table for storing gallery information';

-- Sample data (optional - uncomment if needed)
-- INSERT INTO `gallery` (`gallery_name_en`, `gallery_name_fr`, `description_en`, `description_fr`, `order`, `member_only`, `added_by`, `status`) 
-- VALUES 
-- ('Sample Gallery', 'Galerie Exemple', 'This is a sample gallery', 'Ceci est une galerie exemple', 1, 0, 1, 1);

