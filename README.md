# StreamlineSport

A Svelte 5 application with MySQL 5.1 database integration.

## Features

- **Svelte 5** frontend with SvelteKit
- **Express.js** backend server
- **MySQL 5.1** database connection
- RESTful API endpoints
- Modern UI with responsive design

## Prerequisites

- Node.js (v18 or higher)
- MySQL 5.1 server running
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your MySQL database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=streamline_sport

SERVER_PORT=3001
NODE_ENV=development
```

## Running the Application

### Development Mode

1. Start the backend server (in one terminal):
```bash
npm run server
```

2. Start the frontend development server (in another terminal):
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:3001`

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## Project Structure

```
StreamlineSport/
├── server/           # Backend Express server
│   ├── index.js      # Main server file
│   └── db.js         # Database connection utilities
├── src/              # Svelte frontend
│   ├── routes/       # SvelteKit routes
│   └── app.css      # Global styles
├── .env.example      # Environment variables template
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/test-db` - Test database connection
- `GET /api/data` - Fetch data from database
- `POST /api/data` - Insert data into database

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE streamline_sport;
```

2. Update your `.env` file with the database credentials

3. Create your tables as needed. Example:
```sql
CREATE TABLE your_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Notes

- The application is configured for MySQL 5.1 compatibility
- Make sure your MySQL server is running before starting the application
- The backend server runs on port 3001 by default
- The frontend development server runs on port 5173 by default

## Troubleshooting

- **Database connection errors**: Verify your MySQL credentials in `.env` file
- **Port conflicts**: Change `SERVER_PORT` in `.env` if port 3001 is in use
- **Module errors**: Run `npm install` again to ensure all dependencies are installed

