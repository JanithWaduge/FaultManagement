# How to Assign Group Faults - Complete Guide

## Overview

The group assignment feature allows you to assign multiple technicians to the same fault, creating a team-based approach to fault resolution. This is implemented without any database schema changes using a record duplication approach.

## 🔧 Implementation Status

✅ **Backend API** - Group assignment endpoint ready  
✅ **Frontend Group Column** - Displays group information in Dashboard  
✅ **New Fault Group Assignment** - Create faults with multiple assignees  
✅ **Existing Fault Group Assignment** - Add group assignment to existing faults

## 📋 How to Assign Group Faults

### Method 1: Create New Fault with Group Assignment

1. **Open New Fault Modal**

   - Click "Create New Fault" button on Dashboard
   - Fill in all required fault details (System, Location, Description, etc.)

2. **Enable Group Assignment**

   - Look for "Assign to multiple technicians (Group Assignment)" checkbox
   - Check this box to enable group assignment mode
   - Note: Option is only available if there are 2+ available technicians

3. **Select Team Members**

   - A list of available technicians will appear with checkboxes
   - Select at least 2 technicians for the group
   - You'll see a summary showing selected technicians count

4. **Submit Fault**
   - Click "Add Fault" to create the fault
   - System will create multiple records (one per technician)
   - All records share the same fault details but different AssignTo values

### Method 2: Add Group Assignment to Existing Fault

1. **Locate Fault in Dashboard**

   - Go to Dashboard and find the fault you want to convert to group assignment
   - Ensure the fault status is not "Closed"

2. **Click Group Assignment Button**

   - In the Actions column, click the "👥" (Group) button
   - This opens the Group Assignment Modal

3. **Select Additional Team Members**

   - Choose technicians to add to the group
   - The modal shows current assignee and fault details
   - Select at least 2 total technicians (including current assignee)

4. **Assign Group**
   - Click "Assign Group" button
   - System creates additional records for new team members
   - Dashboard refreshes to show group information

## 🔍 How to Identify Group Faults

### In Dashboard Table

- **Group Column**: Shows group status
  - `Group (3)` - Indicates 3 people assigned to this fault
  - `-` - Single person assignment

### Visual Indicators

- Multiple rows with same fault details but different AssignTo values
- Group detection is automatic based on matching:
  - DateTime (when fault was reported)
  - DescFault (fault description)
  - Location (fault location)
  - SystemID (affected system)

## 🛠 Technical Implementation Details

### Backend (Already Complete)

```javascript
// New endpoint for group assignment
POST /api/faults/:id/assign-group
Body: { technicians: ["Tech1", "Tech2", "Tech3"] }

// Enhanced GET endpoint with group detection
GET /api/faults
Response includes: { ..., groupInfo: [...] }
```

### Frontend Features

1. **NewFaultModal.js**: Group assignment toggle and multi-select
2. **GroupAssignmentModal.js**: Dedicated modal for existing fault group assignment
3. **Dashboard.js**: Group column display and group assignment button
4. **Automatic Detection**: Groups detected and displayed automatically

### Database Approach

- **No Schema Changes**: Uses existing `dbo.tblFaults` table
- **Record Duplication**: Creates multiple records with same fault data
- **MaxId + 1 Logic**: Each group member gets unique ID
- **Group Detection**: Identifies groups by matching fault criteria

## 📊 Group Assignment Workflow

```
New Fault → Group Toggle → Select Technicians → Submit
    ↓
Creates Record 1: ID=100, AssignTo=Tech1, [fault details]
Creates Record 2: ID=101, AssignTo=Tech2, [same fault details]
Creates Record 3: ID=102, AssignTo=Tech3, [same fault details]
    ↓
Dashboard Display: Shows "Group (3)" in Group column
```

## 🚀 Testing Group Assignment

### Test Scenario 1: New Group Fault

1. Create new fault with 3 technicians assigned
2. Check Dashboard shows "Group (3)" in Group column
3. Verify all 3 technicians see the fault in their assignments

### Test Scenario 2: Convert Existing Fault

1. Find single-assigned fault
2. Click group assignment button (👥)
3. Add 2 more technicians
4. Verify group status updates to "Group (3)"

### Test Scenario 3: Group Management

1. View fault details to see all group members
2. Each technician can update fault status independently
3. Status changes reflect across all group records

## 🔧 Available Features

### ✅ Currently Working

- Create new faults with group assignment
- Add group assignment to existing faults
- Display group status in Dashboard
- Automatic group detection
- Multi-technician selection UI

### 🚀 Future Enhancements (If Needed)

- Group member management (add/remove from groups)
- Group communication features
- Group progress tracking
- Group performance analytics

## 📝 Important Notes

1. **Minimum Group Size**: Must assign at least 2 technicians
2. **Database Safety**: No schema changes required or made
3. **Backward Compatibility**: Existing single assignments work normally
4. **Performance**: Group detection is optimized for large fault lists
5. **UI Responsiveness**: Group assignment UI adapts to available technicians

The group assignment feature is now fully functional and ready for use! Users can create team-based fault assignments for complex issues requiring multiple technicians.
