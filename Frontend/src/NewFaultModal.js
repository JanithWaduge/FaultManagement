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
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  // States for "Add" modals
  const [showAddSystemModal, setShowAddSystemModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showAddSubSystemModal, setShowAddSubSystemModal] = useState(false);
  const [newSystemName, setNewSystemName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newSubSystemName, setNewSubSystemName] = useState("");

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

  // Handler for adding a new system
  const handleAddSystem = () => {
    if (newSystemName.trim() === "") {
      setError("System name cannot be empty");
      return;
    }

    // Add the new system to the options list if it doesn't already exist
    if (!systemOptions.includes(newSystemName.trim())) {
      // In a real application, you would make an API call to save this to the database
      systemOptions.push(newSystemName.trim());
      setFormData({ ...formData, SystemID: newSystemName.trim() });
      setNewSystemName("");
      setShowAddSystemModal(false);
      setSuccess("New system added successfully!");
    } else {
      setError("This system already exists!");
    }
  };

  // Handler for adding a new location
  const handleAddLocation = () => {
    if (newLocationName.trim() === "") {
      setError("Location name cannot be empty");
      return;
    }

    // Add the new location to the options list if it doesn't already exist
    if (!locationOptions.includes(newLocationName.trim())) {
      // In a real application, you would make an API call to save this to the database
      locationOptions.push(newLocationName.trim());
      setFormData({ ...formData, Location: newLocationName.trim() });
      setNewLocationName("");
      setShowAddLocationModal(false);
      setSuccess("New location added successfully!");
    } else {
      setError("This location already exists!");
    }
  };

  // Handler for adding a new subsystem
  const handleAddSubSystem = () => {
    if (newSubSystemName.trim() === "") {
      setError("Subsystem name cannot be empty");
      return;
    }

    // Add the new subsystem to the options list if it doesn't already exist
    if (!subSystemOptions.includes(newSubSystemName.trim())) {
      // In a real application, you would make an API call to save this to the database
      subSystemOptions.push(newSubSystemName.trim());
      setFormData({ ...formData, SubSystem: newSubSystemName.trim() });
      setNewSubSystemName("");
      setShowAddSubSystemModal(false);
      setSuccess("New subsystem added successfully!");
    } else {
      setError("This subsystem already exists!");
    }
  };

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
        className="professional-modal"
      >

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}

              </div>
            </Alert>
          )}

          <Form
            id="fault-form"
            noValidate
            validated={validated}
            onSubmit={handleSubmit}
            autoComplete="off"
            className="professional-form"
          >
            {/* System Information Section */}


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
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-warning d-flex align-items-center">
                  <span className="me-2"></span>
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
                      <div className="d-flex">
                        <Form.Select
                          name="Location"
                          value={formData.Location}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          aria-required="true"
                          className="border-2 shadow-sm me-2"
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
                        <Button
                          variant="outline-warning"
                          className="add-button"
                          onClick={() => setShowAddLocationModal(true)}
                          disabled={isSubmitting}
                        >
                          <i className="bi bi-plus-lg"></i> Add
                        </Button>
                      </div>
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
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-success d-flex align-items-center">
                  <span className="me-2"></span>
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
                      <div className="d-flex">
                        <Form.Select
                          name="SubSystem"
                          value={formData.SubSystem}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="border-2 shadow-sm me-2"
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
                        <Button
                          variant="outline-success"
                          className="add-button"
                          onClick={() => setShowAddSubSystemModal(true)}
                          disabled={isSubmitting}
                        >
                          <i className="bi bi-plus-lg"></i> Add
                        </Button>
                      </div>
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
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-danger d-flex align-items-center">
                  <span className="me-2"></span>
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


              <Form.Group className="professional-form-group" controlId="formDescFault">
                <Form.Label className="professional-label">
                  <span className="label-icon">📄</span>
                  Detailed Description <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  name="DescFault"
                  as="textarea"
                  rows={5}
                  value={formData.DescFault}
                  onChange={handleChange}
                  placeholder="Please describe the fault in detail including when it occurred, what happened, and any error messages..."
                  required
                  maxLength="500"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-describedby="descHelp"
                  className="professional-textarea"
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a detailed description of the fault.
                </Form.Control.Feedback>
                <div className="character-counter">
                  {formData.DescFault.length}/500 characters
                </div>
                <Form.Text id="descHelp" className="professional-help-text">
                  Include as much detail as possible to help technicians understand and resolve the issue quickly
                </Form.Text>
              </Form.Group>
            </div>

            {/* Photos Section */}
            <div className="form-section photo-section">
              <div className="section-header">
                <h5 className="section-title">
                  <span className="section-icon">📷</span>
                  Photo Attachments
                </h5>
                <p className="section-subtitle">Upload photos to help illustrate the problem</p>
              </div>

              <Form.Group controlId="formAddPhotos" className="professional-form-group">
                <div className="d-flex align-items-center mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setPhotosModalOpen(true)}
                    disabled={loadingPhotos || !initialData?.id}
                    title="View Existing Photos"
                    className="professional-btn professional-btn-secondary me-3"
                  >
                    📷 View Existing Photos
                  </Button>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isSubmitting}
                    style={{ flex: 1 }}
                    aria-describedby="photosHelp"
                    className="professional-input"
                  />
                </div>
                <Form.Text id="photosHelp" className="professional-help-text">
                  You can upload multiple photos (JPG, PNG, GIF) to showcase the fault. Maximum 10MB per file.
                </Form.Text>

                {/* Photo previews */}
                {photos.length > 0 && (
                  <div
                    className="mt-3 p-3 bg-light rounded"
                    style={{
                      maxHeight: "150px",
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderPhotoPreviews()}
                  </div>
                )}
              </Form.Group>
            </div>

            {/* Assignment Section */}
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <span className="section-icon">👥</span>
                  Assignment & Priority
                </h5>
                <p className="section-subtitle">Assign technicians and set priority level</p>
              </div>



              <div className="col-md-6">
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

      {/* Modal for adding a new system */}
      <Modal
        show={showAddSystemModal}
        onHide={() => setShowAddSystemModal(false)}
        centered
        backdrop="static"
        size="md"
      >
        <Modal.Header closeButton className="enhanced-modal-header">
          <Modal.Title className="fw-bold fs-5">Add New System</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && showAddSystemModal && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">⚠️</span>
                {error}
              </div>
            </Alert>
          )}
          {success && showAddSystemModal && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">✅</span>
                {success}
              </div>
            </Alert>
          )}
          <Form.Group controlId="formAddSystem">
            <Form.Label className="fw-semibold">System Name</Form.Label>
            <Form.Control
              type="text"
              value={newSystemName}
              onChange={(e) => setNewSystemName(e.target.value)}
              placeholder="Enter new system name"
              className="border-2 shadow-sm"
              style={{
                borderColor: "#e3f2fd",
                borderRadius: "8px",
                padding: "12px",
              }}
            />
            <Form.Text className="text-muted">
              The system name should be unique and descriptive.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddSystemModal(false);
              setNewSystemName("");
              setError("");
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddSystem}>
            Add System
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for adding a new location */}
      <Modal
        show={showAddLocationModal}
        onHide={() => setShowAddLocationModal(false)}
        centered
        backdrop="static"
        size="md"
      >
        <Modal.Header closeButton className="enhanced-modal-header">
          <Modal.Title className="fw-bold fs-5">Add New Location</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && showAddLocationModal && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">⚠️</span>
                {error}
              </div>
            </Alert>
          )}
          {success && showAddLocationModal && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">✅</span>
                {success}
              </div>
            </Alert>
          )}
          <Form.Group controlId="formAddLocation">
            <Form.Label className="fw-semibold">Location Name</Form.Label>
            <Form.Control
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Enter new location name"
              className="border-2 shadow-sm"
              style={{
                borderColor: "#fff3e0",
                borderRadius: "8px",
                padding: "12px",
              }}
            />
            <Form.Text className="text-muted">
              The location name should be unique and descriptive.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddLocationModal(false);
              setNewLocationName("");
              setError("");
            }}
          >
            Cancel
          </Button>
          <Button variant="warning" onClick={handleAddLocation}>
            Add Location
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for adding a new subsystem */}
      <Modal
        show={showAddSubSystemModal}
        onHide={() => setShowAddSubSystemModal(false)}
        centered
        backdrop="static"
        size="md"
      >
        <Modal.Header closeButton className="enhanced-modal-header">
          <Modal.Title className="fw-bold fs-5">Add New Subsystem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && showAddSubSystemModal && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">⚠️</span>
                {error}
              </div>
            </Alert>
          )}
          {success && showAddSubSystemModal && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
              className="mb-4 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">✅</span>
                {success}
              </div>
            </Alert>
          )}
          <Form.Group controlId="formAddSubSystem">
            <Form.Label className="fw-semibold">Subsystem Name</Form.Label>
            <Form.Control
              type="text"
              value={newSubSystemName}
              onChange={(e) => setNewSubSystemName(e.target.value)}
              placeholder="Enter new subsystem name"
              className="border-2 shadow-sm"
              style={{
                borderColor: "#e8f5e8",
                borderRadius: "8px",
                padding: "12px",
              }}
            />
            <Form.Text className="text-muted">
              The subsystem name should be unique and descriptive.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddSubSystemModal(false);
              setNewSubSystemName("");
              setError("");
            }}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddSubSystem}>
            Add Subsystem
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
        /* Professional Modal Styling */
        .professional-modal .modal-content {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          overflow: hidden;
        }

        .professional-modal-header {
          background: linear-gradient(135deg, #001f3f 0%, #0072ff 100%);
          color: white;
          border: none;
          padding: 2rem 2rem 1.5rem 2rem;
          position: relative;
        }

        .professional-modal-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" patternUnits="userSpaceOnUse" width="100" height="100"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }

        .professional-modal-title {
          position: relative;
          z-index: 1;
        }

        .modal-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        }
      `}</style>
    </>
  );
}
//test comment
