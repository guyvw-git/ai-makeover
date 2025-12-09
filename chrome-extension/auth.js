// Authentication manager for Chrome extension
class AuthManager {
    constructor() {
        this.AUTH_KEY = 'userAuth';
    }

    // Check if user is authenticated
    async isAuthenticated() {
        const auth = await this.getAuth();
        if (!auth || !auth.accessToken) return false;

        // Check if token is expired
        if (auth.expiresAt && Date.now() > auth.expiresAt) {
            return false;
        }

        return true;
    }

    // Get stored auth data
    async getAuth() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.AUTH_KEY], (result) => {
                resolve(result[this.AUTH_KEY] || null);
            });
        });
    }

    // Sign in with Google (Delegates to background script if needed)
    async signIn() {
        // If we are in a content script (no chrome.identity), ask background
        if (!chrome.identity) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'AUTH_SIGN_IN' }, (response) => {
                    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                    else if (response && response.error) reject(new Error(response.error));
                    else resolve(response.user);
                });
            });
        }

        // Otherwise (popup/background), use identity directly
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!token) {
                    reject(new Error('No token received'));
                    return;
                }

                // Get user info from Google
                try {
                    const userInfo = await this.getUserInfo(token);

                    const authData = {
                        accessToken: token,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                        expiresAt: Date.now() + (3600 * 1000) // 1 hour
                    };

                    await this.saveAuth(authData);
                    resolve(authData);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Get user info from Google API
    async getUserInfo(token) {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        return response.json();
    }

    // Save auth data
    async saveAuth(authData) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.AUTH_KEY]: authData }, resolve);
        });
    }

    // Sign out
    async signOut() {
        // If in content script, delegate to background
        if (!chrome.identity) {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'AUTH_SIGN_OUT' }, resolve);
            });
        }

        const auth = await this.getAuth();

        if (auth && auth.accessToken) {
            // Revoke token
            chrome.identity.removeCachedAuthToken({ token: auth.accessToken }, () => {
                chrome.storage.local.remove([this.AUTH_KEY]);
            });
        } else {
            chrome.storage.local.remove([this.AUTH_KEY]);
        }
    }

    // Get current user
    async getCurrentUser() {
        const auth = await this.getAuth();
        if (!auth) return null;

        return {
            email: auth.email,
            name: auth.name,
            picture: auth.picture
        };
    }
}

// Export singleton instance
window.authManager = new AuthManager();
