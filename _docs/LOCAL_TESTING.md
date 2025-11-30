# Local Testing Guide - StreamlineSport v3

Simple guide to run the application on your local machine for testing.

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **MySQL 5.1** server running locally
3. **Database** created and configured

## Quick Setup (5 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` with your local settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=streamline_sport

# Server Configuration
SERVER_PORT=3111
SERVER_HOST=0.0.0.0
NODE_ENV=development

# Frontend Configuration
FRONTEND_PORT=5555
FRONTEND_HOST=0.0.0.0
API_URL=http://localhost:3111

# Frontend API Base URL
VITE_API_BASE_URL=http://localhost:3111

# Public Club ID (if needed)
PUBLIC_CLUB_ID=CLUB_ID
```

### Step 3: Verify Database Connection

Test your database connection:

```bash
npm run test-db
```

You should see:
```
✅ All tests passed! Database connection is working correctly.
```

### Step 4: Start Backend Server

Open **Terminal 1** (PowerShell or Command Prompt):

```bash
npm run server
```

You should see:
```
✓ Server running on http://0.0.0.0:3111
  Accessible at: http://localhost:3111
  Environment: development
  Database: localhost:3306/streamline_sport
```

**Keep this terminal open!**

### Step 5: Start Frontend Server

Open **Terminal 2** (new PowerShell or Command Prompt window):

```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5555/
```

## Access Your Application

- **Frontend**: http://localhost:5555
- **Backend API**: http://localhost:3111
- **API Health Check**: http://localhost:3111/api/health
- **Database Test**: http://localhost:3111/api/test-db

## Testing Different Languages

- **French**: http://localhost:5555/fr
- **English**: http://localhost:5555/en

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run server` | Start backend server (port 3111) |
| `npm run dev` | Start frontend dev server (port 5555) |
| `npm run test-db` | Test database connection |
| `npm run verify-env` | Verify environment variables |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

**Windows:**
```powershell
# Check what's using port 3111
netstat -ano | findstr :3111

# Check what's using port 5555
netstat -ano | findstr :5555
```

**Kill the process:**
```powershell
# Replace PID with the process ID from above
taskkill /PID <PID> /F
```

Or change the ports in your `.env` file.

### Database Connection Failed

1. **Check MySQL is running:**
   ```bash
   mysqladmin -u root -p status
   ```

2. **Verify database exists:**
   ```sql
   CREATE DATABASE IF NOT EXISTS streamline_sport;
   ```

3. **Check credentials in `.env`:**
   - `DB_HOST=localhost`
   - `DB_USER=root` (or your MySQL username)
   - `DB_PASSWORD=your_password`
   - `DB_NAME=streamline_sport`

### Frontend Can't Connect to Backend

1. **Verify backend is running:**
   - Open http://localhost:3111/api/health in browser
   - Should return: `{"status":"ok","message":"Server is running",...}`

2. **Check `VITE_API_BASE_URL` in `.env`:**
   ```
   VITE_API_BASE_URL=http://localhost:3111
   ```
   - No spaces around `=`
   - No quotes or semicolons
   - Port matches `SERVER_PORT`

3. **Restart frontend server** after changing `.env`:
   - Stop with `Ctrl+C`
   - Run `npm run dev` again

### Both Servers on Same Machine

For local testing, both servers run on `localhost`:

- **Backend**: `http://localhost:3111`
- **Frontend**: `http://localhost:5555`
- **API URL**: `http://localhost:3111`

This is the default configuration and works perfectly for local testing.

## Development Workflow

1. **Start both servers** (Terminal 1: backend, Terminal 2: frontend)
2. **Make changes** to your code
3. **Frontend auto-reloads** (Vite hot module replacement)
4. **Backend requires restart** for changes (stop with `Ctrl+C`, run `npm run server` again)

## Stopping the Servers

Press `Ctrl+C` in each terminal to stop the servers.

## Next Steps

Once local testing works:
- See `HOSTING_GUIDE.md` for production deployment
- See `START_SERVERS.md` for more detailed server information
- See `DATABASE_SETUP.md` for database schema setup

