
// Helper function to verify Google OAuth token
export async function verifyGoogleToken(token: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Invalid token');
    }

    return response.json();
}
