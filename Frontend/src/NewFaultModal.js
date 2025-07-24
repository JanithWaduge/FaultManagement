import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";

// Options arrays
const locationOptions = ["BIA", "BDA", "JIA", "MRIA", "RMA"];
const systemOptions = [
  "NETWORK",
  "PBX",
  "CCTV",
  "IP-PABX",
  "FIDS",
  "VDGS",
  "IT",
  "FIRE",
  "CLOCK",
  "EGB",
  "ERP",
];
const faultLocationOptions = [
  "Admin-IT",
  "Terminal-A",
  "Terminal-B",
  "Cargo Building",
  "Terminal Car Park",
  "Pier Building",
];

export default function NewFaultModal({
  show,
  handleClose,
  handleAdd,
  assignablePersons = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    SystemID: systemOptions[0],
    SectionID: "",
    ReportedBy: "",
    Location: locationOptions[0],
    LocationOfFault: "",
    DescFault: "",
    Status: "In Progress",
    AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const emptyForm = {
      SystemID: systemOptions[0],
      SectionID: "",
      ReportedBy: "",
      Location: locationOptions[0],
      LocationOfFault: "",
      DescFault: "",
      Status: "In Progress",
      AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
    };

    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        SystemID: systemOptions.includes(initialData.SystemID)
          ? initialData.SystemID
          : systemOptions[0],
        SectionID: initialData.SectionID || "",
        ReportedBy: initialData.ReportedBy || "",
        Location: locationOptions.includes(initialData.Location)
          ? initialData.Location
          : locationOptions[0],
        LocationOfFault: initialData.LocationOfFault || "",
        DescFault: initialData.DescFault || "",
        Status: initialData.Status || "Open",
        AssignTo:
          initialData.AssignTo ||
          (assignablePersons.length > 0 ? assignablePersons[0] : ""),
      });
    } else {
      setFormData(emptyForm);
    }

    setValidated(false);
    setError("");
    setIsSubmitting(false);
  }, [initialData, assignablePersons, show]);

  // Change handler for inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Prepare payload for API
  function buildPayload(formData, initialData) {
    const payload = {
      SystemID: formData.SystemID,
      ReportedBy: formData.ReportedBy,
      Location: formData.Location,
      DescFault: formData.DescFault,
      AssignTo: formData.AssignTo,
      Status: formData.Status,
    };

    if (formData.SectionID && formData.SectionID.trim() !== "") {
      payload.SectionID = formData.SectionID;
    }
    if (formData.LocationOfFault && formData.LocationOfFault.trim() !== "") {
      payload.LocationOfFault = formData.LocationOfFault;
    }
    if (initialData && initialData.id) {
      payload.id = initialData.id;
    }
    return payload;
  }

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }
    if (!formData.ReportedBy.trim() || !formData.DescFault.trim()) {
      setError("Reported By and Description are required fields.");
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = buildPayload(formData, initialData);
      const success = await handleAdd(payload);
      if (success) {
        handleClose();
        // Reset form
        setFormData({
          SystemID: systemOptions[0],
          SectionID: "",
          ReportedBy: "",
          Location: locationOptions[0],
          LocationOfFault: "",
          DescFault: "",
          Status: "In Progress",
          AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
        });
        setValidated(false);
      }
    } catch (err) {
      let errorMsg = "Failed to submit form. Please try again.";
      if (err && err.response && err.response.data) {
        if (err.response.data.errors) {
          errorMsg = `Validation failed: ${err.response.data.errors
            .map((e) => e.msg)
            .join(", ")}`;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
        console.error("API full error:", err.response.data);
      }
      setError(errorMsg);
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
    <Modal
      show={show}
      onHide={handleModalClose}
      centered
      backdrop={isSubmitting ? "static" : true}
      size="lg"
      aria-labelledby="new-fault-modal"
    >
      <Modal.Header closeButton={!isSubmitting} className="border-bottom-0">
        <Modal.Title id="new-fault-modal" className="fw-bold fs-5">
          {initialData ? "Edit Fault Report" : "New Fault Report"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4">
            {error}
          </Alert>
        )}

        <Form noValidate validated={validated} onSubmit={handleSubmit} autoComplete="off">
          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group controlId="formSystemID">
                <Form.Label className="fw-semibold">
                  System <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="SystemID"
                  value={formData.SystemID}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-describedby="systemHelp"
                >
                  {systemOptions.map((system) => (
                    <option key={system} value={system}>
                      {system}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select a system.
                </Form.Control.Feedback>
                <Form.Text id="systemHelp" muted>
                  
                  Select the system related to the fault.
                </Form.Text>
              </Form.Group>
            </div>

            <div className="col-md-6 mb-3">
              <Form.Group controlId="formReportedBy">
                <Form.Label className="fw-semibold">
                  Reported By <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="ReportedBy"
                  value={formData.ReportedBy}
                  onChange={handleChange}
                  placeholder="Enter reporter name"
                  required
                  maxLength="100"
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <Form.Control.Feedback type="invalid">
                  Please provide the reporter's name.
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group controlId="formLocation">
                <Form.Label className="fw-semibold">
                  Location <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="Location"
                  value={formData.Location}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  aria-required="true"
                >
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select the location.
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6 mb-3">
              <Form.Group controlId="formLocationOfFault">
                <Form.Label className="fw-semibold">Location of Fault</Form.Label>
                <Form.Select
                  name="LocationOfFault"
                  value={formData.LocationOfFault}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select location of fault</option>
                  {faultLocationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-4" controlId="formDescFault">
            <Form.Label className="fw-semibold">
              Description <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              name="DescFault"
              as="textarea"
              rows={4}
              value={formData.DescFault}
              onChange={handleChange}
              placeholder="Describe the fault in detail"
              required
              maxLength="500"
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby="descHelp"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a description of the fault.
            </Form.Control.Feedback>
            <Form.Text id="descHelp" muted className="d-block text-end">
              {formData.DescFault.length}/500 characters
            </Form.Text>
          </Form.Group>

          <div className="row mb-4">
            {initialData && (
              <div className="col-md-6 mb-3 mb-md-0">
                <Form.Group controlId="formStatus">
                  <Form.Label className="fw-semibold">
                    Status <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="Status"
                    value={formData.Status}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    aria-required="true"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select a status.
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            )}

            <div className={`col-md-${initialData ? "6" : "12"}`}>
              <Form.Group controlId="formAssignTo">
                <Form.Label className="fw-semibold">
                  Assigned To <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="AssignTo"
                  value={formData.AssignTo}
                  onChange={handleChange}
                  required
                  disabled={assignablePersons.length === 0 || isSubmitting}
                  aria-required="true"
                >
                  {assignablePersons.length === 0 ? (
                    <option value="" disabled>
                      No persons available
                    </option>
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

          <Modal.Footer className="px-0 pt-0 border-0">
            <Button
              variant="outline-secondary"
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="me-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || assignablePersons.length === 0}
              className="d-flex align-items-center justify-content-center"
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : initialData ? (
                "Update Fault"
              ) : (
                "Create Fault"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>

      {/* Optional extra styles with styled jsx or CSS module if preferred */}
      <style>{`
        .fw-semibold {
          font-weight: 600 !important;
        }
        /* Customize modal scrolling */
        .modal-body {
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 1.25rem;
        }
      `}</style>
    </Modal>
  );
}
