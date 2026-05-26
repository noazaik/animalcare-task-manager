const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'אסימון גישה נדרש' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'אסימון לא תקף' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'נדרשת הרשאת מנהל' });
  }
  next();
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken
};
