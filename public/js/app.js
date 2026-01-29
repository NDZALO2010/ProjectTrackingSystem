/**
 * Main Application Module for Project Tracking System
 * 
 * This file contains common functionality used across multiple pages
 * including navigation, user display, and shared utilities.
 */

// ============================================
// GLOBAL STATE
// ============================================

/**
 * Store for application-wide data
 */
const appState = {
    currentUser: null,
    projects: [],
    tasks: [],
    users: [],
    resources: []
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on protected pages
    const isLoginPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/';
    
    if (!isLoginPage && !checkAuth()) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return;
    }
    
    // Load current user data
    appState.currentUser = getCurrentUser();
    
    // Set up logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

/**
 * Handles user logout
 */
function handleLogout() {
    if (confirmAction('Are you sure you want to logout?')) {
        logout();
    }
}

// ============================================
// DATA LOADING FUNCTIONS
// ============================================

/**
 * Loads all projects from the server
 * @returns {Promise<Array>} Array of projects
 */
async function loadProjects() {
    try {
        const projects = await fetchAPI('/projects');
        appState.projects = projects;
        return projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'error');
        return [];
    }
}

/**
 * Loads all tasks from the server
 * @param {string} projectId - Optional project ID to filter tasks
 * @returns {Promise<Array>} Array of tasks
 */
async function loadTasks(projectId = null) {
    try {
        const endpoint = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
        const tasks = await fetchAPI(endpoint);
        appState.tasks = tasks;
        return tasks;
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks', 'error');
        return [];
    }
}

/**
 * Loads all users from the server
 * @returns {Promise<Array>} Array of users
 */
async function loadUsers() {
    try {
        const users = await fetchAPI('/users');
        appState.users = users;
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Failed to load users', 'error');
        return [];
    }
}

/**
 * Loads all resources from the server
 * @returns {Promise<Array>} Array of resources
 */
async function loadResources() {
    try {
        const resources = await fetchAPI('/resources');
        appState.resources = resources;
        return resources;
    } catch (error) {
        console.error('Error loading resources:', error);
        showNotification('Failed to load resources', 'error');
        return [];
    }
}

// ============================================
// PROJECT FUNCTIONS
// ============================================

/**
 * Gets a project by ID
 * @param {string} projectId - Project ID
 * @returns {Object|null} Project object or null
 */
function getProjectById(projectId) {
    return appState.projects.find(p => p.id === projectId) || null;
}

/**
 * Gets project name by ID
 * @param {string} projectId - Project ID
 * @returns {string} Project name or 'Unknown Project'
 */
function getProjectName(projectId) {
    const project = getProjectById(projectId);
    return project ? project.name : 'Unknown Project';
}

/**
 * Calculates project progress based on tasks
 * @param {string} projectId - Project ID
 * @returns {number} Progress percentage (0-100)
 */
function calculateProjectProgress(projectId) {
    const projectTasks = appState.tasks.filter(t => t.projectId === projectId);
    
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    return calculatePercentage(completedTasks, projectTasks.length);
}

// ============================================
// USER FUNCTIONS
// ============================================

/**
 * Gets a user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User object or null
 */
function getUserById(userId) {
    return appState.users.find(u => u.id === userId) || null;
}

/**
 * Gets user name by ID
 * @param {string} userId - User ID
 * @returns {string} User name or 'Unknown User'
 */
function getUserName(userId) {
    const user = getUserById(userId);
    return user ? user.fullName : 'Unknown User';
}

/**
 * Gets users by role
 * @param {string} role - User role
 * @returns {Array} Array of users with the specified role
 */
function getUsersByRole(role) {
    return appState.users.filter(u => u.role === role);
}

// ============================================
// TASK FUNCTIONS
// ============================================

/**
 * Gets a task by ID
 * @param {string} taskId - Task ID
 * @returns {Object|null} Task object or null
 */
function getTaskById(taskId) {
    return appState.tasks.find(t => t.id === taskId) || null;
}

/**
 * Gets tasks by status
 * @param {string} status - Task status
 * @returns {Array} Array of tasks with the specified status
 */
function getTasksByStatus(status) {
    return appState.tasks.filter(t => t.status === status);
}

/**
 * Gets tasks by project
 * @param {string} projectId - Project ID
 * @returns {Array} Array of tasks for the project
 */
function getTasksByProject(projectId) {
    return appState.tasks.filter(t => t.projectId === projectId);
}

/**
 * Gets overdue tasks
 * @returns {Array} Array of overdue tasks
 */
function getOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appState.tasks.filter(task => {
        if (task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
    });
}

// ============================================
// RESOURCE FUNCTIONS
// ============================================

/**
 * Gets resources by project
 * @param {string} projectId - Project ID
 * @returns {Array} Array of resources for the project
 */
function getResourcesByProject(projectId) {
    return appState.resources.filter(r => r.projectId === projectId);
}

/**
 * Gets resources by user
 * @param {string} userId - User ID
 * @returns {Array} Array of resources for the user
 */
function getResourcesByUser(userId) {
    return appState.resources.filter(r => r.userId === userId);
}

/**
 * Calculates total resource cost
 * @param {Array} resources - Array of resources
 * @returns {number} Total cost
 */
function calculateResourceCost(resources) {
    return resources.reduce((total, resource) => {
        return total + (resource.usedHours * resource.hourlyRate);
    }, 0);
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Calculates overall statistics
 * @returns {Object} Statistics object
 */
function calculateStatistics() {
    return {
        totalProjects: appState.projects.length,
        activeProjects: appState.projects.filter(p => p.status === 'active').length,
        completedProjects: appState.projects.filter(p => p.status === 'completed').length,
        totalTasks: appState.tasks.length,
        completedTasks: appState.tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: appState.tasks.filter(t => t.status === 'in-progress').length,
        pendingTasks: appState.tasks.filter(t => t.status === 'pending').length,
        overdueTasks: getOverdueTasks().length,
        totalBudget: appState.projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        budgetSpent: appState.projects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0),
        totalResources: appState.resources.length,
        totalResourceCost: calculateResourceCost(appState.resources)
    };
}

// ============================================
// RENDER HELPER FUNCTIONS
// ============================================

/**
 * Renders a status badge
 * @param {string} status - Status value
 * @returns {string} HTML for status badge
 */
function renderStatusBadge(status) {
    return `<span class="badge badge-${status}">${status}</span>`;
}

/**
 * Renders a priority badge
 * @param {string} priority - Priority value
 * @returns {string} HTML for priority badge
 */
function renderPriorityBadge(priority) {
    return `<span class="badge badge-priority-${priority}">${priority}</span>`;
}

/**
 * Renders action buttons for a record
 * @param {string} id - Record ID
 * @param {string} type - Record type (project, task, etc.)
 * @returns {string} HTML for action buttons
 */
function renderActionButtons(id, type) {
    return `
        <button class="btn btn-sm btn-secondary" onclick="view${capitalize(type)}('${id}')">
            View
        </button>
        <button class="btn btn-sm btn-primary" onclick="edit${capitalize(type)}('${id}')">
            Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="delete${capitalize(type)}('${id}')">
            Delete
        </button>
    `;
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// FILTER AND SEARCH FUNCTIONS
// ============================================

/**
 * Sets up filter listeners for a page
 * @param {Function} renderFunction - Function to call when filters change
 */
function setupFilters(renderFunction) {
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderFunction);
    }
    
    // Priority filter
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', renderFunction);
    }
    
    // Project filter
    const projectFilter = document.getElementById('projectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', renderFunction);
    }
    
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(renderFunction, 300));
    }
}

/**
 * Gets current filter values
 * @returns {Object} Filter values
 */
function getFilterValues() {
    return {
        status: document.getElementById('statusFilter')?.value || 'all',
        priority: document.getElementById('priorityFilter')?.value || 'all',
        project: document.getElementById('projectFilter')?.value || 'all',
        search: document.getElementById('searchInput')?.value || ''
    };
}

/**
 * Applies filters to an array of items
 * @param {Array} items - Items to filter
 * @param {Object} filters - Filter values
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} Filtered items
 */
function applyFilters(items, filters, searchFields) {
    let filtered = [...items];
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(item => item.status === filters.status);
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
        filtered = filtered.filter(item => item.priority === filters.priority);
    }
    
    // Apply project filter
    if (filters.project && filters.project !== 'all') {
        filtered = filtered.filter(item => item.projectId === filters.project);
    }
    
    // Apply search filter
    if (filters.search) {
        filtered = filterBySearch(filtered, filters.search, searchFields);
    }
    
    return filtered;
}

// ============================================
// MODAL HELPER FUNCTIONS
// ============================================

/**
 * Opens a modal
 * @param {string} modalId - ID of the modal element
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

/**
 * Closes a modal
 * @param {string} modalId - ID of the modal element
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

/**
 * Resets a form
 * @param {string} formId - ID of the form element
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// ============================================
// EXPORT STATE FOR DEBUGGING
// ============================================

// Make appState available in console for debugging
window.appState = appState;
