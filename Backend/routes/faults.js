const express = require('express');
const { body, validationResult, param } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Field mappings according to your table structure
const ALLOWED_UPDATE_FIELDS = [
    'SystemID',
    'Location',
    'LocationOfFault',
    'LocFaultID',
    'DescFault',
    'ReportedBy',
    'ExtNo',
    'AssignTo',
    'Status',
    'SectionID',
    'FaultForwardID'
];

// Allowed values for SystemID
const VALID_SYSTEM_IDS = [
    'NETWORK',
    'PBX',
    'CCTV',
    'IP-PABX',
    'FIDS',
    'VDGS',
    'IT',
    'FIRE',
    'CLOCK',
    'EGB',
    'ERP'
];

// Allowed values for LocationOfFault
const VALID_FAULT_LOCATIONS = [
    'Admin-IT',
    'Terminal-A',
    'Terminal-B',
    'Cargo Building',
    'Terminal Car Park',
    'Pier Building'
];

// Create new fault
router.post('/', [
    authenticateToken,
    body('SystemID').isIn(VALID_SYSTEM_IDS).withMessage('Invalid System ID'),
    body('Location').trim().notEmpty().withMessage('Location is required'),
    body('LocationOfFault').optional().isIn(VALID_FAULT_LOCATIONS).withMessage('Invalid fault location'),
    body('DescFault').trim().notEmpty().withMessage('Description is required'),
    body('ReportedBy').trim().notEmpty().withMessage('Reporter name is required'),
    body('AssignTo').trim().notEmpty().withMessage('Assignee is required'),
    body('SectionID').optional().isInt({ allow_null: true }).withMessage('Section ID must be an integer if provided').toInt() // Explicitly allow null
], async (req, res) => {
    try {
        // Check if req.body is an object and not empty
        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is empty or invalid' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const {
            SystemID,
            Location,
            LocationOfFault = null,
            LocFaultID = null,
            DescFault,
            ReportedBy,
            ExtNo = null,
            AssignTo,
            Status = 'Open',
            SectionID = null,
            FaultForwardID = null
        } = req.body;

        console.log('Received data:', req.body); // Debug log

        const queryParams = {
            SystemID,
            Location,
            LocationOfFault,
            LocFaultID,
            DescFault,
            ReportedBy,
            ExtNo,
            AssignTo,
            Status,
            SectionID,
            FaultForwardID
        };

        const result = await db.query(`
            INSERT INTO dbo.tblFaults (
                SystemID, Location, LocationOfFault, LocFaultID, DescFault,
                ReportedBy, ExtNo, DateTime, AssignTo,
                Status, SectionID, FaultForwardID
            ) VALUES (
                @SystemID, @Location, @LocationOfFault, @LocFaultID, @DescFault,
                @ReportedBy, @ExtNo, GETDATE(), @AssignTo,
                @Status, @SectionID, @FaultForwardID
            );
            SELECT SCOPE_IDENTITY() AS id;
        `, queryParams);

        const newFault = await db.query(`
            SELECT * FROM dbo.tblFaults WHERE id = @id
        `, { id: result.recordset[0].id });

        res.status(201).json({
            message: 'Fault created successfully',
            fault: newFault.recordset[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to create fault',
            error: process.env.NODE_ENV === 'development' ? error.message : null,
            details: process.env.NODE_ENV === 'development' ? error.stack : null
        });
    }
});


// Show faults conditionally based on assigned technician
router.get('/', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;

        // List of specific technicians to restrict
        const technicians = [
            'John Doe',
            'Jane Smith',
            'Alex Johnson',
            'Emily Davis'
        ];

        let result;

        if (technicians.includes(username)) {
            // If logged-in user is a technician, show only their assigned faults
            result = await db.query(`
                SELECT * 
                FROM dbo.tblFaults
                WHERE AssignTo = @username
            `, { username });
        } else {
            // For others (admin, manager, etc.), show all faults
            result = await db.query(`
                SELECT * 
                FROM dbo.tblFaults
            `);
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch faults',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});


// Update a fault (with enhanced validation error handling)
router.put('/:id', [
  authenticateToken,
  param('id').isInt().withMessage('Fault ID must be an integer'),
  body('SystemID').optional().isIn(VALID_SYSTEM_IDS).withMessage('Invalid System ID'),
  body('Location').optional().trim().notEmpty().withMessage('Location is required'),
  body('LocationOfFault').optional().isIn(VALID_FAULT_LOCATIONS).withMessage('Invalid fault location'),
  body('DescFault').optional().trim().notEmpty().withMessage('Description is required'),
  body('ReportedBy').optional().trim().notEmpty().withMessage('Reporter name is required'),
  body('AssignTo').optional().trim().notEmpty().withMessage('Assignee is required'),
  body('SectionID').optional().custom(value => {
    if (value === null) return true; // allow null explicitly
    if (typeof value === 'number') return Number.isInteger(value);
    if (typeof value === 'string' && value.trim() === '') return true; // treat empty string as null
    throw new Error('Section ID must be an integer or null if provided');
  }),
  // Updated status validation to include all statuses used in frontend
  body('Status').optional().isIn(['Open', 'In Progress', 'Pending', 'Closed']).withMessage('Invalid status value')
], async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Log detailed error with body for debugging
      console.error('Validation failed on update:', errors.array());
      console.error('Request Body:', req.body);

      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        receivedBody: req.body  // Optional, remove in prod for security
      });
    }

    const faultId = req.params.id;
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    // Treat empty string SectionID as null before SQL update
    if (updates.SectionID === '') {
      updates.SectionID = null;
    }

    const query = `
      UPDATE dbo.tblFaults
      SET ${Object.keys(updates).map(field => `${field} = @${field}`).join(', ')},
          DateTime = GETDATE()
      WHERE id = @id;
      SELECT * FROM dbo.tblFaults WHERE id = @id;
    `;
    const queryParams = { id: faultId, ...updates };

    const result = await db.query(query, queryParams);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Fault not found' });
    }

    res.status(200).json({
      message: 'Fault updated successfully',
      fault: result.recordset[0]
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      message: 'Failed to update fault',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});



// Delete a fault
router.delete('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Fault ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const faultId = req.params.id;

        const result = await db.query(`
            DELETE FROM dbo.tblFaults WHERE id = @id;
            SELECT @@ROWCOUNT AS affectedRows;
        `, { id: faultId });

        if (result.recordset[0].affectedRows === 0) {
            return res.status(404).json({ message: 'Fault not found' });
        }

        res.status(200).json({ message: 'Fault deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to delete fault',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

module.exports = router;