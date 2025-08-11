import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

export default function GroupAssignmentModal({
  show,
  handleClose,
  fault,
  assignablePersons = [],
  onGroupAssign,
}) {
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize selected technicians from current fault AssignTo (comma-separated)
  useEffect(() => {
    if (fault && fault.AssignTo) {
      const currentAssignees = fault.AssignTo.split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      console.log(
        "GroupAssignmentModal - Current assignees:",
        currentAssignees
      );
      console.log(
        "GroupAssignmentModal - Available persons:",
        assignablePersons
      );

      // Only set technicians that are in the assignablePersons list
      const validAssignees = currentAssignees.filter((assignee) =>
        assignablePersons.includes(assignee)
      );

      console.log("GroupAssignmentModal - Valid assignees:", validAssignees);
      setSelectedTechnicians(validAssignees);
    } else {
      setSelectedTechnicians([]);
    }
  }, [fault, assignablePersons]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTechnicians.length < 2) {
      setError("Please select at least 2 technicians for group assignment.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Submitting group assignment:", {
        faultId: fault.id,
        selectedTechnicians,
      });

      await onGroupAssign(fault.id, selectedTechnicians);

      // Clear state and close modal
      setSelectedTechnicians([]);
      setError("");
      handleClose();
    } catch (error) {
      console.error("Group assignment error:", error);
      setError(`Failed to assign group: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose_ = () => {
    setSelectedTechnicians([]);
    setError("");
    handleClose();
  };

  // Get current assignees for display
  const currentAssignees =
    fault && fault.AssignTo
      ? fault.AssignTo.split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      : [];

  return (
    <Modal show={show} onHide={handleClose_} size="md">
      <Modal.Header closeButton>
        <Modal.Title>Group Assignment</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {fault && (
          <div className="mb-3">
            <strong>Fault #{fault.id}</strong>
            <p className="text-muted mb-2">{fault.DescFault}</p>
            <small className="text-muted">
              Current assignees:{" "}
              {currentAssignees.length > 0
                ? currentAssignees.join(", ")
                : "Unassigned"}
              {currentAssignees.length > 1 && (
                <span className="badge bg-info ms-2">
                  Group ({currentAssignees.length})
                </span>
              )}
            </small>
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label className="fw-semibold">
              Select Technicians for Group Assignment
            </Form.Label>
            <div
              className="border rounded p-2"
              style={{ maxHeight: "250px", overflowY: "auto" }}
            >
              {assignablePersons.map((person) => (
                <Form.Check
                  key={person}
                  type="checkbox"
                  id={`group-tech-${person}`}
                  label={person}
                  checked={selectedTechnicians.includes(person)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTechnicians((prev) => [...prev, person]);
                    } else {
                      setSelectedTechnicians((prev) =>
                        prev.filter((tech) => tech !== person)
                      );
                    }
                  }}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {selectedTechnicians.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">
                  Selected: {selectedTechnicians.join(", ")} (
                  {selectedTechnicians.length} technicians)
                </small>
              </div>
            )}

            {selectedTechnicians.length < 2 && (
              <div className="mt-1">
                <small className="text-danger">
                  Please select at least 2 technicians for group assignment
                </small>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose_}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || selectedTechnicians.length < 2}
        >
          {isSubmitting ? "Assigning..." : "Assign Group"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
