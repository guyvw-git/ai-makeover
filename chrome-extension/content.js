// AI Makeover Content Script

// Load configuration
let CONFIG = window.AI_MAKEOVER_CONFIG || { API_BASE_URL: 'http://localhost:3000' };

if (!window.AI_MAKEOVER_CONFIG) {
    console.warn('window.AI_MAKEOVER_CONFIG was not found. Using default localhost:3000.');
}

console.log('AI Makeover Config:', CONFIG);

console.log("AI Makeover Extension Loaded");

// Helper to create elements
function createElement(tag, className, innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
}

// Icons
const WAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="ai-makeover-wand-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" /></svg>`;
const STYLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>`;
const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" /></svg>`;
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
// CUSTOM ICON (Pencil/Edit)
const CUSTOM_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;

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
    // Check if we should ignore this page
    try {
        const appUrl = new URL(CONFIG.API_BASE_URL);
        const currentHostname = window.location.hostname;
        const appHostname = appUrl.hostname;

        // Check for exact match or localhost variations
        const isLocalhost = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';
        const isSameHost = currentHostname === appHostname || (isLocalhost(currentHostname) && isLocalhost(appHostname));
        const isSamePort = window.location.port === appUrl.port || (!window.location.port && !appUrl.port);

        if (
            document.body.classList.contains('ai-makeover-app') ||
            document.querySelector('meta[name="ai-makeover-extension-ignore"]') ||
            (isSameHost && isSamePort)
        ) {
            console.log('[AI Makeover] Ignoring this page (app detected)');
            return;
        }
    } catch (e) {
        console.warn('[AI Makeover] Error checking ignore rules:', e);
        // Fallback: check for class and meta tag only
        if (
            document.body && document.body.classList.contains('ai-makeover-app') ||
            document.querySelector('meta[name="ai-makeover-extension-ignore"]')
        ) return;
    }

    const images = document.querySelectorAll('img');
    images.forEach(async img => {
        // Skip if already processed or too small
        if (img.dataset.aiMakeoverProcessed || img.width < 200 || img.height < 200) return;

        img.dataset.aiMakeoverProcessed = 'true';

        // Check if user is authenticated before showing magic wand
        console.log('[AI Makeover] Checking auth for image:', img.src.substring(0, 50));
        console.log('[AI Makeover] authManager defined?', typeof window.authManager !== 'undefined');

        if (typeof window.authManager === 'undefined') {
            console.log('[AI Makeover] Auth manager not loaded yet');
            return;
        }

        const isAuth = await window.authManager.isAuthenticated();
        console.log('[AI Makeover] Is authenticated?', isAuth);

        if (!isAuth) {
            // Don't show magic wand - user needs to sign in via popup first
            console.log('[AI Makeover] User not authenticated. Please sign in via extension popup.');
            return;
        }

        console.log('[AI Makeover] User is authenticated! Creating magic wand button...');

        const wrapper = createElement('div', 'ai-makeover-image-wrapper');

        // Preserve the original image's display context
        const computedStyle = window.getComputedStyle(img);
        const imgDisplay = computedStyle.display;

        wrapper.style.position = 'relative';
        wrapper.style.display = imgDisplay === 'block' ? 'block' : 'inline-block';
        wrapper.style.width = img.width + 'px';
        wrapper.style.height = img.height + 'px';
        wrapper.style.isolation = 'isolate'; // Create new stacking context

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Ensure image fills wrapper
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';

        // Add Magic Wand Button
        const btn = createElement('div', 'ai-makeover-wand-btn', WAND_ICON);
        btn.title = "AI Makeover";
        wrapper.appendChild(btn);

        // Handle Wand Click - Show Radial Menu
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showRadialMenu(wrapper, img, btn);
        });
    });
}

// Show Radial Menu with Style Options
function showRadialMenu(wrapper, img, btn) {
    // Hide the magic wand button
    btn.style.display = 'none';

    // Create shadow host for style isolation
    const shadowHost = createElement('div', 'ai-makeover-shadow-host');
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '100%';
    shadowHost.style.height = '100%';
    shadowHost.style.zIndex = '10000';

    // Stop event propagation
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evt => {
        shadowHost.addEventListener(evt, (e) => e.stopPropagation());
    });

    wrapper.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // Load styles into shadow DOM
    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadow.appendChild(styleLink);

    // Create radial menu container
    const radialMenu = createElement('div', 'ai-makeover-radial-menu');
    shadow.appendChild(radialMenu);

    // Add all styles + custom prompt option
    const items = [
        ...DESIGN_STYLES.map(s => ({ type: 'style', ...s })),
        { type: 'custom', name: 'Custom Prompt', icon: CUSTOM_ICON, id: 'custom' }
    ];

    const radius = 80; // Distance from center
    const totalItems = items.length;
    const startAngle = -90; // Start at top

    items.forEach((item, index) => {
        const itemBtn = createElement('div', 'ai-makeover-radial-item');
        itemBtn.dataset.title = item.name;

        // Render icon
        if (item.type === 'custom') {
            itemBtn.innerHTML = item.icon; // Already full SVG
            itemBtn.classList.add('custom-prompt');
        } else {
            // Create SVG from path
            itemBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${item.icon}" />
                </svg>`;
        }

        // Calculate position in circle
        const angleDeg = startAngle + (index * (360 / totalItems));
        const angleRad = angleDeg * (Math.PI / 180);
        const x = radius * Math.cos(angleRad);
        const y = radius * Math.sin(angleRad);

        itemBtn.style.left = `calc(50% + ${x}px)`;
        itemBtn.style.top = `calc(50% + ${y}px)`;

        // Click handler
        itemBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.type === 'custom') {
                // Show custom prompt input
                shadowHost.remove();
                showMagicInput(wrapper, img, btn);
            } else {
                // Trigger generation with this style
                shadowHost.remove();
                handleGenerateWithStyle(wrapper, img, btn, item.extensivePrompt);
            }
        });

        radialMenu.appendChild(itemBtn);
    });

    // Click outside to close
    function handleClickOutside(e) {
        if (!shadowHost.contains(e.target)) {
            shadowHost.remove();
            btn.style.display = 'flex';
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }
    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 100);
}

// Handle generation with a selected style
async function handleGenerateWithStyle(wrapper, img, btn, stylePrompt) {
    // Show loading state
    btn.classList.add('ai-makeover-loading');
    btn.style.display = 'flex';

    try {
        // Get auth token
        const auth = await window.authManager.getAuth();

        if (!auth || !auth.accessToken) {
            showError(wrapper, 'Please sign in via the extension popup to use AI Makeover', btn);
            return;
        }

        const base64 = await fetchImageViaBackground(img.src);

        // Use the style's extensive prompt
        const finalPrompt = "Redesign this room. " + stylePrompt;

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.accessToken}`
            },
            body: JSON.stringify({
                imageBase64: base64,
                prompt: finalPrompt,
                metadata: {
                    userEmail: auth.email,
                    sourceUrl: window.location.href
                }
            })
        });

        if (response.status === 401) {
            showError(wrapper, 'Session expired. Please sign in again via the extension popup.', btn);
            await window.authManager.signOut();
            return;
        }

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
        btn.classList.remove('ai-makeover-loading');
        btn.style.display = 'none';
    }
}

// Show Magic Input UI
function showMagicInput(wrapper, img, btn) {
    btn.style.display = 'none';

    // Create shadow host for style isolation
    const shadowHost = createElement('div', 'ai-makeover-shadow-host');
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '100%';
    shadowHost.style.height = '100%';
    shadowHost.style.zIndex = '10000';

    // Stop event propagation
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evt => {
        shadowHost.addEventListener(evt, (e) => e.stopPropagation());
    });

    wrapper.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // Load styles into shadow DOM
    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadow.appendChild(styleLink);

    // Container
    const container = createElement('div', 'ai-makeover-magic-input-container text-mode');
    shadow.appendChild(container);

    // Render Text Input Mode
    function renderTextInput() {
        container.innerHTML = '';
        container.className = 'ai-makeover-magic-input-container text-mode';

        const inputWrapper = createElement('div', 'ai-makeover-input-wrapper');

        // Style Toggle
        const styleToggle = createElement('button', 'ai-makeover-style-toggle', STYLE_ICON);
        styleToggle.title = "Choose a Style";
        styleToggle.onclick = (e) => {
            e.stopPropagation();
            renderStyleSelector();
        };

        // Input
        const input = createElement('input', 'ai-makeover-text-input');
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
        const sendBtn = createElement('button', 'ai-makeover-send-btn', SEND_ICON);
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
        container.className = 'ai-makeover-magic-input-container style-mode';

        const selector = createElement('div', 'ai-makeover-style-selector');

        // Bar
        const bar = createElement('div', 'ai-makeover-selector-bar');

        DESIGN_STYLES.forEach(style => {
            const styleBtn = createElement('button', 'ai-makeover-style-btn');
            styleBtn.title = style.name;
            styleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white">
        <path stroke-linecap="round" stroke-linejoin="round" d="${style.icon}" />
    </svg>
    <span class="ai-makeover-style-label">${style.name}</span>
`;
            styleBtn.onclick = (e) => {
                e.stopPropagation();
                handleGenerate(null, style.extensivePrompt);
            };
            bar.appendChild(styleBtn);
        });

        // Close Button
        const closeBtn = createElement('button', 'ai-makeover-close-selector-btn', CLOSE_ICON);
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
        shadowHost.remove();

        // Add loading state to button instead of separate spinner
        btn.classList.add('ai-makeover-loading');
        btn.style.display = 'flex';

        try {
            // Get auth token
            const auth = await window.authManager.getAuth();

            if (!auth || !auth.accessToken) {
                showError(wrapper, 'Please sign in via the extension popup to use AI Makeover', btn);
                return;
            }

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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.accessToken}`
                },
                body: JSON.stringify({
                    imageBase64: base64,
                    prompt: finalPrompt,
                    metadata: {
                        userEmail: auth.email,
                        sourceUrl: window.location.href
                    }
                })
            });

            // Handle 401 Unauthorized (token expired/invalid)
            if (response.status === 401) {
                showError(wrapper, 'Session expired. Please sign in again via the extension popup.', btn);
                await window.authManager.signOut(); // Clear invalid token
                return;
            }

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
            btn.classList.remove('ai-makeover-loading');
        }
    }

    // Click Outside Listener
    function handleClickOutside(e) {
        if (!shadowHost.contains(e.target) && !btn.contains(e.target)) {
            shadowHost.remove();
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
    const host = createElement('div', 'ai-makeover-shadow-host');
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

    const errorOverlay = createElement('div', 'ai-makeover-error-overlay');

    errorOverlay.innerHTML = `
    <div class="ai-makeover-error-content">
            <div class="ai-makeover-error-header">
                <div class="ai-makeover-error-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 32px; height: 32px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="ai-makeover-error-title">Can't reach Server</div>
            </div>
            <div class="ai-makeover-error-message">${errorMessage}</div>
            <button class="ai-makeover-error-close-btn">Close</button>
        </div>
    `;

    shadow.appendChild(errorOverlay);

    const closeBtn = errorOverlay.querySelector('.ai-makeover-error-close-btn');
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
    const host = createElement('div', 'ai-makeover-shadow-host');
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

    const overlay = createElement('div', 'ai-makeover-overlay');

    overlay.innerHTML = `
    <img src="${originalUrl}" class="ai-makeover-img-original">
        <img src="${aiUrl}" class="ai-makeover-img-ai ai-makeover-overlay-ai" style="opacity: 1">

            <div class="ai-makeover-label ai-makeover-label-original">Original</div>
            <div class="ai-makeover-label ai-makeover-label-ai">AI Makeover</div>

            <div class="ai-makeover-slider-container">
                <span class="ai-makeover-slider-label">Original</span>
                <input type="range" min="0" max="100" value="100" class="ai-makeover-range">
                    <span class="ai-makeover-slider-label ai">AI</span>
                    <button class="ai-makeover-close-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
            </div>
            `;

    shadow.appendChild(overlay);

    const slider = overlay.querySelector('.ai-makeover-range');
    const aiImg = overlay.querySelector('.ai-makeover-overlay-ai');
    const aiLabel = overlay.querySelector('.ai-makeover-label-ai');
    const closeBtn = overlay.querySelector('.ai-makeover-close-btn');

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
        const btn = wrapper.querySelector('.ai-makeover-wand-btn');
        if (btn) btn.style.display = 'flex';
    });
}

// Run periodically
setInterval(processImages, 2000);
processImages();
