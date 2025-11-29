import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MySQL 5.1 compatible connection configuration
 * @returns {mysql.ConnectionConfig}
 */
function getConnectionConfig() {
	return {
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '3306'),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'streamline_sport',
		// MySQL 5.1 compatibility settings
		charset: 'utf8', // MySQL 5.1 uses utf8, not utf8mb4
		timezone: '+00:00',
		// Disable features not supported in MySQL 5.1
		enableKeepAlive: true,
		keepAliveInitialDelay: 0,
		// Connection timeout
		connectTimeout: 10000,
		// MySQL 5.1 specific flags
		flags: ['-FOUND_ROWS', '-IGNORE_SPACE']
	};
}

/**
 * Create a new MySQL connection
 * @returns {Promise<mysql.Connection>}
 */
export async function createConnection() {
	try {
		const config = getConnectionConfig();
		const connection = await mysql.createConnection(config);

		// Set session variables for MySQL 5.1 compatibility
		await connection.execute("SET SESSION sql_mode = 'TRADITIONAL'");
		await connection.execute("SET NAMES 'utf8'");

		console.log(`Database connection established to ${config.host}:${config.port}/${config.database}`);
		return connection;
	} catch (error) {
		console.error('Database connection error:', error.message);
		console.error('Connection config:', {
			host: process.env.DB_HOST || 'localhost',
			port: process.env.DB_PORT || '3306',
			user: process.env.DB_USER || 'root',
			database: process.env.DB_NAME || 'streamline_sport'
		});
		throw error;
	}
}

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
export async function query(sql, params = []) {
	const connection = await createConnection();
	try {
		const [rows] = await connection.execute(sql, params);
		return rows;
	} finally {
		await connection.end();
	}
}

/**
 * Create a connection pool for better performance
 * Recommended for production use
 * @returns {mysql.Pool}
 */
export function createPool() {
	const config = {
		...getConnectionConfig(),
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
		// Pool-specific settings
		acquireTimeout: 60000,
		idleTimeout: 600000,
		reconnect: true
	};

	const pool = mysql.createPool(config);

	// Handle pool errors
	pool.on('connection', (connection) => {
		console.log('New connection established in pool');
		// Set session variables for MySQL 5.1 compatibility
		connection.execute("SET SESSION sql_mode = 'TRADITIONAL'").catch(console.error);
		connection.execute("SET NAMES 'utf8'").catch(console.error);
	});

	pool.on('error', (err) => {
		console.error('Pool error:', err.message);
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			console.log('Attempting to reconnect to database...');
		}
	});

	return pool;
}

// Create a singleton pool instance
let poolInstance = null;

/**
 * Get or create the connection pool singleton
 * @returns {mysql.Pool}
 */
export function getPool() {
	if (!poolInstance) {
		poolInstance = createPool();
	}
	return poolInstance;
}

/**
 * Close the connection pool
 * @returns {Promise<void>}
 */
export async function closePool() {
	if (poolInstance) {
		await poolInstance.end();
		poolInstance = null;
		console.log('Connection pool closed');
	}
}

