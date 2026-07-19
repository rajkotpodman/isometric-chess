# Isometric Chess - Render Deployment Configuration

This application is a static HTML5 Canvas game that requires no build process.

## Deployment Instructions

### On Render.com:
1. Connect your GitHub repository
2. Create a new Web Service
3. Set the build command to: `npm install http-server`
4. Set the start command to: `npx http-server . -p $PORT`
5. Deploy!

### Local Testing:
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server . -p 8000

# Option 3: Open directly
Open index.html in your browser
```

Then visit `http://localhost:8000` in your browser.

## About This Project

A fully playable chess game with:
- Isometric 3D board visualization
- Complete chess rules enforcement
- Check/checkmate detection
- Move history tracking
- Touch support for mobile devices

No build process needed - pure vanilla JavaScript!
