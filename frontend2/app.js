// Facebook App Configuration
const FACEBOOK_APP_ID = '1256644736404295'; // Replace with your Facebook App ID
const API_VERSION = 'v18.0';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const formSection = document.getElementById('formSection');
const postForm = document.getElementById('postForm');
const loginStatus = document.getElementById('loginStatus');
const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const postImage = document.getElementById('postImage');
const imagePreview = document.getElementById('imagePreview');

// State
let userAccessToken = null;
let isLoggedIn = false;

// Initialize Facebook SDK
function initializeFacebook() {
    FB.init({
        appId: FACEBOOK_APP_ID,
        xfbml: true,
        version: API_VERSION,
        cookie: true,
        status: true
    });

    // Check if user is already logged in
    FB.getLoginStatus(handleLoginStatusChange);
}

// Handle login/logout button clicks
loginBtn.addEventListener('click', () => {
    FB.login(handleLoginStatusChange, { scope: 'pages_manage_metadata,pages_read_engagement' });
});

logoutBtn.addEventListener('click', () => {
    FB.logout(handleLogout);
});

// Handle form submission
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    publishPost();
});

// Handle image file selection
postImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            imagePreview.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
});

// Handle Facebook login status change
function handleLoginStatusChange(response) {
    if (response.authResponse) {
        userAccessToken = response.authResponse.accessToken;
        isLoggedIn = true;
        showLoginSuccess();
        formSection.style.display = 'block';
    } else {
        isLoggedIn = false;
        showLoginRequired();
        formSection.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    userAccessToken = null;
    isLoggedIn = false;
    formSection.style.display = 'none';
    postForm.reset();
    imagePreview.classList.remove('active');
    imagePreview.innerHTML = '';
    showLogoutMessage();
}

// Show login success message
function showLoginSuccess() {
    loginStatus.style.display = 'block';
    loginStatus.className = 'status-message';
    loginStatus.innerHTML = '✅ Successfully logged in with Facebook!';
    loginStatus.style.display = 'block';
}

// Show login required message
function showLoginRequired() {
    loginStatus.style.display = 'block';
    loginStatus.className = 'status-message';
    loginStatus.innerHTML = '⚠️ Please log in with Facebook to continue';
    loginStatus.style.display = 'block';
}

// Show logout message
function showLogoutMessage() {
    loginStatus.style.display = 'block';
    loginStatus.className = 'status-message';
    loginStatus.innerHTML = '👋 You have been logged out';
}

// Publish post to Facebook
async function publishPost() {
    if (!isLoggedIn || !userAccessToken) {
        showError('Please log in with Facebook first');
        return;
    }

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const pageId = document.getElementById('pageId').value.trim();
    const imageInput = document.getElementById('postImage');

    // Validation
    if (!content) {
        showError('Post content is required');
        return;
    }

    if (!pageId) {
        showError('Facebook Page ID is required');
        return;
    }

    // Show loading spinner
    showLoading(true);

    try {
        let postData = {
            message: title ? `${title}\n\n${content}` : content,
            access_token: userAccessToken
        };

        // Handle image upload
        if (imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];
            
            // Convert image to base64
            const base64Image = await fileToBase64(imageFile);
            // postData.picture = base64Image;
        }

        // Publish to Facebook
        const response = await publishToFacebook(pageId, postData);

        if (response.id) {
            showSuccess(`Post published successfully!<br>Post ID: ${response.id}`);
            postForm.reset();
            imagePreview.classList.remove('active');
            imagePreview.innerHTML = '';
        } else {
            showError('Failed to publish post. Please check your Page ID and try again.');
        }
    } catch (error) {
        showError(`Error: ${error.message}`);
        console.error('Publishing error:', error);
    } finally {
        showLoading(false);
    }
}

// Publish to Facebook using Graph API
async function publishToFacebook(pageId, postData) {
    return new Promise((resolve, reject) => {
        FB.api(
            `/${pageId}/feed`,
            'POST',
            postData,
            function(response) {
                if (!response || response.error) {
                    reject(new Error(response?.error?.message || 'Facebook API error'));
                } else {
                    resolve(response);
                }
            }
        );
    });
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Show error message
function showError(message) {
    errorMessage.innerHTML = `❌ ${message}`;
    errorMessage.style.display = 'block';
    statusMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    successMessage.innerHTML = `✅ ${message}`;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    statusMessage.style.display = 'none';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Disable/enable form inputs
function setFormDisabled(disabled) {
    const inputs = postForm.querySelectorAll('input, textarea, button');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if Facebook SDK is loaded
    if (typeof FB !== 'undefined') {
        initializeFacebook();
    } else {
        // Fallback if SDK fails to load
        setTimeout(() => {
            if (typeof FB !== 'undefined') {
                initializeFacebook();
            } else {
                showError('Facebook SDK failed to load. Please refresh the page.');
            }
        }, 2000);
    }
});

// Health check with backend
async function checkBackendHealth() {
    try {
        const response = await fetch('/api/health', {
            method: 'GET'
        });
        const data = await response.json();
        console.log('Backend health check:', data);
    } catch (error) {
        console.error('Backend health check failed:', error);
    }
}

// Check backend on load
window.addEventListener('load', () => {
    checkBackendHealth();
});
