-- Script to clean up test overdue faults
-- Run this script to remove the test data after testing

-- Remove test overdue faults
DELETE FROM dbo.tblFault 
WHERE DescFault LIKE '%OVERDUE TEST FAULT%';

-- Verify cleanup
SELECT COUNT(*) as RemainingTestFaults
FROM dbo.tblFault 
WHERE DescFault LIKE '%OVERDUE TEST FAULT%';

-- Show current fault counts
SELECT 
    Status,
    COUNT(*) as Count,
    AVG(DATEDIFF(day, DateTime, GETDATE())) as AvgDaysOld
FROM dbo.tblFault 
WHERE Status != 'Closed'
GROUP BY Status
ORDER BY Status;
