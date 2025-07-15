const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const router = express.Router();
const database = require('../config/database');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'default-secret-please-change-in-production';
const saltRounds = 10;

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set in environment variables. Using default secret.');
}

// Input validation middleware
const validateRegisterInput = (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (password.length < 6 || password.length > 100) {
    return res.status(400).json({ message: 'Password must be between 6 and 100 characters.' });
  }

  if (username.length > 50) {
    return res.status(400).json({ message: 'Username must be 50 characters or less.' });
  }

  if (!['admin', 'user', 'technician'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  next();
};

// REGISTER USER
router.post('/register', validateRegisterInput, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const pool = await database.getPool();

    // Check for existing user
    const checkResult = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT username, email FROM tblUsers 
        WHERE username = @username OR email = @email
      `);

    if (checkResult.recordset.length > 0) {
      const existing = checkResult.recordset[0];
      return res.status(409).json({
        message: existing.username === username 
          ? 'Username already exists.' 
          : 'Email already exists.'
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const now = new Date();

    await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.NVarChar(255), hashedPassword)
      .input('role', sql.NVarChar(20), role)
      .input('is_active', sql.Bit, true)
      .input('created_at', sql.DateTime, now)
      .input('updated_at', sql.DateTime, now)
      .query(`
        INSERT INTO tblUsers 
        (username, email, password_hash, role, is_active, created_at, updated_at)
        VALUES (@username, @email, @password_hash, @role, @is_active, @created_at, @updated_at)
      `);

    res.status(201).json({ 
      message: 'User registered successfully.',
      user: { username, email, role }
    });

  } catch (error) {
    console.error('Register Error:', error);
    
    if (error.number === 2627) { // Unique constraint violation
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    
    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({ message: 'Input exceeds maximum length.' });
    }

    const pool = await database.getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query(`
        SELECT id, username, email, password_hash, role, is_active
        FROM tblUsers WHERE username = @username
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Account inactive. Please contact support.',
        is_active: false
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      { expiresIn }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const pool = await database.getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query(`
        SELECT id, username, email, role, created_at 
        FROM tblUsers 
        WHERE id = @id AND is_active = 1
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: 'User not found or inactive.' });
    }

    req.user = result.recordset[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'Authentication failed.' });
  }
};

// GET USER PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ 
      message: 'Failed to get profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;