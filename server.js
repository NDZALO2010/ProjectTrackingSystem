/**
 * Project Tracking System - Main Server File
 * 
 * This file sets up the Express server and handles all API routes.
 * It provides endpoints for authentication, projects, tasks, resources, and reports.
 * 
 * The server uses JSON files for data storage to keep things simple and readable.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Express application
const app = express();
const PORT = 3000;

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Reads data from a JSON file
 * @param {string} filename - Name of the file to read
 * @returns {Object} Parsed JSON data
 */
function readDataFile(filename) {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return null;
    }
}

/**
 * Writes data to a JSON file
 * @param {string} filename - Name of the file to write
 * @param {Object} data - Data to write to the file
 */
function writeDataFile(filename, data) {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error.message);
        return false;
    }
}

/**
 * Generates a unique ID for new records
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// AUTHENTICATION API
// ============================================

/**
 * Login endpoint - Authenticates user credentials
 * POST /api/login
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Read users from database
    const users = readDataFile('users.json');
    
    if (!users) {
        return res.status(500).json({ error: 'Unable to read user data' });
    }
    
    // Find user with matching credentials
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Remove password from response for security
        const { password, ...userWithoutPassword } = user;
        res.json({ 
            success: true, 
            user: userWithoutPassword,
            message: 'Login successful' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });
    }
});

/**
 * Get all users (for admin purposes)
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
    const users = readDataFile('users.json');
    
    if (!users) {
        return res.status(500).json({ error: 'Unable to read user data' });
    }
    
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

// ============================================
// PROJECTS API
// ============================================

/**
 * Get all projects
 * GET /api/projects
 */
app.get('/api/projects', (req, res) => {
    const projects = readDataFile('projects.json');
    
    if (!projects) {
        return res.status(500).json({ error: 'Unable to read project data' });
    }
    
    res.json(projects);
});

/**
 * Get a single project by ID
 * GET /api/projects/:id
 */
app.get('/api/projects/:id', (req, res) => {
    const projects = readDataFile('projects.json');
    const project = projects.find(p => p.id === req.params.id);
    
    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

/**
 * Create a new project
 * POST /api/projects
 */
app.post('/api/projects', (req, res) => {
    const projects = readDataFile('projects.json');
    
    // Create new project with generated ID and timestamp
    const newProject = {
        id: generateId(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    
    if (writeDataFile('projects.json', projects)) {
        res.status(201).json(newProject);
    } else {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

/**
 * Update an existing project
 * PUT /api/projects/:id
 */
app.put('/api/projects/:id', (req, res) => {
    const projects = readDataFile('projects.json');
    const index = projects.findIndex(p => p.id === req.params.id);
    
    if (index !== -1) {
        // Update project while preserving ID and creation date
        projects[index] = {
            ...projects[index],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };
        
        if (writeDataFile('projects.json', projects)) {
            res.json(projects[index]);
        } else {
            res.status(500).json({ error: 'Failed to update project' });
        }
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
app.delete('/api/projects/:id', (req, res) => {
    const projects = readDataFile('projects.json');
    const filteredProjects = projects.filter(p => p.id !== req.params.id);
    
    if (filteredProjects.length < projects.length) {
        if (writeDataFile('projects.json', filteredProjects)) {
            res.json({ success: true, message: 'Project deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete project' });
        }
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

// ============================================
// TASKS API
// ============================================

/**
 * Get all tasks (optionally filtered by project)
 * GET /api/tasks?projectId=xxx
 */
app.get('/api/tasks', (req, res) => {
    const tasks = readDataFile('tasks.json');
    
    if (!tasks) {
        return res.status(500).json({ error: 'Unable to read task data' });
    }
    
    // Filter by project if projectId is provided
    if (req.query.projectId) {
        const filteredTasks = tasks.filter(t => t.projectId === req.query.projectId);
        return res.json(filteredTasks);
    }
    
    res.json(tasks);
});

/**
 * Create a new task
 * POST /api/tasks
 */
app.post('/api/tasks', (req, res) => {
    const tasks = readDataFile('tasks.json');
    
    const newTask = {
        id: generateId(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    if (writeDataFile('tasks.json', tasks)) {
        res.status(201).json(newTask);
    } else {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

/**
 * Update a task
 * PUT /api/tasks/:id
 */
app.put('/api/tasks/:id', (req, res) => {
    const tasks = readDataFile('tasks.json');
    const index = tasks.findIndex(t => t.id === req.params.id);
    
    if (index !== -1) {
        tasks[index] = {
            ...tasks[index],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };
        
        if (writeDataFile('tasks.json', tasks)) {
            res.json(tasks[index]);
        } else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
app.delete('/api/tasks/:id', (req, res) => {
    const tasks = readDataFile('tasks.json');
    const filteredTasks = tasks.filter(t => t.id !== req.params.id);
    
    if (filteredTasks.length < tasks.length) {
        if (writeDataFile('tasks.json', filteredTasks)) {
            res.json({ success: true, message: 'Task deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// ============================================
// RESOURCES API
// ============================================

/**
 * Get all resources
 * GET /api/resources
 */
app.get('/api/resources', (req, res) => {
    const resources = readDataFile('resources.json');
    
    if (!resources) {
        return res.status(500).json({ error: 'Unable to read resource data' });
    }
    
    res.json(resources);
});

/**
 * Create a new resource allocation
 * POST /api/resources
 */
app.post('/api/resources', (req, res) => {
    const resources = readDataFile('resources.json');
    
    const newResource = {
        id: generateId(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    resources.push(newResource);
    
    if (writeDataFile('resources.json', resources)) {
        res.status(201).json(newResource);
    } else {
        res.status(500).json({ error: 'Failed to create resource allocation' });
    }
});

/**
 * Update a resource allocation
 * PUT /api/resources/:id
 */
app.put('/api/resources/:id', (req, res) => {
    const resources = readDataFile('resources.json');
    const index = resources.findIndex(r => r.id === req.params.id);
    
    if (index !== -1) {
        resources[index] = {
            ...resources[index],
            ...req.body,
            id: req.params.id
        };
        
        if (writeDataFile('resources.json', resources)) {
            res.json(resources[index]);
        } else {
            res.status(500).json({ error: 'Failed to update resource' });
        }
    } else {
        res.status(404).json({ error: 'Resource not found' });
    }
});

// ============================================
// REPORTS API
// ============================================

/**
 * Get dashboard statistics
 * GET /api/reports/dashboard
 */
app.get('/api/reports/dashboard', (req, res) => {
    const projects = readDataFile('projects.json');
    const tasks = readDataFile('tasks.json');
    const resources = readDataFile('resources.json');
    
    // Calculate statistics
    const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        totalResources: resources.length,
        // Calculate total budget across all projects
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        // Calculate budget spent
        budgetSpent: projects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0)
    };
    
    res.json(stats);
});

/**
 * Get project progress report
 * GET /api/reports/project-progress/:projectId
 */
app.get('/api/reports/project-progress/:projectId', (req, res) => {
    const tasks = readDataFile('tasks.json');
    const projectTasks = tasks.filter(t => t.projectId === req.params.projectId);
    
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    res.json({
        projectId: req.params.projectId,
        totalTasks,
        completedTasks,
        inProgressTasks: projectTasks.filter(t => t.status === 'in-progress').length,
        pendingTasks: projectTasks.filter(t => t.status === 'pending').length,
        progressPercentage: Math.round(progressPercentage)
    });
});

// ============================================
// SERVE MAIN APPLICATION
// ============================================

/**
 * Serve the main index.html file
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('===========================================');
    console.log('  Project Tracking System Server Started  ');
    console.log('===========================================');
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Environment: Development`);
    console.log('===========================================');
});
