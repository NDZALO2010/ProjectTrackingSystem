/**
 * Authentication Module for Project Tracking System
 * 
 * This file handles user login functionality.
 * It validates credentials, communicates with the server,
 * and manages user sessions using localStorage.
 */

// ============================================
// LOGIN FORM HANDLER
// ============================================

/**
 * Initialize login form when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get the login form element
    const loginForm = document.getElementById('loginForm');
    
    // Check if user is already logged in
    // If yes, redirect to dashboard
    if (checkAuth()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Add submit event listener to the login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Handles the login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    
    // Get form input values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Get error message element
    const errorMessage = document.getElementById('errorMessage');
    
    // Hide any previous error messages
    errorMessage.style.display = 'none';
    
    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    try {
        // Disable the submit button to prevent multiple submissions
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        // Send login request to the server
        const response = await fetchAPI('/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        // Check if login was successful
        if (response.success) {
            // Save user data to localStorage
            saveUser(response.user);
            
            // Show success message
            showNotification('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            // Show error message from server
            showError(response.message || 'Login failed');
            
            // Re-enable the submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    } catch (error) {
        // Handle any errors that occurred during login
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
        
        // Re-enable the submit button
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Scroll to the error message
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Auto-fill login form with demo credentials
 * This is a helper function for development/demo purposes
 * @param {string} username - Username to fill
 * @param {string} password - Password to fill
 */
function fillDemoCredentials(username, password) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
}

// ============================================
// OPTIONAL: Add click handlers to demo credentials
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Make demo credentials clickable for easy testing
    const credentialItems = document.querySelectorAll('.credential-item');
    
    credentialItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.title = 'Click to auto-fill';
        
        item.addEventListener('click', function() {
            const credentialText = this.querySelector('span').textContent;
            const [username, password] = credentialText.split(' / ');
            
            if (username && password) {
                fillDemoCredentials(username.trim(), password.trim());
                showNotification('Credentials auto-filled! Click Login to continue.', 'info');
            }
        });
    });
});
