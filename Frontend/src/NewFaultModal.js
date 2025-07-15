import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";

export default function NewFaultModal({
  show,
  handleClose,
  handleAdd,
  assignablePersons = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    SystemID: "",
    SectionID: "",
    ReportedBy: "",
    Location: "",
    DescFault: "",
    Status: "Open",
    AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const emptyForm = {
      SystemID: "",
      SectionID: "",
      ReportedBy: "",
      Location: "",
      DescFault: "",
      Status: "Open",
      AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
    };

    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        SystemID: initialData.SystemID || "",
        SectionID: initialData.SectionID || "",
        ReportedBy: initialData.ReportedBy || "",
        Location: initialData.Location || "",
        DescFault: initialData.DescFault || "",
        Status: initialData.Status || "Open",
        AssignTo: initialData.AssignTo || (assignablePersons.length > 0 ? assignablePersons[0] : "")
      });
    } else {
      setFormData(emptyForm);
    }
    
    setValidated(false);
    setError("");
    setIsSubmitting(false);
  }, [initialData, assignablePersons, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const dataToSubmit = {
        ...formData,
        id: initialData ? initialData.id : undefined,
        SystemID: parseInt(formData.SystemID, 10), // Ensure base-10 parsing
        SectionID: parseInt(formData.SectionID, 10) // Ensure base-10 parsing
      };
      const success = await handleAdd(dataToSubmit);
      if (success) {
        handleClose();
        setFormData({
          SystemID: "",
          SectionID: "",
          ReportedBy: "",
          Location: "",
          DescFault: "",
          Status: "Open",
          AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
        });
        setValidated(false);
      }
    } catch (error) {
      setError(error.message || "Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      handleClose();
    }
  };

  return (
    <Modal show={show} onHide={handleModalClose} centered backdrop={isSubmitting ? "static" : true}>
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>
          {initialData ? "Edit Fault Report" : "New Fault Report"}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group controlId="formSystemID">
                <Form.Label>System ID <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="SystemID"
                  value={formData.SystemID}
                  onChange={handleChange}
                  placeholder="Enter system ID"
                  required
                  min="1"
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid system ID.
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6 mb-3">
              <Form.Group controlId="formSectionID">
                <Form.Label>Section ID <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="SectionID"
                  value={formData.SectionID}
                  onChange={handleChange}
                  placeholder="Enter section ID"
                  required
                  min="1"
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid section ID.
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3" controlId="formReportedBy">
            <Form.Label>Reported By <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="ReportedBy"
              value={formData.ReportedBy}
              onChange={handleChange}
              placeholder="Enter reporter name"
              required
              maxLength="100"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              Please provide the reporter's name.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formLocation">
            <Form.Label>Location <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="Location"
              value={formData.Location}
              onChange={handleChange}
              placeholder="Enter location"
              required
              maxLength="200"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              Please provide the location.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formDescFault">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control
              name="DescFault"
              as="textarea"
              rows={3}
              value={formData.DescFault}
              onChange={handleChange}
              placeholder="Describe the fault in detail"
              required
              maxLength="500"
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a description of the fault.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              {formData.DescFault.length}/500 characters
            </Form.Text>
          </Form.Group>

          <div className="row">
            {initialData && (
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formStatus">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="Status"
                    value={formData.Status}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a status.
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            )}

            <div className={`col-md-${initialData ? '6' : '12'} mb-3`}>
              <Form.Group controlId="formAssignTo">
                <Form.Label>Assigned To <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="AssignTo"
                  value={formData.AssignTo}
                  onChange={handleChange}
                  required
                  disabled={assignablePersons.length === 0 || isSubmitting}
                >
                  {assignablePersons.length === 0 ? (
                    <option value="" disabled>No persons available</option>
                  ) : (
                    assignablePersons.map((person) => (
                      <option key={person} value={person}>
                        {person}
                      </option>
                    ))
                  )}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select an assignee.
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <Modal.Footer className="px-0">
            <Button 
              variant="secondary" 
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting || assignablePersons.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                initialData ? "Update Fault" : "Create Fault"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}