import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  ListGroup,
  Spinner,
  Alert,
} from "react-bootstrap";

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
  onClosingNoteComplete = null, // New prop for callback
}) => {
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show && fault) {
      // Fetch notes when modal opens
      onFetchNotes(fault.id);
    }
  }, [show, fault, onFetchNotes]);

  useEffect(() => {
    // Clear form when modal closes
    if (!show) {
      setNoteText("");
      setEditingNote(null);
    }
  }, [show]);

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
          FaultID: fault.id,
        });
        setEditingNote(null);
      } else {
        await onAddNote({
          FaultID: fault.id,
          Notes: noteText,
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

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteText(note.Notes);
  };

  const handleDeleteNote = async (note) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await onDeleteNote({
          id: note.id,
          FaultID: fault.id,
        });
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    }
  };

  const handleCancel = () => {
    setNoteText("");
    setEditingNote(null);
  };

  const faultNotes = fault ? notes[fault.id] || [] : [];
  const isLoading = fault ? loading[fault.id] : false;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isClosingNote ? "⚠️ Closing Note Required - " : ""}
          Notes for Fault #{fault?.id} - {fault?.DescFault?.substring(0, 50)}
          {fault?.DescFault?.length > 50 ? "..." : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Add/Edit Note Form */}
        <div className="mb-4">
          <Form.Group>
            <Form.Label>
              {editingNote ? "Edit Note" : "Add New Note"}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your notes here..."
              disabled={saving}
            />
          </Form.Group>
          <div className="mt-2 d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || saving}
              size="sm"
            >
              {saving && <Spinner size="sm" className="me-1" />}
              {editingNote ? "Update Note" : "Add Note"}
            </Button>
            {editingNote && (
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div>
          <h6 className="mb-3">Notes History ({faultNotes.length})</h6>

          {isLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
              <div className="mt-2">Loading notes...</div>
            </div>
          ) : faultNotes.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p>No notes added yet.</p>
              <small>Add the first note using the form above.</small>
            </div>
          ) : (
            <ListGroup
              variant="flush"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {faultNotes.map((note) => (
                <ListGroup.Item key={note.id} className="px-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                        {note.Notes}
                      </div>
                      <small className="text-muted">
                        <strong>User ID:</strong> {note.UserID} |{" "}
                        <strong>Date:</strong>{" "}
                        {new Date(note.date).toLocaleString()}
                      </small>
                    </div>
                    <div className="ms-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEditNote(note)}
                        disabled={saving}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteNote(note)}
                        disabled={saving}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesModal;
