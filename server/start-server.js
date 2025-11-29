import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

console.log('Starting server...\n');
console.log('Environment variables loaded:');
console.log(`  DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`  SERVER_PORT: ${process.env.SERVER_PORT || '3001'}\n`);

// Import after dotenv.config() to ensure env vars are loaded
import { createConnection, getPool, closePool, query } from './db.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

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
	app.listen(PORT, () => {
		console.log(`\n✓ Server running on http://localhost:${PORT}`);
		console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
		console.log(`  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'streamline_sport'}`);
		console.log(`\n  API endpoints:`);
		console.log(`  - Health: http://localhost:${PORT}/api/health`);
		console.log(`  - DB Test: http://localhost:${PORT}/api/test-db`);
		console.log(`  - Menu: http://localhost:${PORT}/api/menu?lang=fr\n`);
	});
} catch (error) {
	console.error('Failed to start server:', error);
	process.exit(1);
}

