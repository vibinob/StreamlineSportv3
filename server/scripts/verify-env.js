import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Load environment variables
dotenv.config({ path: join(rootDir, '.env') });

console.log('Verifying .env configuration...\n');

const requiredVars = [
	'DB_HOST',
	'DB_PORT',
	'DB_USER',
	'DB_PASSWORD',
	'DB_NAME'
];

const optionalVars = [
	'SERVER_PORT',
	'NODE_ENV'
];

let allValid = true;

// Check if .env file exists
const envPath = join(rootDir, '.env');
if (!existsSync(envPath)) {
	console.error('❌ .env file not found!');
	console.error(`   Expected location: ${envPath}`);
	console.error('   Please create it from env.example: cp env.example .env\n');
	process.exit(1);
}

console.log('✓ .env file found\n');

// Check required variables
console.log('Required variables:');
requiredVars.forEach(varName => {
	const value = process.env[varName];
	if (!value) {
		console.error(`  ❌ ${varName}: Not set`);
		allValid = false;
	} else {
		// Mask password
		const displayValue = varName === 'DB_PASSWORD' 
			? '*'.repeat(Math.min(value.length, 8)) 
			: value;
		console.log(`  ✓ ${varName}: ${displayValue}`);
	}
});

console.log('\nOptional variables:');
optionalVars.forEach(varName => {
	const value = process.env[varName];
	if (value) {
		console.log(`  ✓ ${varName}: ${value}`);
	} else {
		console.log(`  - ${varName}: Using default`);
	}
});

console.log('\nConfiguration Summary:');
console.log(`  Database Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Database Port: ${process.env.DB_PORT || '3306'}`);
console.log(`  Database User: ${process.env.DB_USER || 'root'}`);
console.log(`  Database Name: ${process.env.DB_NAME || 'streamline_sport'}`);
console.log(`  Server Port: ${process.env.SERVER_PORT || '3001'}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);

if (allValid) {
	console.log('\n✅ All required environment variables are set!\n');
	console.log('You can now test the connection with: npm run test-db');
	process.exit(0);
} else {
	console.log('\n❌ Some required environment variables are missing!\n');
	console.log('Please update your .env file with the required values.');
	process.exit(1);
}

