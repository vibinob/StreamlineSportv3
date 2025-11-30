# Hosting Guide - StreamlineSport v3

This guide explains how to host your StreamlineSport application with the backend server and frontend on different host addresses.

## Project Architecture

- **Backend Server**: Express.js API server (default: port 3111)
- **Frontend**: SvelteKit application (default: port 5555)
- **Database**: MySQL 5.1

## Quick Start

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your hosting configuration:

```env
# Database Configuration
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=streamline_sport

# Backend Server Configuration
SERVER_PORT=3111
SERVER_HOST=0.0.0.0  # Use 0.0.0.0 to listen on all interfaces
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=5555
FRONTEND_HOST=0.0.0.0  # Use 0.0.0.0 to listen on all interfaces
VITE_API_BASE_URL=http://your-backend-host:3111  # Backend API URL for frontend to connect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Servers

#### Option A: Development Mode (Two Terminals)

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

#### Option B: Production Mode

**Terminal 1 - Build Frontend:**
```bash
npm run build
```

**Terminal 2 - Start Backend:**
```bash
npm run server
```

**Terminal 3 - Start Frontend (Production):**
```bash
npm run preview
```

## Hosting Scenarios

### Scenario 1: Same Server, Different Ports (Local Development)

Both servers run on the same machine but different ports.

**Configuration:**
```env
SERVER_HOST=0.0.0.0
SERVER_PORT=3111
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5555
VITE_API_BASE_URL=http://localhost:3111
```

**Access:**
- Frontend: `http://localhost:5555`
- Backend API: `http://localhost:3111`

### Scenario 2: Different Servers (Production)

Backend and frontend run on separate servers or IP addresses.

**Backend Server Configuration (.env on backend server):**
```env
SERVER_HOST=0.0.0.0  # Listen on all interfaces
SERVER_PORT=3111
DB_HOST=your_database_server
# ... other DB config
```

**Frontend Server Configuration (.env on frontend server):**
```env
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5555
VITE_API_BASE_URL=http://backend-server-ip:3111  # Point to backend server
# ... DB config not needed on frontend server
```

**Access:**
- Frontend: `http://frontend-server-ip:5555`
- Backend API: `http://backend-server-ip:3111`

### Scenario 3: Same Server, Same Domain (Reverse Proxy)

Both servers run on the same machine, accessed through a reverse proxy (nginx/Apache).

**Backend Configuration:**
```env
SERVER_HOST=127.0.0.1  # Only listen on localhost
SERVER_PORT=3111
```

**Frontend Configuration:**
```env
FRONTEND_HOST=127.0.0.1  # Only listen on localhost
FRONTEND_PORT=5555
VITE_API_BASE_URL=http://127.0.0.1:3111
```

**Nginx Example Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3111;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables Reference

### Backend Server Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_HOST` | `0.0.0.0` | Host address to bind the server. Use `0.0.0.0` for all interfaces, `127.0.0.1` for localhost only |
| `SERVER_PORT` | `3111` | Port number for the backend server |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `DB_HOST` | `localhost` | MySQL database host |
| `DB_PORT` | `3306` | MySQL database port |
| `DB_USER` | `root` | MySQL database user |
| `DB_PASSWORD` | - | MySQL database password |
| `DB_NAME` | `streamline_sport` | MySQL database name |

### Frontend Server Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_HOST` | `0.0.0.0` | Host address to bind the frontend server |
| `FRONTEND_PORT` | `5555` | Port number for the frontend server |
| `VITE_API_BASE_URL` | `http://localhost:3111` | Backend API URL that the frontend will proxy requests to |

## Security Considerations

### Production Checklist

1. **Firewall Configuration**
   - Only expose necessary ports (3111 for backend, 5555 for frontend, or 80/443 if using reverse proxy)
   - Block direct database access from external networks

2. **Environment Variables**
   - Never commit `.env` file to version control
   - Use strong database passwords
   - Consider using environment-specific `.env` files (`.env.production`, `.env.staging`)

3. **HTTPS/SSL**
   - Use a reverse proxy (nginx/Apache) with SSL certificates
   - Configure SSL for both frontend and backend if exposed directly

4. **CORS Configuration**
   - Update CORS settings in `server/start-server.js` to allow only your frontend domain
   - Example:
   ```javascript
   app.use(cors({
     origin: 'https://yourdomain.com',
     credentials: true
   }));
   ```

5. **Database Security**
   - Use a dedicated database user with minimal required permissions
   - Enable MySQL SSL connections if possible
   - Regularly update MySQL server

## Process Management (Production)

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

**Start Backend:**
```bash
cd /path/to/StreamlineSportv3
pm2 start server/start-server.js --name "streamline-backend"
pm2 save
pm2 startup  # Configure to start on system boot
```

**Start Frontend (Production Build):**
```bash
npm run build
pm2 serve build 5555 --name "streamline-frontend" --spa
pm2 save
```

**Manage Processes:**
```bash
pm2 list          # View all processes
pm2 logs          # View logs
pm2 restart all   # Restart all processes
pm2 stop all      # Stop all processes
```

### Using systemd (Linux)

Create `/etc/systemd/system/streamline-backend.service`:
```ini
[Unit]
Description=StreamlineSport Backend Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/StreamlineSportv3
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/start-server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable streamline-backend
sudo systemctl start streamline-backend
sudo systemctl status streamline-backend
```

## Troubleshooting

### Server Won't Start

1. **Check Port Availability:**
   ```bash
   # Windows
   netstat -an | findstr :3111
   netstat -an | findstr :5555
   
   # Linux/Mac
   lsof -i :3111
   lsof -i :5555
   ```

2. **Verify Environment Variables:**
   ```bash
   npm run verify-env
   ```

3. **Check Database Connection:**
   ```bash
   npm run test-db
   ```

### Frontend Can't Connect to Backend

1. **Verify VITE_API_BASE_URL in `.env`:**
   - Must match the backend server's actual address
   - Use `http://` or `https://` prefix
   - Include port number if not using standard ports

2. **Check CORS Settings:**
   - Ensure backend CORS allows requests from frontend domain
   - Check browser console for CORS errors

3. **Network Connectivity:**
   - Verify firewall rules allow connections
   - Test backend API directly: `curl http://backend-host:3111/api/health`

### Database Connection Issues

1. **Verify Database is Running:**
   ```bash
   mysqladmin -u root -p status
   ```

2. **Test Connection:**
   ```bash
   npm run test-db
   ```

3. **Check Database Credentials:**
   - Verify all DB_* variables in `.env`
   - Ensure database user has proper permissions
   - Confirm database exists: `SHOW DATABASES;`

## Monitoring

### Health Checks

- Backend Health: `http://your-backend-host:3111/api/health`
- Database Test: `http://your-backend-host:3111/api/test-db`

### Logs

- Backend logs: Check console output or PM2 logs
- Frontend logs: Check browser console and Vite dev server output
- Database logs: Check MySQL error log

## Additional Resources

- [SvelteKit Deployment Guide](https://kit.svelte.dev/docs/adapter-auto)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)
- [MySQL 5.1 Documentation](https://dev.mysql.com/doc/refman/5.1/en/)

