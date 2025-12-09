// Zillow AI Makeover Content Script

// Load configuration
let CONFIG = { API_BASE_URL: 'http://localhost:3000' }; // Default fallback
try {
    // Import config.js - it's loaded as a web accessible resource
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('config.js');
    script.onload = () => {
        if (typeof window.CONFIG !== 'undefined') {
            CONFIG = window.CONFIG;
        }
    };
    document.head.appendChild(script);
} catch (e) {
    console.warn('Failed to load config.js, using default localhost:3000');
}

console.log("Zillow AI Makeover Extension Loaded");

// Helper to create elements
function createElement(tag, className, innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
}

// Icons
const WAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="zillow-ai-wand-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" /></svg>`;
const STYLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>`;
const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" /></svg>`;
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

// Style Data
const DESIGN_STYLES = [
    {
        id: 'modern',
        name: 'Modern',
        icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
        extensivePrompt: 'Render this room in a sleek Modern style. Use clean lines, minimalist furniture, and a neutral color palette (white, grey, black). Incorporate materials like glass, metal, and smooth wood. Ensure the space is clutter-free and functional with contemporary, geometric lighting. The final look should be elegant, simple, and high-end.'
    },
    {
        id: 'scandinavian',
        name: 'Scandinavian',
        icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
        extensivePrompt: 'Render this room in a Scandinavian style. Make it bright, airy, and cozy. Use light wood tones, white walls, and natural fabrics. Add subtle pastels, indoor plants, and soft textures. Focus on simplicity, comfort, and natural light. Avoid heavy ornamentation or dark colors.'
    },
    {
        id: 'industrial',
        name: 'Industrial',
        icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
        extensivePrompt: 'Render this room in an Industrial style. Feature exposed brick or concrete, metal fixtures, and reclaimed wood. Use a neutral earth tone palette with leather accents and iron piping. Include large factory-style windows if possible. Lighting should be warm and warehouse-inspired (e.g., Edison bulbs).'
    },
    {
        id: 'boho',
        name: 'Bohemian',
        icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
        extensivePrompt: 'Render this room in a Bohemian (Boho) style. Create an artistic, relaxed, and eclectic space. Use warm earthy tones, layered patterns, and plenty of indoor plants. Incorporate vintage or handmade pieces, woven textiles, rugs, and natural materials. The design should feel lived-in and expressive.'
    },
    {
        id: 'traditional',
        name: 'Traditional',
        icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
        extensivePrompt: 'Render this room in a Traditional style. Use classic furniture shapes, rich wood finishes, and elegant details. Emphasize symmetry and a warm neutral color palette. Incorporate paneling, molding, patterned fabrics, and refined decor like chandeliers. Avoid modern minimalism.'
    },
    {
        id: 'japandi',
        name: 'Japandi',
        icon: 'M5 12h14M12 5v14m-7 3h14a2 2 0 002-2V7.5L12 2 3 7.5V19a2 2 0 002 2z',
        extensivePrompt: 'Render this room in Japandi style — a fusion of Japanese minimalism and Scandinavian warmth. Use natural materials like light wood and stone, neutral earthy tones (tan, sand, charcoal, off-white), and clean, low-profile furniture. Add subtle texture with linen, organic forms, and soft lighting. The final result should feel calm, harmonious, balanced, and understated with focus on simplicity and nature.'
    }
];

// Process images
function processImages() {
    // Avoid running on our own app
    try {
        const appUrl = new URL(CONFIG.API_BASE_URL);
        if (
            document.body.classList.contains('zillow-makeover-app') ||
            (window.location.hostname === appUrl.hostname && window.location.port === appUrl.port) ||
            document.querySelector('meta[name="zillow-ai-extension-ignore"]')
        ) return;
    } catch (e) {
        // If URL parsing fails, just check for the class and meta tag
        if (
            document.body.classList.contains('zillow-makeover-app') ||
            document.querySelector('meta[name="zillow-ai-extension-ignore"]')
        ) return;
    }

    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Skip if already processed or too small
        if (img.dataset.zillowAiProcessed || img.width < 200 || img.height < 200) return;

        // Mark as processed
        img.dataset.zillowAiProcessed = 'true';

        const wrapper = createElement('div', 'zillow-ai-image-wrapper');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Add Magic Wand Button
        const btn = createElement('div', 'zillow-ai-wand-btn', WAND_ICON);
        btn.title = "AI Makeover";
        wrapper.appendChild(btn);

        // Handle Wand Click
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showMagicInput(wrapper, img, btn);
        });
    });
}

// Show Magic Input UI
function showMagicInput(wrapper, img, btn) {
    btn.style.display = 'none';

    // Container
    const container = createElement('div', 'zillow-ai-magic-input-container text-mode');
    wrapper.appendChild(container);

    // Render Text Input Mode
    function renderTextInput() {
        container.innerHTML = '';
        container.className = 'zillow-ai-magic-input-container text-mode';

        const inputWrapper = createElement('div', 'zillow-ai-input-wrapper');

        // Style Toggle
        const styleToggle = createElement('button', 'zillow-ai-style-toggle', STYLE_ICON);
        styleToggle.title = "Choose a Style";
        styleToggle.onclick = (e) => {
            e.stopPropagation();
            renderStyleSelector();
        };

        // Input
        const input = createElement('input', 'zillow-ai-text-input');
        input.type = 'text';
        input.placeholder = 'Add to prompt...';

        // Aggressively stop propagation to prevent host site from stealing focus
        ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress'].forEach(evt => {
            input.addEventListener(evt, (e) => e.stopPropagation());
        });

        input.onkeydown = (e) => {
            e.stopPropagation(); // Double check
            if (e.key === 'Enter') handleGenerate(input.value);
        };

        // Send Button
        const sendBtn = createElement('button', 'zillow-ai-send-btn', SEND_ICON);
        sendBtn.onclick = (e) => {
            e.stopPropagation();
            handleGenerate(input.value);
        };

        inputWrapper.appendChild(styleToggle);
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(sendBtn);
        container.appendChild(inputWrapper);

        // Auto-focus
        setTimeout(() => input.focus(), 50);
    }

    // Render Style Selector Mode
    function renderStyleSelector() {
        container.innerHTML = '';
        container.className = 'zillow-ai-magic-input-container style-mode';

        const selector = createElement('div', 'zillow-ai-style-selector');

        // Bar
        const bar = createElement('div', 'zillow-ai-selector-bar');

        DESIGN_STYLES.forEach(style => {
            const styleBtn = createElement('button', 'zillow-ai-style-btn');
            styleBtn.title = style.name;
            styleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${style.icon}" />
                </svg>
                <span class="zillow-ai-style-label">${style.name}</span>
            `;
            styleBtn.onclick = (e) => {
                e.stopPropagation();
                handleGenerate(null, style.extensivePrompt);
            };
            bar.appendChild(styleBtn);
        });

        // Close Button
        const closeBtn = createElement('button', 'zillow-ai-close-selector-btn', CLOSE_ICON);
        closeBtn.title = "Back to Text Input";
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            renderTextInput();
        };

        selector.appendChild(bar);
        selector.appendChild(closeBtn);
        container.appendChild(selector);
    }

    // Handle Generation
    async function handleGenerate(magicPrompt, overridePrompt = null) {
        container.remove();

        // Add loading state to button instead of separate spinner
        btn.classList.add('zillow-ai-loading');
        btn.style.display = 'flex';

        try {
            const base64 = await fetchImageViaBackground(img.src);

            // Default prompt logic
            let finalPrompt = "Rerender the attached image into a luxury house setting. Focus on resell value for the house and touch up this room to make it visually fantastic. You CAN NOT change the structural layout of the room. You should work with light colors like white, black trim and wood accents to make it look expensive. Always think about redoing flooring and walls. You should furnish the rooms too so it looks like they are nicely staged";

            if (overridePrompt) {
                // Prepend clear instruction to avoid text-only response
                finalPrompt = "Redesign this room. " + overridePrompt;
            } else if (magicPrompt) {
                finalPrompt += " " + magicPrompt;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64,
                    prompt: finalPrompt
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.aiUrl) {
                showComparisonOverlay(wrapper, img.src, data.aiUrl);
            } else {
                showError(wrapper, 'AI Generation Failed: ' + (data.error || 'Unknown error'), btn);
            }

        } catch (err) {
            console.error('AI Makeover Error:', err);
            let errorMessage = 'Error generating AI makeover';

            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                errorMessage = `Cannot connect to server at ${CONFIG.API_BASE_URL}. Please ensure the server is running.`;
            } else if (err.message.includes('Server error')) {
                errorMessage = err.message;
            } else {
                errorMessage = err.message || 'Unknown error occurred';
            }

            showError(wrapper, errorMessage, btn);
        } finally {
            btn.classList.remove('zillow-ai-loading');
        }
    }

    // Click Outside Listener
    function handleClickOutside(e) {
        if (!container.contains(e.target) && !btn.contains(e.target)) {
            container.remove();
            btn.style.display = 'flex';
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }

    // Initialize
    renderTextInput();

    // Delay adding listener to avoid immediate trigger
    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 100);
}

// Show Error Overlay
function showError(wrapper, errorMessage, btn) {
    const host = createElement('div', 'zillow-ai-shadow-host');
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.zIndex = '10000';

    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evt => {
        host.addEventListener(evt, (e) => e.stopPropagation());
    });

    wrapper.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadow.appendChild(styleLink);

    const errorOverlay = createElement('div', 'zillow-ai-error-overlay');

    errorOverlay.innerHTML = `
        <div class="zillow-ai-error-content">
            <div class="zillow-ai-error-header">
                <div class="zillow-ai-error-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 32px; height: 32px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="zillow-ai-error-title">Can't reach Server</div>
            </div>
            <div class="zillow-ai-error-message">${errorMessage}</div>
            <button class="zillow-ai-error-close-btn">Close</button>
        </div>
    `;

    shadow.appendChild(errorOverlay);

    const closeBtn = errorOverlay.querySelector('.zillow-ai-error-close-btn');
    closeBtn.addEventListener('click', () => {
        host.remove();
        // Show wand button again when error is dismissed
        if (btn) btn.style.display = 'flex';
    });
}

// Fetch Image via Background Script
function fetchImageViaBackground(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_IMAGE', url: url }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.error) {
                reject(new Error(response.error));
            } else if (response && response.base64) {
                resolve(response.base64);
            } else {
                reject(new Error('Unknown error fetching image'));
            }
        });
    });
}

// Show Comparison Overlay
function showComparisonOverlay(wrapper, originalUrl, aiUrl) {
    const host = createElement('div', 'zillow-ai-shadow-host');
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.zIndex = '10000';

    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evt => {
        host.addEventListener(evt, (e) => e.stopPropagation());
    });

    wrapper.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadow.appendChild(styleLink);

    const overlay = createElement('div', 'zillow-ai-overlay');

    overlay.innerHTML = `
        <img src="${originalUrl}" class="zillow-ai-img-original">
        <img src="${aiUrl}" class="zillow-ai-img-ai zillow-ai-overlay-ai" style="opacity: 1">
        
        <div class="zillow-ai-label zillow-ai-label-original">Original</div>
        <div class="zillow-ai-label zillow-ai-label-ai">AI Makeover</div>

        <div class="zillow-ai-slider-container">
            <span class="zillow-ai-slider-label">Original</span>
            <input type="range" min="0" max="100" value="100" class="zillow-ai-range">
            <span class="zillow-ai-slider-label ai">AI</span>
            <button class="zillow-ai-close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    `;

    shadow.appendChild(overlay);

    const slider = overlay.querySelector('.zillow-ai-range');
    const aiImg = overlay.querySelector('.zillow-ai-overlay-ai');
    const aiLabel = overlay.querySelector('.zillow-ai-label-ai');
    const closeBtn = overlay.querySelector('.zillow-ai-close-btn');

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        aiImg.style.opacity = val / 100;
        aiLabel.style.opacity = val / 100;
    });

    // Initialize slider position and opacity to 100%
    slider.value = 100;
    aiImg.style.opacity = 1;
    aiLabel.style.opacity = 1;

    closeBtn.addEventListener('click', () => {
        host.remove();
        // Show wand button again when overlay is closed
        const btn = wrapper.querySelector('.zillow-ai-wand-btn');
        if (btn) btn.style.display = 'flex';
    });
}

// Run periodically
setInterval(processImages, 2000);
processImages();
