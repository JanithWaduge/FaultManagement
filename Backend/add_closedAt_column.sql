-- Add ClosedAt column to tblFaults table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblFaults' AND COLUMN_NAME = 'ClosedAt')
BEGIN
    ALTER TABLE dbo.tblFaults 
    ADD ClosedAt DATETIME NULL;
    
    PRINT 'ClosedAt column added to tblFaults table';
END
ELSE
BEGIN
    PRINT 'ClosedAt column already exists in tblFaults table';
END

-- Update existing closed faults to have a ClosedAt timestamp (use DateTime as fallback)
UPDATE dbo.tblFaults 
SET ClosedAt = DateTime 
WHERE Status = 'Closed' AND ClosedAt IS NULL;

PRINT 'Updated existing closed faults with ClosedAt timestamps';
