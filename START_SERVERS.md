# How to Start the Application

This application requires **two servers** to be running:

## 1. Backend API Server (Port 3001)

The backend server handles database connections and API endpoints.

**Start it:**
```bash
npm run server
```

**Or in a separate terminal:**
```bash
node server/index.js
```

You should see:
```
Server running on http://localhost:3001
Environment: development
Database: localhost:3306/streamline_sport
```

**Test it:**
- Health check: http://localhost:3001/api/health
- Database test: http://localhost:3001/api/test-db

## 2. Frontend Development Server (Port 5555)

The frontend server serves your SvelteKit application.

**Start it (in a NEW terminal):**
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5555/
```

**Access your site:**
- Main site: http://localhost:5555
- French: http://localhost:5555/fr
- English: http://localhost:5555/en

## Quick Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Troubleshooting

### Connection Refused Error

If you see `ERR_CONNECTION_REFUSED`:

1. **Check if servers are running:**
   ```bash
   # Check backend (port 3001)
   netstat -an | findstr 3001
   
   # Check frontend (port 5555)
   netstat -an | findstr 5555
   ```

2. **Make sure both servers are started:**
   - Backend must be running on port 3001
   - Frontend must be running on port 5555

3. **Check for port conflicts:**
   - If port 3001 is in use, change `SERVER_PORT` in `.env`
   - If port 5555 is in use, change `port` in `vite.config.js`

4. **Verify .env file exists:**
   ```bash
   npm run verify-env
   ```

### Database Connection Issues

If backend starts but database connection fails:

1. **Test database connection:**
   ```bash
   npm run test-db
   ```

2. **Verify MySQL is running:**
   ```bash
   mysqladmin -u root -p status
   ```

3. **Check .env credentials:**
   - DB_HOST
   - DB_PORT
   - DB_USER
   - DB_PASSWORD
   - DB_NAME

## Production Build

For production, build the frontend first:

```bash
npm run build
npm run preview
```

Then start the backend:
```bash
npm run server
```

