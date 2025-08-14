const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcrypt");
const { authenticateToken } = require("../middleware/auth");

// Database connection
const dbConfig = require("../config/database");

// GET /api/technicians/stats - Get technician statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    // Get technician count and activity stats
    const statsQuery = `
      SELECT 
        COUNT(*) as totalTechnicians,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeTechnicians,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactiveTechnicians,
        COUNT(CASE WHEN created_at >= DATEADD(DAY, -7, GETDATE()) THEN 1 END) as newThisWeek
      FROM dbo.tblUsers 
      WHERE role = 'technician'
    `;

    const result = await pool.request().query(statsQuery);
    const stats = result.recordset[0];

    res.json({
      success: true,
      stats: {
        total: stats.totalTechnicians,
        active: stats.activeTechnicians,
        inactive: stats.inactiveTechnicians,
        newThisWeek: stats.newThisWeek,
      },
    });
  } catch (error) {
    console.error("Error fetching technician stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch technician statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// GET /api/technicians - Get all technicians
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        is_active, 
        created_at, 
        updated_at 
      FROM dbo.tblUsers 
      WHERE role = 'technician' 
      ORDER BY username ASC
    `);

    res.json({
      success: true,
      technicians: result.recordset,
      totalCount: result.recordset.length,
    });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch technicians",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// GET /api/technicians/:id - Get specific technician
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("id", sql.Int, id).query(`
        SELECT 
          id, 
          username, 
          email, 
          role, 
          is_active, 
          created_at, 
          updated_at 
        FROM dbo.tblUsers 
        WHERE id = @id AND role = 'technician'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    res.json({
      success: true,
      technician: result.recordset[0],
    });
  } catch (error) {
    console.error("Error fetching technician:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch technician",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// POST /api/technicians - Create new technician
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const pool = await sql.connect(dbConfig);

    // Check if username already exists
    const usernameCheck = await pool
      .request()
      .input("username", sql.VarChar, username)
      .query("SELECT id FROM dbo.tblUsers WHERE username = @username");

    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if email already exists
    const emailCheck = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id FROM dbo.tblUsers WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new technician
    const insertResult = await pool
      .request()
      .input("username", sql.VarChar, username)
      .input("email", sql.VarChar, email)
      .input("password_hash", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, "technician")
      .input("is_active", sql.Bit, 1).query(`
        INSERT INTO dbo.tblUsers (username, email, password_hash, role, is_active, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@username, @email, @password_hash, @role, @is_active, GETDATE(), GETDATE())
      `);

    const newTechnician = insertResult.recordset[0];

    // Remove password_hash from response
    delete newTechnician.password_hash;

    res.status(201).json({
      success: true,
      message: "Technician created successfully",
      technician: newTechnician,
    });
  } catch (error) {
    console.error("Error creating technician:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create technician",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// PUT /api/technicians/:id - Update technician
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, is_active } = req.body;

    // Validation
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email are required",
      });
    }

    const pool = await sql.connect(dbConfig);

    // Check if technician exists
    const existingCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT id FROM dbo.tblUsers WHERE id = @id AND role = 'technician'"
      );

    if (existingCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // Check if new username conflicts with existing users (excluding current user)
    const usernameCheck = await pool
      .request()
      .input("username", sql.VarChar, username)
      .input("id", sql.Int, id)
      .query(
        "SELECT id FROM dbo.tblUsers WHERE username = @username AND id != @id"
      );

    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if new email conflicts with existing users (excluding current user)
    const emailCheck = await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("id", sql.Int, id)
      .query("SELECT id FROM dbo.tblUsers WHERE email = @email AND id != @id");

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Update technician
    const updateResult = await pool
      .request()
      .input("id", sql.Int, id)
      .input("username", sql.VarChar, username)
      .input("email", sql.VarChar, email)
      .input("is_active", sql.Bit, is_active !== undefined ? is_active : 1)
      .query(`
        UPDATE dbo.tblUsers 
        SET username = @username, 
            email = @email, 
            is_active = @is_active, 
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND role = 'technician'
      `);

    if (updateResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Technician not found or update failed",
      });
    }

    const updatedTechnician = updateResult.recordset[0];
    delete updatedTechnician.password_hash;

    res.json({
      success: true,
      message: "Technician updated successfully",
      technician: updatedTechnician,
    });
  } catch (error) {
    console.error("Error updating technician:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update technician",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// DELETE /api/technicians/:id - Soft delete technician
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(dbConfig);

    // Check if technician exists
    const existingCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT id FROM dbo.tblUsers WHERE id = @id AND role = 'technician'"
      );

    if (existingCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    // Soft delete (set is_active to 0)
    await pool.request().input("id", sql.Int, id).query(`
        UPDATE dbo.tblUsers 
        SET is_active = 0, 
            updated_at = GETDATE()
        WHERE id = @id AND role = 'technician'
      `);

    res.json({
      success: true,
      message: "Technician deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting technician:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate technician",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
