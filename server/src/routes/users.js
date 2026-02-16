const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/users - Get all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'שגיאה בטעינת משתמשים' });
  }
});

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', requireAdmin, (req, res) => {
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
    const user = db.updateUserRole(userId, role);
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

module.exports = router;
