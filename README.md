TEAM TASK MANAGEMENT SYSTEM

🔗 Live Demo:
https://team-task-management-a785.onrender.com

📂 GitHub Repository:
https://github.com/ROUNAK-KUMAR-GUPTA/team-task-management

--------------------------------------------------

📌 Project Description:
This is a full-stack Team Task Management application that helps users manage projects and tasks efficiently. It includes authentication, project creation, task tracking, and a dashboard overview. The frontend and backend are deployed together as a single service.

--------------------------------------------------

📁 Project Structure:
```
team-task-management/
│
├── backend/
│   ├── middleware/            # Custom middleware (authentication, etc.)
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   │
│   ├── db.js                  # SQLite database connection
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   │
│   ├── taskmanager.db         # SQLite database (local)
│   ├── taskmanager.db-shm
│   └── taskmanager.db-wal
│
├── frontend/
│   ├── index.html             # Main UI page
│   ├── style.css              # Styling
│   └── script.js              # Frontend logic
│
├── .gitignore                 # Ignored files (node_modules, .env, db files)
└── README.txt                 # Project documentation
```
--------------------------------------------------

⚙️ Tech Stack:
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: SQLite (better-sqlite3)
Deployment: Render

--------------------------------------------------

✨ Features:
- User Authentication (Login / Register)
- Create and Manage Projects
- Add, Update, Delete Tasks
- Dashboard Overview
- REST API Integration
- Full-stack integration (single deployment)
- Responsive UI

--------------------------------------------------

🔌 API Endpoints:

Auth:
POST   /api/auth/register
POST   /api/auth/login

Projects:
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

Tasks:
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

Dashboard:
GET    /api/dashboard

Health Check:
GET    /api/health

--------------------------------------------------

🚀 How to Run Locally:

1. Clone repository:
   git clone https://github.com/ROUNAK-KUMAR-GUPTA/team-task-management.git

2. Navigate to backend:
   cd team-task-manager/backend

3. Install dependencies:
   npm install

4. Start server:
   node server.js

5. Open browser:
   http://localhost:5000

--------------------------------------------------

🌐 Deployment:
The application is deployed on Render (free tier):
https://team-task-management-a785.onrender.com

--------------------------------------------------

👨‍💻 Author:
Rounak Kumar Gupta
rounakgupta029@gmail.com
7061717005
