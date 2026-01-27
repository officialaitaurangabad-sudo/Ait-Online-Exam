# Windows Server Setup Guide - Frontend

This guide will help you run the AIT Online Exam Platform frontend on a Windows Server.

## Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation:
     ```powershell
     node --version
     npm --version
     ```

2. **Git** (if cloning from repository)
   - Download from: https://git-scm.com/download/win

## Step-by-Step Setup

### 1. Navigate to Frontend Directory

Open PowerShell or Command Prompt and navigate to the frontend directory:

```powershell
cd D:\Online-Exam\Ait-Online-Exam\frontend
```

### 2. Install Dependencies

Install all required npm packages:

```powershell
npm install
```

**Note:** This may take a few minutes. If you encounter errors, try:
```powershell
npm install --legacy-peer-deps
```

### 3. Verify Environment File

Ensure the `.env` file exists in the `frontend` directory. It should contain:

```
VITE_API_URL=http://46.37.122.240:5000/api
```

If the file doesn't exist, it should have been created automatically. Verify with:
```powershell
Get-Content .env
```

### 4. Run in Development Mode

For development/testing:

```powershell
npm run dev
```

This will:
- Start the Vite development server
- Make the app available at: `http://46.37.122.240:5173`
- Enable hot module replacement (auto-refresh on code changes)

**To run in background (PowerShell):**
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Online-Exam\Ait-Online-Exam\frontend; npm run dev"
```

### 5. Run in Production Mode

For production deployment:

#### Step 5a: Build the Application

```powershell
npm run build
```

This creates an optimized production build in the `dist` folder.

#### Step 5b: Preview the Production Build (Optional)

```powershell
npm run preview
```

#### Step 5c: Serve with a Web Server

For production, you should use a proper web server. Options:

**Option 1: Using Node.js `serve` package**
```powershell
# Install serve globally
npm install -g serve

# Serve the built files
serve -s dist -l 5173
```

**Option 2: Using IIS (Internet Information Services)**

1. Install IIS on Windows Server
2. Create a new website pointing to the `dist` folder
3. Configure bindings for port 5173 (or your preferred port)
4. Ensure the backend CORS allows your IIS port

**Option 3: Using Nginx (if installed)**
- Configure Nginx to serve the `dist` folder
- Set up reverse proxy for API calls

## Windows Firewall Configuration

Ensure Windows Firewall allows incoming connections on port 5173:

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Frontend Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

Or manually:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `5173`
6. Allow the connection
7. Apply to all profiles
8. Name it "Frontend Dev Server"

## Running as a Windows Service (Production)

To run the frontend as a Windows service, you can use:

### Option 1: PM2 (Recommended)

```powershell
# Install PM2 globally
npm install -g pm2

# Start the dev server with PM2
cd D:\Online-Exam\Ait-Online-Exam\frontend
pm2 start npm --name "frontend-dev" -- run dev

# Or for production build with serve
pm2 start serve --name "frontend-prod" -- -s dist -l 5173

# Save PM2 configuration
pm2 save

# Setup PM2 to start on Windows boot
pm2 startup
```

### Option 2: NSSM (Non-Sucking Service Manager)

1. Download NSSM from: https://nssm.cc/download
2. Extract and run `nssm.exe install FrontendService`
3. Configure:
   - Path: `C:\Program Files\nodejs\node.exe` (or your Node.js path)
   - Startup directory: `D:\Online-Exam\Ait-Online-Exam\frontend`
   - Arguments: `npm run dev` (or `serve -s dist -l 5173` for production)
4. Install the service

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

1. Change the port in `vite.config.js`:
   ```javascript
   server: {
     port: 3000, // Change to your preferred port
     host: true,
   }
   ```

2. Update the backend CORS to include the new port

### Cannot Access from Network

1. Ensure `host: true` is set in `vite.config.js` (already configured)
2. Check Windows Firewall rules
3. Verify the server's network configuration allows external connections

### Environment Variables Not Loading

1. Ensure `.env` file exists in the `frontend` directory
2. Restart the dev server after changing `.env`
3. Verify variable names start with `VITE_`

### Build Errors

```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

## Quick Start Commands

```powershell
# Development
cd D:\Online-Exam\Ait-Online-Exam\frontend
npm install
npm run dev

# Production Build
npm run build
npm run preview

# Production with serve
npm install -g serve
serve -s dist -l 5173
```

## Access URLs

- **Development:** http://46.37.122.240:5173
- **Production (if using serve):** http://46.37.122.240:5173
- **Local access:** http://localhost:5173

## Next Steps

1. Ensure the backend is running on port 5000
2. Verify CORS configuration allows your frontend URL
3. Test the connection by accessing the frontend URL
4. Check browser console for any connection errors

## Notes

- The frontend is configured to proxy API requests to `http://46.37.122.240:5000`
- Hot reload is enabled in development mode
- Production builds are optimized and minified
- Source maps are included for debugging in production builds

