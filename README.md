# Project Tracking System (PTS)

A comprehensive web-based application for managing projects, tasks, resources, and team performance. Built with simplicity and readability in mind.

## Features

### Core Functionality
- **Project Management**: Create, configure, and monitor projects from initiation to closure
- **Task & Milestone Tracking**: Assign tasks, set deadlines, and track progress
- **Resource Management**: Allocate team members and manage workload
- **Budget Tracking**: Monitor project budgets and expenses
- **Progress Reporting**: Real-time dashboards and custom reports
- **Risk & Issue Management**: Identify, track, and resolve project risks
- **User Management**: Role-based access control for different user types

### User Roles
- **Project Managers**: Full project control and team management
- **Team Members**: Task management and progress updates
- **Department Heads**: Multi-project oversight
- **Executives**: High-level reporting and analytics
- **System Administrators**: User and system configuration

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- A modern web browser

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Default Login Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Project Manager:**
- Username: `pm_ndzalo`
- Password: `pm123`

**Team Member:**
- Username: `dev_nobela`
- Password: `dev123`

## Technology Stack

### Backend Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** (v4.18.2) - Web application framework for handling HTTP requests and routing
- **body-parser** (v1.20.2) - Middleware for parsing JSON request bodies
- **CORS** (v2.8.5) - Middleware for enabling Cross-Origin Resource Sharing
- **File System (fs)** - Node.js built-in module for reading/writing JSON files as database

### Frontend Technologies
- **HTML5** - Markup language for structure
  - Multiple pages: index.html, dashboard.html, projects.html, tasks.html, resources.html, reports.html
- **CSS3** - Styling (styles.css)
  - Custom CSS with theme support (light/dark mode)
- **Vanilla JavaScript** - No frameworks, pure JavaScript
  - Modular JS files: app.js, auth.js, projects.js, tasks.js, resources.js, reports.js, utils.js
  - DOM manipulation
  - Fetch API for HTTP requests
  - Event handling

### Data Storage
- **JSON Files** - File-based database
  - users.json
  - projects.json
  - tasks.json
  - resources.json

### Architecture Pattern
- **RESTful API** - Backend provides REST endpoints
- **Client-Server Architecture** - Separation between frontend and backend
- **MVC-like Pattern** - Separation of concerns in code organization

### Development Tools
- **npm** - Package manager

### Key Characteristics
- **No Build Process** - Runs directly without compilation
- **No Frontend Framework** - Pure vanilla JavaScript (no React, Vue, Angular, etc.)
- **Simple & Readable** - Designed for clarity and maintainability
- **Lightweight** - Only 3 backend dependencies
- **Traditional Architecture** - Server-rendered HTML with client-side JavaScript enhancement

## Project Structure

```
project-tracking-system/
├── server.js              # Express server with all API endpoints
├── package.json           # Project dependencies
├── README.md             # This file
├── public/               # Frontend files
│   ├── index.html        # Login page
│   ├── dashboard.html    # Main dashboard
│   ├── projects.html     # Projects management
│   ├── tasks.html        # Task management
│   ├── resources.html    # Resource allocation
│   ├── reports.html      # Reports and analytics
│   ├── css/
│   │   └── styles.css    # Application styles
│   └── js/
│       ├── app.js        # Main application logic
│       ├── auth.js       # Authentication handling
│       ├── projects.js   # Project management
│       ├── tasks.js      # Task management
│       ├── resources.js  # Resource management
│       ├── reports.js    # Reporting functionality
│       └── utils.js      # Utility functions
└── data/                 # JSON database files
    ├── users.json        # User accounts
    ├── projects.json     # Project data
    ├── tasks.json        # Task data
    └── resources.json    # Resource allocations
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/users` - Get all users

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks?projectId=xxx` - Get tasks by project
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource allocation
- `PUT /api/resources/:id` - Update resource

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/project-progress/:projectId` - Get project progress

## Usage Guide

### Creating a New Project
1. Log in to the system
2. Navigate to "Projects" page
3. Click "Create New Project"
4. Fill in project details (name, description, budget, timeline)
5. Assign team members
6. Click "Save"

### Managing Tasks
1. Select a project
2. Click "Add Task"
3. Enter task details (title, description, assignee, deadline)
4. Set priority and status
5. Track progress as work is completed

### Viewing Reports
1. Navigate to "Reports" page
2. View dashboard with key metrics
3. Select specific project for detailed progress
4. Export reports as needed

## Code Philosophy

This project is built with the following principles:

- **Readability First**: Clear variable names, comprehensive comments
- **Simplicity**: No complex frameworks, easy to understand
- **Modularity**: Separated concerns, reusable components
- **Maintainability**: Well-structured code that's easy to modify
- **Human-Friendly**: Logic that makes sense to developers

## Security Notes

**Important**: This is a demonstration system with basic security:
- Passwords are stored in plain text (use hashing in production)
- No session management (implement JWT or sessions for production)
- No input validation (add validation for production use)
- CORS is wide open (restrict in production)

For production use, implement:
- Password hashing (bcrypt)
- JWT authentication
- Input validation and sanitization
- HTTPS
- Rate limiting
- Proper error handling

## Customization

### Adding New Features
1. Add API endpoint in `server.js`
2. Create corresponding frontend function in `public/js/`
3. Update UI in relevant HTML file
4. Test thoroughly

### Modifying Data Structure
1. Update JSON files in `data/` directory
2. Modify API endpoints to handle new fields
3. Update frontend to display new data

## Contributing

This is a demonstration project. Feel free to fork and enhance!

## Support

For questions or issues, please refer to the code comments which explain each function's purpose and logic.
