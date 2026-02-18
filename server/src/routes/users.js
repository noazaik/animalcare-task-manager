const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/users - Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'שגיאה בטעינת משתמשים' });
  }
});

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  if (!role || !['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'תפקיד לא תקין' });
  }

  // Prevent admin from demoting themselves
  if (userId === req.user.userId && role !== 'ADMIN') {
    return res.status(400).json({ error: 'לא ניתן להסיר הרשאות מנהל מעצמך' });
  }

  try {
    const user = await db.updateUserRole(userId, role);
    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'שגיאה בעדכון תפקיד משתמש' });
  }
});

// GET /api/users/invites - Get all invited emails (admin only)
router.get('/invites', requireAdmin, async (req, res) => {
  try {
    const invites = await db.getInvitedEmails();
    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'שגיאה בטעינת הזמנות' });
  }
});

// POST /api/users/invites - Add invited email (admin only)
router.post('/invites', requireAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'אימייל נדרש' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'כתובת אימייל לא תקינה' });
  }

  try {
    const invite = await db.addInvitedEmail(email);
    res.status(201).json(invite);
  } catch (error) {
    console.error('Error adding invite:', error);
    res.status(500).json({ error: 'שגיאה בהוספת הזמנה' });
  }
});

// DELETE /api/users/invites/:id - Remove invited email (admin only)
router.delete('/invites/:id', requireAdmin, async (req, res) => {
  const inviteId = parseInt(req.params.id);

  try {
    const deleted = await db.removeInvitedEmail(inviteId);
    if (!deleted) {
      return res.status(404).json({ error: 'הזמנה לא נמצאה' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error removing invite:', error);
    res.status(500).json({ error: 'שגיאה במחיקת הזמנה' });
  }
});

module.exports = router;
