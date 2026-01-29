/**
 * Projects Management Module
 * 
 * This file handles all project-related functionality including:
 * - Loading and displaying projects
 * - Creating new projects
 * - Editing existing projects
 * - Deleting projects
 * - Filtering and searching projects
 */

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the projects page
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
    
    // Render projects
    renderProjects();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up filters
    setupFilters(renderProjects);
});

/**
 * Load all necessary data for the projects page
 */
async function loadAllData() {
    try {
        // Load projects, users, and tasks in parallel
        await Promise.all([
            loadProjects(),
            loadUsers(),
            loadTasks()
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
    // Create project button
    const createBtn = document.getElementById('createProjectBtn');
    if (createBtn) {
        createBtn.addEventListener('click', openCreateProjectModal);
    }
    
    // Project form submission
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Renders all projects based on current filters
 */
function renderProjects() {
    const container = document.getElementById('projectsGrid');
    
    if (!container) return;
    
    // Get filter values
    const filters = getFilterValues();
    
    // Apply filters to projects
    const filteredProjects = applyFilters(
        appState.projects,
        filters,
        ['name', 'description', 'department']
    );
    
    // Check if there are any projects to display
    if (filteredProjects.length === 0) {
        showEmptyState(container, 'No projects found');
        return;
    }
    
    // Build HTML for all project cards
    container.innerHTML = filteredProjects.map(project => {
        const progress = calculateProjectProgress(project.id);
        const daysRemaining = daysUntil(project.endDate);
        const isOverdue = daysRemaining < 0;
        
        return `
            <div class="project-card" onclick="viewProject('${project.id}')">
                <div class="project-header">
                    <h3>${escapeHtml(project.name)}</h3>
                    ${renderStatusBadge(project.status)}
                </div>
                <p class="project-description">${escapeHtml(project.description)}</p>
                <div class="project-meta">
                    <span>📅 ${formatDate(project.startDate)} - ${formatDate(project.endDate)}</span>
                    <span>💰 ${formatCurrency(project.budget)}</span>
                </div>
                <div class="project-meta">
                    <span>📊 Progress: ${progress}%</span>
                    <span ${isOverdue ? 'style="color: #E74C3C;"' : ''}>
                        ${isOverdue ? '⚠️ Overdue' : `⏱️ ${daysRemaining} days left`}
                    </span>
                </div>
                <div class="project-meta">
                    <span>🏢 ${escapeHtml(project.department)}</span>
                    <span class="badge badge-priority-${project.priority}">${project.priority}</span>
                </div>
                <div class="project-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-sm btn-primary" onclick="editProject('${project.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Opens the modal to create a new project
 */
function openCreateProjectModal() {
    // Reset the form
    resetForm('projectForm');
    
    // Clear the hidden ID field
    document.getElementById('projectId').value = '';
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Create New Project';
    
    // Set default values
    document.getElementById('projectStatus').value = 'planning';
    document.getElementById('projectPriority').value = 'medium';
    document.getElementById('projectBudgetSpent').value = '0';
    
    // Set default dates (today and 3 months from now)
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const endDate = threeMonthsLater.toISOString().split('T')[0];
    
    document.getElementById('projectStartDate').value = today;
    document.getElementById('projectEndDate').value = endDate;
    
    // Open the modal
    openModal('projectModal');
}

/**
 * Opens the modal to edit an existing project
 * @param {string} projectId - ID of the project to edit
 */
function editProject(projectId) {
    const project = getProjectById(projectId);
    
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Edit Project';
    
    // Fill form with project data
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('projectStatus').value = project.status;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectStartDate').value = project.startDate;
    document.getElementById('projectEndDate').value = project.endDate;
    document.getElementById('projectBudget').value = project.budget;
    document.getElementById('projectBudgetSpent').value = project.budgetSpent || 0;
    document.getElementById('projectDepartment').value = project.department;
    
    // Open the modal
    openModal('projectModal');
}

/**
 * Closes the project modal
 */
function closeProjectModal() {
    closeModal('projectModal');
    resetForm('projectForm');
}

/**
 * Views detailed information about a project
 * @param {string} projectId - ID of the project to view
 */
async function viewProject(projectId) {
    const project = getProjectById(projectId);
    
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    // Get project tasks
    const projectTasks = getTasksByProject(projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const progress = calculateProjectProgress(projectId);
    
    // Get project resources
    const projectResources = getResourcesByProject(projectId);
    const resourceCost = calculateResourceCost(projectResources);
    
    // Build detailed view HTML
    const detailsHTML = `
        <div style="padding: 25px;">
            <div class="project-meta" style="margin-bottom: 20px;">
                ${renderStatusBadge(project.status)}
                ${renderPriorityBadge(project.priority)}
            </div>
            
            <h3>Description</h3>
            <p style="margin-bottom: 20px;">${escapeHtml(project.description)}</p>
            
            <h3>Timeline</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Start Date:</strong> ${formatDate(project.startDate)}</span>
                <span><strong>End Date:</strong> ${formatDate(project.endDate)}</span>
                <span><strong>Duration:</strong> ${daysBetween(project.startDate, project.endDate)} days</span>
            </div>
            
            <h3>Budget</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Total Budget:</strong> ${formatCurrency(project.budget)}</span>
                <span><strong>Spent:</strong> ${formatCurrency(project.budgetSpent || 0)}</span>
                <span><strong>Remaining:</strong> ${formatCurrency(project.budget - (project.budgetSpent || 0))}</span>
            </div>
            <div class="budget-progress">
                <div class="progress-bar" style="width: ${calculatePercentage(project.budgetSpent || 0, project.budget)}%">
                    ${calculatePercentage(project.budgetSpent || 0, project.budget)}%
                </div>
            </div>
            
            <h3 style="margin-top: 20px;">Progress</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Total Tasks:</strong> ${projectTasks.length}</span>
                <span><strong>Completed:</strong> ${completedTasks}</span>
                <span><strong>Progress:</strong> ${progress}%</span>
            </div>
            <div class="budget-progress">
                <div class="progress-bar" style="width: ${progress}%">
                    ${progress}%
                </div>
            </div>
            
            <h3 style="margin-top: 20px;">Resources</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Team Members:</strong> ${projectResources.length}</span>
                <span><strong>Resource Cost:</strong> ${formatCurrency(resourceCost)}</span>
            </div>
            
            <h3 style="margin-top: 20px;">Milestones</h3>
            ${project.milestones && project.milestones.length > 0 ? `
                <div style="margin-top: 10px;">
                    ${project.milestones.map(milestone => `
                        <div class="task-item" style="margin-bottom: 10px;">
                            <div class="task-info">
                                <h4>${escapeHtml(milestone.name)}</h4>
                                <p>Due: ${formatDate(milestone.dueDate)}</p>
                            </div>
                            <div class="task-meta">
                                ${renderStatusBadge(milestone.status)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="empty-state">No milestones defined</p>'}
            
            <h3 style="margin-top: 20px;">Risks</h3>
            ${project.risks && project.risks.length > 0 ? `
                <div style="margin-top: 10px;">
                    ${project.risks.map(risk => `
                        <div class="task-item" style="margin-bottom: 10px;">
                            <div class="task-info">
                                <h4>${escapeHtml(risk.description)}</h4>
                            </div>
                            <div class="task-meta">
                                <span class="badge badge-priority-${risk.severity}">${risk.severity}</span>
                                ${renderStatusBadge(risk.status)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="empty-state">No risks identified</p>'}
            
            <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="editProject('${project.id}'); closeViewProjectModal();">
                    Edit Project
                </button>
                <button class="btn btn-secondary" onclick="closeViewProjectModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Set modal content
    document.getElementById('viewProjectName').textContent = project.name;
    document.getElementById('projectDetails').innerHTML = detailsHTML;
    
    // Open the modal
    openModal('viewProjectModal');
}

/**
 * Closes the view project modal
 */
function closeViewProjectModal() {
    closeModal('viewProjectModal');
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Handles project form submission (create or update)
 * @param {Event} event - Form submit event
 */
async function handleProjectSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const projectId = document.getElementById('projectId').value;
    const projectData = {
        name: document.getElementById('projectName').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        startDate: document.getElementById('projectStartDate').value,
        endDate: document.getElementById('projectEndDate').value,
        budget: parseFloat(document.getElementById('projectBudget').value),
        budgetSpent: parseFloat(document.getElementById('projectBudgetSpent').value) || 0,
        department: document.getElementById('projectDepartment').value.trim(),
        projectManager: appState.currentUser.id,
        teamMembers: [],
        milestones: [],
        risks: []
    };
    
    // Validate dates
    if (!isValidDateRange(projectData.startDate, projectData.endDate)) {
        showNotification('End date must be after start date', 'error');
        return;
    }
    
    // Validate budget
    if (projectData.budgetSpent > projectData.budget) {
        showNotification('Budget spent cannot exceed total budget', 'error');
        return;
    }
    
    try {
        let result;
        
        if (projectId) {
            // Update existing project
            result = await fetchAPI(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(projectData)
            });
            showNotification('Project updated successfully', 'success');
        } else {
            // Create new project
            result = await fetchAPI('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
            showNotification('Project created successfully', 'success');
        }
        
        // Reload projects and re-render
        await loadProjects();
        renderProjects();
        
        // Close modal
        closeProjectModal();
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Failed to save project', 'error');
    }
}

/**
 * Deletes a project
 * @param {string} projectId - ID of the project to delete
 */
async function deleteProject(projectId) {
    const project = getProjectById(projectId);
    
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirmAction(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await fetchAPI(`/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        showNotification('Project deleted successfully', 'success');
        
        // Reload projects and re-render
        await loadProjects();
        renderProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project', 'error');
    }
}
