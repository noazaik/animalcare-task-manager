const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const defaultData = {
  users: [],
  tasks: [],
  taskCompletions: [],
  nextUserId: 1,
  nextTaskId: 1
};

function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading database:', error);
  }
  return { ...defaultData };
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// User operations
function getAllUsers() {
  const db = readDb();
  return db.users.map(u => ({
    id: u.id,
    fullName: u.fullName || u.username,
    email: u.email || null,
    role: u.role,
    createdAt: u.createdAt
  }));
}

function findUserByUsername(username) {
  const db = readDb();
  return db.users.find(u => u.username === username);
}

function findUserByEmail(email) {
  const db = readDb();
  return db.users.find(u => u.email === email.toLowerCase());
}

function findUserByGoogleId(googleId) {
  const db = readDb();
  return db.users.find(u => u.googleId === googleId);
}

function createUser(user) {
  const db = readDb();
  const newUser = {
    id: db.nextUserId++,
    ...user,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

function updateUserRole(userId, role) {
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.role = role;
  writeDb(db);
  return user;
}

// Task operations
function getAllTasks() {
  const db = readDb();
  return db.tasks.sort((a, b) => a.sortOrder - b.sortOrder);
}

function getTaskById(id) {
  const db = readDb();
  return db.tasks.find(t => t.id === id);
}

function createTask(task) {
  const db = readDb();
  const maxSortOrder = db.tasks.reduce((max, t) => Math.max(max, t.sortOrder || 0), 0);
  const newTask = {
    id: db.nextTaskId++,
    ...task,
    sortOrder: maxSortOrder + 1,
    isComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.tasks.push(newTask);
  writeDb(db);
  return newTask;
}

function updateTask(id, updates) {
  const db = readDb();
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  db.tasks[index] = {
    ...db.tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  writeDb(db);
  return db.tasks[index];
}

function deleteTask(id) {
  const db = readDb();
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) return false;

  db.tasks.splice(index, 1);
  // Also delete completions for this task
  db.taskCompletions = db.taskCompletions.filter(c => c.taskId !== id);
  writeDb(db);
  return true;
}

function reorderTasks(taskIds) {
  const db = readDb();
  taskIds.forEach((id, index) => {
    const task = db.tasks.find(t => t.id === id);
    if (task) {
      task.sortOrder = index;
    }
  });
  writeDb(db);
}

// Task completion operations
function getCompletionsForDate(date) {
  const db = readDb();
  const dateStr = date.toISOString().split('T')[0];
  return db.taskCompletions.filter(c => c.date.split('T')[0] === dateStr);
}

function setCompletion(taskId, date, complete) {
  const db = readDb();
  const dateStr = new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z';
  const existingIndex = db.taskCompletions.findIndex(
    c => c.taskId === taskId && c.date.split('T')[0] === dateStr.split('T')[0]
  );

  if (complete) {
    if (existingIndex === -1) {
      db.taskCompletions.push({
        taskId,
        date: dateStr,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    if (existingIndex !== -1) {
      db.taskCompletions.splice(existingIndex, 1);
    }
  }
  writeDb(db);
}

// Cleanup old completion records (older than 30 days)
function cleanupOldCompletions() {
  const db = readDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const before = db.taskCompletions.length;
  db.taskCompletions = db.taskCompletions.filter(c => {
    const completionDate = new Date(c.date);
    return completionDate >= thirtyDaysAgo;
  });
  const after = db.taskCompletions.length;

  if (before !== after) {
    writeDb(db);
    console.log(`Cleaned up ${before - after} old completion records`);
  }

  return before - after;
}

module.exports = {
  readDb,
  writeDb,
  getAllUsers,
  findUserByUsername,
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  updateUserRole,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getCompletionsForDate,
  setCompletion,
  cleanupOldCompletions
};
