const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// Simple JWT decode (without verification - for development)
function decodeGoogleToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (e) {
    return null;
  }
}

// Login with email and password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });
  }

  try {
    const user = db.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'משתמש זה נרשם עם Google. אנא התחבר עם Google.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// Sign up with email, password, and full name
router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'כל השדות נדרשים' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 6 תווים' });
  }

  try {
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'אימייל זה כבר קיים במערכת' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role: 'USER'
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// Google OAuth login/signup
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential נדרש' });
  }

  try {
    const payload = decodeGoogleToken(credential);

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'אימות Google נכשל' });
    }

    const { sub: googleId, email, name } = payload;

    let user = db.findUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists with same email
      user = db.findUserByEmail(email);
      if (!user) {
        // Create new user
        user = db.createUser({
          email: email.toLowerCase(),
          fullName: name,
          googleId,
          role: 'USER'
        });
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'אימות Google נכשל' });
  }
});

module.exports = router;
