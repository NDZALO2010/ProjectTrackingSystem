/**
 * Tasks Management Module
 * 
 * This file handles all task-related functionality including:
 * - Loading and displaying tasks in a Kanban board
 * - Creating new tasks
 * - Editing existing tasks
 * - Deleting tasks
 * - Filtering and searching tasks
 */

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the tasks page
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
    
    // Populate project filter dropdown
    populateProjectFilter();
    
    // Populate form dropdowns
    populateFormDropdowns();
    
    // Render tasks
    renderTasks();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up filters
    setupFilters(renderTasks);
});

/**
 * Load all necessary data for the tasks page
 */
async function loadAllData() {
    try {
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
    // Create task button
    const createBtn = document.getElementById('createTaskBtn');
    if (createBtn) {
        createBtn.addEventListener('click', openCreateTaskModal);
    }
    
    // Task form submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
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
    
    // Keep the "All Projects" option and add project options
    const projectOptions = appState.projects.map(project => 
        `<option value="${project.id}">${escapeHtml(project.name)}</option>`
    ).join('');
    
    projectFilter.innerHTML = '<option value="all">All Projects</option>' + projectOptions;
}

/**
 * Populates form dropdowns (projects and assignees)
 */
function populateFormDropdowns() {
    // Populate project dropdown in task form
    const taskProject = document.getElementById('taskProject');
    if (taskProject) {
        const projectOptions = appState.projects.map(project => 
            `<option value="${project.id}">${escapeHtml(project.name)}</option>`
        ).join('');
        taskProject.innerHTML = '<option value="">Select a project</option>' + projectOptions;
    }
    
    // Populate assignee dropdown in task form
    const taskAssignee = document.getElementById('taskAssignee');
    if (taskAssignee) {
        const userOptions = appState.users
            .filter(user => user.role === 'team_member' || user.role === 'project_manager')
            .map(user => 
                `<option value="${user.id}">${escapeHtml(user.fullName)}</option>`
            ).join('');
        taskAssignee.innerHTML = '<option value="">Select team member</option>' + userOptions;
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Renders all tasks in the Kanban board based on current filters
 */
function renderTasks() {
    // Get filter values
    const filters = getFilterValues();
    
    // Apply filters to tasks
    let filteredTasks = applyFilters(
        appState.tasks,
        filters,
        ['title', 'description']
    );
    
    // Render tasks by status
    renderTaskColumn('pending', filteredTasks);
    renderTaskColumn('in-progress', filteredTasks);
    renderTaskColumn('completed', filteredTasks);
}

/**
 * Renders tasks for a specific status column
 * @param {string} status - Task status
 * @param {Array} allTasks - All filtered tasks
 */
function renderTaskColumn(status, allTasks) {
    // Get tasks for this status
    const tasks = allTasks.filter(task => task.status === status);
    
    // Get container element
    const containerId = status === 'in-progress' ? 'inProgressTasks' : 
                       status === 'pending' ? 'pendingTasks' : 'completedTasks';
    const container = document.getElementById(containerId);
    
    // Get count element
    const countId = status === 'in-progress' ? 'inProgressCount' : 
                   status === 'pending' ? 'pendingCount' : 'completedCount';
    const countElement = document.getElementById(countId);
    
    if (!container) return;
    
    // Update count
    if (countElement) {
        countElement.textContent = tasks.length;
    }
    
    // Check if there are any tasks
    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks</p>';
        return;
    }
    
    // Build HTML for task cards
    container.innerHTML = tasks.map(task => {
        const project = getProjectById(task.projectId);
        const assignee = getUserById(task.assignedTo);
        const isOverdue = isPastDate(task.dueDate) && task.status !== 'completed';
        
        return `
            <div class="task-item" onclick="viewTask('${task.id}')">
                <div class="task-info">
                    <h4>${escapeHtml(task.title)}</h4>
                    <p>${escapeHtml(task.description)}</p>
                    <div style="margin-top: 8px; font-size: 12px; color: #7f8c8d;">
                        📁 ${project ? escapeHtml(project.name) : 'Unknown Project'}
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #7f8c8d;">
                        👤 ${assignee ? escapeHtml(assignee.fullName) : 'Unassigned'}
                    </div>
                </div>
                <div class="task-meta">
                    ${renderPriorityBadge(task.priority)}
                    <span ${isOverdue ? 'style="color: #E74C3C; font-weight: 600;"' : ''}>
                        ${isOverdue ? '⚠️ Overdue' : '📅'} ${formatDate(task.dueDate)}
                    </span>
                </div>
                <div class="project-actions" onclick="event.stopPropagation()" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ecf0f1;">
                    <button class="btn btn-sm btn-primary" onclick="editTask('${task.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">
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
 * Opens the modal to create a new task
 */
function openCreateTaskModal() {
    // Reset the form
    resetForm('taskForm');
    
    // Clear the hidden ID field
    document.getElementById('taskId').value = '';
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Create New Task';
    
    // Set default values
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskActualHours').value = '0';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    const dueDate = oneWeekLater.toISOString().split('T')[0];
    
    document.getElementById('taskStartDate').value = today;
    document.getElementById('taskDueDate').value = dueDate;
    
    // Open the modal
    openModal('taskModal');
}

/**
 * Opens the modal to edit an existing task
 * @param {string} taskId - ID of the task to edit
 */
function editTask(taskId) {
    const task = getTaskById(taskId);
    
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Edit Task';
    
    // Fill form with task data
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskProject').value = task.projectId;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStartDate').value = task.startDate;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskEstimatedHours').value = task.estimatedHours;
    document.getElementById('taskActualHours').value = task.actualHours || 0;
    document.getElementById('taskAssignee').value = task.assignedTo;
    document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
    
    // Open the modal
    openModal('taskModal');
}

/**
 * Closes the task modal
 */
function closeTaskModal() {
    closeModal('taskModal');
    resetForm('taskForm');
}

/**
 * Views detailed information about a task
 * @param {string} taskId - ID of the task to view
 */
function viewTask(taskId) {
    const task = getTaskById(taskId);
    
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }
    
    const project = getProjectById(task.projectId);
    const assignee = getUserById(task.assignedTo);
    const creator = getUserById(task.createdBy);
    const isOverdue = isPastDate(task.dueDate) && task.status !== 'completed';
    
    // Build detailed view HTML
    const detailsHTML = `
        <div style="padding: 25px;">
            <div class="task-meta" style="margin-bottom: 20px;">
                ${renderStatusBadge(task.status)}
                ${renderPriorityBadge(task.priority)}
                ${isOverdue ? '<span class="badge" style="background-color: #f8d7da; color: #721c24;">⚠️ Overdue</span>' : ''}
            </div>
            
            <h3>Description</h3>
            <p style="margin-bottom: 20px;">${escapeHtml(task.description)}</p>
            
            <h3>Project</h3>
            <p style="margin-bottom: 20px;">
                📁 ${project ? escapeHtml(project.name) : 'Unknown Project'}
            </p>
            
            <h3>Assignment</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Assigned To:</strong> ${assignee ? escapeHtml(assignee.fullName) : 'Unassigned'}</span>
                <span><strong>Created By:</strong> ${creator ? escapeHtml(creator.fullName) : 'Unknown'}</span>
            </div>
            
            <h3>Timeline</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Start Date:</strong> ${formatDate(task.startDate)}</span>
                <span><strong>Due Date:</strong> ${formatDate(task.dueDate)}</span>
                ${task.completedDate ? `<span><strong>Completed:</strong> ${formatDate(task.completedDate)}</span>` : ''}
            </div>
            
            <h3>Effort</h3>
            <div class="project-meta" style="margin-bottom: 20px;">
                <span><strong>Estimated Hours:</strong> ${task.estimatedHours}h</span>
                <span><strong>Actual Hours:</strong> ${task.actualHours || 0}h</span>
                <span><strong>Variance:</strong> ${(task.actualHours || 0) - task.estimatedHours}h</span>
            </div>
            
            ${task.tags && task.tags.length > 0 ? `
                <h3>Tags</h3>
                <div style="margin-bottom: 20px;">
                    ${task.tags.map(tag => `<span class="badge" style="margin-right: 5px;">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            
            ${task.dependencies && task.dependencies.length > 0 ? `
                <h3>Dependencies</h3>
                <p style="margin-bottom: 20px;">This task depends on ${task.dependencies.length} other task(s)</p>
            ` : ''}
            
            <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="editTask('${task.id}'); closeViewTaskModal();">
                    Edit Task
                </button>
                <button class="btn btn-secondary" onclick="closeViewTaskModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Set modal content
    document.getElementById('viewTaskTitle').textContent = task.title;
    document.getElementById('taskDetails').innerHTML = detailsHTML;
    
    // Open the modal
    openModal('viewTaskModal');
}

/**
 * Closes the view task modal
 */
function closeViewTaskModal() {
    closeModal('viewTaskModal');
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Handles task form submission (create or update)
 * @param {Event} event - Form submit event
 */
async function handleTaskSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const taskId = document.getElementById('taskId').value;
    const tagsInput = document.getElementById('taskTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    
    const taskData = {
        projectId: document.getElementById('taskProject').value,
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        startDate: document.getElementById('taskStartDate').value,
        dueDate: document.getElementById('taskDueDate').value,
        estimatedHours: parseFloat(document.getElementById('taskEstimatedHours').value),
        actualHours: parseFloat(document.getElementById('taskActualHours').value) || 0,
        assignedTo: document.getElementById('taskAssignee').value,
        createdBy: appState.currentUser.id,
        tags: tags,
        dependencies: [],
        completedDate: null
    };
    
    // Set completed date if status is completed
    if (taskData.status === 'completed' && !taskId) {
        taskData.completedDate = new Date().toISOString();
    }
    
    // Validate dates
    if (!isValidDateRange(taskData.startDate, taskData.dueDate)) {
        showNotification('Due date must be after start date', 'error');
        return;
    }
    
    try {
        let result;
        
        if (taskId) {
            // Update existing task
            const existingTask = getTaskById(taskId);
            
            // Update completed date if status changed to completed
            if (taskData.status === 'completed' && existingTask.status !== 'completed') {
                taskData.completedDate = new Date().toISOString();
            } else if (taskData.status !== 'completed') {
                taskData.completedDate = null;
            } else {
                taskData.completedDate = existingTask.completedDate;
            }
            
            result = await fetchAPI(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            showNotification('Task updated successfully', 'success');
        } else {
            // Create new task
            result = await fetchAPI('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            showNotification('Task created successfully', 'success');
        }
        
        // Reload tasks and re-render
        await loadTasks();
        renderTasks();
        
        // Close modal
        closeTaskModal();
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification('Failed to save task', 'error');
    }
}

/**
 * Deletes a task
 * @param {string} taskId - ID of the task to delete
 */
async function deleteTask(taskId) {
    const task = getTaskById(taskId);
    
    if (!task) {
        showNotification('Task not found', 'error');
        return;
    }
    
    // Confirm deletion
    if (!confirmAction(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await fetchAPI(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        showNotification('Task deleted successfully', 'success');
        
        // Reload tasks and re-render
        await loadTasks();
        renderTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
    }
}
