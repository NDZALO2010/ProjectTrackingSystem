/**
 * Resources Management Module
 * 
 * This file handles all resource allocation functionality including:
 * - Loading and displaying resource allocations
 * - Creating new resource allocations
 * - Editing existing allocations
 * - Calculating utilization and costs
 * - Filtering and searching resources
 */

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the resources page
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display user info
    displayUserInfo();
    
    // Load initial data
    await loadAllData();
    
    // Populate filter dropdowns
    populateProjectFilter();
    
    // Populate form dropdowns
    populateFormDropdowns();
    
    // Render resources
    renderResources();
    
    // Render statistics
    renderStatistics();
    
    // Render utilization chart
    renderUtilizationChart();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up filters
    setupFilters(renderResources);
});

/**
 * Load all necessary data for the resources page
 */
async function loadAllData() {
    try {
        await Promise.all([
            loadProjects(),
            loadUsers(),
            loadResources()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load data', 'error');
    }
}

/**
 * Set up event listeners for buttons and forms
 */
function setupEventListeners() {
    // Allocate resource button
    const allocateBtn = document.getElementById('allocateResourceBtn');
    if (allocateBtn) {
        allocateBtn.addEventListener('click', openCreateResourceModal);
    }
    
    // Resource form submission
    const resourceForm = document.getElementById('resourceForm');
    if (resourceForm) {
        resourceForm.addEventListener('submit', handleResourceSubmit);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/**
 * Populates the project filter dropdown
 */
function populateProjectFilter() {
    const projectFilter = document.getElementById('projectFilter');
    
    if (!projectFilter) return;
    
    const projectOptions = appState.projects.map(project => 
        `<option value="${project.id}">${escapeHtml(project.name)}</option>`
    ).join('');
    
    projectFilter.innerHTML = '<option value="all">All Projects</option>' + projectOptions;
}

/**
 * Populates form dropdowns (projects and users)
 */
function populateFormDropdowns() {
    // Populate project dropdown
    const resourceProject = document.getElementById('resourceProject');
    if (resourceProject) {
        const projectOptions = appState.projects.map(project => 
            `<option value="${project.id}">${escapeHtml(project.name)}</option>`
        ).join('');
        resourceProject.innerHTML = '<option value="">Select a project</option>' + projectOptions;
    }
    
    // Populate user dropdown
    const resourceUser = document.getElementById('resourceUser');
    if (resourceUser) {
        const userOptions = appState.users
            .filter(user => user.role === 'team_member' || user.role === 'project_manager')
            .map(user => 
                `<option value="${user.id}">${escapeHtml(user.fullName)}</option>`
            ).join('');
        resourceUser.innerHTML = '<option value="">Select team member</option>' + userOptions;
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Renders resource statistics
 */
function renderStatistics() {
    const resources = appState.resources;
    
    // Calculate statistics
    const totalAllocations = resources.length;
    const totalHours = resources.reduce((sum, r) => sum + r.allocatedHours, 0);
    const totalUsedHours = resources.reduce((sum, r) => sum + r.usedHours, 0);
    const avgUtilization = totalHours > 0 ? Math.round((totalUsedHours / totalHours) * 100) : 0;
    const totalCost = calculateResourceCost(resources);
    
    // Update UI
    document.getElementById('totalResources').textContent = totalAllocations;
    document.getElementById('totalHours').textContent = totalHours;
    document.getElementById('avgUtilization').textContent = `${avgUtilization}%`;
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
}

/**
 * Renders all resources in the table based on current filters
 */
function renderResources() {
    const tbody = document.getElementById('resourcesTableBody');
    
    if (!tbody) return;
    
    // Get filter values
    const filters = getFilterValues();
    
    // Apply filters to resources
    let filteredResources = applyFilters(
        appState.resources,
        filters,
        ['userName', 'role']
    );
    
    // Check if there are any resources
    if (filteredResources.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No resource allocations found</td></tr>';
        return;
    }
    
    // Build HTML for table rows
    tbody.innerHTML = filteredResources.map(resource => {
        const project = getProjectById(resource.projectId);
        const totalCost = resource.usedHours * resource.hourlyRate;
        const utilization = resource.allocatedHours > 0 
            ? Math.round((resource.usedHours / resource.allocatedHours) * 100) 
            : 0;
        
        return `
            <tr>
                <td>${escapeHtml(resource.userName)}</td>
                <td>${project ? escapeHtml(project.name) : 'Unknown Project'}</td>
                <td>${escapeHtml(resource.role)}</td>
                <td>${resource.allocatedHours}h</td>
                <td>${resource.usedHours}h</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="budget-progress" style="flex: 1; height: 20px;">
                            <div class="progress-bar" style="width: ${Math.min(utilization, 100)}%; font-size: 11px;">
                                ${utilization}%
                            </div>
                        </div>
                    </div>
                </td>
                <td>${formatCurrency(resource.hourlyRate)}</td>
                <td>${formatCurrency(totalCost)}</td>
                <td>${renderStatusBadge(resource.status)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editResource('${resource.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteResource('${resource.id}')">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update statistics after filtering
    renderStatistics();
}

/**
 * Renders team member utilization chart
 */
function renderUtilizationChart() {
    const container = document.getElementById('utilizationChart');
    
    if (!container) return;
    
    // Group resources by user
    const userResources = {};
    
    appState.resources.forEach(resource => {
        if (!userResources[resource.userId]) {
            userResources[resource.userId] = {
                userName: resource.userName,
                totalAllocated: 0,
                totalUsed: 0
            };
        }
        userResources[resource.userId].totalAllocated += resource.allocatedHours;
        userResources[resource.userId].totalUsed += resource.usedHours;
    });
    
    // Convert to array and calculate utilization
    const userStats = Object.values(userResources).map(user => ({
        ...user,
        utilization: user.totalAllocated > 0 
            ? Math.round((user.totalUsed / user.totalAllocated) * 100) 
            : 0
    }));
    
    // Sort by utilization
    userStats.sort((a, b) => b.utilization - a.utilization);
    
    // Check if there are any users
    if (userStats.length === 0) {
        container.innerHTML = '<p class="empty-state">No resource data available</p>';
        return;
    }
    
    // Build HTML for utilization bars
    container.innerHTML = userStats.map(user => `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 500;">${escapeHtml(user.userName)}</span>
                <span style="color: #7f8c8d; font-size: 14px;">
                    ${user.totalUsed}h / ${user.totalAllocated}h (${user.utilization}%)
                </span>
            </div>
            <div class="budget-progress">
                <div class="progress-bar" style="width: ${Math.min(user.utilization, 100)}%">
                    ${user.utilization}%
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Opens the modal to create a new resource allocation
 */
function openCreateResourceModal() {
    // Reset the form
    resetForm('resourceForm');
    
    // Clear the hidden ID field
    document.getElementById('resourceId').value = '';
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Allocate Resource';
    
    // Set default values
    document.getElementById('resourceStatus').value = 'planned';
    document.getElementById('resourceUsedHours').value = '0';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const endDate = threeMonthsLater.toISOString().split('T')[0];
    
    document.getElementById('resourceStartDate').value = today;
    document.getElementById('resourceEndDate').value = endDate;
    
    // Open the modal
    openModal('resourceModal');
}

/**
 * Opens the modal to edit an existing resource allocation
 * @param {string} resourceId - ID of the resource to edit
 */
function editResource(resourceId) {
    const resource = appState.resources.find(r => r.id === resourceId);
    
    if (!resource) {
        showNotification('Resource allocation not found', 'error');
        return;
    }
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Edit Resource Allocation';
    
    // Fill form with resource data
    document.getElementById('resourceId').value = resource.id;
    document.getElementById('resourceProject').value = resource.projectId;
    document.getElementById('resourceUser').value = resource.userId;
    document.getElementById('resourceRole').value = resource.role;
    document.getElementById('resourceAllocatedHours').value = resource.allocatedHours;
    document.getElementById('resourceUsedHours').value = resource.usedHours;
    document.getElementById('resourceHourlyRate').value = resource.hourlyRate;
    document.getElementById('resourceStartDate').value = resource.startDate;
    document.getElementById('resourceEndDate').value = resource.endDate;
    document.getElementById('resourceStatus').value = resource.status;
    
    // Open the modal
    openModal('resourceModal');
}

/**
 * Closes the resource modal
 */
function closeResourceModal() {
    closeModal('resourceModal');
    resetForm('resourceForm');
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Handles resource form submission (create or update)
 * @param {Event} event - Form submit event
 */
async function handleResourceSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const resourceId = document.getElementById('resourceId').value;
    const userId = document.getElementById('resourceUser').value;
    const user = getUserById(userId);
    
    const allocatedHours = parseFloat(document.getElementById('resourceAllocatedHours').value);
    const usedHours = parseFloat(document.getElementById('resourceUsedHours').value);
    
    const resourceData = {
        projectId: document.getElementById('resourceProject').value,
        userId: userId,
        userName: user ? user.fullName : 'Unknown User',
        role: document.getElementById('resourceRole').value.trim(),
        allocatedHours: allocatedHours,
        usedHours: usedHours,
        hourlyRate: parseFloat(document.getElementById('resourceHourlyRate').value),
        startDate: document.getElementById('resourceStartDate').value,
        endDate: document.getElementById('resourceEndDate').value,
        utilizationPercentage: allocatedHours > 0 ? Math.round((usedHours / allocatedHours) * 100) : 0,
        status: document.getElementById('resourceStatus').value
    };
    
    // Validate dates
    if (!isValidDateRange(resourceData.startDate, resourceData.endDate)) {
        showNotification('End date must be after start date', 'error');
        return;
    }
    
    // Validate hours
    if (resourceData.usedHours > resourceData.allocatedHours) {
        if (!confirmAction('Used hours exceed allocated hours. Do you want to continue?')) {
            return;
        }
    }
    
    try {
        let result;
        
        if (resourceId) {
            // Update existing resource
            result = await fetchAPI(`/resources/${resourceId}`, {
                method: 'PUT',
                body: JSON.stringify(resourceData)
            });
            showNotification('Resource allocation updated successfully', 'success');
        } else {
            // Create new resource
            result = await fetchAPI('/resources', {
                method: 'POST',
                body: JSON.stringify(resourceData)
            });
            showNotification('Resource allocated successfully', 'success');
        }
        
        // Reload resources and re-render
        await loadResources();
        renderResources();
        renderUtilizationChart();
        
        // Close modal
        closeResourceModal();
    } catch (error) {
        console.error('Error saving resource:', error);
        showNotification('Failed to save resource allocation', 'error');
    }
}

/**
 * Deletes a resource allocation
 * @param {string} resourceId - ID of the resource to delete
 */
async function deleteResource(resourceId) {
    const resource = appState.resources.find(r => r.id === resourceId);
    
    if (!resource) {
        showNotification('Resource allocation not found', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirmAction(`Are you sure you want to delete the resource allocation for "${resource.userName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await fetchAPI(`/resources/${resourceId}`, {
            method: 'DELETE'
        });
        
        showNotification('Resource allocation deleted successfully', 'success');
        
        // Reload resources and re-render
        await loadResources();
        renderResources();
        renderUtilizationChart();
    } catch (error) {
        console.error('Error deleting resource:', error);
        showNotification('Failed to delete resource allocation', 'error');
    }
}
