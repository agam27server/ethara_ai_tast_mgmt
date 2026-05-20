# Team Task Manager

Team Task Manager is a production-ready, full-stack collaborative platform built on the MERN stack with JWT authentication, role-based access control, a real-time Kanban task board, interactive dashboard analytics, and dark mode support.

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):**
  * **Admin:** Full CRUD operations on projects and tasks, team member assignment management, and full project control.
  * **Member:** View assigned projects and tasks only, update task status (Todo, In Progress, Completed), and write comments.
* **Interactive Kanban Board:** Real-time drag-and-drop task movements across status columns (Todo, In Progress, Completed).
* **Real-Time Synchronisation:** WebSockets (Socket.IO) push board changes and comment feeds to all active project members in real-time.
* **Overview Analytics Dashboard:** Visual metrics tracking total/completed/pending/overdue tasks, priority distributions, and a historical activity log feed.
* **Premium UX/UI:** Tailored dark/light mode context, glassmorphic layouts, loading skeletons, responsive collapsible sidebar menus, and custom Toast notification alerts.

---

## 🛠 Tech Stack

* **Frontend:** React.js, Tailwind CSS, Vite, Lucide Icons, Recharts, Socket.IO Client.
* **Backend:** Node.js, Express.js, Mongoose, Socket.IO Server.
* **Database:** MongoDB (with Mongoose modeling).
* **Authentication:** JSON Web Tokens (JWT) + BCrypt password hashing.
* **Deployment:** Railway (Nixpacks builder, monorepo unified serving).

---

## 📂 Project Architecture

```
team-task-manager/
├── client/                     # Frontend Application (Vite + React)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Layout & Shared widgets (Sidebar, Navbar, Guards)
│   │   ├── context/            # Auth, Theme, and Toast Providers
│   │   ├── pages/              # Views (Login, Register, Dashboard, Kanban, Projects)
│   │   ├── services/           # Axios API Wrapper, Socket.IO Client
│   │   ├── App.jsx             # React Routes & Context setup
│   │   ├── index.css           # Styling directives, glassmorphic tokens
│   │   └── main.jsx            # React mount point
│   ├── tailwind.config.js      # Tailwind configurations (Dark Mode enabled)
│   └── vite.config.js          # Proxy setups for API & Websockets
├── server/                     # Backend REST API (Node + Express)
│   ├── controllers/            # Controller layers (Auth, Project, Task, Dashboard)
│   ├── middleware/             # JWT protect and authorization middlewares
│   ├── models/                 # Database Schemas (User, Project, Task)
│   ├── routes/                 # REST endpoints routing
│   ├── utils/                  # Seed script and utility functions
│   └── server.js               # App bootstrapper, DB connection, socket room setups
├── railway.json                # Nixpacks deployment configuration
└── package.json                # Monorepo root configurations & workspace controls
```

---

## ⚙️ Environment Variables

### Server Environment Configuration (`server/.env`)
Create a `.env` file under the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/team-task-manager
JWT_SECRET=supersecretjwtsecretkeychangeinproduction
```

---

## 🧪 Demo Login Credentials

The project comes with a seeding script to populate the database with default records. Use these credentials to test role differences:

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin** | `admin@taskmanager.com` | `AdminPass123!` | Full control of projects, members, task CRUD. |
| **Member 1** | `john@taskmanager.com` | `MemberPass123!` | View assigned projects/tasks, status shifts, add comments. |
| **Member 2** | `jane@taskmanager.com` | `MemberPass123!` | View assigned projects/tasks, status shifts, add comments. |

---

## 🖥️ Local Installation Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas connection URI)

### Quick Start (Monorepo Controls)

1. **Clone & Open Project:**
   ```bash
   cd team-task-manager
   ```

2. **Install All Dependencies:**
   Install dependencies for both frontend and backend concurrently from the root directory:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables:**
   * Create `server/.env` and paste variables as shown in the environment config section.

4. **Seed the Database:**
   Pre-populate the collections with sample projects, members, and historical task records:
   ```bash
   npm run seed
   ```

5. **Run in Development Mode:**
   Boot both React Dev Server (port 3000) and Express Server (port 5000) concurrently:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`.

---

## 📡 REST API Documentation

All routes require a bearer token header: `Authorization: Bearer <JWT_TOKEN>` (except Public routes).

### Authentication
* `POST /api/auth/register` (Public) - Create user account.
* `POST /api/auth/login` (Public) - Login user, returns token and details.
* `GET /api/auth/me` (Private) - Get current user profile.

### Workspace Users
* `GET /api/users` (Private) - Get all users (used for assigning projects and tasks).

### Projects
* `GET /api/projects` (Private) - Get projects (Admin: all, Member: assigned only).
* `POST /api/projects` (Private, Admin-only) - Create a new project.
* `PUT /api/projects/:id` (Private, Admin-only) - Update project settings and member list.
* `DELETE /api/projects/:id` (Private, Admin-only) - Delete project and related tasks.

### Tasks
* `GET /api/tasks?projectId=<id>` (Private) - Get task list (supports `search`, `status`, `priority`, and `sortBy` filters).
* `POST /api/tasks` (Private, Admin-only) - Create a task.
* `PUT /api/tasks/:id` (Private) - Update task (Admin: all fields, Member: status only).
* `DELETE /api/tasks/:id` (Private, Admin-only) - Delete a task.
* `POST /api/tasks/:id/comments` (Private) - Post comment.

### Dashboard Stats
* `GET /api/dashboard/stats` (Private) - Aggregate dashboard stats & activity timeline feed.

---

## ⛵ Railway Deployment Steps

This repository is optimized to build and deploy as a single service on Railway using Nixpacks, serving the React compiled frontend straight from the Express backend in production.

1. **Push Code to GitHub:**
   Commit all changes and push your local branch to your GitHub repository.
2. **Connect to Railway:**
   * Log into [Railway.app](https://railway.app/).
   * Click **New Project** -> **Deploy from GitHub repo** -> Select your repository.
3. **Configure Environment Variables:**
   Under the service **Variables** tab, add:
   * `PORT`: `5000` (or leave empty, Railway defaults it)
   * `NODE_ENV`: `production`
   * `MONGO_URI`: `mongodb+srv://...` (your MongoDB Atlas connection string)
   * `JWT_SECRET`: `your_custom_production_secret_key`
4. **Deploy:**
   Railway will detect the root `package.json` and the `railway.json` file. It will automatically run:
   * Build command: `npm run install-all && npm run build`
   * Start command: `npm start`
5. **Access Application:**
   Railway will generate a public URL. Open the domain, and your production full-stack application is live!
