const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DB_PATH = path.join(__dirname, '..', 'data.json');
const DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL connection pool
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Initialize PostgreSQL tables
async function initializePostgres() {
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        full_name VARCHAR(255),
        google_id VARCHAR(255),
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        start_time VARCHAR(10) DEFAULT '06:00',
        end_time VARCHAR(10) DEFAULT '14:00',
        recurrence VARCHAR(50) DEFAULT 'NONE',
        shift VARCHAR(50) DEFAULT 'MORNING',
        sort_order INTEGER DEFAULT 0,
        is_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS task_completions (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invited_emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed admin user if no users exist
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)',
        ['admin@example.com', adminPassword, 'מנהל מערכת', 'ADMIN']
      );
      console.log('Created default admin user: admin@example.com / admin123');
    }

    console.log('PostgreSQL tables initialized');
  } finally {
    client.release();
  }
}

// JSON file fallback functions
const defaultData = {
  users: [],
  tasks: [],
  taskCompletions: [],
  invitedEmails: [],
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
async function getAllUsers() {
  if (pool) {
    const result = await pool.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY id');
    return result.rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    }));
  }
  const db = readDb();
  return db.users.map(u => ({
    id: u.id,
    fullName: u.fullName || u.username,
    email: u.email || null,
    role: u.role,
    createdAt: u.createdAt
  }));
}

async function findUserByUsername(username) {
  const db = readDb();
  return db.users.find(u => u.username === username);
}

async function findUserByEmail(email) {
  if (pool) {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      fullName: row.full_name,
      googleId: row.google_id,
      role: row.role,
      createdAt: row.created_at
    };
  }
  const db = readDb();
  return db.users.find(u => u.email === email.toLowerCase());
}

async function findUserByGoogleId(googleId) {
  if (pool) {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      googleId: row.google_id,
      role: row.role
    };
  }
  const db = readDb();
  return db.users.find(u => u.googleId === googleId);
}

async function createUser(user) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, google_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.email, user.password || null, user.fullName, user.googleId || null, user.role || 'USER']
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at
    };
  }
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

async function updateUserRole(userId, role) {
  if (pool) {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role
    };
  }
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.role = role;
  writeDb(db);
  return user;
}

// Task operations
async function getAllTasks() {
  if (pool) {
    const result = await pool.query('SELECT * FROM tasks ORDER BY sort_order');
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      startTime: row.start_time,
      endTime: row.end_time,
      recurrence: row.recurrence,
      shift: row.shift,
      sortOrder: row.sort_order,
      isComplete: row.is_complete,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
  const db = readDb();
  return db.tasks.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getTaskById(id) {
  if (pool) {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      startTime: row.start_time,
      endTime: row.end_time,
      recurrence: row.recurrence,
      shift: row.shift,
      sortOrder: row.sort_order,
      isComplete: row.is_complete
    };
  }
  const db = readDb();
  return db.tasks.find(t => t.id === id);
}

async function createTask(task) {
  if (pool) {
    const sortResult = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM tasks');
    const nextOrder = sortResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, due_date, start_time, end_time, recurrence, shift, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [task.title, task.description, task.dueDate, task.startTime, task.endTime, task.recurrence, task.shift, nextOrder]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      startTime: row.start_time,
      endTime: row.end_time,
      recurrence: row.recurrence,
      shift: row.shift,
      sortOrder: row.sort_order,
      isComplete: row.is_complete
    };
  }
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

async function updateTask(id, updates) {
  if (pool) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.title !== undefined) { fields.push(`title = $${paramIndex++}`); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(updates.description); }
    if (updates.dueDate !== undefined) { fields.push(`due_date = $${paramIndex++}`); values.push(updates.dueDate); }
    if (updates.startTime !== undefined) { fields.push(`start_time = $${paramIndex++}`); values.push(updates.startTime); }
    if (updates.endTime !== undefined) { fields.push(`end_time = $${paramIndex++}`); values.push(updates.endTime); }
    if (updates.recurrence !== undefined) { fields.push(`recurrence = $${paramIndex++}`); values.push(updates.recurrence); }
    if (updates.shift !== undefined) { fields.push(`shift = $${paramIndex++}`); values.push(updates.shift); }
    if (updates.isComplete !== undefined) { fields.push(`is_complete = $${paramIndex++}`); values.push(updates.isComplete); }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      startTime: row.start_time,
      endTime: row.end_time,
      recurrence: row.recurrence,
      shift: row.shift,
      isComplete: row.is_complete
    };
  }
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

async function deleteTask(id) {
  if (pool) {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
  const db = readDb();
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) return false;

  db.tasks.splice(index, 1);
  db.taskCompletions = db.taskCompletions.filter(c => c.taskId !== id);
  writeDb(db);
  return true;
}

async function reorderTasks(taskIds) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < taskIds.length; i++) {
        await client.query('UPDATE tasks SET sort_order = $1 WHERE id = $2', [i, taskIds[i]]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return;
  }
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
async function getCompletionsForDate(date) {
  if (pool) {
    const dateStr = date.toISOString().split('T')[0];
    const result = await pool.query('SELECT task_id FROM task_completions WHERE date = $1', [dateStr]);
    return result.rows.map(row => ({ taskId: row.task_id }));
  }
  const db = readDb();
  const dateStr = date.toISOString().split('T')[0];
  return db.taskCompletions.filter(c => c.date.split('T')[0] === dateStr);
}

async function setCompletion(taskId, date, complete) {
  if (pool) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    if (complete) {
      await pool.query(
        'INSERT INTO task_completions (task_id, date) VALUES ($1, $2) ON CONFLICT (task_id, date) DO NOTHING',
        [taskId, dateStr]
      );
    } else {
      await pool.query('DELETE FROM task_completions WHERE task_id = $1 AND date = $2', [taskId, dateStr]);
    }
    return;
  }
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

async function cleanupOldCompletions() {
  if (pool) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await pool.query('DELETE FROM task_completions WHERE date < $1', [thirtyDaysAgo.toISOString().split('T')[0]]);
    if (result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} old completion records`);
    }
    return result.rowCount;
  }
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

// Invited emails operations
async function getInvitedEmails() {
  if (pool) {
    const result = await pool.query('SELECT id, email, created_at FROM invited_emails ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at
    }));
  }
  const db = readDb();
  return db.invitedEmails || [];
}

async function isEmailInvited(email) {
  if (pool) {
    const result = await pool.query('SELECT id FROM invited_emails WHERE LOWER(email) = LOWER($1)', [email]);
    return result.rows.length > 0;
  }
  const db = readDb();
  return (db.invitedEmails || []).some(inv => inv.email.toLowerCase() === email.toLowerCase());
}

async function addInvitedEmail(email) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO invited_emails (email) VALUES (LOWER($1)) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email]
    );
    if (result.rows.length === 0) {
      // Email already exists
      const existing = await pool.query('SELECT * FROM invited_emails WHERE LOWER(email) = LOWER($1)', [email]);
      return { id: existing.rows[0].id, email: existing.rows[0].email, createdAt: existing.rows[0].created_at };
    }
    return { id: result.rows[0].id, email: result.rows[0].email, createdAt: result.rows[0].created_at };
  }
  const db = readDb();
  if (!db.invitedEmails) db.invitedEmails = [];

  const existing = db.invitedEmails.find(inv => inv.email.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const newInvite = {
    id: Date.now(),
    email: email.toLowerCase(),
    createdAt: new Date().toISOString()
  };
  db.invitedEmails.push(newInvite);
  writeDb(db);
  return newInvite;
}

async function removeInvitedEmail(id) {
  if (pool) {
    const result = await pool.query('DELETE FROM invited_emails WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
  const db = readDb();
  if (!db.invitedEmails) return false;

  const index = db.invitedEmails.findIndex(inv => inv.id === id);
  if (index === -1) return false;

  db.invitedEmails.splice(index, 1);
  writeDb(db);
  return true;
}

// Initialize database on startup
if (pool) {
  initializePostgres().catch(err => console.error('Failed to initialize PostgreSQL:', err));
}

module.exports = {
  pool,
  initializePostgres,
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
  cleanupOldCompletions,
  getInvitedEmails,
  isEmailInvited,
  addInvitedEmail,
  removeInvitedEmail
};
