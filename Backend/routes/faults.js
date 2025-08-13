const express = require("express");
const { body, validationResult, param } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get faults by technician name
router.get("/technician/:name", authenticateToken, async (req, res) => {
  try {
    const technicianName = decodeURIComponent(req.params.name);

    const query = `
      SELECT * FROM dbo.tblFaults
      WHERE AssignTo = @name
      ORDER BY DateTime DESC
    `;

    const result = await db.query(query, {
      name: technicianName,
    });

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching technician faults:", error);
    res.status(500).json({
      message: "Error fetching technician faults",
      error: error.message,
    });
  }
});

// Field mappings according to your table structure
const ALLOWED_UPDATE_FIELDS = [
  "SystemID",
  "Location",
  "LocationOfFault",
  "LocFaultID",
  "DescFault",
  "ReportedBy",
  "ExtNo",
  "AssignTo",
  "Status",
  "SectionID",
  "FaultForwardID",
  "Priority",
];

// Allowed values for SystemID
const VALID_SYSTEM_IDS = [
  "NETWORK",
  "PBX",
  "CCTV",
  "IP-PABX",
  "FIDS",
  "VDGS",
  "IT",
  "FIRE",
  "CLOCK",
  "EGB",
  "ERP",
];

// Allowed values for LocationOfFault
const VALID_FAULT_LOCATIONS = [
  "Admin-IT",
  "Terminal-A",
  "Terminal-B",
  "Cargo Building",
  "Terminal Car Park",
  "Pier Building",
];

// Create new fault
router.post(
  "/",
  [
    authenticateToken,
    body("SystemID").isIn(VALID_SYSTEM_IDS).withMessage("Invalid System ID"),
    body("Location").trim().notEmpty().withMessage("Location is required"),
    body("LocationOfFault")
      .optional()
      .isIn(VALID_FAULT_LOCATIONS)
      .withMessage("Invalid fault location"),
    body("DescFault").trim().notEmpty().withMessage("Description is required"),
    body("ReportedBy")
      .trim()
      .notEmpty()
      .withMessage("Reporter name is required"),
    body("AssignTo").trim().notEmpty().withMessage("Assignee is required"),
    body("SectionID")
      .optional()
      .isInt({ allow_null: true })
      .withMessage("Section ID must be an integer if provided")
      .toInt(),
  ],
  async (req, res) => {
    try {
      if (
        !req.body ||
        typeof req.body !== "object" ||
        Object.keys(req.body).length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Request body is empty or invalid" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
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
        Status = "Open",
        SectionID = null,
        FaultForwardID = null,
        isHighPriority = false,
      } = req.body;

      // Convert boolean to database value
      const Priority = isHighPriority ? "High" : null;

      console.log("Received data:", req.body);
      console.log("isHighPriority:", isHighPriority, "Priority:", Priority);

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
        FaultForwardID,
        Priority,
      };

      const result = await db.query(
        `
            INSERT INTO dbo.tblFaults (
                SystemID, Location, LocationOfFault, LocFaultID, DescFault,
                ReportedBy, ExtNo, DateTime, AssignTo,
                Status, SectionID, FaultForwardID, Priority
            ) VALUES (
                @SystemID, @Location, @LocationOfFault, @LocFaultID, @DescFault,
                @ReportedBy, @ExtNo, GETDATE(), @AssignTo,
                @Status, @SectionID, @FaultForwardID, @Priority
            );
            SELECT SCOPE_IDENTITY() AS id;
        `,
        queryParams
      );

      const newFault = await db.query(
        `
            SELECT * FROM dbo.tblFaults WHERE id = @id
        `,
        { id: result.recordset[0].id }
      );

      res.status(201).json({
        message: "Fault created successfully",
        fault: newFault.recordset[0],
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: "Failed to create fault",
        error: process.env.NODE_ENV === "development" ? error.message : null,
        details: process.env.NODE_ENV === "development" ? error.stack : null,
      });
    }
  }
);

// Show faults conditionally based on assigned technician
router.get("/", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { status } = req.query;

    const technicians = [
      "John Doe",
      "Jane Smith",
      "Alex Johnson",
      "Emily Davis",
    ];

    let baseQuery = "";
    let queryParams = {};

    if (technicians.includes(username)) {
      baseQuery = "SELECT * FROM dbo.tblFaults WHERE AssignTo = @username";
      queryParams.username = username;
    } else {
      baseQuery = "SELECT * FROM dbo.tblFaults";
    }

    // Add status filter if provided
    if (status) {
      if (Object.keys(queryParams).length > 0) {
        baseQuery += " AND Status = @status";
      } else {
        baseQuery += " WHERE Status = @status";
      }
      queryParams.status = status;
    }

    // Order by newest first
    baseQuery += " ORDER BY DateTime DESC";

    const result = await db.query(baseQuery, queryParams);
    const faults = result.recordset;

    // Add group detection logic
    const faultsWithGroups = detectGroupsInFaults(faults);

    res.status(200).json(faultsWithGroups);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      message: "Failed to fetch faults",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
});

// Update a fault
router.put(
  "/:id",
  [
    authenticateToken,
    param("id").isInt().withMessage("Fault ID must be an integer"),
    body("SystemID")
      .optional()
      .isIn(VALID_SYSTEM_IDS)
      .withMessage("Invalid System ID"),
    body("Location")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Location is required"),
    body("LocationOfFault")
      .optional()
      .isIn(VALID_FAULT_LOCATIONS)
      .withMessage("Invalid fault location"),
    body("DescFault")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("ReportedBy")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Reporter name is required"),
    body("AssignTo")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Assignee is required"),
    body("SectionID")
      .optional()
      .custom((value) => {
        if (value === null) return true;
        if (typeof value === "number") return Number.isInteger(value);
        if (typeof value === "string" && value.trim() === "") return true;
        throw new Error("Section ID must be an integer or null if provided");
      }),
    body("Status")
      .optional()
      .isIn(["Open", "In Progress", "Pending", "Hold", "Closed"])
      .withMessage("Invalid status value"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        console.error("Validation failed on update:", errors.array());
        console.error("Request Body:", req.body);

        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
          receivedBody: req.body,
        });
      }

      const faultId = req.params.id;
      const updates = {};
      ALLOWED_UPDATE_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Handle isHighPriority conversion for updates
      if (req.body.isHighPriority !== undefined) {
        updates.Priority = req.body.isHighPriority ? "High" : null;
        console.log(
          "UPDATE - isHighPriority:",
          req.body.isHighPriority,
          "Priority:",
          updates.Priority
        );
      }

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({ message: "No valid fields provided for update" });
      }

      if (updates.SectionID === "") {
        updates.SectionID = null;
      }

      const query = `
      UPDATE dbo.tblFaults
      SET ${Object.keys(updates)
        .map((field) => `${field} = @${field}`)
        .join(", ")}
      WHERE id = @id;
      SELECT * FROM dbo.tblFaults WHERE id = @id;
    `;
      const queryParams = { id: faultId, ...updates };

      const result = await db.query(query, queryParams);
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Fault not found" });
      }

      res.status(200).json({
        message: "Fault updated successfully",
        fault: result.recordset[0],
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: "Failed to update fault",
        error: process.env.NODE_ENV === "development" ? error.message : null,
      });
    }
  }
);

// Delete a fault
router.delete(
  "/:id",
  [
    authenticateToken,
    param("id").isInt().withMessage("Fault ID must be an integer"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const faultId = req.params.id;

      const result = await db.query(
        `
            DELETE FROM dbo.tblFaults WHERE id = @id;
            SELECT @@ROWCOUNT AS affectedRows;
        `,
        { id: faultId }
      );

      if (result.recordset[0].affectedRows === 0) {
        return res.status(404).json({ message: "Fault not found" });
      }

      res.status(200).json({ message: "Fault deleted successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: "Failed to delete fault",
        error: process.env.NODE_ENV === "development" ? error.message : null,
      });
    }
  }
);

// Group assignment endpoint - Update AssignTo field with comma-separated assignees
router.post(
  "/:id/assign-group",
  [
    authenticateToken,
    param("id").isInt().withMessage("Fault ID must be an integer"),
    body("assignees")
      .isArray({ min: 1 })
      .withMessage("Assignees must be a non-empty array"),
    body("assignees.*")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Each assignee must be a non-empty string"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const faultId = parseInt(req.params.id);
      const { assignees } = req.body;

      // Get original fault data
      const originalFaultQuery = "SELECT * FROM dbo.tblFaults WHERE id = @id";
      const originalFaultResult = await db.query(originalFaultQuery, {
        id: faultId,
      });

      if (originalFaultResult.recordset.length === 0) {
        return res.status(404).json({ message: "Fault not found" });
      }

      const originalFault = originalFaultResult.recordset[0];

      // Get current assignees (might already be a comma-separated list)
      const currentAssignees = originalFault.AssignTo
        ? originalFault.AssignTo.split(",").map((name) => name.trim())
        : [];

      // Use the new assignees (replace, don't append)
      const newAssignees = [...new Set(assignees)]; // Remove duplicates

      if (newAssignees.length < 2) {
        return res.status(400).json({
          message: "Group assignment requires at least 2 assignees",
        });
      }

      console.log("Group assignment - Current assignees:", currentAssignees);
      console.log("Group assignment - New assignees:", newAssignees);

      // Update the fault record with comma-separated assignees
      const updateQuery = `
        UPDATE dbo.tblFaults 
        SET AssignTo = @assignTo
        WHERE id = @id
      `;

      const updateParams = {
        id: faultId,
        assignTo: newAssignees.join(", "),
      };

      await db.query(updateQuery, updateParams);

      res.status(200).json({
        success: true,
        message: "Group assignment updated successfully",
        faultId: faultId,
        assignees: newAssignees,
        totalAssignees: newAssignees.length,
      });
    } catch (error) {
      console.error("Error updating group assignment:", error);
      res.status(500).json({
        message: "Failed to update group assignment",
        error: process.env.NODE_ENV === "development" ? error.message : null,
      });
    }
  }
);

// Function to detect groups in faults array - now based on comma-separated AssignTo field
function detectGroupsInFaults(faults) {
  if (!faults || faults.length === 0) return faults;

  // Add group metadata to each fault based on AssignTo field
  return faults.map((fault) => {
    // Check if AssignTo contains multiple assignees (comma-separated)
    const assignees = fault.AssignTo
      ? fault.AssignTo.split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      : [];

    const isGrouped = assignees.length > 1;

    return {
      ...fault,
      // Group metadata (computed, not stored in DB)
      isGrouped: isGrouped,
      groupSize: assignees.length,
      allAssignees: fault.AssignTo || "",
      groupMembers: assignees.map((assignee, index) => ({
        id: fault.id, // Same ID for all members since it's one record
        assignee: assignee,
      })),
    };
  });
}

// Notes routes - nested under faults
const notesRouter = require("./notes");
router.use("/notes", notesRouter);

module.exports = router;
