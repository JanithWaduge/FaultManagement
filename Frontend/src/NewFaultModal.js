import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";

// Your options arrays as before
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
    Status: "Open",
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
      Status: "Open",
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

  // Change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  // Construct clean payload, omitting unused/empty optional fields
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // built-in client-side validation
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
      console.log("Submitting payload:", payload);
      const success = await handleAdd(payload);
      if (success) {
        handleClose();
        setFormData({
          SystemID: systemOptions[0],
          SectionID: "",
          ReportedBy: "",
          Location: locationOptions[0],
          LocationOfFault: "",
          DescFault: "",
          Status: "Open",
          AssignTo: assignablePersons.length > 0 ? assignablePersons[0] : "",
        });
        setValidated(false);
      }
    } catch (err) {
      // Try to show detailed API validation feedback if sent
      let errorMsg = "Failed to submit form. Please try again.";
      if (err && err.response && err.response.data) {
        if (err.response.data.errors) {
          errorMsg = `Validation failed: ${err.response.data.errors
            .map((e) => e.msg)
            .join(", ")}`;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
        // Optionally log full error for debugging
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
    >
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
                <Form.Label>
                  System <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="SystemID"
                  value={formData.SystemID}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
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
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3" controlId="formReportedBy">
            <Form.Label>
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
            />
            <Form.Control.Feedback type="invalid">
              Please provide the reporter's name.
            </Form.Control.Feedback>
          </Form.Group>

          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Group controlId="formLocation">
                <Form.Label>
                  Location <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="Location"
                  value={formData.Location}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
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
                <Form.Label>Location of Fault</Form.Label>
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

          <Form.Group className="mb-3" controlId="formDescFault">
            <Form.Label>
              Description <span className="text-danger">*</span>
            </Form.Label>
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
                  <Form.Label>
                    Status <span className="text-danger">*</span>
                  </Form.Label>
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

            <div className={`col-md-${initialData ? "6" : "12"} mb-3`}>
              <Form.Group controlId="formAssignTo">
                <Form.Label>
                  Assigned To <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="AssignTo"
                  value={formData.AssignTo}
                  onChange={handleChange}
                  required
                  disabled={assignablePersons.length === 0 || isSubmitting}
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
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
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
    </Modal>
  );
}
