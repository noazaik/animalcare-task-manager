# מנהל משימות טיפול בבעלי חיים

Hebrew RTL task manager with authentication, admin/user roles, and recurring tasks.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE task_manager;
```

### 2. Server Setup

```bash
cd server

# Create .env file from example
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/task_manager?schema=public"

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Seed the database with sample users and tasks
npm run db:seed

# Start the development server
npm run dev
```

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Sample Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| user | user123 | User |

## Features

### Authentication
- JWT-based login
- Role-based access (Admin/User)

### Admin Capabilities
- Create, edit, delete tasks
- Reorder tasks
- Toggle task completion

### User Capabilities
- Toggle task completion only

### Task Management
- Daily, weekly, monthly recurring tasks
- Date navigation
- Time-based tasks (start/end time)
- Completion tracking per date for recurring tasks

### RTL Support
- Full Hebrew interface
- Right-to-left layout

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password

### Tasks (requires authentication)
- `GET /api/tasks?date=YYYY-MM-DD` - Get tasks for a date
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/:id` - Update task (admin only)
- `DELETE /api/tasks/:id` - Delete task (admin only)
- `PATCH /api/tasks/:id/complete` - Toggle completion (all users)
- `PUT /api/tasks/reorder` - Reorder tasks (admin only)

## Project Structure

```
animal-care-task-manager-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Tasks/
│   │   │   └── Layout/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   └── package.json
└── README.md
```
