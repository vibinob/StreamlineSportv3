-- News Table Creation Script for MySQL 5.1
-- Table: news
-- Description: Main news table storing news metadata and settings

CREATE TABLE IF NOT EXISTS `news` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `author` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Author name',
  `news_date` DATE NOT NULL COMMENT 'Publication date of the news',
  `show_in_homepage` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = hidden, 1 = show on homepage',
  `order` INT(11) NOT NULL DEFAULT 0 COMMENT 'Display order for homepage/news listing',
  `post_to_public` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = not public, 1 = visible to public',
  `post_to_member` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = not for members, 1 = visible to members',
  `date_added` DATETIME NOT NULL COMMENT 'Date when news was created',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, 2 = deleted',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_news_date` (`news_date`),
  INDEX `idx_order` (`order`),
  INDEX `idx_show_in_homepage` (`show_in_homepage`),
  INDEX `idx_post_to_public` (`post_to_public`),
  INDEX `idx_post_to_member` (`post_to_member`),
  INDEX `idx_date_added` (`date_added`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Main news table for storing news metadata';

