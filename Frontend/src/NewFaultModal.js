import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function NewFaultModal({
  show,
  handleClose,
  handleAdd,
  assignablePersons = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    systemID: "",
    sectionID: "",
    reportedBy: "",
    location: "",
    description: "",
    urgency: "low",
    status: "open",
    assignedTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
  });

  useEffect(() => {
    // Define emptyForm inside effect to avoid React Hook warning
    const emptyForm = {
      systemID: "",
      sectionID: "",
      reportedBy: "",
      location: "",
      description: "",
      urgency: "low",
      status: "open",
      assignedTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
    };

    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        assignedTo:
          initialData.assignedTo && assignablePersons.includes(initialData.assignedTo)
            ? initialData.assignedTo
            : assignablePersons.length > 0
            ? assignablePersons[0]
            : "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, assignablePersons, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAdd(formData);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? "Edit Fault Report" : "New Fault Report"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* System ID */}
          <Form.Group className="mb-3" controlId="formSystemID">
            <Form.Label>System ID</Form.Label>
            <Form.Control
              name="systemID"
              value={formData.systemID}
              onChange={handleChange}
              placeholder="Enter system ID"
              required
            />
          </Form.Group>

          {/* Section ID */}
          <Form.Group className="mb-3" controlId="formSectionID">
            <Form.Label>Section ID</Form.Label>
            <Form.Control
              name="sectionID"
              value={formData.sectionID}
              onChange={handleChange}
              placeholder="Enter section ID"
              required
            />
          </Form.Group>

          {/* Reported By */}
          <Form.Group className="mb-3" controlId="formReportedBy">
            <Form.Label>Reported By</Form.Label>
            <Form.Control
              name="reportedBy"
              value={formData.reportedBy}
              onChange={handleChange}
              placeholder="Enter reporter name"
              required
            />
          </Form.Group>

          {/* Location */}
          <Form.Group className="mb-3" controlId="formLocation">
            <Form.Label>Location</Form.Label>
            <Form.Control
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
              required
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3" controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              name="description"
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the fault"
              required
            />
          </Form.Group>

          {/* Urgency */}
          <Form.Group className="mb-3" controlId="formUrgency">
            <Form.Label>Urgency</Form.Label>
            <Form.Select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Select>
          </Form.Group>

          {/* Status */}
          <Form.Group className="mb-3" controlId="formStatus">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="closed">Closed</option>
            </Form.Select>
          </Form.Group>

          {/* Assigned To */}
          <Form.Group className="mb-3" controlId="formAssignedTo">
            <Form.Label>Assigned To</Form.Label>
            <Form.Select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
              disabled={assignablePersons.length === 0}
            >
              {assignablePersons.length === 0 ? (
                <option disabled>No persons available</option>
              ) : (
                assignablePersons.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {initialData ? "Update Fault" : "Add Fault"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
