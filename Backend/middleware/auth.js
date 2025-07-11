// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Check token validity in database (optional for immediate invalidation)
    const tokenCheck = await db.query(
      'SELECT 1 FROM InvalidatedTokens WHERE token = @param0',
      [token]
    );
    
    if (tokenCheck.recordset.length > 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been invalidated',
        code: 'INVALIDATED_TOKEN'
      });
    }

    // 4. Get user from database
    const result = await db.query(
      `SELECT id, username, email, role, is_active 
       FROM tblUsers 
       WHERE id = @param0`,
      [decoded.userId]
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.recordset[0];
    
    // 5. Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 6. Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    // 7. Handle specific JWT errors
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Malformed token';
      code = 'MALFORMED_TOKEN';
    }

    return res.status(403).json({
      error: 'Forbidden',
      message,
      code
    });
  }
};

const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

module.exports = { 
  authenticateToken,
  requireAdmin: requireRoles('admin'), // Backwards compatibility
  requireRoles
};