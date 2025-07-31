const express = require('express');
const { body, validationResult, param } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notes for a specific fault
router.get('/:faultId', [
    authenticateToken,
    param('faultId').isInt().withMessage('Fault ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const faultId = req.params.faultId;

        // First check if the fault exists
        const faultCheck = await db.query(`
            SELECT id FROM dbo.tblFaults WHERE id = @faultId
        `, { faultId });

        if (faultCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Fault not found' });
        }

        // Get all notes for this fault, ordered by newest first
        const result = await db.query(`
            SELECT 
                id,
                UserID,
                date,
                FaultID,
                Notes
            FROM dbo.tblNotes 
            WHERE FaultID = @faultId 
            ORDER BY date DESC
        `, { faultId });

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notes',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Create a new note for a fault
router.post('/', [
    authenticateToken,
    body('FaultID').isInt().withMessage('Fault ID is required and must be an integer'),
    body('Notes').trim().notEmpty().withMessage('Notes content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { FaultID, Notes } = req.body;
        const UserID = req.user.id || req.user.userId; // Get user ID from JWT token

        // First check if the fault exists
        const faultCheck = await db.query(`
            SELECT id FROM dbo.tblFaults WHERE id = @FaultID
        `, { FaultID });

        if (faultCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Fault not found' });
        }

        // Insert the new note
        const result = await db.query(`
            INSERT INTO dbo.tblNotes (UserID, date, FaultID, Notes)
            VALUES (@UserID, GETDATE(), @FaultID, @Notes);
            SELECT SCOPE_IDENTITY() AS id;
        `, { UserID, FaultID, Notes });

        // Get the newly created note with all details
        const newNote = await db.query(`
            SELECT 
                id,
                UserID,
                date,
                FaultID,
                Notes
            FROM dbo.tblNotes 
            WHERE id = @id
        `, { id: result.recordset[0].id });

        res.status(201).json({
            message: 'Note created successfully',
            note: newNote.recordset[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to create note',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Update an existing note
router.put('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Note ID must be an integer'),
    body('Notes').trim().notEmpty().withMessage('Notes content is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const noteId = req.params.id;
        const { Notes } = req.body;
        const UserID = req.user.id || req.user.userId;

        // Check if note exists and belongs to the user (optional security check)
        const existingNote = await db.query(`
            SELECT id, UserID FROM dbo.tblNotes WHERE id = @noteId
        `, { noteId });

        if (existingNote.recordset.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Update the note
        const result = await db.query(`
            UPDATE dbo.tblNotes 
            SET Notes = @Notes, date = GETDATE()
            WHERE id = @noteId;
            
            SELECT 
                id,
                UserID,
                date,
                FaultID,
                Notes
            FROM dbo.tblNotes 
            WHERE id = @noteId;
        `, { Notes, noteId });

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({
            message: 'Note updated successfully',
            note: result.recordset[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to update note',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// Delete a note
router.delete('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Note ID must be an integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const noteId = req.params.id;
        const UserID = req.user.id || req.user.userId;

        // Check if note exists
        const existingNote = await db.query(`
            SELECT id, UserID FROM dbo.tblNotes WHERE id = @noteId
        `, { noteId });

        if (existingNote.recordset.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Delete the note
        const result = await db.query(`
            DELETE FROM dbo.tblNotes WHERE id = @noteId;
            SELECT @@ROWCOUNT AS affectedRows;
        `, { noteId });

        if (result.recordset[0].affectedRows === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: 'Failed to delete note',
            error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

module.exports = router;