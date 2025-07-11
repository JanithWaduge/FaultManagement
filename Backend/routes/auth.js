// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

const router = express.Router();

// Input validation middleware
const validate = validations => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// Register route
router.post('/register', authLimiter, validate([
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be user or admin')
]), async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM tblUsers WHERE username = @param0 OR email = @param1',
      [username, email]
    );

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.query(
      `INSERT INTO tblUsers 
       (username, email, password_hash, role) 
       OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.role
       VALUES (@param0, @param1, @param2, @param3)`,
      [username, email, hashedPassword, role]
    );

    const newUser = result.recordset[0];
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Login route
router.post('/login', authLimiter, validate([
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
]), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const result = await db.query(
      `SELECT id, username, email, password_hash, role, is_active 
       FROM tblUsers 
       WHERE username = @param0`,
      [username]
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    const user = result.recordset[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Account is disabled. Please contact support.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role FROM tblUsers WHERE id = @param0',
      [req.user.userId]
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      user: result.recordset[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const result = await db.query(
      'SELECT id, username, role FROM tblUsers WHERE id = @param0',
      [decoded.userId]
    );

    if (result.recordset.length === 0) {
      return res.sendStatus(403);
    }

    const user = result.recordset[0];
    const newToken = generateToken(user);

    res.json({
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.sendStatus(403);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ 
    message: 'Logout successful' 
  });
});

// Token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

module.exports = router;