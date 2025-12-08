// Zillow AI Makeover Content Script

console.log("Zillow AI Makeover Extension Loaded");

// Helper to create elements
function createElement(tag, className, innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
}

// Icon SVG
const WAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="zillow-ai-wand-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z" /></svg>`;

// Process images
function processImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Skip if already processed or too small
        if (img.dataset.zillowAiProcessed || img.width < 200 || img.height < 200) return;

        // Mark as processed
        img.dataset.zillowAiProcessed = 'true';

        // Wrap image to position button
        // Note: This might break some layouts, ideally we'd use a more non-intrusive overlay method
        // But for a prototype, wrapping or appending a sibling is easiest.
        // Let's try appending a sibling container positioned absolutely over the image if the parent is relative.
        // If not, we might need to wrap. Let's try wrapping.

        const wrapper = createElement('div', 'zillow-ai-image-wrapper');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block'; // Or block depending on img

        // Insert wrapper before img
        img.parentNode.insertBefore(wrapper, img);
        // Move img into wrapper
        wrapper.appendChild(img);

        // Add Magic Wand Button
        const btn = createElement('div', 'zillow-ai-wand-btn', WAND_ICON);
        btn.title = "AI Makeover";
        wrapper.appendChild(btn);

        // Handle Click
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Show loading
            const spinner = createElement('div', 'zillow-ai-spinner-container', '<div class="zillow-ai-spinner"></div>');
            wrapper.appendChild(spinner);
            btn.style.display = 'none'; // Hide wand while loading

            try {
                // Get Base64 via background script (to bypass CORS)
                const base64 = await fetchImageViaBackground(img.src);

                // Call API
                const response = await fetch('http://localhost:3000/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64,
                        prompt: "Rerender the attached image into a luxury house setting. Focus on resell value for the house and touch up this room to make it visually fantastic. You CAN NOT change the structural layout of the room. You should work with light colors like white, black trim and wood accents to make it look expensive. Always think about redoing flooring and walls. You should furnish the rooms too so it looks like they are nicely staged"
                    })
                });

                const data = await response.json();

                if (data.aiUrl) {
                    // Show Comparison Overlay
                    showComparisonOverlay(wrapper, img.src, data.aiUrl);
                } else {
                    alert('AI Generation Failed: ' + (data.error || 'Unknown error'));
                }

            } catch (err) {
                console.error(err);
                alert('Error: ' + err.message);
            } finally {
                spinner.remove();
                btn.style.display = 'flex';
            }
        });
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
    // Create host for shadow DOM
    const host = createElement('div', 'zillow-ai-shadow-host');
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.zIndex = '10000';

    // Prevent clicks from bubbling to host site (fixes Zillow slider issue)
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evt => {
        host.addEventListener(evt, (e) => e.stopPropagation());
    });

    wrapper.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadow.appendChild(styleLink);

    // Overlay Container (inside shadow)
    const overlay = createElement('div', 'zillow-ai-overlay');

    // HTML Structure
    overlay.innerHTML = `
        <img src="${originalUrl}" class="zillow-ai-img-original">
        <img src="${aiUrl}" class="zillow-ai-img-ai zillow-ai-overlay-ai" style="opacity: 0.5">
        
        <div class="zillow-ai-label zillow-ai-label-original">Original</div>
        <div class="zillow-ai-label zillow-ai-label-ai">AI Makeover</div>
        
        <button class="zillow-ai-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="zillow-ai-slider-container">
            <span class="zillow-ai-slider-label">Original</span>
            <input type="range" min="0" max="100" value="50" class="zillow-ai-range">
            <span class="zillow-ai-slider-label ai">AI</span>
        </div>
    `;

    shadow.appendChild(overlay);

    // Logic
    const slider = overlay.querySelector('.zillow-ai-range');
    const aiImg = overlay.querySelector('.zillow-ai-overlay-ai');
    const aiLabel = overlay.querySelector('.zillow-ai-label-ai');
    const closeBtn = overlay.querySelector('.zillow-ai-close-btn');

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        aiImg.style.opacity = val / 100;
        aiLabel.style.opacity = val / 100;
    });

    closeBtn.addEventListener('click', () => {
        host.remove();
    });
}

// Run periodically to catch lazy-loaded images
setInterval(processImages, 2000);
processImages();
