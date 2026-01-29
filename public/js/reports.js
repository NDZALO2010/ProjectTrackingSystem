/**
 * Reports and Analytics Module
 * 
 * This file handles all reporting functionality including:
 * - Overview dashboard statistics
 * - Project performance reports
 * - Task analysis reports
 * - Resource utilization reports
 * - Budget analysis reports
 */

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the reports page
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
    
    // Render overview report (default)
    renderOverviewReport();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Load all necessary data for the reports page
 */
async function loadAllData() {
    try {
        await Promise.all([
            loadProjects(),
            loadUsers(),
            loadTasks(),
            loadResources()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load data', 'error');
    }
}

/**
 * Set up event listeners for buttons and tabs
 */
function setupEventListeners() {
    // Report tab buttons
    const reportTabs = document.querySelectorAll('.report-tab');
    reportTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchReportTab(this.dataset.report);
        });
    });
    
    // Project selector for project reports
    const projectSelect = document.getElementById('projectSelect');
    if (projectSelect) {
        // Populate project dropdown
        const projectOptions = appState.projects.map(project => 
            `<option value="${project.id}">${escapeHtml(project.name)}</option>`
        ).join('');
        projectSelect.innerHTML = '<option value="">Choose a project</option>' + projectOptions;
        
        // Add change listener
        projectSelect.addEventListener('change', function() {
            if (this.value) {
                renderProjectReport(this.value);
            } else {
                document.getElementById('projectReportContent').innerHTML = 
                    '<p class="empty-state">Please select a project to view its report</p>';
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ============================================
// TAB SWITCHING
// ============================================

/**
 * Switches between different report tabs
 * @param {string} reportType - Type of report to display
 */
function switchReportTab(reportType) {
    // Update tab buttons
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.report === reportType) {
            tab.classList.add('active');
        }
    });
    
    // Hide all report sections
    document.querySelectorAll('.report-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected report section
    const reportMap = {
        'overview': 'overviewReport',
        'projects': 'projectsReport',
        'tasks': 'tasksReport',
        'resources': 'resourcesReport',
        'budget': 'budgetReport'
    };
    
    const sectionId = reportMap[reportType];
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Render the appropriate report
    switch(reportType) {
        case 'overview':
            renderOverviewReport();
            break;
        case 'tasks':
            renderTasksReport();
            break;
        case 'resources':
            renderResourcesReport();
            break;
        case 'budget':
            renderBudgetReport();
            break;
    }
}

// ============================================
// OVERVIEW REPORT
// ============================================

/**
 * Renders the overview report with system-wide statistics
 */
async function renderOverviewReport() {
    try {
        // Get dashboard statistics from API
        const stats = await fetchAPI('/reports/dashboard');
        
        // Update statistics cards
        document.getElementById('overviewTotalProjects').textContent = stats.totalProjects;
        document.getElementById('overviewActiveProjects').textContent = stats.activeProjects;
        document.getElementById('overviewCompletedTasks').textContent = stats.completedTasks;
        document.getElementById('overviewInProgressTasks').textContent = stats.inProgressTasks;
        
        // Update budget overview
        const totalBudget = stats.totalBudget;
        const budgetSpent = stats.budgetSpent;
        const budgetRemaining = totalBudget - budgetSpent;
        const budgetPercentage = totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0;
        
        document.getElementById('overviewTotalBudget').textContent = formatCurrency(totalBudget);
        document.getElementById('overviewBudgetSpent').textContent = formatCurrency(budgetSpent);
        document.getElementById('overviewBudgetRemaining').textContent = formatCurrency(budgetRemaining);
        
        const budgetBar = document.getElementById('overviewBudgetBar');
        budgetBar.style.width = `${budgetPercentage}%`;
        budgetBar.textContent = `${budgetPercentage}%`;
        
        // Render project status distribution chart
        renderProjectStatusChart();
        
    } catch (error) {
        console.error('Error rendering overview report:', error);
        showNotification('Failed to load overview report', 'error');
    }
}

/**
 * Renders a simple project status distribution chart
 */
function renderProjectStatusChart() {
    const container = document.getElementById('projectStatusChart');
    
    if (!container) return;
    
    // Count projects by status
    const statusCounts = {
        active: 0,
        planning: 0,
        completed: 0,
        'on-hold': 0
    };
    
    appState.projects.forEach(project => {
        if (statusCounts.hasOwnProperty(project.status)) {
            statusCounts[project.status]++;
        }
    });
    
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p class="empty-state">No project data available</p>';
        return;
    }
    
    // Build simple bar chart
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${Object.entries(statusCounts).map(([status, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 500; text-transform: capitalize;">${status.replace('-', ' ')}</span>
                            <span style="color: #7f8c8d;">${count} projects (${percentage}%)</span>
                        </div>
                        <div class="budget-progress">
                            <div class="progress-bar" style="width: ${percentage}%">
                                ${percentage}%
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================
// PROJECT REPORT
// ============================================

/**
 * Renders a detailed report for a specific project
 * @param {string} projectId - ID of the project
 */
async function renderProjectReport(projectId) {
    const project = getProjectById(projectId);
    const container = document.getElementById('projectReportContent');
    
    if (!project || !container) return;
    
    try {
        // Get project progress from API
        const progress = await fetchAPI(`/reports/project-progress/${projectId}`);
        
        // Get project tasks and resources
        const projectTasks = getTasksByProject(projectId);
        const projectResources = getResourcesByProject(projectId);
        const resourceCost = calculateResourceCost(projectResources);
        
        // Calculate additional metrics
        const overdueTasks = projectTasks.filter(task => 
            isPastDate(task.dueDate) && task.status !== 'completed'
        );
        
        const budgetRemaining = project.budget - (project.budgetSpent || 0);
        const budgetPercentage = calculatePercentage(project.budgetSpent || 0, project.budget);
        
        const daysRemaining = daysUntil(project.endDate);
        const totalDuration = daysBetween(project.startDate, project.endDate);
        const daysElapsed = totalDuration - daysRemaining;
        const timePercentage = calculatePercentage(daysElapsed, totalDuration);
        
        // Build report HTML
        container.innerHTML = `
            <div class="report-card">
                <h3>Project Overview</h3>
                <div class="project-meta" style="margin-bottom: 15px;">
                    ${renderStatusBadge(project.status)}
                    ${renderPriorityBadge(project.priority)}
                </div>
                <p>${escapeHtml(project.description)}</p>
            </div>
            
            <div class="report-card">
                <h3>Progress Summary</h3>
                <div class="stats-grid" style="margin-bottom: 20px;">
                    <div class="stat-card">
                        <div class="stat-icon">📋</div>
                        <div class="stat-content">
                            <h3>${progress.totalTasks}</h3>
                            <p>Total Tasks</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <h3>${progress.completedTasks}</h3>
                            <p>Completed</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🚀</div>
                        <div class="stat-content">
                            <h3>${progress.inProgressTasks}</h3>
                            <p>In Progress</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <h3>${progress.pendingTasks}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar" style="width: ${progress.progressPercentage}%">
                        ${progress.progressPercentage}% Complete
                    </div>
                </div>
            </div>
            
            <div class="report-card">
                <h3>Timeline Analysis</h3>
                <div class="budget-summary">
                    <div class="budget-row">
                        <span>Start Date:</span>
                        <span class="budget-amount">${formatDate(project.startDate)}</span>
                    </div>
                    <div class="budget-row">
                        <span>End Date:</span>
                        <span class="budget-amount">${formatDate(project.endDate)}</span>
                    </div>
                    <div class="budget-row">
                        <span>Total Duration:</span>
                        <span class="budget-amount">${totalDuration} days</span>
                    </div>
                    <div class="budget-row">
                        <span>Days Elapsed:</span>
                        <span class="budget-amount">${daysElapsed} days</span>
                    </div>
                    <div class="budget-row">
                        <span>Days Remaining:</span>
                        <span class="budget-amount" style="color: ${daysRemaining < 0 ? '#E74C3C' : '#2c3e50'}">
                            ${daysRemaining} days ${daysRemaining < 0 ? '(Overdue)' : ''}
                        </span>
                    </div>
                </div>
                <div class="budget-progress" style="margin-top: 15px;">
                    <div class="progress-bar" style="width: ${Math.min(timePercentage, 100)}%">
                        ${timePercentage}% Time Elapsed
                    </div>
                </div>
            </div>
            
            <div class="report-card">
                <h3>Budget Analysis</h3>
                <div class="budget-summary">
                    <div class="budget-row">
                        <span>Total Budget:</span>
                        <span class="budget-amount">${formatCurrency(project.budget)}</span>
                    </div>
                    <div class="budget-row">
                        <span>Budget Spent:</span>
                        <span class="budget-amount">${formatCurrency(project.budgetSpent || 0)}</span>
                    </div>
                    <div class="budget-row">
                        <span>Budget Remaining:</span>
                        <span class="budget-amount" style="color: ${budgetRemaining < 0 ? '#E74C3C' : '#27AE60'}">
                            ${formatCurrency(budgetRemaining)}
                        </span>
                    </div>
                    <div class="budget-row">
                        <span>Resource Cost:</span>
                        <span class="budget-amount">${formatCurrency(resourceCost)}</span>
                    </div>
                </div>
                <div class="budget-progress" style="margin-top: 15px;">
                    <div class="progress-bar" style="width: ${Math.min(budgetPercentage, 100)}%">
                        ${budgetPercentage}% Spent
                    </div>
                </div>
            </div>
            
            ${overdueTasks.length > 0 ? `
                <div class="report-card">
                    <h3>⚠️ Overdue Tasks (${overdueTasks.length})</h3>
                    <div style="margin-top: 15px;">
                        ${overdueTasks.map(task => `
                            <div class="task-item" style="margin-bottom: 10px;">
                                <div class="task-info">
                                    <h4>${escapeHtml(task.title)}</h4>
                                    <p>Due: ${formatDate(task.dueDate)} (${Math.abs(daysUntil(task.dueDate))} days overdue)</p>
                                </div>
                                <div class="task-meta">
                                    ${renderPriorityBadge(task.priority)}
                                    ${renderStatusBadge(task.status)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
    } catch (error) {
        console.error('Error rendering project report:', error);
        container.innerHTML = '<p class="error-state">Failed to load project report</p>';
    }
}

// ============================================
// TASKS REPORT
// ============================================

/**
 * Renders the tasks analysis report
 */
function renderTasksReport() {
    const tasks = appState.tasks;
    
    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    
    // Update statistics
    document.getElementById('tasksTotalTasks').textContent = totalTasks;
    document.getElementById('tasksCompleted').textContent = completedTasks;
    document.getElementById('tasksInProgress').textContent = inProgressTasks;
    document.getElementById('tasksPending').textContent = pendingTasks;
    
    // Render priority breakdown
    renderTaskPriorityChart();
    
    // Render overdue tasks
    renderOverdueTasksList();
}

/**
 * Renders task priority breakdown chart
 */
function renderTaskPriorityChart() {
    const container = document.getElementById('taskPriorityChart');
    
    if (!container) return;
    
    const priorityCounts = {
        high: 0,
        medium: 0,
        low: 0
    };
    
    appState.tasks.forEach(task => {
        if (priorityCounts.hasOwnProperty(task.priority)) {
            priorityCounts[task.priority]++;
        }
    });
    
    const total = Object.values(priorityCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p class="empty-state">No task data available</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${Object.entries(priorityCounts).map(([priority, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 500; text-transform: capitalize;">${priority} Priority</span>
                            <span style="color: #7f8c8d;">${count} tasks (${percentage}%)</span>
                        </div>
                        <div class="budget-progress">
                            <div class="progress-bar" style="width: ${percentage}%">
                                ${percentage}%
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Renders list of overdue tasks
 */
function renderOverdueTasksList() {
    const container = document.getElementById('overdueTasks');
    
    if (!container) return;
    
    const overdueTasks = getOverdueTasks();
    
    if (overdueTasks.length === 0) {
        container.innerHTML = '<p class="empty-state">✅ No overdue tasks!</p>';
        return;
    }
    
    container.innerHTML = overdueTasks.map(task => {
        const project = getProjectById(task.projectId);
        const daysOverdue = Math.abs(daysUntil(task.dueDate));
        
        return `
            <div class="task-item" style="margin-bottom: 10px;">
                <div class="task-info">
                    <h4>${escapeHtml(task.title)}</h4>
                    <p>📁 ${project ? escapeHtml(project.name) : 'Unknown Project'}</p>
                    <p style="color: #E74C3C; font-weight: 600;">
                        ⚠️ ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue (Due: ${formatDate(task.dueDate)})
                    </p>
                </div>
                <div class="task-meta">
                    ${renderPriorityBadge(task.priority)}
                    ${renderStatusBadge(task.status)}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RESOURCES REPORT
// ============================================

/**
 * Renders the resources utilization report
 */
function renderResourcesReport() {
    const resources = appState.resources;
    
    // Calculate statistics
    const totalAllocations = resources.length;
    const totalHours = resources.reduce((sum, r) => sum + r.allocatedHours, 0);
    const totalUsedHours = resources.reduce((sum, r) => sum + r.usedHours, 0);
    const avgUtilization = totalHours > 0 ? Math.round((totalUsedHours / totalHours) * 100) : 0;
    const totalCost = calculateResourceCost(resources);
    
    // Update statistics
    document.getElementById('resourcesTotalAllocations').textContent = totalAllocations;
    document.getElementById('resourcesTotalHours').textContent = totalHours;
    document.getElementById('resourcesAvgUtilization').textContent = `${avgUtilization}%`;
    document.getElementById('resourcesTotalCost').textContent = formatCurrency(totalCost);
    
    // Render team utilization chart
    renderTeamUtilizationChart();
}

/**
 * Renders team member utilization chart
 */
function renderTeamUtilizationChart() {
    const container = document.getElementById('teamUtilizationChart');
    
    if (!container) return;
    
    // Group resources by user
    const userResources = {};
    
    appState.resources.forEach(resource => {
        if (!userResources[resource.userId]) {
            userResources[resource.userId] = {
                userName: resource.userName,
                totalAllocated: 0,
                totalUsed: 0,
                totalCost: 0
            };
        }
        userResources[resource.userId].totalAllocated += resource.allocatedHours;
        userResources[resource.userId].totalUsed += resource.usedHours;
        userResources[resource.userId].totalCost += (resource.usedHours * resource.hourlyRate);
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
    
    if (userStats.length === 0) {
        container.innerHTML = '<p class="empty-state">No resource data available</p>';
        return;
    }
    
    container.innerHTML = userStats.map(user => `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 500;">${escapeHtml(user.userName)}</span>
                <span style="color: #7f8c8d; font-size: 14px;">
                    ${user.totalUsed}h / ${user.totalAllocated}h (${user.utilization}%) - ${formatCurrency(user.totalCost)}
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
// BUDGET REPORT
// ============================================

/**
 * Renders the budget analysis report
 */
function renderBudgetReport() {
    const projects = appState.projects;
    
    // Calculate overall budget statistics
    const totalAllocated = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0);
    const remaining = totalAllocated - totalSpent;
    const utilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    
    // Update summary
    document.getElementById('budgetTotalAllocated').textContent = formatCurrency(totalAllocated);
    document.getElementById('budgetTotalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('budgetRemaining').textContent = formatCurrency(remaining);
    document.getElementById('budgetUtilization').textContent = `${utilization}%`;
    
    // Render project budget table
    renderProjectBudgetTable();
}

/**
 * Renders budget breakdown by project
 */
function renderProjectBudgetTable() {
    const container = document.getElementById('projectBudgetTable');
    
    if (!container) return;
    
    const projects = appState.projects;
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="empty-state">No project data available</p>';
        return;
    }
    
    // Sort projects by budget (descending)
    const sortedProjects = [...projects].sort((a, b) => (b.budget || 0) - (a.budget || 0));
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Total Budget</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Utilization</th>
                </tr>
            </thead>
            <tbody>
                ${sortedProjects.map(project => {
                    const budget = project.budget || 0;
                    const spent = project.budgetSpent || 0;
                    const remaining = budget - spent;
                    const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                    
                    return `
                        <tr>
                            <td><strong>${escapeHtml(project.name)}</strong></td>
                            <td>${renderStatusBadge(project.status)}</td>
                            <td>${formatCurrency(budget)}</td>
                            <td>${formatCurrency(spent)}</td>
                            <td style="color: ${remaining < 0 ? '#E74C3C' : '#27AE60'}">
                                ${formatCurrency(remaining)}
                            </td>
                            <td>
                                <div class="budget-progress" style="height: 20px;">
                                    <div class="progress-bar" style="width: ${Math.min(utilization, 100)}%; font-size: 11px;">
                                        ${utilization}%
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}
