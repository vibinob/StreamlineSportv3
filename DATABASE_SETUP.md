# Database Setup Guide

This guide will help you set up and connect to MySQL 5.1 database for the StreamlineSport application.

## Prerequisites

- MySQL 5.1 server installed and running
- Node.js (v18 or higher)
- npm or yarn package manager

## Step 1: Create the Database

1. Connect to your MySQL server:
```bash
mysql -u root -p
```

2. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS streamline_sport CHARACTER SET utf8 COLLATE utf8_general_ci;
```

3. (Optional) Create a dedicated user:
```sql
CREATE USER 'streamline_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON streamline_sport.* TO 'streamline_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=streamline_sport
SERVER_PORT=3001
NODE_ENV=development
```

## Step 3: Test the Connection

1. Start the backend server:
```bash
npm run server
```

2. Test the database connection:
```bash
curl http://localhost:3001/api/test-db
```

Or open in your browser: `http://localhost:3001/api/test-db`

You should see a response like:
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": {
    "test": { "test": 1 },
    "version": "5.1.73",
    "database": "streamline_sport",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Step 4: Create Your Tables

Create your database tables using SQL scripts or through your MySQL client. Example:

```sql
USE streamline_sport;

-- Example table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## MySQL 5.1 Compatibility Notes

- Uses `utf8` charset instead of `utf8mb4` (MySQL 5.1 limitation)
- Some modern MySQL features may not be available
- Connection pool is configured for optimal performance with MySQL 5.1

## Troubleshooting

### Connection Refused
- Verify MySQL server is running: `mysqladmin -u root -p status`
- Check firewall settings
- Verify DB_HOST and DB_PORT in `.env`

### Access Denied
- Verify DB_USER and DB_PASSWORD in `.env`
- Check user privileges: `SHOW GRANTS FOR 'your_user'@'localhost';`

### Database Not Found
- Create the database: `CREATE DATABASE streamline_sport;`
- Verify DB_NAME in `.env` matches the database name

### Character Encoding Issues
- Ensure database uses `utf8` charset
- Verify connection charset is set to `utf8` in `server/db.js`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/test-db` - Test database connection
- `GET /api/data` - Fetch data (example endpoint)
- `POST /api/data` - Insert data (example endpoint)

## Next Steps

1. Create your database schema
2. Update API endpoints in `server/index.js` to match your tables
3. Implement your business logic
4. Test all database operations

