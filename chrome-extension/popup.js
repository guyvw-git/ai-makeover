document.addEventListener('DOMContentLoaded', async () => {
    const signedOutView = document.getElementById('signed-out');
    const signedInView = document.getElementById('signed-in');
    const signInBtn = document.getElementById('sign-in-btn');
    const signOutBtn = document.getElementById('sign-out-btn');

    // Check auth status
    // TEMPORARY: Skip auth for Chrome Web Store initial submission
    const SKIP_AUTH = true;
    console.log('[Popup] JavaScript running. SKIP_AUTH:', SKIP_AUTH);

    if (SKIP_AUTH) {
        showSignedInView({
            name: 'ReImagine User',
            email: 'user@example.com',
            picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c' // Generic avatar
        });
        // Hide sign-out button in this mode since it does nothing real
        if (signOutBtn) signOutBtn.style.display = 'none';
    } else {
        const isAuth = await authManager.isAuthenticated();
        if (isAuth) {
            const user = await authManager.getCurrentUser();
            showSignedInView(user);
        } else {
            showSignedOutView();
        }
    }

    // Sign in handler
    signInBtn.addEventListener('click', async () => {
        try {
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
            const user = await authManager.signIn();
            showSignedInView(user);
        } catch (error) {
            console.error('Sign-in error:', error);
            signInBtn.disabled = false;
            signInBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            `;
            alert('Sign-in failed. Please try again.');
        }
    });

    // Sign out handler
    signOutBtn.addEventListener('click', async () => {
        await authManager.signOut();
        showSignedOutView();
    });

    function showSignedInView(user) {
        signedOutView.style.display = 'none';
        signedInView.style.display = 'block';

        document.getElementById('user-avatar').src = user.picture || '';
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-email').textContent = user.email;
    }

    function showSignedOutView() {
        signedOutView.style.display = 'block';
        signedInView.style.display = 'none';
    }
});
