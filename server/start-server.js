import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
dotenv.config();

console.log('Starting server...\n');
console.log('Environment variables loaded:');
console.log(`  DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`  SERVER_PORT: ${process.env.SERVER_PORT || '3111'}\n`);

// Import after dotenv.config() to ensure env vars are loaded
import { createConnection, getPool, closePool, query } from './db.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3111;
const HOST = process.env.SERVER_HOST || '0.0.0.0'; // 0.0.0.0 allows external connections

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no database required)
app.get('/api/health', (req, res) => {
	res.json({ 
		status: 'ok', 
		message: 'Server is running',
		timestamp: new Date().toISOString()
	});
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
	try {
		const connection = await createConnection();
		
		// Test basic query
		const [testRows] = await connection.execute('SELECT 1 as test');
		
		// Get MySQL version
		const [versionRows] = await connection.execute('SELECT VERSION() as version');
		
		// Get current database
		const [dbRows] = await connection.execute('SELECT DATABASE() as current_database');
		
		connection.end();
		
		res.json({
			success: true,
			message: 'Database connection successful',
			data: {
				test: testRows[0],
				version: versionRows[0].version,
				database: dbRows[0].current_database,
				timestamp: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error('Database test error:', error);
		res.status(500).json({
			success: false,
			error: error.message,
			code: error.code
		});
	}
});

// Example: Get all records from a table
app.get('/api/data', async (req, res) => {
	try {
		const connection = await createConnection();
		// Replace 'your_table' with your actual table name
		const [rows] = await connection.execute('SELECT * FROM your_table LIMIT 100');
		connection.end();
		res.json({ success: true, data: rows });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

// Example: Insert a record
app.post('/api/data', async (req, res) => {
	try {
		const { name, value } = req.body;
		const connection = await createConnection();
		// Replace with your actual table structure
		const [result] = await connection.execute(
			'INSERT INTO your_table (name, value) VALUES (?, ?)',
			[name, value]
		);
		connection.end();
		res.json({ success: true, data: result });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

// Menu API - builds a nested menu tree similar to the old .NET code
app.get('/api/menu', async (req, res) => {
	console.log('[Menu API] Request received:', {
		lang: req.query.lang,
		url: req.originalUrl,
		method: req.method
	});

	try {
		const lang = req.query.lang || 'fr';

		// Map language to legacy language id used in pc.fld_languageid
		// 1 = English, 2 = French (default to French if unknown)
		let languageId;
		if (lang === 'en' || lang === '1') {
			languageId = 1;
		} else if (lang === 'fr' || lang === '2') {
			languageId = 2;
		} else {
			languageId = 2;
		}

		console.log('[Menu API] Language mapping:', { lang, languageId });

		// Public member flag - matches original getMenu(langID, "1")
		const publicMember = 1;

		console.log('[Menu API] Executing query...');

		const rows = await query(
			`SELECT
				p.fld_id         AS id,
				p.fld_parentid   AS parent_id,
				pc.fld_title     AS title,
				pc.fld_url       AS url,
				p.fld_mainitem   AS main_item,
				p.fld_order      AS sort_order,
				p.fld_pagetypeid AS page_type_id
			 FROM tbl_pages p
			 JOIN tbl_pagecontent pc ON pc.fld_pageid = p.fld_id
			 WHERE
				p.fld_order  > 0 AND
				p.fld_post   = 1 AND
				p.fld_menu   = 1 AND
				p.fld_status = 1 AND
				pc.fld_status = 1 AND
				p.fld_public = ? AND
				pc.fld_languageid = ?
			 ORDER BY p.fld_order ASC`,
			[publicMember, languageId]
		);

		console.log('[Menu API] Query returned', rows.length, 'rows');

		// Build a tree from flat rows (similar to recursive PopulateSubItem)
		/** @type {Record<number, any>} */
		const byId = {};
		/** @type {any[]} */
		const roots = [];

		for (const row of rows) {
			byId[row.id] = {
				id: row.id,
				parentId: row.parent_id,
				title: row.title,
				url: row.url,
				mainItem: row.main_item,
				pageTypeId: row.page_type_id,
				sortOrder: row.sort_order,
				children: []
			};
		}

		for (const node of Object.values(byId)) {
			if (node.parentId && byId[node.parentId]) {
				byId[node.parentId].children.push(node);
			} else if (node.mainItem === 1 || node.mainItem === '1') {
				// Only top-level items where fld_mainitem = 1 become roots,
				// as in the original C# getMenu implementation.
				roots.push(node);
			}
		}

		console.log('[Menu API] Built tree with', roots.length, 'root items');

		const result = {
			success: true,
			data: roots
		};

		// Log the result as JSON for debugging
		console.log('\n========== Menu API Result ==========');
		console.log(JSON.stringify(result, null, 2));
		console.log('=====================================\n');

		res.json(result);
	} catch (error) {
		console.error('Menu API error:', {
			message: error.message,
			stack: error.stack,
			lang: req.query.lang,
			url: req.originalUrl
		});
		res.status(500).json({ success: false, error: error.message });
	}
});

// Gallery API endpoints
// GET /api/gallery - Get all galleries
app.get('/api/gallery', async (req, res) => {
	console.log('[Gallery API] GET request received');
	try {
		const rows = await query(
			`SELECT 
				id,
				gallery_name_en,
				gallery_name_fr,
				description_en,
				description_fr,
				\`order\`,
				member_only,
				date_created,
				added_by,
				date_updated,
				updated_by,
				status
			FROM gallery 
			WHERE status != 2 
			ORDER BY \`order\` ASC, id ASC`
		);
		console.log('[Gallery API] Query returned', rows.length, 'galleries');
		res.json({ success: true, data: rows });
	} catch (error) {
		console.error('[Gallery API] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// GET /api/public/gallery - Get public galleries (excludes member_only=1)
app.get('/api/public/gallery', async (req, res) => {
	console.log('[Public Gallery API] GET request received');
	try {
		const rows = await query(
			`SELECT 
				id,
				gallery_name_en,
				gallery_name_fr,
				description_en,
				description_fr,
				\`order\`,
				member_only,
				date_created,
				added_by,
				date_updated,
				updated_by,
				status
			FROM gallery 
			WHERE status != 2 AND member_only = 0
			ORDER BY \`order\` ASC, id ASC`
		);
		console.log('[Public Gallery API] Query returned', rows.length, 'public galleries');
		res.json({ success: true, data: rows });
	} catch (error) {
		console.error('[Public Gallery API] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// GET /api/gallery/:id - Get single gallery
app.get('/api/gallery/:id', async (req, res) => {
	const { id } = req.params;
	console.log('[Gallery API] GET by ID:', id);
	try {
		const rows = await query(
			`SELECT * FROM gallery WHERE id = ? AND status != 2`,
			[id]
		);
		if (rows.length === 0) {
			return res.status(404).json({ success: false, error: 'Gallery not found' });
		}
		res.json({ success: true, data: rows[0] });
	} catch (error) {
		console.error('[Gallery API] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// POST /api/gallery - Create new gallery
app.post('/api/gallery', async (req, res) => {
	console.log('[Gallery API] POST request received:', req.body);
	try {
		const {
			gallery_name_en,
			gallery_name_fr,
			description_en,
			description_fr,
			member_only,
			added_by
		} = req.body;

		// Get max order and add 1 to place new gallery at the end
		const maxOrderResult = await query(
			`SELECT MAX(\`order\`) as max_order FROM gallery WHERE status != 2`
		);
		const maxOrder = maxOrderResult[0]?.max_order || 0;
		const newOrder = maxOrder + 1;

		const result = await query(
			`INSERT INTO gallery (
				gallery_name_en, gallery_name_fr, description_en, description_fr,
				\`order\`, member_only, date_created, added_by, status
			) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 1)`,
			[
				gallery_name_en || '',
				gallery_name_fr || '',
				description_en || null,
				description_fr || null,
				newOrder,
				member_only || 0,
				added_by || null
			]
		);

		console.log('[Gallery API] Created gallery with ID:', result.insertId, 'Order:', newOrder);
		res.json({ success: true, data: { id: result.insertId } });
	} catch (error) {
		console.error('[Gallery API] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// PUT /api/gallery/:id - Update gallery
app.put('/api/gallery/:id', async (req, res) => {
	const { id } = req.params;
	console.log('[Gallery API] PUT request for ID:', id, req.body);
	try {
		const {
			gallery_name_en,
			gallery_name_fr,
			description_en,
			description_fr,
			order,
			member_only,
			updated_by
		} = req.body;

		await query(
			`UPDATE gallery SET
				gallery_name_en = ?,
				gallery_name_fr = ?,
				description_en = ?,
				description_fr = ?,
				\`order\` = ?,
				member_only = ?,
				date_updated = NOW(),
				updated_by = ?
			WHERE id = ? AND status != 2`,
			[
				gallery_name_en,
				gallery_name_fr,
				description_en,
				description_fr,
				order,
				member_only,
				updated_by || null,
				id
			]
		);

		console.log('[Gallery API] Updated gallery ID:', id);
		res.json({ success: true });
	} catch (error) {
		console.error('[Gallery API] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// DELETE /api/gallery/:id - Soft delete gallery (set status to 2)
	app.delete('/api/gallery/:id', async (req, res) => {
		const { id } = req.params;
		console.log('[Gallery API] DELETE request for ID:', id);
		try {
			await query(
				`UPDATE gallery SET status = 2, date_updated = NOW() WHERE id = ?`,
				[id]
			);
			console.log('[Gallery API] Deleted gallery ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[Gallery API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/gallery/:id/order - Update gallery order
	app.put('/api/gallery/:id/order', async (req, res) => {
		const { id } = req.params;
		const { order } = req.body;
		console.log('[Gallery API] Update order for ID:', id, 'New order:', order);
		try {
			await query(
				`UPDATE gallery SET \`order\` = ?, date_updated = NOW() WHERE id = ? AND status != 2`,
				[order, id]
			);
			console.log('[Gallery API] Updated order for gallery ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[Gallery API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// ==================== Multer Configuration ====================
	// Configure multer for file uploads (memory storage)
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

	// ==================== Slider API ====================
	// GET /api/slider - Get all sliders
	app.get('/api/slider', async (req, res) => {
		console.log('[Slider API] GET request received');
		try {
			const rows = await query(
				`SELECT 
					id,
					image_en,
					image_fr,
					link_en,
					link_fr,
					\`order\`,
					status,
					date_created,
					added_by,
					date_updated,
					updated_by
				FROM slider 
				WHERE status != 2 
				ORDER BY \`order\` ASC, id ASC`
			);
			console.log('[Slider API] Query returned', rows.length, 'sliders');
			res.json({ success: true, data: rows });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/slider/:id - Get single slider
	app.get('/api/slider/:id', async (req, res) => {
		const { id } = req.params;
		console.log('[Slider API] GET by ID:', id);
		try {
			const rows = await query(
				`SELECT * FROM slider WHERE id = ? AND status != 2`,
				[id]
			);
			if (rows.length === 0) {
				return res.status(404).json({ success: false, error: 'Slider not found' });
			}
			res.json({ success: true, data: rows[0] });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// Helper function to get slider images directory
	function getSliderImagesPath(clubId) {
		const basePath = path.join(__dirname, '..', 'static', 'images', 'clubs', clubId, 'slider');
		return basePath;
	}

	// Helper function to ensure slider directory exists
	function ensureSliderDirectoryExists(basePath) {
		if (!fs.existsSync(basePath)) {
			fs.mkdirSync(basePath, { recursive: true });
		}
	}

	// POST /api/slider - Create new slider with image uploads
	app.post('/api/slider', upload.fields([{ name: 'image_en', maxCount: 1 }, { name: 'image_fr', maxCount: 1 }]), async (req, res) => {
		console.log('[Slider API] POST request received');
		const { link_en, link_fr, club_id } = req.body;

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			const sliderPath = getSliderImagesPath(club_id);
			ensureSliderDirectoryExists(sliderPath);

			let imageEnFilename = null;
			let imageFrFilename = null;

			// Process image_en
			if (req.files && req.files['image_en'] && req.files['image_en'][0]) {
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageEnFilename = `slider_en_${timestamp}${ext}`;
				const imagePath = path.join(sliderPath, imageEnFilename);
				await fs.promises.writeFile(imagePath, file.buffer);
				console.log('[Slider API] Saved image_en:', imageEnFilename);
			}

			// Process image_fr
			if (req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				imageFrFilename = `slider_fr_${timestamp}${ext}`;
				const imagePath = path.join(sliderPath, imageFrFilename);
				await fs.promises.writeFile(imagePath, file.buffer);
				console.log('[Slider API] Saved image_fr:', imageFrFilename);
			}

			// At least one image is required
			if (!imageEnFilename && !imageFrFilename) {
				return res.status(400).json({ success: false, error: 'At least one image (image_en or image_fr) is required' });
			}

			// Get max order
			const maxOrderResult = await query(`SELECT MAX(\`order\`) as max_order FROM slider WHERE status != 2`);
			const maxOrder = maxOrderResult[0]?.max_order ?? 0;
			const newOrder = maxOrder + 1;

			const result = await query(
				`INSERT INTO slider (image_en, image_fr, link_en, link_fr, \`order\`, date_created, status) 
				VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
				[imageEnFilename || null, imageFrFilename || null, link_en || null, link_fr || null, newOrder]
			);
			console.log('[Slider API] Created slider with ID:', result.insertId, 'Order:', newOrder);
			res.json({ success: true, data: { id: result.insertId } });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/slider/:id - Update slider with optional image uploads
	app.put('/api/slider/:id', upload.fields([{ name: 'image_en', maxCount: 1 }, { name: 'image_fr', maxCount: 1 }]), async (req, res) => {
		const { id } = req.params;
		console.log('[Slider API] PUT request for ID:', id);
		const { link_en, link_fr, status, club_id } = req.body;

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			// Get existing slider to check current filenames
			const existingRows = await query(`SELECT image_en, image_fr FROM slider WHERE id = ? AND status != 2`, [id]);
			if (existingRows.length === 0) {
				return res.status(404).json({ success: false, error: 'Slider not found' });
			}
			const existing = existingRows[0];

			const sliderPath = getSliderImagesPath(club_id);
			ensureSliderDirectoryExists(sliderPath);

			const updateFields = [];
			const updateValues = [];

			// Process image_en if uploaded
			if (req.files && req.files['image_en'] && req.files['image_en'][0]) {
				const file = req.files['image_en'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				const imageEnFilename = `slider_en_${timestamp}${ext}`;
				const imagePath = path.join(sliderPath, imageEnFilename);
				await fs.promises.writeFile(imagePath, file.buffer);

				// Delete old image if it exists
				if (existing.image_en) {
					const oldImagePath = path.join(sliderPath, existing.image_en);
					try {
						if (fs.existsSync(oldImagePath)) {
							await fs.promises.unlink(oldImagePath);
						}
					} catch (fileError) {
						console.warn('[Slider API] Error deleting old image_en:', fileError);
					}
				}

				updateFields.push('image_en = ?');
				updateValues.push(imageEnFilename);
				console.log('[Slider API] Updated image_en:', imageEnFilename);
			}

			// Process image_fr if uploaded
			if (req.files && req.files['image_fr'] && req.files['image_fr'][0]) {
				const file = req.files['image_fr'][0];
				const timestamp = Date.now();
				const ext = path.extname(file.originalname);
				const imageFrFilename = `slider_fr_${timestamp}${ext}`;
				const imagePath = path.join(sliderPath, imageFrFilename);
				await fs.promises.writeFile(imagePath, file.buffer);

				// Delete old image if it exists
				if (existing.image_fr) {
					const oldImagePath = path.join(sliderPath, existing.image_fr);
					try {
						if (fs.existsSync(oldImagePath)) {
							await fs.promises.unlink(oldImagePath);
						}
					} catch (fileError) {
						console.warn('[Slider API] Error deleting old image_fr:', fileError);
					}
				}

				updateFields.push('image_fr = ?');
				updateValues.push(imageFrFilename);
				console.log('[Slider API] Updated image_fr:', imageFrFilename);
			}

			if (link_en !== undefined) {
				updateFields.push('link_en = ?');
				updateValues.push(link_en || null);
			}
			if (link_fr !== undefined) {
				updateFields.push('link_fr = ?');
				updateValues.push(link_fr || null);
			}
			if (status !== undefined) {
				updateFields.push('status = ?');
				updateValues.push(status);
			}

			if (updateFields.length === 0) {
				return res.status(400).json({ success: false, error: 'No fields to update' });
			}

			updateFields.push('date_updated = NOW()');
			updateValues.push(id);

			await query(
				`UPDATE slider SET ${updateFields.join(', ')} WHERE id = ? AND status != 2`,
				updateValues
			);
			console.log('[Slider API] Updated slider ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// DELETE /api/slider/:id - Delete slider (soft delete)
	app.delete('/api/slider/:id', async (req, res) => {
		const { id } = req.params;
		console.log('[Slider API] DELETE request for ID:', id);
		try {
			await query(
				`UPDATE slider SET status = 2, date_updated = NOW() WHERE id = ?`,
				[id]
			);
			console.log('[Slider API] Deleted slider ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/slider/:id/order - Update slider order
	app.put('/api/slider/:id/order', async (req, res) => {
		const { id } = req.params;
		const { order } = req.body;
		console.log('[Slider API] Update order for ID:', id, 'New order:', order);
		try {
			await query(
				`UPDATE slider SET \`order\` = ?, date_updated = NOW() WHERE id = ? AND status != 2`,
				[order, id]
			);
			console.log('[Slider API] Updated order for slider ID:', id);
			res.json({ success: true });
		} catch (error) {
			console.error('[Slider API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// ==================== Gallery Images API ====================

	// Helper function to get gallery images directory
	function getGalleryImagesPath(clubId, galleryId) {
		const basePath = path.join(__dirname, '..', 'static', 'images', 'clubs', clubId, 'gallery', String(galleryId));
		const thumbnailPath = path.join(basePath, 'thumbnail');
		return { basePath, thumbnailPath };
	}

	// Helper function to ensure directories exist
	function ensureDirectoriesExist(basePath, thumbnailPath) {
		if (!fs.existsSync(basePath)) {
			fs.mkdirSync(basePath, { recursive: true });
		}
		if (!fs.existsSync(thumbnailPath)) {
			fs.mkdirSync(thumbnailPath, { recursive: true });
		}
	}

	// GET /api/gallery/:galleryId/images - Get all images for a gallery
	app.get('/api/gallery/:galleryId/images', async (req, res) => {
		const { galleryId } = req.params;
		console.log('[Gallery Images API] GET request for gallery ID:', galleryId);
		try {
			const rows = await query(
				`SELECT * FROM gallery_images WHERE gallery_id = ? AND status != 2 ORDER BY \`order\` ASC, date_created ASC`,
				[galleryId]
			);
			console.log('[Gallery Images API] Found', rows.length, 'images');
			res.json({ success: true, data: rows });
		} catch (error) {
			console.error('[Gallery Images API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// POST /api/gallery/:galleryId/images - Upload image
	app.post('/api/gallery/:galleryId/images', upload.single('image'), async (req, res) => {
		const { galleryId } = req.params;
		const { club_id } = req.body;
		console.log('[Gallery Images API] POST request for gallery ID:', galleryId, 'Club ID:', club_id);

		if (!req.file) {
			return res.status(400).json({ success: false, error: 'No image file provided' });
		}

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			const { basePath, thumbnailPath } = getGalleryImagesPath(club_id, galleryId);
			ensureDirectoriesExist(basePath, thumbnailPath);

			// Generate unique filename
			const timestamp = Date.now();
			const ext = path.extname(req.file.originalname);
			const imageFilename = `img_${timestamp}${ext}`;
			const thumbnailFilename = `thumb_${timestamp}${ext}`;

			const imagePath = path.join(basePath, imageFilename);
			const thumbnailPathFull = path.join(thumbnailPath, thumbnailFilename);

			// Save original image
			await fs.promises.writeFile(imagePath, req.file.buffer);

			// Generate and save thumbnail (300x300, maintaining aspect ratio)
			await sharp(req.file.buffer)
				.resize(300, 300, { fit: 'inside', withoutEnlargement: true })
				.toFile(thumbnailPathFull);

			// Get max order for this gallery
			const maxOrderResult = await query(
				`SELECT MAX(\`order\`) as max_order FROM gallery_images WHERE gallery_id = ? AND status != 2`,
				[galleryId]
			);
			const maxOrder = maxOrderResult[0]?.max_order || 0;
			const newOrder = maxOrder + 1;

			// Insert into database
			const result = await query(
				`INSERT INTO gallery_images (gallery_id, image_filename, thumbnail_filename, \`order\`, date_created, status) 
				VALUES (?, ?, ?, ?, NOW(), 1)`,
				[galleryId, imageFilename, thumbnailFilename, newOrder]
			);

			console.log('[Gallery Images API] Created image with ID:', result.insertId);
			res.json({
				success: true,
				data: {
					id: result.insertId,
					gallery_id: galleryId,
					image_filename: imageFilename,
					thumbnail_filename: thumbnailFilename,
					order: newOrder
				}
			});
		} catch (error) {
			console.error('[Gallery Images API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// DELETE /api/gallery/:galleryId/images/:imageId - Delete image
	app.delete('/api/gallery/:galleryId/images/:imageId', async (req, res) => {
		const { galleryId, imageId } = req.params;
		const { club_id } = req.body;
		console.log('[Gallery Images API] DELETE request for image ID:', imageId, 'Gallery ID:', galleryId);

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			// Get image info
			const rows = await query(
				`SELECT * FROM gallery_images WHERE id = ? AND gallery_id = ? AND status != 2`,
				[imageId, galleryId]
			);

			if (rows.length === 0) {
				return res.status(404).json({ success: false, error: 'Image not found' });
			}

			const image = rows[0];
			const { basePath, thumbnailPath } = getGalleryImagesPath(club_id, galleryId);

			// Delete files
			const imagePath = path.join(basePath, image.image_filename);
			const thumbnailPathFull = path.join(thumbnailPath, image.thumbnail_filename);

			try {
				if (fs.existsSync(imagePath)) {
					await fs.promises.unlink(imagePath);
				}
				if (fs.existsSync(thumbnailPathFull)) {
					await fs.promises.unlink(thumbnailPathFull);
				}
			} catch (fileError) {
				console.warn('[Gallery Images API] Error deleting files:', fileError);
				// Continue with database deletion even if file deletion fails
			}

			// Soft delete in database
			await query(
				`UPDATE gallery_images SET status = 2 WHERE id = ?`,
				[imageId]
			);

			console.log('[Gallery Images API] Deleted image ID:', imageId);
			res.json({ success: true });
		} catch (error) {
			console.error('[Gallery Images API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/gallery/:galleryId/images/:imageId/order - Update image order
	app.put('/api/gallery/:galleryId/images/:imageId/order', async (req, res) => {
		const { galleryId, imageId } = req.params;
		const { order } = req.body;
		console.log('[Gallery Images API] Update order for image ID:', imageId, 'Gallery ID:', galleryId, 'New order:', order);
		try {
			await query(
				`UPDATE gallery_images SET \`order\` = ? WHERE id = ? AND gallery_id = ? AND status != 2`,
				[order, imageId, galleryId]
			);
			console.log('[Gallery Images API] Updated order for image ID:', imageId);
			res.json({ success: true });
		} catch (error) {
			console.error('[Gallery Images API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// ==================== News API ====================

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

	// POST /api/news/upload-image - Upload image for rich text editor
	app.post('/api/news/upload-image', upload.single('image'), async (req, res) => {
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

	// POST /api/news/upload-file - Upload file for rich text editor
	app.post('/api/news/upload-file', upload.single('file'), async (req, res) => {
		const { club_id } = req.body;
		console.log('[News File Upload API] POST request, Club ID:', club_id);

		if (!req.file) {
			return res.status(400).json({ success: false, error: 'No file provided' });
		}

		if (!club_id) {
			return res.status(400).json({ success: false, error: 'Club ID is required' });
		}

		try {
			// Create files directory inside news folder
			const filesPath = path.join(__dirname, '..', 'static', 'images', 'clubs', club_id, 'news', 'files');
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
			const fileUrl = `/images/clubs/${club_id}/news/files/${fileFilename}`;

			console.log('[News File Upload API] File uploaded:', fileFilename, version > 1 ? `(version ${version})` : '');
			res.json({ success: true, url: fileUrl, filename: fileFilename });
		} catch (error) {
			console.error('[News File Upload API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// GET /api/news - Get all news
	app.get('/api/news', async (req, res) => {
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

	// GET /api/news/:id - Get single news item
	app.get('/api/news/:id', async (req, res) => {
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

	// POST /api/news - Create new news with bilingual content
	app.post('/api/news', upload.fields([
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

			// Insert English content if provided
			if (title_en) {
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
						slug_en || null,
						added_by || null
					]
				);
				console.log('[News API] Created English content for news ID:', newsId);
			}

			// Insert French content if provided
			if (title_fr) {
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
						slug_fr || null,
						added_by || null
					]
				);
				console.log('[News API] Created French content for news ID:', newsId);
			}

			res.json({ success: true, data: { id: newsId } });
		} catch (error) {
			console.error('[News API] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	});

	// PUT /api/news/:id - Update news
	app.put('/api/news/:id', upload.fields([
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
					if (slug_en !== undefined) {
						contentFields.push('slug_url = ?');
						contentValues.push(slug_en || null);
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
							slug_en || null,
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
					if (slug_fr !== undefined) {
						contentFields.push('slug_url = ?');
						contentValues.push(slug_fr || null);
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
							slug_fr || null,
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
	app.delete('/api/news/:id', async (req, res) => {
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
	app.put('/api/news/:id/order', async (req, res) => {
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

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('\nShutting down gracefully...');
	await closePool();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('\nShutting down gracefully...');
	await closePool();
	process.exit(0);
});

// Error handling for uncaught errors
process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
try {
	app.listen(PORT, HOST, () => {
		const serverUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
		console.log(`\n✓ Server running on http://${HOST}:${PORT}`);
		console.log(`  Accessible at: ${serverUrl}`);
		console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
		console.log(`  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'streamline_sport'}`);
		console.log(`\n  API endpoints:`);
		console.log(`  - Health: ${serverUrl}/api/health`);
		console.log(`  - DB Test: ${serverUrl}/api/test-db`);
		console.log(`  - Menu: ${serverUrl}/api/menu?lang=fr`);
		console.log(`  - Public Gallery: ${serverUrl}/api/public/gallery`);
		console.log(`  - Slider: ${serverUrl}/api/slider`);
		console.log(`  - News: ${serverUrl}/api/news\n`);
	});
} catch (error) {
	console.error('Failed to start server:', error);
	process.exit(1);
}

