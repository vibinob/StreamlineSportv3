-- News Content Management System - Complete Table Creation Script
-- Compatible with MySQL 5.1
-- 
-- This script creates both the main news table and the bilingual content table
-- Run this script to set up the complete news management system
--
-- Tables created:
-- 1. news - Main news table with metadata and settings
-- 2. news_content - Bilingual content table (English and French)

-- ============================================
-- 1. Main News Table
-- ============================================
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

-- ============================================
-- 2. News Content Table (Bilingual)
-- ============================================
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

-- ============================================
-- Sample Data (Optional - uncomment if needed)
-- ============================================
-- 
-- INSERT INTO `news` (`author`, `news_date`, `show_in_homepage`, `order`, `post_to_public`, `post_to_member`, `date_added`, `status`) 
-- VALUES 
-- ('John Doe', '2024-01-15', 1, 1, 1, 1, NOW(), 1);
-- 
-- SET @news_id = LAST_INSERT_ID();
-- 
-- INSERT INTO `news_content` (`news_id`, `language_id`, `title`, `summary`, `article`, `slug_url`, `date_added`, `status`) 
-- VALUES 
-- (@news_id, 1, 'Welcome to Our New Website', 'We are excited to launch our new website', 'Full article content in English...', 'welcome-to-our-new-website', NOW(), 1),
-- (@news_id, 2, 'Bienvenue sur notre nouveau site web', 'Nous sommes ravis de lancer notre nouveau site web', 'Contenu complet de l''article en français...', 'bienvenue-sur-notre-nouveau-site-web', NOW(), 1);

