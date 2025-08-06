const express = require('express');
const multer = require('multer');
const sql = require('mssql');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const database = require('../config/database'); // Import Database instance
const { authenticateToken } = require('../middleware/auth');

// Configure multer for uploads directory
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads'); // Use absolute path
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Store file with unique name
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CREATE: Upload a photo for a fault
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
    let pool;
    try {
        const { faultId } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No photo uploaded.' });
        if (!faultId) return res.status(400).json({ error: 'FaultId is required.' });

        // Store relative path
        const relativePath = `uploads/${file.filename}`;
        const uploadedAt = new Date();
        const uploadedBy = req.user ? req.user.username : 'Unknown';

        pool = await database.getPool();
        const request = pool.request();
        request.input('FaultId', sql.Int, parseInt(faultId));
        request.input('PhotoPath', sql.NVarChar(500), relativePath); // Store relative path
        request.input('UploadedAt', sql.DateTime2, uploadedAt);
        request.input('UploadedBy', sql.NVarChar(255), uploadedBy);

        await request.query(`
            INSERT INTO dbo.tblPhotos
            (FaultId, PhotoPath, UploadedAt, UploadedBy)
            VALUES (@FaultId, @PhotoPath, @UploadedAt, @UploadedBy)
        `);

        res.status(201).json({ message: 'Photo uploaded successfully.', photoPath: relativePath });
    } catch (err) {
        console.error('Error uploading photo:', err);
        res.status(500).json({ error: 'Failed to upload photo', details: err.message });
    }
});

// READ: Get photos by faultId
router.get('/fault/:faultId', authenticateToken, async (req, res) => {
    let pool;
    try {
        const { faultId } = req.params;

        if (!faultId || isNaN(parseInt(faultId))) {
            return res.status(400).json({ error: 'Invalid fault ID.' });
        }

        pool = await database.getPool();
        const request = pool.request();
        request.input('FaultId', sql.Int, parseInt(faultId));

        const result = await request.query(`
            SELECT PhotoId, FaultId, PhotoPath, UploadedAt, UploadedBy
            FROM dbo.tblPhotos 
            WHERE FaultId = @FaultId
            ORDER BY UploadedAt
        `);

        console.log(`Found ${result.recordset.length} photos for fault ${faultId}`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching photos:', err);
        res.status(500).json({ error: 'Failed to fetch photos', details: err.message });
    }
});

// READ: Get a photo's details by photoId
router.get('/:photoId', authenticateToken, async (req, res) => {
    let pool;
    try {
        const { photoId } = req.params;

        if (!photoId || isNaN(parseInt(photoId))) {
            return res.status(400).json({ error: 'Invalid photo ID.' });
        }

        pool = await database.getPool();
        const request = pool.request();
        request.input('PhotoId', sql.Int, parseInt(photoId));

        const result = await request.query(`
            SELECT PhotoId, FaultId, PhotoPath, UploadedAt, UploadedBy
            FROM dbo.tblPhotos 
            WHERE PhotoId = @PhotoId
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Photo not found.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching photo:', err);
        res.status(500).json({ error: 'Failed to fetch photo', details: err.message });
    }
});

// DELETE: Remove photo (DB & file)
router.delete('/:photoId', authenticateToken, async (req, res) => {
    let pool;
    try {
        const { photoId } = req.params;

        if (!photoId || isNaN(parseInt(photoId))) {
            return res.status(400).json({ error: 'Invalid photo ID.' });
        }

        pool = await database.getPool();
        const request = pool.request();
        request.input('PhotoId', sql.Int, parseInt(photoId));

        // First get photo info
        const photoResult = await request.query(`
            SELECT PhotoId, FaultId, PhotoPath, UploadedAt, UploadedBy
            FROM dbo.tblPhotos 
            WHERE PhotoId = @PhotoId
        `);

        if (photoResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Photo not found.' });
        }

        const photo = photoResult.recordset[0];
        const filePath = path.join(__dirname, '../uploads', photo.PhotoPath.replace('uploads/', ''));

        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
                else console.log('File deleted:', filePath);
            });
        } else {
            console.warn('File not found for deletion:', filePath);
        }

        // Delete record
        await request.query(`
            DELETE FROM dbo.tblPhotos 
            WHERE PhotoId = @PhotoId
        `);

        res.json({ message: 'Photo deleted successfully.' });
    } catch (err) {
        console.error('Error deleting photo:', err);
        res.status(500).json({ error: 'Failed to delete photo', details: err.message });
    }
});

// Test route
router.get('/test/:faultId', async (req, res) => {
    try {
        const { faultId } = req.params;
        console.log('Testing photo fetch for fault:', faultId);

        const pool = await database.getPool();
        console.log('Database connected successfully');

        const request = pool.request();
        request.input('FaultId', sql.Int, parseInt(faultId));

        const result = await request.query(`
            SELECT COUNT(*) as PhotoCount 
            FROM dbo.tblPhotos 
            WHERE FaultId = @FaultId
        `);

        res.json({
            message: 'Test successful',
            faultId: faultId,
            photoCount: result.recordset[0].PhotoCount
        });
    } catch (err) {
        console.error('Test error:', err);
        res.status(500).json({ error: 'Test failed', details: err.message, stack: err.stack });
    }
});

module.exports = router;