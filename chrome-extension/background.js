// Background script to handle cross-origin image fetching

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
});
