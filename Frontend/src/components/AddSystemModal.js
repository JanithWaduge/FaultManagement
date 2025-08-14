import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const AddSystemModal = ({ show, onHide, onSystemAdded }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const baseUrl =
        process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/systems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add system");
      }

      const newSystem = await response.json();

      setSuccess("System added successfully!");
      setName("");

      // Notify parent component
      if (onSystemAdded) {
        onSystemAdded(newSystem);
      }

      // Auto-close after success
      setTimeout(() => {
        setSuccess("");
        onHide();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError("");
    setSuccess("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-plus-circle me-2 text-primary"></i>
          Add New System
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              <i className="fas fa-cogs me-2 text-primary"></i>
              System Name
            </Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter system name"
              required
              disabled={loading}
              className="form-control-lg"
            />
            <Form.Text className="text-muted">
              Enter a unique name for the new system
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={loading}
          className="px-4"
        >
          <i className="fas fa-times me-2"></i>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className="px-4"
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Adding...
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>
              Add System
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddSystemModal;
