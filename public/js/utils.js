/**
 * Utility Functions for Project Tracking System
 * 
 * This file contains reusable helper functions used throughout the application.
 * These functions handle common tasks like API calls, formatting, validation, etc.
 */

// ============================================
// API CONFIGURATION
// ============================================

/**
 * Base URL for API endpoints
 * Change this if your server runs on a different port
 */
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// API HELPER FUNCTIONS
// ============================================

/**
 * Makes an API request to the server
 * @param {string} endpoint - The API endpoint (e.g., '/projects')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise} Response data from the server
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        // Set default headers
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // Merge default options with provided options
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        // Make the API request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        // Parse and return JSON response
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Checks if user is authenticated
 * @returns {boolean} True if user is logged in, false otherwise
 */
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    return user !== null;
}

/**
 * Gets the current logged-in user
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Saves user data to local storage
 * @param {Object} user - User object to save
 */
function saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

/**
 * Logs out the current user
 */
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

/**
 * Displays user information in the navigation bar
 */
function displayUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = user.fullName || user.username;
        }
        
        if (userAvatarElement && user.avatar) {
            userAvatarElement.textContent = user.avatar;
        }
    }
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

/**
 * Formats a number as currency (USD)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formats a date string to a readable date and time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculates the number of days between two dates
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {number} Number of days
 */
function daysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Checks if a date is in the past
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if date is in the past
 */
function isPastDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

/**
 * Gets the number of days until a date
 * @param {string} dateString - Target date string
 * @returns {number} Number of days (negative if past)
 */
function daysUntil(dateString) {
    const target = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates that a string is not empty
 * @param {string} str - String to validate
 * @returns {boolean} True if not empty
 */
function isNotEmpty(str) {
    return str && str.trim().length > 0;
}

/**
 * Validates that a number is positive
 * @param {number} num - Number to validate
 * @returns {boolean} True if positive
 */
function isPositiveNumber(num) {
    return !isNaN(num) && num > 0;
}

/**
 * Validates that end date is after start date
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {boolean} True if valid date range
 */
function isValidDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end >= start;
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Shows a notification message to the user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Shows a loading indicator
 * @param {HTMLElement} element - Element to show loading in
 */
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

/**
 * Shows an empty state message
 * @param {HTMLElement} element - Element to show message in
 * @param {string} message - Message to display
 */
function showEmptyState(element, message = 'No items found') {
    if (element) {
        element.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
    }
}

/**
 * Shows an error state message
 * @param {HTMLElement} element - Element to show message in
 * @param {string} message - Error message to display
 */
function showErrorState(element, message = 'Failed to load data') {
    if (element) {
        element.innerHTML = `<p class="error-state">${escapeHtml(message)}</p>`;
    }
}

/**
 * Confirms an action with the user
 * @param {string} message - Confirmation message
 * @returns {boolean} True if user confirmed
 */
function confirmAction(message) {
    return confirm(message);
}

// ============================================
// DATA MANIPULATION FUNCTIONS
// ============================================

/**
 * Filters an array of objects by a search term
 * @param {Array} items - Array of objects to filter
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
function filterBySearch(items, searchTerm, fields) {
    if (!searchTerm || searchTerm.trim() === '') {
        return items;
    }
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

/**
 * Sorts an array of objects by a field
 * @param {Array} items - Array to sort
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
function sortBy(items, field, order = 'asc') {
    return [...items].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Groups an array of objects by a field
 * @param {Array} items - Array to group
 * @param {string} field - Field to group by
 * @returns {Object} Grouped object
 */
function groupBy(items, field) {
    return items.reduce((groups, item) => {
        const key = item[field];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Calculates percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

/**
 * Saves data to local storage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

/**
 * Loads data from local storage
 * @param {string} key - Storage key
 * @returns {*} Loaded data or null
 */
function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return null;
    }
}

/**
 * Removes data from local storage
 * @param {string} key - Storage key
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from storage:', error);
    }
}

// ============================================
// DEBOUNCE FUNCTION
// ============================================

/**
 * Debounces a function call
 * Useful for search inputs to avoid too many API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// THEME MANAGEMENT
// ============================================

/**
 * Initializes the theme based on saved preference or system preference
 * Should be called when the page loads
 */
function initTheme() {
    // Check if there's a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Use saved preference
        setTheme(savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

/**
 * Sets the theme to light or dark mode
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Save preference
    localStorage.setItem('theme', theme);
    
    // Update toggle button icon if it exists
    updateThemeToggleIcon(theme);
}

/**
 * Toggles between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

/**
 * Updates the theme toggle button icon
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function updateThemeToggleIcon(theme) {
    const toggleButtons = document.querySelectorAll('.theme-toggle');
    toggleButtons.forEach(button => {
        if (theme === 'dark') {
            button.textContent = '☀️'; // Sun icon for light mode option
            button.setAttribute('aria-label', 'Switch to light mode');
        } else {
            button.textContent = '🌙'; // Moon icon for dark mode option
            button.setAttribute('aria-label', 'Switch to dark mode');
        }
    });
}

/**
 * Gets the current theme
 * @returns {string} 'light' or 'dark'
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

// Initialize theme when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// ============================================
// EXPORT FOR USE IN OTHER FILES
// ============================================

// Note: These functions are available globally since this script
// is loaded before other scripts in the HTML files
