const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Helper: Get tasks for a specific date and shift based on recurrence rules
function getTasksForDate(date, shift) {
  const allTasks = db.getAllTasks();
  const completions = db.getCompletionsForDate(date);
  const completionSet = new Set(completions.map(c => c.taskId));

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  const tasksForDate = allTasks.filter(task => {
    // Filter by shift if specified
    if (shift && task.shift !== shift) {
      return false;
    }

    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    switch (task.recurrence) {
      case 'NONE':
        return taskDate.getTime() === startOfDay.getTime();

      case 'DAILY':
        return taskDate.getTime() <= startOfDay.getTime();

      case 'WEEKLY':
        return taskDate.getTime() <= startOfDay.getTime() &&
               taskDate.getDay() === dayOfWeek;

      case 'MONTHLY':
        return taskDate.getTime() <= startOfDay.getTime() &&
               taskDate.getDate() === dayOfMonth;

      default:
        return false;
    }
  });

  return tasksForDate.map(task => ({
    ...task,
    isCompleteForDate: task.recurrence === 'NONE'
      ? task.isComplete
      : completionSet.has(task.id)
  }));
}

// GET /api/tasks - Get tasks for a specific date and shift
router.get('/', (req, res) => {
  const dateParam = req.query.date;
  const shift = req.query.shift; // MORNING or EVENING
  const date = dateParam ? new Date(dateParam) : new Date();

  try {
    const tasks = getTasksForDate(date, shift);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'שגיאה בטעינת משימות' });
  }
});

// POST /api/tasks - Create a new task (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { title, description, dueDate, startTime, endTime, recurrence, shift } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'כותרת נדרשת' });
  }

  try {
    const task = db.createTask({
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      startTime: startTime || '06:00',
      endTime: endTime || '14:00',
      recurrence: recurrence || 'NONE',
      shift: shift || 'MORNING'
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'שגיאה ביצירת משימה' });
  }
});

// PUT /api/tasks/reorder - Reorder tasks (admin only) - Must be before /:id
router.put('/reorder', requireAdmin, (req, res) => {
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: 'רשימת משימות נדרשת' });
  }

  try {
    db.reorderTasks(taskIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'שגיאה בסידור משימות' });
  }
});

// PUT /api/tasks/:id - Update a task (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, description, dueDate, startTime, endTime, recurrence, shift } = req.body;

  try {
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate) updates.dueDate = new Date(dueDate).toISOString();
    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (recurrence) updates.recurrence = recurrence;
    if (shift) updates.shift = shift;

    const task = db.updateTask(taskId, updates);
    if (!task) {
      return res.status(404).json({ error: 'משימה לא נמצאה' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'שגיאה בעדכון משימה' });
  }
});

// DELETE /api/tasks/:id - Delete a task (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const deleted = db.deleteTask(taskId);
    if (!deleted) {
      return res.status(404).json({ error: 'משימה לא נמצאה' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'שגיאה במחיקת משימה' });
  }
});

// PATCH /api/tasks/:id/complete - Toggle task completion (all users)
router.patch('/:id/complete', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { complete, date } = req.body;
  const targetDate = date ? new Date(date) : new Date();

  try {
    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'משימה לא נמצאה' });
    }

    if (task.recurrence === 'NONE') {
      db.updateTask(taskId, { isComplete: complete });
    } else {
      db.setCompletion(taskId, targetDate, complete);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling completion:', error);
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס משימה' });
  }
});

module.exports = router;
