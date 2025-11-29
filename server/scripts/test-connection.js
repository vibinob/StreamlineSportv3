import dotenv from 'dotenv';
import { createConnection, getPool, closePool } from '../db.js';

dotenv.config();

/**
 * Test database connection
 */
async function testConnection() {
	console.log('Testing MySQL 5.1 database connection...\n');
	console.log('Configuration:');
	console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
	console.log(`  Port: ${process.env.DB_PORT || '3306'}`);
	console.log(`  User: ${process.env.DB_USER || 'root'}`);
	console.log(`  Database: ${process.env.DB_NAME || 'streamline_sport'}`);
	console.log('');

	try {
		// Test single connection
		console.log('1. Testing single connection...');
		const connection = await createConnection();
		const [version] = await connection.execute('SELECT VERSION() as version');
		console.log(`   ✓ Connected! MySQL Version: ${version[0].version}`);
		
		const [db] = await connection.execute('SELECT DATABASE() as db');
		console.log(`   ✓ Current Database: ${db[0].db || 'None'}`);
		
		await connection.end();
		console.log('   ✓ Connection closed\n');

		// Test connection pool
		console.log('2. Testing connection pool...');
		const pool = getPool();
		const [poolTest] = await pool.execute('SELECT 1 as test');
		console.log(`   ✓ Pool connection successful! Test result: ${poolTest[0].test}`);
		
		// Test multiple queries
		console.log('3. Testing multiple queries...');
		const [query1] = await pool.execute('SELECT NOW() as current_time');
		const [query2] = await pool.execute('SELECT USER() as current_user');
		console.log(`   ✓ Query 1: Current time = ${query1[0].current_time}`);
		console.log(`   ✓ Query 2: Current user = ${query2[0].current_user}`);
		
		await closePool();
		console.log('   ✓ Pool closed\n');

		console.log('✅ All tests passed! Database connection is working correctly.\n');
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Connection test failed!\n');
		console.error('Error details:');
		console.error(`  Code: ${error.code || 'N/A'}`);
		console.error(`  Message: ${error.message}`);
		console.error(`  SQL State: ${error.sqlState || 'N/A'}\n`);
		
		console.error('Troubleshooting tips:');
		console.error('  1. Verify MySQL server is running');
		console.error('  2. Check database credentials in .env file');
		console.error('  3. Ensure database exists: CREATE DATABASE streamline_sport;');
		console.error('  4. Verify user has proper permissions\n');
		
		process.exit(1);
	}
}

// Run the test
testConnection();

