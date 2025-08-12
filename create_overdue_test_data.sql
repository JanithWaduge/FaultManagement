-- Script to create test data for overdue faults (older than 1 week)
-- Run this script on your database to test the overdue functionality

-- Insert test faults that are overdue (8-15 days old)
INSERT INTO dbo.tblFault (
    SystemID, 
    ReportedBy, 
    Location, 
    LocationOfFault, 
    DescFault, 
    Status, 
    AssignTo, 
    Priority, 
    DateTime
)
VALUES 
-- 10 days old fault
(
    'SYS001', 
    'John Test', 
    'Building A', 
    'Server Room', 
    'Network connectivity issues - OVERDUE TEST FAULT', 
    'In Progress', 
    'Jane Smith', 
    'High', 
    DATEADD(day, -10, GETDATE())
),
-- 8 days old fault
(
    'SYS002', 
    'Sarah Test', 
    'Building B', 
    'Office Floor 2', 
    'Internet connection dropping frequently - OVERDUE TEST FAULT', 
    'Pending', 
    'Alex Johnson', 
    'Medium', 
    DATEADD(day, -8, GETDATE())
),
-- 12 days old fault
(
    'SYS003', 
    'Mike Test', 
    'Building C', 
    'Data Center', 
    'Critical server downtime - OVERDUE TEST FAULT', 
    'In Progress', 
    'Emily Davis', 
    'High', 
    DATEADD(day, -12, GETDATE())
),
-- 15 days old fault
(
    'SYS004', 
    'Lisa Test', 
    'Building A', 
    'Reception Area', 
    'Phone system malfunction - OVERDUE TEST FAULT', 
    'Pending', 
    'John Doe', 
    'Low', 
    DATEADD(day, -15, GETDATE())
);

-- Verify the inserted data
SELECT 
    id,
    SystemID,
    ReportedBy,
    DescFault,
    Status,
    Priority,
    DateTime,
    DATEDIFF(day, DateTime, GETDATE()) as DaysOld,
    CASE 
        WHEN DATEDIFF(day, DateTime, GETDATE()) > 7 THEN 'OVERDUE'
        ELSE 'ON TIME'
    END as OverdueStatus
FROM dbo.tblFault 
WHERE DescFault LIKE '%OVERDUE TEST FAULT%'
ORDER BY DateTime DESC;
