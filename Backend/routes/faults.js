const express = require('express');
const { body, validationResult, param } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Field mappings according to your table structure
const ALLOWED_UPDATE_FIELDS = [
    'SystemID',
    'Location',
    'LocFaultID',
    'DescFault',
    'ReportedBy',
    'ExtNo',
    'AssignTo',
    'Status',
    'SectionID',
    'FaultForwardID'
];

// Create new fault
router.post('/', [
    authenticateToken,
    body('SystemID').isInt().withMessage('System ID must be an integer'),
    body('Location').trim().notEmpty().withMessage('Location is required'),
    body('DescFault').trim().notEmpty().withMessage('Description is required'),
    body('ReportedBy').trim().notEmpty().withMessage('Reporter name is required'),
    body('AssignTo').trim().notEmpty().withMessage('Assignee is required'),
    body('SectionID').isInt().withMessage('Section ID must be an integer')
], async (req, res) => {
    try {
        // Check if req.body is an object and not empty
        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is empty or invalid' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            SystemID,
            Location,
            LocFaultID = null,
            DescFault,
            ReportedBy,
            ExtNo = null,
            AssignTo,
            Status = 'Open',
            SectionID,
            FaultForwardID = null
        } = req.body;

        const queryParams = {
            SystemID,
            Location,
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
                SystemID, Location, LocFaultID, DescFault,
                ReportedBy, ExtNo, DateTime, AssignTo,
                Status, SectionID, FaultForwardID
            ) VALUES (
                @SystemID, @Location, @LocFaultID, @DescFault,
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
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Get all faults
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM dbo.tblFaults');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch faults',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Update a fault
router.put('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Fault ID must be an integer'),
    body('SystemID').optional().isInt().withMessage('System ID must be an integer'),
    body('Location').optional().trim().notEmpty().withMessage('Location is required'),
    body('DescFault').optional().trim().notEmpty().withMessage('Description is required'),
    body('ReportedBy').optional().trim().notEmpty().withMessage('Reporter name is required'),
    body('AssignTo').optional().trim().notEmpty().withMessage('Assignee is required'),
    body('SectionID').optional().isInt().withMessage('Section ID must be an integer'),
    body('Status').optional().isIn(['Open', 'Closed']).withMessage('Status must be Open or Closed')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
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