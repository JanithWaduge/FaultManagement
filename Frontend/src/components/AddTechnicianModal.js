// Frontend/src/components/AddTechnicianModal.js

import React, { useState } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import technicianService from "../services/technicianService";

const AddTechnicianModal = ({ show, onHide, onTechnicianAdded }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (error) setError("");
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
    setValidationErrors([]);
    setLoading(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onHide();
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    // Username validation
    if (!formData.username.trim()) {
      errors.push("Username is required");
    } else if (formData.username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!technicianService.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.push("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setValidationErrors([]);

    try {
      // Prepare data for API
      const technicianData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      // Call API to create technician
      const result = await technicianService.createTechnician(technicianData);

      if (result.success) {
        // Success - notify parent and close modal
        if (onTechnicianAdded) {
          onTechnicianAdded(result.data);
        }
        handleClose();
      } else {
        // API returned an error
        setError(result.error || "Failed to create technician");
      }
    } catch (error) {
      console.error("Error creating technician:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="text-primary fw-bold">
          <i className="fas fa-user-plus me-2"></i>
          Add New Technician
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-2">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="warning">
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong>Please fix the following errors:</strong>
            <ul className="mb-0 mt-2">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Username Field */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              <i className="fas fa-user me-2 text-primary"></i>
              Username
            </Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              disabled={loading}
              className="form-control-lg"
              autoComplete="username"
            />
            <Form.Text className="text-muted">
              Must be at least 3 characters long
            </Form.Text>
          </Form.Group>

          {/* Email Field */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              <i className="fas fa-envelope me-2 text-primary"></i>
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              disabled={loading}
              className="form-control-lg"
              autoComplete="email"
            />
            <Form.Text className="text-muted">
              This will be used for login and notifications
            </Form.Text>
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              <i className="fas fa-lock me-2 text-primary"></i>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              disabled={loading}
              className="form-control-lg"
              autoComplete="new-password"
            />
            <Form.Text className="text-muted">
              Must be at least 6 characters long
            </Form.Text>
          </Form.Group>

          {/* Confirm Password Field */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              <i className="fas fa-lock me-2 text-primary"></i>
              Confirm Password
            </Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              disabled={loading}
              className="form-control-lg"
              autoComplete="new-password"
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
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
          disabled={loading}
          className="px-4"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Creating...
            </>
          ) : (
            <>
              <i className="fas fa-user-plus me-2"></i>
              Add Technician
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddTechnicianModal;
