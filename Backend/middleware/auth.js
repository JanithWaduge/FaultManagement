// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const database = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Optional: Verify user still exists and is active
        const pool = await database.getPool();
        const request = pool.request();
        request.input('id', sql.Int, decoded.id);
        
        const result = await request.query(`
            SELECT id, username, role, is_active 
            FROM tblUsers 
            WHERE id = @id AND is_active = 1
        `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        return res.status(500).json({ message: 'Authentication failed' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};