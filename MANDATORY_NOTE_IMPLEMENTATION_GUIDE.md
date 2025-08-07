# Mandatory Note Before Fault Closure - Implementation Guide

## Overview

This document provides a step-by-step implementation guide for adding mandatory note functionality when closing faults. When a user selects "Closed" status from the status dropdown, the system will require them to add a note before allowing the fault to be closed and moved to the resolved faults table.

## Current System Architecture

### Frontend Components

1. **Dashboard.js** - Main dashboard component containing fault tables
2. **NotesModal.js** - Modal component for managing notes
3. **useFaultNotes.js** - Custom hook for notes operations
4. **FaultsTable** - Component displaying faults in table format

### Backend Structure

1. **Backend/routes/faults.js** - Main fault management endpoints
2. **Backend/routes/notes.js** - Notes-specific endpoints
3. **Database Tables**:
   - `tblFaults` - Main faults table
   - `tblNotes` - Notes table with FaultID foreign key

## Current Status Workflow

Currently, when a user changes status to "Closed" in the status dropdown:

```javascript
onChange={async (e) => {
  if (isResolved) return;
  const updatedFault = { ...f, Status: e.target.value };
  try {
    await onEdit(updatedFault);  // Direct status update
  } catch (err) {
    alert("Failed to update status: " + err.message);
  }
}}
```

## Implementation Steps

### Step 1: Add State Variables for Mandatory Note Workflow

Add these state variables to the Dashboard component:

```javascript
// In Dashboard.js - Add to existing state declarations
const [faultPendingClose, setFaultPendingClose] = useState(null);
const [closeNoteRequired, setCloseNoteRequired] = useState(false);
const [pendingStatusChange, setPendingStatusChange] = useState(null);
```

**Purpose**:

- `faultPendingClose`: Stores the fault that's waiting to be closed after note addition
- `closeNoteRequired`: Flag to indicate when a closing note is mandatory
- `pendingStatusChange`: Stores the pending status change details

### Step 2: Create Status Change Interceptor Function

Add a new function to handle status changes and intercept "Closed" selections:

```javascript
// In Dashboard.js - Add this function
const handleStatusChange = async (fault, newStatus) => {
  // Check if status is being changed to "Closed"
  if (newStatus === "Closed" && fault.Status !== "Closed") {
    console.log("Requiring a closing note for fault:", fault.id);

    // Store the fault and status change for later completion
    setFaultPendingClose({
      ...fault,
      Status: newStatus,
    });
    setPendingStatusChange({ fault, newStatus });
    setCloseNoteRequired(true);
    setSelectedFaultForNotes(fault);
    setNotesModal(true);

    // Don't proceed with status change yet
    return;
  }

  // For non-closing status changes, proceed normally
  try {
    const updatedFault = { ...fault, Status: newStatus };
    await update(updatedFault);
  } catch (err) {
    setErr(`Failed to update status: ${err.message}`);
  }
};
```

### Step 3: Update FaultsTable Status Dropdown

Replace the existing status dropdown onChange handler:

```javascript
// In FaultsTable component - Update the select element
<select
  value={f.Status}
  onChange={(e) => {
    if (isResolved) return;
    handleStatusChange(f, e.target.value); // Use new handler
  }}
  className={`form-select form-select-sm status-${f.Status.toLowerCase().replace(
    /\s+/g,
    "-"
  )}`}
  disabled={isResolved}
  // ... other props remain the same
>
  <option value="In Progress">In Progress</option>
  <option value="Pending">Pending</option>
  <option value="Closed">Closed</option>
</select>
```

**Purpose**: This intercepts all status changes and applies the mandatory note logic for "Closed" status.

### Step 4: Modify NotesModal for Closing Note Workflow

Update the NotesModal component to handle the special closing note scenario:

```javascript
// In NotesModal.js - Update the Modal header and save logic
const NotesModal = ({
  show,
  onHide,
  fault,
  notes,
  loading,
  error,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onFetchNotes,
  isClosingNote = false, // New prop
  onClosingNoteComplete = null // New prop for callback
}) => {
  // ... existing code ...

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      if (isClosingNote) {
        alert("A note is required before closing this fault.");
      }
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        await onEditNote({
          id: editingNote.id,
          Notes: noteText,
          FaultID: fault.id
        });
      } else {
        await onAddNote({
          FaultID: fault.id,
          Notes: noteText
        });
      }

      // If this is a closing note, trigger the completion callback
      if (isClosingNote && onClosingNoteComplete) {
        await onClosingNoteComplete();
      }

      setNoteText("");
      setEditingNote(null);

      if (!isClosingNote) {
        onHide();
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note: " + error.message);
    } finally {
      setSaving(false);
    }
  };
```

### Step 5: Add Closing Note Completion Logic

Create a function to handle what happens after a closing note is successfully added:

```javascript
// In Dashboard.js - Add this function
const handleClosingNoteComplete = async () => {
  if (!faultPendingClose || !pendingStatusChange) {
    console.error("No pending close operation found");
    return;
  }

  try {
    // Now perform the actual status update to "Closed"
    await update(faultPendingClose);

    // Close the notes modal
    setNotesModal(false);

    // Clear the pending state
    setFaultPendingClose(null);
    setPendingStatusChange(null);
    setCloseNoteRequired(false);
    setSelectedFaultForNotes(null);

    // Show success message
    setSuccess(
      `Fault #${faultPendingClose.id} has been closed and moved to resolved faults.`
    );

    // Refresh fault data to ensure UI consistency
    await fetchAllFaults();
  } catch (error) {
    console.error("Error completing fault closure:", error);
    setErr(`Failed to close fault: ${error.message}`);
  }
};
```

### Step 6: Update NotesModal Integration in Dashboard

Modify how the NotesModal is called in the Dashboard:

```javascript
// In Dashboard.js - Update NotesModal usage
<NotesModal
  show={notesModal}
  onHide={() => {
    if (closeNoteRequired) {
      // Show confirmation before closing if this is for closing a fault
      if (
        window.confirm(
          "Closing without adding a note will cancel the status change. Are you sure?"
        )
      ) {
        setNotesModal(false);
        setCloseNoteRequired(false);
        setFaultPendingClose(null);
        setPendingStatusChange(null);
        setSelectedFaultForNotes(null);
      }
    } else {
      setNotesModal(false);
      setSelectedFaultForNotes(null);
    }
  }}
  fault={selectedFaultForNotes}
  notes={localNotes}
  loading={localNotesLoading}
  error={localNotesError}
  onAddNote={handleAddNote}
  onEditNote={handleEditNote}
  onDeleteNote={handleDeleteNote}
  onFetchNotes={memoizedFetchNotes}
  isClosingNote={closeNoteRequired} // Pass the closing note flag
  onClosingNoteComplete={handleClosingNoteComplete} // Pass completion callback
/>
```

### Step 7: Pass handleStatusChange to FaultsTable

Ensure the new status change handler is passed to the FaultsTable component:

```javascript
// In Dashboard.js - Update FaultsTable usage in both tabs
<FaultsTable
  faults={current}
  onEdit={update}
  onMarkResolved={resolve}
  isResolved={false}
  page={page}
  setPage={setPage}
  max={max}
  onOpenEditModal={openEditModal}
  onOpenNotesModal={openNotesModal}
  handleStatusChange={handleStatusChange} // Add this prop
/>
```

### Step 8: Update FaultsTable Component Signature

Modify the FaultsTable function to accept the new prop:

```javascript
// In Dashboard.js - Update FaultsTable function signature
function FaultsTable({
  faults,
  onEdit,
  onDelete,
  onMarkResolved,
  isResolved,
  page,
  setPage,
  max,
  onOpenEditModal,
  onOpenNotesModal,
  handleStatusChange, // Add this parameter
}) {
  // ... existing code ...
}
```

## Database Considerations

### Notes Table Structure

Ensure the notes table has the proper structure:

```sql
CREATE TABLE tblNotes (
  id INT PRIMARY KEY IDENTITY(1,1),
  FaultID INT NOT NULL,
  Notes NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (FaultID) REFERENCES tblFaults(id)
);
```

### Backend API Endpoints Required

Ensure these endpoints exist in `Backend/routes/notes.js`:

- `GET /api/faults/notes/:faultId` - Fetch notes for a fault
- `POST /api/faults/notes` - Add new note
- `PUT /api/faults/notes/:noteId` - Update existing note
- `DELETE /api/faults/notes/:noteId` - Delete note

## User Experience Flow

### Normal Status Change

1. User clicks status dropdown
2. User selects "In Progress" or "Pending"
3. Status updates immediately
4. Fault remains in current table

### Closing Status Change

1. User clicks status dropdown
2. User selects "Closed"
3. **System intercepts the change**
4. Notes modal opens automatically
5. User **must** enter a note (required field)
6. User clicks "Save Note"
7. System saves the note first
8. System then updates fault status to "Closed"
9. Fault automatically moves to "Resolved Faults" table
10. Success message displays

### Cancellation Flow

1. If user tries to close notes modal without adding note
2. System shows confirmation: "Closing without adding a note will cancel the status change. Are you sure?"
3. If user confirms: status change is cancelled
4. If user cancels: modal stays open for note entry

## Error Handling

### Frontend Error Scenarios

1. **Empty Note**: "A note is required before closing this fault."
2. **Network Error**: "Failed to save note: [error message]"
3. **Status Update Error**: "Failed to close fault: [error message]"

### Backend Validation

1. Ensure note content is not empty or whitespace-only
2. Validate fault exists before allowing note addition
3. Ensure user has permission to close the fault

## Testing Scenarios

### Happy Path Testing

1. Select "Closed" status → Notes modal opens
2. Enter valid note → Click Save
3. Verify fault status becomes "Closed"
4. Verify fault appears in "Resolved Faults" table
5. Verify note is saved and displays correctly

### Edge Case Testing

1. Try to close modal without note → Confirmation dialog
2. Empty note submission → Error message
3. Network failure during note save → Error handling
4. Multiple rapid status changes → State consistency
5. Browser refresh during process → State recovery

## Implementation Priority

### Phase 1 (Core Functionality)

1. Add state variables for pending close workflow
2. Implement handleStatusChange interceptor
3. Update status dropdown to use new handler
4. Basic notes modal integration

### Phase 2 (Enhanced UX)

1. Add closing note specific UI indicators
2. Implement confirmation dialogs
3. Add success/error messages
4. Improve loading states

### Phase 3 (Polish & Testing)

1. Comprehensive error handling
2. Edge case testing
3. Performance optimization
4. User feedback integration

## Success Criteria

### Functional Requirements

✅ Status change to "Closed" requires mandatory note
✅ Note must be non-empty to proceed
✅ Fault moves to resolved table after successful closure
✅ User can cancel the closure process
✅ Other status changes work normally

### Technical Requirements

✅ No data loss during the process
✅ Proper error handling and user feedback
✅ Consistent UI state management
✅ Database integrity maintained
✅ API endpoints handle all scenarios correctly

## Maintenance Considerations

### Code Organization

- Keep status change logic centralized in handleStatusChange
- Maintain clear separation between note operations and status updates
- Document the state flow for future developers

### Performance

- Minimize API calls during the workflow
- Use proper loading states for better UX
- Implement proper cleanup of event listeners

### Future Enhancements

- Add note templates for common closure reasons
- Implement note history/audit trail
- Add bulk fault closure with notes capability
- Integration with notification system for stakeholders
