// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // First time installation - check if user needs to sign in
        chrome.storage.local.get(['userAuth'], async (result) => {
            if (!result.userAuth) {
                // Open popup to prompt sign-in
                chrome.action.openPopup();
            }
        });
    }

    if (details.reason === 'update') {
        // Extension was updated - verify token is still valid
        chrome.storage.local.get(['userAuth'], async (result) => {
            if (result.userAuth && result.userAuth.expiresAt) {
                if (Date.now() > result.userAuth.expiresAt) {
                    // Token expired - clear it
                    chrome.storage.local.remove(['userAuth']);
                    chrome.action.openPopup();
                }
            }
        });
    }
});

// Handle image fetching via background script to avoid CORS issues

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_IMAGE') {
        fetch(request.url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({ base64: reader.result });
                };
                reader.onerror = () => {
                    sendResponse({ error: 'Failed to read blob' });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Background fetch error:', error);
                sendResponse({ error: error.message });
            });

        return true; // Will respond asynchronously
    }

    if (request.type === 'AUTH_SIGN_IN') {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
                return;
            }

            if (!token) {
                sendResponse({ error: 'No token received' });
                return;
            }

            try {
                // Get user info
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Failed to fetch user info codes');
                const userInfo = await response.json();

                const authData = {
                    accessToken: token,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    expiresAt: Date.now() + (3600 * 1000)
                };

                // Save to storage (shared with content script)
                chrome.storage.local.set({ 'userAuth': authData }, () => {
                    sendResponse({ user: authData });
                });

            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
        return true;
    }

    if (request.type === 'AUTH_SIGN_OUT') {
        chrome.storage.local.get(['userAuth'], (result) => {
            const token = result.userAuth ? result.userAuth.accessToken : null;
            chrome.storage.local.remove(['userAuth'], () => {
                if (token) {
                    chrome.identity.removeCachedAuthToken({ token: token }, () => {
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: true });
                }
            });
        });
        return true;
    }
});
