-- News Content Table Creation Script for MySQL 5.1
-- Table: news_content
-- Description: Bilingual content table for news articles (English and French)
-- Each news item has 2 records: one for English (language_id=1) and one for French (language_id=2)

CREATE TABLE IF NOT EXISTS `news_content` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `news_id` INT(11) NOT NULL COMMENT 'Foreign key to news table',
  `language_id` TINYINT(1) NOT NULL COMMENT '1 = English, 2 = French',
  `title` VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'News title',
  `summary` TEXT NULL DEFAULT NULL COMMENT 'Short summary/description of the news',
  `article` LONGTEXT NULL DEFAULT NULL COMMENT 'Full article content',
  `image_filename` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Main image filename',
  `image_thumbnail` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Thumbnail image filename',
  `slug_url` VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL-friendly slug for the news article',
  `date_added` DATETIME NOT NULL COMMENT 'Date when content was created',
  `added_by` INT(11) NULL DEFAULT NULL COMMENT 'User ID who created the content',
  `date_updated` DATETIME NULL DEFAULT NULL COMMENT 'Date when content was last updated',
  `updated_by` INT(11) NULL DEFAULT NULL COMMENT 'User ID who last updated the content',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, 2 = deleted',
  PRIMARY KEY (`id`),
  INDEX `idx_news_id` (`news_id`),
  INDEX `idx_language_id` (`language_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_slug_url` (`slug_url`),
  INDEX `idx_date_added` (`date_added`),
  UNIQUE KEY `unique_news_language` (`news_id`, `language_id`),
  CONSTRAINT `fk_news_content_news` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='News content table for bilingual news articles';

