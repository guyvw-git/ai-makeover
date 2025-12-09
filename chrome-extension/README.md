# Zillow AI Makeover Chrome Extension

## Overview

This Chrome extension adds a "Magic Wand" button to images on any website, allowing you to generate AI-powered makeovers using various design styles.

## Configuration

The extension uses a configurable API endpoint defined in `config.js`.

### Development (Default)

By default, the extension is configured to use `http://localhost:3000`:

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000'
};
```

### Production Deployment

Before deploying to production:

1. Open `config.js` in this directory
2. Update the `API_BASE_URL` to your production server URL:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-production-domain.com'
};
```

3. Save the file
4. Reload the extension in Chrome (see Installation below)

## Installation

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension` directory from this project

### Reloading After Changes

After modifying `config.js` or any other extension files:

1. Go to `chrome://extensions/`
2. Find "Zillow AI Makeover" in the list
3. Click the refresh icon (🔄) on the extension card

## Usage

1. Navigate to any website with images (e.g., zillow.com, real estate listings)
2. Hover over an image to see the Magic Wand button appear
3. Click the Magic Wand to open the style selector or custom prompt input
4. Choose a design style (Modern, Scandinavian, Industrial, etc.) or enter a custom prompt
5. Wait for the AI to generate the makeover
6. View the before/after comparison with the interactive slider

## Features

- **Multiple Design Styles**: Modern, Scandinavian, Industrial, Bohemian, Traditional, and Architectural
- **Custom Prompts**: Add your own instructions to customize the AI makeover
- **Interactive Comparison**: Slider to compare original and AI-generated images
- **Works on Any Website**: Process images from any site you visit

## Requirements

- Chrome browser (version 88 or higher)
- Running Next.js backend server (see main project README)
- API key configured in the backend (see backend `.env.local`)

## Troubleshooting

### Extension not working

- Ensure the Next.js backend is running
- Check that `config.js` has the correct API URL
- Verify the extension is loaded and enabled in `chrome://extensions/`
- Check the browser console for error messages

### API calls failing

- Confirm the backend server is accessible at the URL in `config.js`
- Check CORS settings in the backend `next.config.ts`
- Verify host permissions in `manifest.json` include your production domain

### Images not processing

- The extension only processes images larger than 200x200 pixels
- Some websites may block the extension - check for CSP (Content Security Policy) restrictions
