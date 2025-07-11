const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Whitelist of allowed fields for update operations
const ALLOWED_UPDATE_FIELDS = [
  'SystemID',
  'Location',
  'LocFaultID',
  'DescFault',
  'ReportedBy',
  'ExtNo',
  'AssignTo',
  'Status',
  'SectionID'
];

// Get all faults with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 0;

    if (status) {
      whereClause += ` AND f.Status = @param${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (f.DescFault LIKE @param${paramIndex} OR f.ReportedBy LIKE @param${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    const query = `
      SELECT f.*, s.System, fl.LocaFault, sec.section_name
      FROM tblFaults f
      LEFT JOIN tblSystem s ON f.SystemID = s.id
      LEFT JOIN tblFaultLoc fl ON f.LocFaultID = fl.id
      LEFT JOIN tblSections sec ON f.SectionID = sec.id
      WHERE ${whereClause}
      ORDER BY f.DateTime DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM tblFaults f
      WHERE ${whereClause}
    `;

    const [faultsResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params)
    ]);

    const total = countResult.recordset[0].total;

    res.json({
      faults: faultsResult.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get faults error:', error);
    res.status(500).json({ message: 'Failed to fetch faults' });
  }
});

// Get fault by ID
router.get('/:fault_id', authenticateToken, async (req, res) => {
  try {
    const faultId = req.params.fault_id;
    
    const result = await db.query(`
      SELECT f.*, s.System, fl.LocaFault, sec.section_name
      FROM tblFaults f
      LEFT JOIN tblSystem s ON f.SystemID = s.id
      LEFT JOIN tblFaultLoc fl ON f.LocFaultID = fl.id
      LEFT JOIN tblSections sec ON f.SectionID = sec.id
      WHERE f.id = @param0
    `, [faultId]);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Fault not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Get fault error:', error);
    res.status(500).json({ message: 'Failed to fetch fault' });
  }
});

// Create new fault
router.post('/', [
  authenticateToken,
  body('SystemID').isInt().withMessage('System ID is required'),
  body('Location').trim().notEmpty().withMessage('Location is required'),
  body('DescFault').trim().notEmpty().withMessage('Description is required'),
  body('ReportedBy').trim().notEmpty().withMessage('Reporter name is required'),
  body('ExtNo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      SystemID,
      Location,
      LocFaultID,
      DescFault,
      ReportedBy,
      ExtNo,
      AssignTo,
      SectionID
    } = req.body;

    const result = await db.query(`
      INSERT INTO tblFaults (
        SystemID, Location, LocFaultID, DescFault, 
        ReportedBy, ExtNo, DateTime, AssignTo, Status, SectionID
      ) VALUES (
        @param0, @param1, @param2, @param3, 
        @param4, @param5, GETDATE(), @param6, 'Open', @param7
      );
      SELECT SCOPE_IDENTITY() as id;
    `, [SystemID, Location, LocFaultID, DescFault, ReportedBy, ExtNo, AssignTo, SectionID]);

    res.status(201).json({
      message: 'Fault created successfully',
      faultId: result.recordset[0].id
    });
  } catch (error) {
    console.error('Create fault error:', error);
    res.status(500).json({ message: 'Failed to create fault' });
  }
});

// Update fault
router.put('/:fault_id', [
  authenticateToken,
  body('Status').optional().isIn(['Open', 'In Progress', 'Resolved', 'Closed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const faultId = req.params.fault_id;
    const updates = req.body;

    // Build safe update query
    const updateFields = [];
    const params = [];
    let paramIndex = 0;

    Object.keys(updates).forEach(key => {
      if (ALLOWED_UPDATE_FIELDS.includes(key) && updates[key] !== undefined) {
        updateFields.push(`${key} = @param${paramIndex}`);
        params.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const query = `
      UPDATE tblFaults 
      SET ${updateFields.join(', ')}, updated_at = GETDATE()
      WHERE id = @param${paramIndex}
    `;
    params.push(faultId);

    await db.query(query, params);

    res.json({ message: 'Fault updated successfully' });
  } catch (error) {
    console.error('Update fault error:', error);
    res.status(500).json({ message: 'Failed to update fault' });
  }
});

// Delete fault (Admin only)
router.delete('/:fault_id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const faultId = req.params.fault_id;

    const result = await db.query(
      'DELETE FROM tblFaults WHERE id = @param0',
      [faultId]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Fault not found' });
    }

    res.json({ message: 'Fault deleted successfully' });
  } catch (error) {
    console.error('Delete fault error:', error);
    res.status(500).json({ message: 'Failed to delete fault' });
  }
});

module.exports = router;