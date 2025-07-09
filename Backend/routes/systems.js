// backend/routes/systems.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all systems
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tblSystem ORDER BY System');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get systems error:', error);
    res.status(500).json({ message: 'Failed to fetch systems' });
  }
});

// Get all fault locations
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tblFaultLoc ORDER BY LocaFault');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// Get all sections
router.get('/sections', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tblSections ORDER BY section_name');
    res.json(result.recordset);
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ message: 'Failed to fetch sections' });
  }
});

// Add new system (Admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('System').trim().notEmpty().withMessage('System name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { System } = req.body;

    const result = await db.query(
      'INSERT INTO tblSystem (System) VALUES (@param0); SELECT SCOPE_IDENTITY() as id;',
      [System]
    );

    res.status(201).json({
      message: 'System added successfully',
      id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Add system error:', error);
    res.status(500).json({ message: 'Failed to add system' });
  }
});

// Add new fault location (Admin only)
router.post('/locations', [
  authenticateToken,
  requireAdmin,
  body('LocaFault').trim().notEmpty().withMessage('Location name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { LocaFault } = req.body;

    const result = await db.query(
      'INSERT INTO tblFaultLoc (LocaFault) VALUES (@param0); SELECT SCOPE_IDENTITY() as id;',
      [LocaFault]
    );

    res.status(201).json({
      message: 'Location added successfully',
      id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ message: 'Failed to add location' });
  }
});

// Add new section (Admin only)
router.post('/sections', [
  authenticateToken,
  requireAdmin,
  body('section_name').trim().notEmpty().withMessage('Section name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { section_name, description } = req.body;

    const result = await db.query(
      'INSERT INTO tblSections (section_name, description) VALUES (@param0, @param1); SELECT SCOPE_IDENTITY() as id;',
      [section_name, description]
    );

    res.status(201).json({
      message: 'Section added successfully',
      id: result.recordset[0].id
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ message: 'Failed to add section' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM tblFaults'),
      db.query("SELECT COUNT(*) as open FROM tblFaults WHERE Status = 'Open'"),
      db.query("SELECT COUNT(*) as inProgress FROM tblFaults WHERE Status = 'In Progress'"),
      db.query("SELECT COUNT(*) as resolved FROM tblFaults WHERE Status = 'Resolved'"),
      db.query("SELECT COUNT(*) as closed FROM tblFaults WHERE Status = 'Closed'")
    ]);

    const result = {
      total: stats[0].recordset[0].total,
      open: stats[1].recordset[0].open,
      inProgress: stats[2].recordset[0].inProgress,
      resolved: stats[3].recordset[0].resolved,
      closed: stats[4].recordset[0].closed
    };

    res.json(result);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;