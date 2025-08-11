# Group Assignment Debug & Test Guide

## Current Status

✅ Backend group assignment endpoint: `/api/faults/:id/assign-group`
✅ Frontend group assignment UI components
✅ Field name mismatch: Fixed `technicians` → `assignees`
✅ Form validation issues: Fixed for group assignment mode
✅ Group column display: Shows `Group (X)` for grouped faults

## Fixed Issues

### 1. Frontend-Backend API Mismatch

**Problem**: Frontend sending `{ technicians: [...] }` but backend expects `{ assignees: [...] }`
**Fix**: Changed frontend to send `{ assignees: technicians }`

### 2. Form Validation Issues

**Problem**: Form validation failing for group assignments
**Fix**:

- Set `required={!isGroupAssignment}` for single assignment select
- Moved group validation before form validation
- Ensure AssignTo is set before validation

### 3. Group Detection Display

**Problem**: Frontend looking for `groupInfo` field but backend returns `isGrouped`, `groupSize`
**Fix**: Updated Dashboard to use correct field names

## Testing Steps

### Test 1: New Fault Group Assignment

1. Open New Fault Modal
2. Fill fault details
3. Check "Assign to multiple technicians"
4. Select 2+ technicians
5. Submit - should create multiple fault records

### Test 2: Existing Fault Group Assignment

1. Find fault in Dashboard
2. Click 👥 (Group) button
3. Select additional technicians
4. Submit - should create additional fault records

### Test 3: Group Column Display

1. Check Dashboard Group column
2. Should show "Group (X)" for faults with multiple assignees
3. Should show "-" for single assignments

## Console Debugging

Check browser console for:

- "Group assignment toggle changed: true/false"
- API request/response data
- Any JavaScript errors

## Potential Remaining Issues

1. **Database Connection**: Ensure SQL Server is running
2. **Authentication**: Check if token is valid
3. **CORS**: Verify backend allows frontend requests
4. **Data Format**: Check if dates/strings match for group detection

## API Test

Test backend directly:

```bash
POST http://localhost:5000/api/faults/1/assign-group
Headers: { "Authorization": "Bearer <token>", "Content-Type": "application/json" }
Body: { "assignees": ["John Doe", "Jane Smith"] }
```

The group assignment functionality should now be working correctly!
