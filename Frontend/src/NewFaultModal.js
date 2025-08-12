import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner,
  Image,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { PhotoModal } from "./components/PhotoModal";

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

const subSystemOptions = [
  "Sub-System 1",
  "Sub-System 2",
  "Sub-System 3",
  "Sub-System 4",
  "Sub-System 5",
  "Hardware",
  "Software",
  "Network",
  "Security",
  "Maintenance",
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
    SubSystem: subSystemOptions[0],
    isHighPriority: false,
  });

  const [isGroupAssignment, setIsGroupAssignment] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);

  const [photos, setPhotos] = useState([]); // New photos to upload
  const [existingPhotos, setExistingPhotos] = useState([]); // Existing photos from backend
  const [photosModalOpen, setPhotosModalOpen] = useState(false); // For PhotoModal
  const [loadingPhotos, setLoadingPhotos] = useState(false); // For fetching photos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch existing photos for the fault
  const fetchPhotos = useCallback(
    async (faultId) => {
      setLoadingPhotos(true);
      try {
        const baseUrl =
          process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
        const url = `${baseUrl}/api/photos/fault/${faultId}`;

        console.log("Fetching photos from:", url);
        console.log("Token:", token ? "Present" : "Missing");

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const photos = await res.json();
        console.log("Photos fetched successfully:", photos);
        setExistingPhotos(photos);
      } catch (error) {
        console.error("Error fetching photos:", error);
        setExistingPhotos([]);
        setError(`Failed to load existing photos: ${error.message}`);
      } finally {
        setLoadingPhotos(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const technicianList = [
      "John Doe",
      "Jane Smith",
      "Alex Johnson",
      "Emily Davis",
    ];
    const isTechnician = user && technicianList.includes(user.username);

    const emptyForm = {
      SystemID: systemOptions[0],
      SectionID: "",
      ReportedBy: "",
      Location: locationOptions[0],
      LocationOfFault: "",
      DescFault: "",
      Status: "In Progress",
      AssignTo: isTechnician ? user.username : assignablePersons[0] || "",
      SubSystem: subSystemOptions[0],
      isHighPriority: false,
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
        Status: initialData.Status || "In Progress",
        AssignTo:
          initialData.AssignTo ||
          (assignablePersons.length > 0 ? assignablePersons[0] : ""),
        SubSystem: subSystemOptions.includes(initialData.SubSystem)
          ? initialData.SubSystem
          : subSystemOptions[0],
        isHighPriority:
          initialData.isHighPriority ||
          initialData.Priority === "High" ||
          false,
      });

      // Fetch existing photos if editing a fault
      if (initialData?.id) {
        fetchPhotos(initialData.id);
      } else {
        setExistingPhotos([]);
      }
    } else {
      setFormData(emptyForm);
      setExistingPhotos([]);
    }

    setPhotos([]); // Clear new photos on open/data change
    setValidated(false);
    setError("");
    setIsSubmitting(false);
  }, [initialData, assignablePersons, show, fetchPhotos]);

  // Handle text/select input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Handle photo file input change
  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setPhotos(selectedFiles);
  };

  // Clear new photos
  const clearPhotos = () => setPhotos([]);

  // Build payload for fault data API
  function buildPayload(formData, initialData) {
    const payload = {
      SystemID: formData.SystemID,
      ReportedBy: formData.ReportedBy,
      Location: formData.Location,
      DescFault: formData.DescFault,
      AssignTo: formData.AssignTo,
      Status: formData.Status,
      SubSystem: formData.SubSystem,
      isHighPriority: formData.isHighPriority,
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

  // Render previews for selected (new) photos
  const renderPhotoPreviews = () => {
    return photos.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return (
        <div
          key={index}
          className="me-2 mb-2"
          style={{ display: "inline-block" }}
        >
          <Image
            src={objectUrl}
            rounded
            thumbnail
            width={100}
            height={100}
            alt={`photo-${index + 1}`}
            onLoad={() => URL.revokeObjectURL(objectUrl)}
          />
        </div>
      );
    });
  };

  // Submit form data and photos
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate group assignment early
    if (isGroupAssignment && selectedTechnicians.length < 2) {
      setError("Please select at least 2 technicians for group assignment.");
      setValidated(true);
      return;
    }

    // For group assignment, ensure AssignTo is set for form validation
    if (
      isGroupAssignment &&
      selectedTechnicians.length > 0 &&
      !formData.AssignTo
    ) {
      setFormData((prev) => ({
        ...prev,
        AssignTo: selectedTechnicians[0],
      }));
    }

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
      // For group assignment, set AssignTo to comma-separated list of all selected technicians
      let payload;
      if (isGroupAssignment && selectedTechnicians.length > 0) {
        payload = buildPayload(
          {
            ...formData,
            AssignTo: selectedTechnicians.join(", "), // Join all technicians with comma-space
          },
          initialData
        );
      } else {
        payload = buildPayload(formData, initialData);
      }

      console.log("Sending payload to handleAdd:", payload);
      console.log("Is this an edit?", !!initialData);
      console.log("FormData isHighPriority:", formData.isHighPriority);
      console.log("Is group assignment?", isGroupAssignment);
      console.log("Selected technicians:", selectedTechnicians);

      const savedFault = await handleAdd(payload);
      console.log("Response from handleAdd:", savedFault);

      if (!savedFault || !savedFault.id) {
        throw new Error("Failed to save fault: No ID returned from handleAdd");
      }

      // Upload new photos if any
      if (photos.length > 0) {
        const uploadUrl = `${process.env.REACT_APP_BACKEND_URL}/api/photos/upload`;
        console.log("Uploading photos to:", uploadUrl);

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const formDataForPhotos = new FormData();
          formDataForPhotos.append("photo", photo);
          formDataForPhotos.append("faultId", savedFault.id);
          formDataForPhotos.append("photoOrder", i + 1);
          formDataForPhotos.append("isActive", true);

          console.log(
            "Uploading photo:",
            photo.name,
            "for faultId:",
            savedFault.id
          );

          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataForPhotos,
          });

          console.log("Upload response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Upload error response:", errorText);
            throw new Error(`Photo upload failed at index ${i}: ${errorText}`);
          }

          const result = await response.json();
          console.log("Upload success:", result);
        }
      }

      // Refresh photos if editing
      if (initialData?.id) {
        await fetchPhotos(savedFault.id);
      }

      // Close modal and reset form
      handleClose();
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
      clearPhotos();
      setValidated(false);
    } catch (err) {
      console.error("Submission error:", err);
      setError(
        `Failed to submit form or upload photos: ${err.message}. Check console for details.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      handleClose();
      setPhotosModalOpen(false);
      setExistingPhotos([]);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleModalClose}
        centered
        backdrop={isSubmitting ? "static" : true}
        size="lg"
        aria-labelledby="new-fault-modal"
      >
        <Modal.Header
          closeButton={!isSubmitting}
          className="enhanced-modal-header"
        >
          <Modal.Title
            id="new-fault-modal"
            className="fw-bold fs-4 d-flex align-items-center"
          >
            <span className="me-2 fs-3">{initialData ? "✏️" : ""}</span>
            {initialData ? "Edit Fault Report" : "Create New Fault Report"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4" style={{ backgroundColor: "#f8f9fa" }}>
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4 border-0 shadow-sm"
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
                color: "white",
              }}
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">⚠️</span>
                {error}
              </div>
            </Alert>
          )}

          <Form
            id="fault-form"
            noValidate
            validated={validated}
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            {/* System Information Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
                  <span className="me-2">🔧</span>
                  System Information
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formSystemID">
                      <Form.Label className="fw-semibold d-flex align-items-center">
                        <span className="me-2"></span>
                        System <span className="text-danger ms-1">*</span>
                      </Form.Label>
                      <Form.Select
                        name="SystemID"
                        value={formData.SystemID}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        aria-required="true"
                        aria-describedby="systemHelp"
                        className="border-2 shadow-sm"
                        style={{
                          borderColor: "#e3f2fd",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
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
                      <Form.Text id="systemHelp" className="text-muted">
                        <small>Select the system related to the fault.</small>
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formReportedBy">
                      <Form.Label className="fw-semibold d-flex align-items-center">
                        <span className="me-2"></span>
                        Reported By <span className="text-danger ms-1">*</span>
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
                        className="border-2 shadow-sm"
                        style={{
                          borderColor: "#e3f2fd",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      />
                      <Form.Control.Feedback type="invalid">
                        Please provide the reporter's name.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Location Information Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                }}
              >
                <h6 className="mb-0 fw-bold text-warning d-flex align-items-center">
                  <span className="me-2">📍</span>
                  Location Details
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formLocation">
                      <Form.Label className="fw-semibold d-flex align-items-center">
                        <span className="me-2"></span>
                        Location <span className="text-danger ms-1">*</span>
                      </Form.Label>
                      <Form.Select
                        name="Location"
                        value={formData.Location}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        aria-required="true"
                        className="border-2 shadow-sm"
                        style={{
                          borderColor: "#fff3e0",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
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
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formLocationOfFault">
                      <Form.Label className="fw-semibold d-flex align-items-center">
                        <span className="me-2"></span>
                        Location of Fault
                      </Form.Label>
                      <Form.Select
                        name="LocationOfFault"
                        value={formData.LocationOfFault}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="border-2 shadow-sm"
                        style={{
                          borderColor: "#fff3e0",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        <option value="">Select location of fault</option>
                        {faultLocationOptions.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Additional Details Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #e8f5e8, #c8e6c9)",
                }}
              >
                <h6 className="mb-0 fw-bold text-success d-flex align-items-center">
                  <span className="me-2">⚙️</span>
                  Additional Details
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formSubSystem">
                      <Form.Label className="fw-semibold d-flex align-items-center">
                        <span className="me-2"></span>
                        Sub System
                      </Form.Label>
                      <Form.Select
                        name="SubSystem"
                        value={formData.SubSystem}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="border-2 shadow-sm"
                        style={{
                          borderColor: "#e8f5e8",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        {subSystemOptions.map((subSystem) => (
                          <option key={subSystem} value={subSystem}>
                            {subSystem}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Fault Description Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #fce4ec, #f8bbd9)",
                }}
              >
                <h6 className="mb-0 fw-bold text-danger d-flex align-items-center">
                  <span className="me-2">📝</span>
                  Fault Description
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group className="mb-4" controlId="formDescFault">
                  <Form.Label className="fw-semibold d-flex align-items-center">
                    <span className="me-2"></span>
                    Description <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    name="DescFault"
                    as="textarea"
                    rows={4}
                    value={formData.DescFault}
                    onChange={handleChange}
                    placeholder="Describe the fault in detail..."
                    required
                    maxLength="500"
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-describedby="descHelp"
                    className="border-2 shadow-sm"
                    style={{
                      borderColor: "#fce4ec",
                      borderRadius: "8px",
                      padding: "12px",
                      resize: "vertical",
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a description of the fault.
                  </Form.Control.Feedback>
                  <Form.Text
                    id="descHelp"
                    className="text-muted d-block text-end"
                  >
                    <small>{formData.DescFault.length}/500 characters</small>
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Photos Section */}
            <Form.Group controlId="formAddPhotos" className="mb-4">
              <Form.Label className="fw-semibold">Photos</Form.Label>
              <div className="d-flex align-items-center mb-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setPhotosModalOpen(true)}
                  disabled={loadingPhotos || !initialData?.id}
                  title="View Existing Photos"
                  className="me-2"
                >
                  📷 View Photos
                </Button>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                  aria-describedby="photosHelp"
                />
              </div>
              <Form.Text id="photosHelp" muted>
                You can upload one or more photos showcasing the fault.
              </Form.Text>
            </Form.Group>

            {/* Photo previews */}
            {photos.length > 0 && (
              <div
                className="mb-4"
                style={{
                  maxHeight: "150px",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {renderPhotoPreviews()}
              </div>
            )}

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

                  {/* Group Assignment Toggle */}
                  <div className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id="groupAssignmentToggle"
                      label="Assign to multiple technicians (Group Assignment)"
                      checked={isGroupAssignment}
                      onChange={(e) => {
                        console.log(
                          "Group assignment toggle changed:",
                          e.target.checked
                        );
                        setIsGroupAssignment(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedTechnicians([]);
                          setFormData((prev) => ({
                            ...prev,
                            AssignTo:
                              assignablePersons.length > 0
                                ? assignablePersons[0]
                                : "",
                          }));
                        } else {
                          setSelectedTechnicians(
                            [formData.AssignTo].filter(Boolean)
                          );
                        }
                      }}
                      disabled={isSubmitting || assignablePersons.length < 2}
                    />
                    {assignablePersons.length < 2 && (
                      <small className="text-muted d-block">
                        Group assignment requires at least 2 available
                        technicians. Currently available:{" "}
                        {assignablePersons.length}
                      </small>
                    )}
                  </div>

                  {/* Single Assignment */}
                  {!isGroupAssignment && (
                    <Form.Select
                      name="AssignTo"
                      value={formData.AssignTo}
                      onChange={handleChange}
                      required={!isGroupAssignment}
                      disabled={
                        assignablePersons.length === 0 ||
                        isSubmitting ||
                        [
                          "John Doe",
                          "Jane Smith",
                          "Alex Johnson",
                          "Emily Davis",
                        ].includes(
                          JSON.parse(localStorage.getItem("user"))?.username
                        )
                      }
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
                  )}

                  {/* Group Assignment */}
                  {isGroupAssignment && (
                    <div>
                      <div
                        className="border rounded p-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {assignablePersons.length === 0 && (
                          <p className="text-muted">
                            No technicians available for selection.
                          </p>
                        )}
                        {assignablePersons.map((person) => (
                          <Form.Check
                            key={person}
                            type="checkbox"
                            id={`tech-${person}`}
                            label={person}
                            checked={selectedTechnicians.includes(person)}
                            onChange={(e) => {
                              console.log(
                                `Technician ${person} ${
                                  e.target.checked ? "selected" : "deselected"
                                }`
                              );
                              if (e.target.checked) {
                                setSelectedTechnicians((prev) => {
                                  const newSelection = [...prev, person];
                                  console.log("New selection:", newSelection);
                                  return newSelection;
                                });
                              } else {
                                setSelectedTechnicians((prev) => {
                                  const newSelection = prev.filter(
                                    (tech) => tech !== person
                                  );
                                  console.log("New selection:", newSelection);
                                  return newSelection;
                                });
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
                      {selectedTechnicians.length < 2 && isGroupAssignment && (
                        <div className="mt-1">
                          <small className="text-danger">
                            Please select at least 2 technicians for group
                            assignment
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  <Form.Control.Feedback type="invalid">
                    Please select an assignee.
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            {/* High Priority Checkbox */}
            <div className="mb-4 p-3 border rounded bg-light">
              <Form.Check
                type="checkbox"
                id="high-priority-checkbox"
                checked={formData.isHighPriority}
                onChange={(e) =>
                  setFormData({ ...formData, isHighPriority: e.target.checked })
                }
                disabled={isSubmitting}
                label={
                  <span
                    className={`fs-6 ${
                      formData.isHighPriority
                        ? "text-danger fw-bold"
                        : "text-dark"
                    }`}
                  >
                    🚩 High Priority
                  </span>
                }
              />
              <Form.Text className="text-muted d-block mt-1">
                Check this box for critical issues requiring immediate attention
              </Form.Text>

              {formData.isHighPriority && (
                <div className="alert alert-warning mt-2 mb-0 py-2">
                  <small>
                    <strong>⚠️ High Priority Selected:</strong> This fault will
                    be flagged with a red flag for immediate attention.
                  </small>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>

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
            variant={formData.isHighPriority ? "danger" : "primary"}
            type="submit"
            form="fault-form"
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
      </Modal>

      <PhotoModal
        show={photosModalOpen}
        photos={existingPhotos}
        onHide={() => setPhotosModalOpen(false)}
        title={`Photos for Fault ${initialData?.id || ""}`}
      />

      <style>{`
        .fw-semibold {
          font-weight: 600 !important;
        }
        
        /* Enhanced Modal Styles */
        .modal-content {
          border: none;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .modal-header {
          background: #001f3f;
          border: none;
          color: white;
          padding: 1.5rem;
        }
        
        .modal-header .btn-close {
          filter: brightness(0) invert(1);
          opacity: 0.8;
        }
        
        .modal-header .btn-close:hover {
          opacity: 1;
        }
        
        .modal-body {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 2rem;
          max-height: 75vh;
          overflow-y: auto;
        }
        
        /* Enhanced Form Controls */
        .form-control, .form-select {
          border: 2px solid #e3f2fd;
          border-radius: 10px;
          padding: 12px 16px;
          transition: all 0.3s ease;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          background: white;
        }
        
        .form-label {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        
        /* Section Cards */
        .section-card {
          background: rgba(255,255,255,0.95);
          border: none;
          border-radius: 15px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .section-header {
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border: none;
          padding: 1rem 1.5rem;
        }
        
        .section-header h6 {
          margin: 0;
          font-weight: 700;
          color: #2c3e50;
        }
        
        /* Priority Section */
        .priority-section {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border-radius: 10px;
          padding: 1rem;
          border: 2px solid #ff9800;
        }
        
        /* Button Enhancements */
        .btn-primary {
          background: #001f3f;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 31, 63, 0.3);
          background: #003366;
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 600;
        }
        
        .btn-outline-secondary {
          border: 2px solid #6c757d;
          border-radius: 10px;
          padding: 12px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        /* Photo Upload Section */
        .photo-upload-section {
          background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
          border-radius: 10px;
          padding: 1rem;
          border: 2px dashed #4caf50;
        }
        
        /* Alert Enhancements */
        .alert {
          border: none;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        
        /* Text Area Enhancements */
        textarea.form-control {
          resize: vertical;
          min-height: 120px;
        }
        
        /* Icon Enhancements */
        .form-label span {
          font-size: 1.2em;
          margin-right: 8px;
        }
        
        /* Animated Loading */
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .modal-body {
            padding: 1rem;
          }
          
          .section-header {
            padding: 0.75rem 1rem;
          }
          
          .form-control, .form-select {
            padding: 10px 12px;
          }
        }
      `}</style>
    </>
  );
}
//test comment
