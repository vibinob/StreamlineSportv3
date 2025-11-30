import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * News API Routes
 * Handles all news-related endpoints
 */

export function createNewsRoutes(query) {
	const router = express.Router();

	// Configure multer for image uploads (memory storage)
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
		fileFilter: (req, file, cb) => {
			const allowedTypes = /jpeg|jpg|png|gif|webp/;
			const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
			const mimetype = allowedTypes.test(file.mimetype);
			if (extname && mimetype) {
				return cb(null, true);
			}
			cb(new Error('Only image files are allowed'));
		}
	});

	// Configure multer for general file uploads (non-images)
	const uploadFile = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for files
		fileFilter: (req, file, cb) => {
			const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|svg)$/i;
			const extname = allowedExtensions.test(path.extname(file.originalname));
			if (extname) {
				return cb(null, true);
			}
			cb(new Error('File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR, 7Z, SVG'));
		}
	});

	// Helper function to get news images directory
	function getNewsImagesPath(clubId) {
		const basePath = path.join(__dirname, '..', 'static', 'images', 'clubs', clubId, 'news');
		const thumbnailPath = path.join(basePath, 'thumbnail');
		return { basePath, thumbnailPath };
	}

	// Helper function to ensure directories exist
	function ensureNewsDirectoriesExist(basePath, thumbnailPath) {
		if (!fs.existsSync(basePath)) {
			fs.mkdirSync(basePath, { recursive: true });
		}
		if (!fs.existsSync(thumbnailPath)) {
			fs.mkdirSync(thumbnailPath, { recursive: true });
		}
	}

	// Helper function to generate slug from title
	function generateSlug(title) {
		if (!title || typeof title !== 'string') return '';
		return title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	// Helper function to ensure slug is unique by appending a number if needed
	async function ensureUniqueSlug(baseSlug, languageId, excludeNewsId = null) {
		if (!baseSlug || !baseSlug.trim()) return baseSlug;
		
		let uniqueSlug = baseSlug.trim();
		let counter = 1;
		
		// Check if slug exists
		let checkQuery = `SELECT id FROM news_content WHERE slug_url = ? AND language_id = ? AND status != 2`;
		let checkParams = [uniqueSlug, languageId];
		
		if (excludeNewsId) {
			checkQuery += ` AND news_id != ?`;
			checkParams.push(excludeNewsId);
		}
		
		let existing = await query(checkQuery, checkParams);
		
		// If slug exists, append a number until we find a unique one
		while (existing.length > 0) {
			counter++;
			uniqueSlug = `${baseSlug.trim()}-${counter}`;
			checkParams[0] = uniqueSlug;
			existing = await query(checkQuery, checkParams);
		}
		
		return uniqueSlug;
	}

	// GET /api/news - Get all news
	router.get('/', async (req, res) => {
		console.log('[News API] GET request received');
		try {
			const rows = await query(
				`SELECT 
					n.id,
					n.author,
					n.news_date,
					n.show_in_homepage,
					n.\`order\`,
					n.post_to_public,
					n.post_to_member,
					n.date_added,
					n.status,
					nc_en.id as content_en_id,
					nc_en.language_id as language_en_id,
					nc_en.title as title_en,
					nc_en.summary as summary_en,
					nc_en.article as article_en,
					nc_en.image_filename as image_en,
					nc_en.image_thumbnail as thumbnail_en,
					nc_en.slug_url as slug_en,
					nc_fr.id as content_fr_id,
					nc_fr.language_id as language_fr_id,
					nc_fr.title as title_fr,
					nc_fr.summary as summary_fr,
					nc_fr.article as article_fr,
					nc_fr.image_filename as image_fr,
					nc_fr.image_thumbnail as thumbnail_fr,
					nc_fr.slug_url as slug_fr
				FROM news n
				LEFT JOIN news_content nc_en ON n.id = nc_en.news_id AND nc_en.language_id = 1 AND nc_en.status != 2
				LEFT JOIN news_content nc_fr ON n.id = nc_fr.news_id AND nc_fr.language_id = 2 AND nc_fr.status != 2
				WHERE n.status != 2 
				ORDER BY n.\`order\` ASC, n.news_date DESC, n.id DESC`
			);
			console.log('[News API] Query returned', rows.length, 'news items');
			res.json({ success: true, data: rows });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news/public - Get all public news (where post_to_public = 1)
	router.get('/public', async (req, res) => {
		const { lang } = req.query;
		const languageId = lang === 'en' ? 1 : 2;
		console.log('[News API] GET public news request, Language:', lang);
		try {
			const rows = await query(
				`SELECT 
					n.id,
					n.author,
					n.news_date,
					n.show_in_homepage,
					n.\`order\`,
					n.post_to_public,
					n.post_to_member,
					n.date_added,
					n.status,
					nc.id as content_id,
					nc.language_id,
					nc.title,
					nc.summary,
					nc.article,
					nc.image_filename as image,
					nc.image_thumbnail as thumbnail,
					nc.slug_url as slug
				FROM news n
				INNER JOIN news_content nc ON n.id = nc.news_id AND nc.language_id = ? AND nc.status != 2
				WHERE n.status != 2 AND n.post_to_public = 1
				ORDER BY n.\`order\` ASC, n.news_date DESC, n.id DESC`,
				[languageId]
			);
			console.log('[News API] Public news query returned', rows.length, 'items');
			res.json({ success: true, data: rows });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news/slug/:slug - Get news by slug
	router.get('/slug/:slug', async (req, res) => {
		const { slug } = req.params;
		const { lang } = req.query;
		const languageId = lang === 'en' ? 1 : 2;
		console.log('[News API] GET by slug:', slug, 'Language:', lang);
		try {
			const rows = await query(
				`SELECT 
					n.id,
					n.author,
					n.news_date,
					n.show_in_homepage,
					n.\`order\`,
					n.post_to_public,
					n.post_to_member,
					n.date_added,
					n.status,
					nc.id as content_id,
					nc.language_id,
					nc.title,
					nc.summary,
					nc.article,
					nc.image_filename as image,
					nc.image_thumbnail as thumbnail,
					nc.slug_url as slug
				FROM news n
				INNER JOIN news_content nc ON n.id = nc.news_id AND nc.language_id = ? AND nc.status != 2
				WHERE n.status != 2 AND n.post_to_public = 1 AND nc.slug_url = ?`,
				[languageId, slug]
			);
			if (rows.length === 0) {
				return res.status(404).json({ success: false, error: 'News not found' });
			}
			console.log('[News API] Found news by slug:', slug);
			res.json({ success: true, data: rows[0] });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news/:id - Get single news item
	router.get('/:id', async (req, res) => {
		const { id } = req.params;
		console.log('[News API] GET by ID:', id);
		try {
			const rows = await query(
				`SELECT 
					n.id,
					n.author,
					n.news_date,
					n.show_in_homepage,
					n.\`order\`,
					n.post_to_public,
					n.post_to_member,
					n.date_added,
					n.status,
					nc_en.id as content_en_id,
					nc_en.language_id as language_en_id,
					nc_en.title as title_en,
					nc_en.summary as summary_en,
					nc_en.article as article_en,
					nc_en.image_filename as image_en,
					nc_en.image_thumbnail as thumbnail_en,
					nc_en.slug_url as slug_en,
					nc_fr.id as content_fr_id,
					nc_fr.language_id as language_fr_id,
					nc_fr.title as title_fr,
					nc_fr.summary as summary_fr,
					nc_fr.article as article_fr,
					nc_fr.image_filename as image_fr,
					nc_fr.image_thumbnail as thumbnail_fr,
					nc_fr.slug_url as slug_fr
				FROM news n
				LEFT JOIN news_content nc_en ON n.id = nc_en.news_id AND nc_en.language_id = 1 AND nc_en.status != 2
				LEFT JOIN news_content nc_fr ON n.id = nc_fr.news_id AND nc_fr.language_id = 2 AND nc_fr.status != 2
				WHERE n.id = ? AND n.status != 2`,
				[id]
			);
			if (rows.length === 0) {
				return res.status(404).json({ success: false, error: 'News not found' });
			}
			res.json({ success: true, data: rows[0] });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// POST /api/news/upload-image - Upload image for rich text editor
	router.post('/upload-image', upload.single('image'), async (req, res) => {
		const { club_id } = req.body;
		console.log('[News Image Upload API] POST request, Club ID:', club_id);

		if (!req.file) {
			return res.status(400).json({ success: false, error: 'No image file provided' });
		}

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			const { basePath } = getNewsImagesPath(club_id);
			ensureNewsDirectoriesExist(basePath, path.join(basePath, 'thumbnail'));

			// Generate unique filename
			const timestamp = Date.now();
			const ext = path.extname(req.file.originalname);
			const imageFilename = `article_${timestamp}${ext}`;

			const imagePath = path.join(basePath, imageFilename);

			// Save image
			await fs.promises.writeFile(imagePath, req.file.buffer);

			// Return URL for the image
			const imageUrl = `/images/clubs/${club_id}/news/${imageFilename}`;

			console.log('[News Image Upload API] Image uploaded:', imageFilename);
			res.json({ success: true, url: imageUrl, filename: imageFilename });
		} catch (error) {
			console.error('[News Image Upload API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news/images - Get list of uploaded images
	router.get('/images', async (req, res) => {
		const { club_id } = req.query;
		console.log('[News Images API] GET request, Club ID:', club_id);

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			const { basePath } = getNewsImagesPath(club_id);
			
			if (!fs.existsSync(basePath)) {
				return res.json({ success: true, images: [] });
			}

			const files = await fs.promises.readdir(basePath);
			const imageList = await Promise.all(
				files
					.filter(filename => {
						const ext = path.extname(filename).toLowerCase();
						return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
					})
					.map(async (filename) => {
						const filePath = path.join(basePath, filename);
						const stats = await fs.promises.stat(filePath);
						return {
							filename,
							url: `/images/clubs/${club_id}/news/${filename}`,
							size: stats.size
						};
					})
			);

			// Sort by filename
			imageList.sort((a, b) => a.filename.localeCompare(b.filename));

			console.log('[News Images API] Found', imageList.length, 'images');
			res.json({ success: true, images: imageList });
		} catch (error) {
			console.error('[News Images API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// POST /api/news/upload-file - Upload file for rich text editor
	router.post('/upload-file', uploadFile.single('file'), async (req, res) => {
		const { club_id } = req.body;
		console.log('[News File Upload API] POST request, Club ID:', club_id);

		if (!req.file) {
			return res.status(400).json({ success: false, error: 'No file provided' });
		}

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			// Create files directory: static/files/clubs/{club_id}/news
			const filesPath = path.join(__dirname, '..', 'static', 'files', 'clubs', club_id, 'news');
			if (!fs.existsSync(filesPath)) {
				fs.mkdirSync(filesPath, { recursive: true });
			}

			// Get original filename without extension
			const originalName = path.parse(req.file.originalname).name;
			const ext = path.extname(req.file.originalname);
			let fileFilename = `${originalName}${ext}`;
			let filePath = path.join(filesPath, fileFilename);
			let version = 1;

			// Check if file exists and add version number
			while (fs.existsSync(filePath)) {
				version++;
				fileFilename = `${originalName}_v${version}${ext}`;
				filePath = path.join(filesPath, fileFilename);
			}

			// Save file
			await fs.promises.writeFile(filePath, req.file.buffer);

			// Return URL for the file
			const fileUrl = `/files/clubs/${club_id}/news/${fileFilename}`;

			console.log('[News File Upload API] File uploaded:', fileFilename, version > 1 ? `(version ${version})` : '');
			res.json({ success: true, url: fileUrl, filename: fileFilename });
		} catch (error) {
			console.error('[News File Upload API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news/files - Get list of uploaded files
	router.get('/files', async (req, res) => {
		const { club_id } = req.query;
		console.log('[News Files API] GET request, Club ID:', club_id);

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			const filesPath = path.join(__dirname, '..', 'static', 'files', 'clubs', club_id, 'news');
			
			if (!fs.existsSync(filesPath)) {
				return res.json({ success: true, files: [] });
			}

			const files = await fs.promises.readdir(filesPath);
			const fileList = await Promise.all(
				files.map(async (filename) => {
					const filePath = path.join(filesPath, filename);
					const stats = await fs.promises.stat(filePath);
					return {
						filename,
						url: `/files/clubs/${club_id}/news/${filename}`,
						size: stats.size
					};
				})
			);

			// Sort by filename
			fileList.sort((a, b) => a.filename.localeCompare(b.filename));

			console.log('[News Files API] Found', fileList.length, 'files');
			res.json({ success: true, files: fileList });
		} catch (error) {
			console.error('[News Files API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// POST /api/news - Create new news with bilingual content
	router.post('/', upload.fields([
		{ name: 'image_en', maxCount: 1 },
		{ name: 'image_fr', maxCount: 1 },
		{ name: 'thumbnail_en', maxCount: 1 },
		{ name: 'thumbnail_fr', maxCount: 1 }
	]), async (req, res) => {
		console.log('[News API] POST request received');
		console.log('[News API] Request body:', req.body);
		console.log('[News API] Request files:', req.files);
		const {
			author,
			news_date,
			show_in_homepage,
			post_to_public,
			post_to_member,
			club_id,
			// English content
			title_en,
			summary_en,
			article_en,
			slug_en,
			// French content
			title_fr,
			summary_fr,
			article_fr,
			slug_fr,
			added_by
		} = req.body;
		
		console.log('[News API] Title EN:', title_en, 'Type:', typeof title_en);
		console.log('[News API] Title FR:', title_fr, 'Type:', typeof title_fr);

		if (!club_id) {
			console.error('[News API] Missing club_id. Received body:', req.body);
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		// Author is required for basic news creation
		if (!author || (typeof author === 'string' && author.trim() === '')) {
			console.error('[News API] Missing or empty author. Received body:', req.body);
			return res.status(400).json({ success: false, error: 'Author is required' });
		}

		// Content (title, summary, article, images) is optional - can be added later via content editor

		try {
			const newsPath = getNewsImagesPath(club_id);
			ensureNewsDirectoriesExist(newsPath.basePath, newsPath.thumbnailPath);

			let imageEnFilename = null;
			let imageFrFilename = null;
			let thumbnailEnFilename = null;
			let thumbnailFrFilename = null;

			// Process image_en
			if (req.files && req.files['image_en'] && req.files['image_en'][0]) {
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageEnFilename = `news_en_${timestamp}${ext}`;
				const imagePath = path.join(newsPath.basePath, imageEnFilename);
				await fs.promises.writeFile(imagePath, file.buffer);
				console.log('[News API] Saved image_en:', imageEnFilename);
			}

			// Process image_fr
			if (req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageFrFilename = `news_fr_${timestamp}${ext}`;
				const imagePath = path.join(newsPath.basePath, imageFrFilename);
				await fs.promises.writeFile(imagePath, file.buffer);
				console.log('[News API] Saved image_fr:', imageFrFilename);
			}

			// Process thumbnail_en
			if (req.files && req.files['thumbnail_en'] && req.files['thumbnail_en'][0]) {
				const file = req.files['thumbnail_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailEnFilename = `thumb_en_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailEnFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
				console.log('[News API] Saved thumbnail_en:', thumbnailEnFilename);
			} else if (imageEnFilename && req.files && req.files['image_en'] && req.files['image_en'][0]) {
				// Auto-generate thumbnail from main image
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailEnFilename = `thumb_en_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailEnFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
				console.log('[News API] Auto-generated thumbnail_en:', thumbnailEnFilename);
			}

			// Process thumbnail_fr
			if (req.files && req.files['thumbnail_fr'] && req.files['thumbnail_fr'][0]) {
				const file = req.files['thumbnail_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailFrFilename = `thumb_fr_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailFrFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
				console.log('[News API] Saved thumbnail_fr:', thumbnailFrFilename);
			} else if (imageFrFilename && req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				// Auto-generate thumbnail from main image
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailFrFilename = `thumb_fr_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailFrFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
				console.log('[News API] Auto-generated thumbnail_fr:', thumbnailFrFilename);
			}

			// Get max order
			const maxOrderResult = await query(`SELECT MAX(\`order\`) as max_order FROM news WHERE status != 2`);
			const maxOrder = maxOrderResult[0]?.max_order ?? 0;
			const newOrder = maxOrder + 1;

			// Insert main news record
			// Handle boolean values from FormData (they come as strings '1' or '0')
			const showHomepage = show_in_homepage === '1' || show_in_homepage === true || show_in_homepage === 1;
			const postPublic = post_to_public === '1' || post_to_public === true || post_to_public === 1;
			const postMember = post_to_member === '1' || post_to_member === true || post_to_member === 1;

			const newsResult = await query(
				`INSERT INTO news (author, news_date, show_in_homepage, \`order\`, post_to_public, post_to_member, date_added, status) 
				VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
				[
					author || '',
					news_date || new Date().toISOString().split('T')[0],
					showHomepage ? 1 : 0,
					newOrder,
					postPublic ? 1 : 0,
					postMember ? 1 : 0
				]
			);

			const newsId = newsResult.insertId;
			console.log('[News API] Created news with ID:', newsId, 'Order:', newOrder);

			// Insert English content if provided (check for non-empty string)
			if (title_en !== undefined && title_en !== null && title_en.trim() !== '') {
				// Auto-generate slug if title is provided but slug is not
				const baseSlugEn = slug_en && slug_en.trim() ? slug_en.trim() : generateSlug(title_en);
				const finalSlugEn = baseSlugEn ? await ensureUniqueSlug(baseSlugEn, 1, null) : null;
				
				await query(
					`INSERT INTO news_content (news_id, language_id, title, summary, article, image_filename, image_thumbnail, slug_url, date_added, added_by, status) 
					VALUES (?, 1, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
					[
						newsId,
						title_en,
						summary_en || null,
						article_en || null,
						imageEnFilename || null,
						thumbnailEnFilename || null,
						finalSlugEn || null,
						added_by || null
					]
				);
				console.log('[News API] Created English content for news ID:', newsId, 'Slug:', finalSlugEn);
			}

			// Insert French content if provided (check for non-empty string)
			if (title_fr !== undefined && title_fr !== null && title_fr.trim() !== '') {
				// Auto-generate slug if title is provided but slug is not
				const baseSlugFr = slug_fr && slug_fr.trim() ? slug_fr.trim() : generateSlug(title_fr);
				const finalSlugFr = baseSlugFr ? await ensureUniqueSlug(baseSlugFr, 2, null) : null;
				
				await query(
					`INSERT INTO news_content (news_id, language_id, title, summary, article, image_filename, image_thumbnail, slug_url, date_added, added_by, status) 
					VALUES (?, 2, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
					[
						newsId,
						title_fr,
						summary_fr || null,
						article_fr || null,
						imageFrFilename || null,
						thumbnailFrFilename || null,
						finalSlugFr || null,
						added_by || null
					]
				);
				console.log('[News API] Created French content for news ID:', newsId, 'Slug:', finalSlugFr);
			}

			res.json({ success: true, data: { id: newsId } });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/news/:id - Update news
	router.put('/:id', upload.fields([
		{ name: 'image_en', maxCount: 1 },
		{ name: 'image_fr', maxCount: 1 },
		{ name: 'thumbnail_en', maxCount: 1 },
		{ name: 'thumbnail_fr', maxCount: 1 }
	]), async (req, res) => {
		const { id } = req.params;
		console.log('[News API] PUT request for ID:', id);
		const {
			author,
			news_date,
			show_in_homepage,
			order,
			post_to_public,
			post_to_member,
			club_id,
			// English content
			title_en,
			summary_en,
			article_en,
			slug_en,
			// French content
			title_fr,
			summary_fr,
			article_fr,
			slug_fr,
			updated_by
		} = req.body;

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			// Get existing news
			const existingRows = await query(`SELECT * FROM news WHERE id = ? AND status != 2`, [id]);
			if (existingRows.length === 0) {
				return res.status(404).json({ success: false, error: 'News not found' });
			}

			const newsPath = getNewsImagesPath(club_id);
			ensureNewsDirectoriesExist(newsPath.basePath, newsPath.thumbnailPath);

			// Get existing content
			const existingContent = await query(
				`SELECT * FROM news_content WHERE news_id = ? AND status != 2`,
				[id]
			);
			const existingEn = existingContent.find(c => c.language_id === 1);
			const existingFr = existingContent.find(c => c.language_id === 2);

			let imageEnFilename = null;
			let imageFrFilename = null;
			let thumbnailEnFilename = null;
			let thumbnailFrFilename = null;

			// Process image_en if uploaded
			if (req.files && req.files['image_en'] && req.files['image_en'][0]) {
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageEnFilename = `news_en_${timestamp}${ext}`;
				const imagePath = path.join(newsPath.basePath, imageEnFilename);
				await fs.promises.writeFile(imagePath, file.buffer);

				// Delete old image if exists
				if (existingEn && existingEn.image_filename) {
					const oldImagePath = path.join(newsPath.basePath, existingEn.image_filename);
					try {
						if (fs.existsSync(oldImagePath)) {
							await fs.promises.unlink(oldImagePath);
						}
					} catch (fileError) {
						console.warn('[News API] Error deleting old image_en:', fileError);
					}
				}
				console.log('[News API] Updated image_en:', imageEnFilename);
			}

			// Process image_fr if uploaded
			if (req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageFrFilename = `news_fr_${timestamp}${ext}`;
				const imagePath = path.join(newsPath.basePath, imageFrFilename);
				await fs.promises.writeFile(imagePath, file.buffer);

				// Delete old image if exists
				if (existingFr && existingFr.image_filename) {
					const oldImagePath = path.join(newsPath.basePath, existingFr.image_filename);
					try {
						if (fs.existsSync(oldImagePath)) {
							await fs.promises.unlink(oldImagePath);
						}
					} catch (fileError) {
						console.warn('[News API] Error deleting old image_fr:', fileError);
					}
				}
				console.log('[News API] Updated image_fr:', imageFrFilename);
			}

			// Process thumbnails
			if (req.files && req.files['thumbnail_en'] && req.files['thumbnail_en'][0]) {
				const file = req.files['thumbnail_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailEnFilename = `thumb_en_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailEnFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);

				// Delete old thumbnail
				if (existingEn && existingEn.image_thumbnail) {
					const oldThumbPath = path.join(newsPath.thumbnailPath, existingEn.image_thumbnail);
					try {
						if (fs.existsSync(oldThumbPath)) {
							await fs.promises.unlink(oldThumbPath);
						}
					} catch (fileError) {
						console.warn('[News API] Error deleting old thumbnail_en:', fileError);
					}
				}
			} else if (imageEnFilename && req.files && req.files['image_en'] && req.files['image_en'][0]) {
				// Auto-generate thumbnail from new main image
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailEnFilename = `thumb_en_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailEnFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
			}

			if (req.files && req.files['thumbnail_fr'] && req.files['thumbnail_fr'][0]) {
				const file = req.files['thumbnail_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailFrFilename = `thumb_fr_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailFrFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);

				// Delete old thumbnail
				if (existingFr && existingFr.image_thumbnail) {
					const oldThumbPath = path.join(newsPath.thumbnailPath, existingFr.image_thumbnail);
					try {
						if (fs.existsSync(oldThumbPath)) {
							await fs.promises.unlink(oldThumbPath);
						}
					} catch (fileError) {
						console.warn('[News API] Error deleting old thumbnail_fr:', fileError);
					}
				}
			} else if (imageFrFilename && req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				// Auto-generate thumbnail from new main image
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				thumbnailFrFilename = `thumb_fr_${timestamp}${ext}`;
				const thumbnailPath = path.join(newsPath.thumbnailPath, thumbnailFrFilename);
				await sharp(file.buffer)
					.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
					.toFile(thumbnailPath);
			}

			// Update main news record
			const updateFields = [];
			const updateValues = [];

			if (author !== undefined) {
				updateFields.push('author = ?');
				updateValues.push(author);
			}
			if (news_date !== undefined) {
				updateFields.push('news_date = ?');
				updateValues.push(news_date);
			}
			if (show_in_homepage !== undefined) {
				updateFields.push('show_in_homepage = ?');
				updateValues.push(show_in_homepage ? 1 : 0);
			}
			if (order !== undefined) {
				updateFields.push('`order` = ?');
				updateValues.push(order);
			}
			if (post_to_public !== undefined) {
				updateFields.push('post_to_public = ?');
				updateValues.push(post_to_public ? 1 : 0);
			}
			if (post_to_member !== undefined) {
				updateFields.push('post_to_member = ?');
				updateValues.push(post_to_member ? 1 : 0);
			}

			if (updateFields.length > 0) {
				updateValues.push(id);
				await query(
					`UPDATE news SET ${updateFields.join(', ')} WHERE id = ? AND status != 2`,
					updateValues
				);
			}

			// Update or insert English content
			if (title_en !== undefined) {
				if (existingEn) {
					const contentFields = [];
					const contentValues = [];
					if (title_en !== undefined) {
						contentFields.push('title = ?');
						contentValues.push(title_en);
					}
					if (summary_en !== undefined) {
						contentFields.push('summary = ?');
						contentValues.push(summary_en || null);
					}
					if (article_en !== undefined) {
						contentFields.push('article = ?');
						contentValues.push(article_en || null);
					}
					if (imageEnFilename) {
						contentFields.push('image_filename = ?');
						contentValues.push(imageEnFilename);
					}
					if (thumbnailEnFilename) {
						contentFields.push('image_thumbnail = ?');
						contentValues.push(thumbnailEnFilename);
					}
					// Auto-generate slug if title is updated but slug is not provided
					let baseSlugEn = null;
					if (title_en !== undefined && (slug_en === undefined || slug_en === null || slug_en === '')) {
						baseSlugEn = generateSlug(title_en);
					} else if (slug_en && slug_en.trim()) {
						baseSlugEn = slug_en.trim();
					}
					
					if (slug_en !== undefined || (title_en !== undefined && baseSlugEn)) {
						// Ensure slug is unique (excluding current news item)
						const finalSlugEn = baseSlugEn ? await ensureUniqueSlug(baseSlugEn, 1, id) : null;
						contentFields.push('slug_url = ?');
						contentValues.push(finalSlugEn || null);
					}
					if (updated_by !== undefined) {
						contentFields.push('updated_by = ?');
						contentValues.push(updated_by || null);
					}
					contentFields.push('date_updated = NOW()');
					contentValues.push(existingEn.id);

					if (contentFields.length > 1) {
						await query(
							`UPDATE news_content SET ${contentFields.join(', ')} WHERE id = ? AND status != 2`,
							contentValues
						);
					}
				} else if (title_en) {
					// Auto-generate slug if title is provided but slug is not
					const baseSlugEn = slug_en && slug_en.trim() ? slug_en.trim() : generateSlug(title_en);
					const finalSlugEn = baseSlugEn ? await ensureUniqueSlug(baseSlugEn, 1, id) : null;
					
					// Insert new English content
					await query(
						`INSERT INTO news_content (news_id, language_id, title, summary, article, image_filename, image_thumbnail, slug_url, date_added, added_by, status) 
						VALUES (?, 1, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
						[
							id,
							title_en,
							summary_en || null,
							article_en || null,
							imageEnFilename || null,
							thumbnailEnFilename || null,
							finalSlugEn || null,
							updated_by || null
						]
					);
				}
			}

			// Update or insert French content
			if (title_fr !== undefined) {
				if (existingFr) {
					const contentFields = [];
					const contentValues = [];
					if (title_fr !== undefined) {
						contentFields.push('title = ?');
						contentValues.push(title_fr);
					}
					if (summary_fr !== undefined) {
						contentFields.push('summary = ?');
						contentValues.push(summary_fr || null);
					}
					if (article_fr !== undefined) {
						contentFields.push('article = ?');
						contentValues.push(article_fr || null);
					}
					if (imageFrFilename) {
						contentFields.push('image_filename = ?');
						contentValues.push(imageFrFilename);
					}
					if (thumbnailFrFilename) {
						contentFields.push('image_thumbnail = ?');
						contentValues.push(thumbnailFrFilename);
					}
					// Auto-generate slug if title is updated but slug is not provided
					let baseSlugFr = null;
					if (title_fr !== undefined && (slug_fr === undefined || slug_fr === null || slug_fr === '')) {
						baseSlugFr = generateSlug(title_fr);
					} else if (slug_fr && slug_fr.trim()) {
						baseSlugFr = slug_fr.trim();
					}
					
					if (slug_fr !== undefined || (title_fr !== undefined && baseSlugFr)) {
						// Ensure slug is unique (excluding current news item)
						const finalSlugFr = baseSlugFr ? await ensureUniqueSlug(baseSlugFr, 2, id) : null;
						contentFields.push('slug_url = ?');
						contentValues.push(finalSlugFr || null);
					}
					if (updated_by !== undefined) {
						contentFields.push('updated_by = ?');
						contentValues.push(updated_by || null);
					}
					contentFields.push('date_updated = NOW()');
					contentValues.push(existingFr.id);

					if (contentFields.length > 1) {
						await query(
							`UPDATE news_content SET ${contentFields.join(', ')} WHERE id = ? AND status != 2`,
							contentValues
						);
					}
				} else if (title_fr) {
					// Auto-generate slug if title is provided but slug is not
					const baseSlugFr = slug_fr && slug_fr.trim() ? slug_fr.trim() : generateSlug(title_fr);
					const finalSlugFr = baseSlugFr ? await ensureUniqueSlug(baseSlugFr, 2, id) : null;
					
					// Insert new French content
					await query(
						`INSERT INTO news_content (news_id, language_id, title, summary, article, image_filename, image_thumbnail, slug_url, date_added, added_by, status) 
						VALUES (?, 2, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
						[
							id,
							title_fr,
							summary_fr || null,
							article_fr || null,
							imageFrFilename || null,
							thumbnailFrFilename || null,
							finalSlugFr || null,
							updated_by || null
						]
					);
				}
			}

			console.log('[News API] Updated news ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// DELETE /api/news/:id - Soft delete news
	router.delete('/:id', async (req, res) => {
		const { id } = req.params;
		console.log('[News API] DELETE request for ID:', id);
		try {
			await query(`UPDATE news SET status = 2 WHERE id = ?`, [id]);
			await query(`UPDATE news_content SET status = 2 WHERE news_id = ?`, [id]);
			console.log('[News API] Deleted news ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/news/:id/order - Update news order
	router.put('/:id/order', async (req, res) => {
		const { id } = req.params;
		const { order } = req.body;
		console.log('[News API] Update order for ID:', id, 'New order:', order);
		try {
			await query(`UPDATE news SET \`order\` = ? WHERE id = ? AND status != 2`, [order, id]);
			console.log('[News API] Updated order for news ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	return router;
}

