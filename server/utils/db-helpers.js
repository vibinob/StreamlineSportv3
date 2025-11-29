import { getPool } from '../db.js';

/**
 * Execute a query using the connection pool
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
export async function executeQuery(sql, params = []) {
	const pool = getPool();
	try {
		const [rows] = await pool.execute(sql, params);
		return rows;
	} catch (error) {
		console.error('Query execution error:', error.message);
		console.error('SQL:', sql);
		console.error('Params:', params);
		throw error;
	}
}

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>}
 */
export async function executeTransaction(callback) {
	const pool = getPool();
	const connection = await pool.getConnection();
	
	try {
		await connection.beginTransaction();
		const result = await callback(connection);
		await connection.commit();
		return result;
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table
 * @returns {Promise<boolean>}
 */
export async function tableExists(tableName) {
	try {
		const rows = await executeQuery(
			'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
			[tableName]
		);
		return rows[0].count > 0;
	} catch (error) {
		console.error('Error checking table existence:', error);
		return false;
	}
}

/**
 * Get table structure
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>}
 */
export async function getTableStructure(tableName) {
	try {
		return await executeQuery(`DESCRIBE ${tableName}`);
	} catch (error) {
		console.error('Error getting table structure:', error);
		throw error;
	}
}

