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

const statusOptions = [
  "Pending",
  "In Progress",
  "On Hold",
  "Closed",
  "Resolved",
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
  const [showAddFaultLocationModal, setShowAddFaultLocationModal] =
    useState(false);
  const [newSystemName, setNewSystemName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newSubSystemName, setNewSubSystemName] = useState("");
  const [newFaultLocationName, setNewFaultLocationName] = useState("");

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

  // Handler for adding a new fault location
  const handleAddFaultLocation = () => {
    if (newFaultLocationName.trim() === "") {
      setError("Fault location name cannot be empty");
      return;
    }

    // Add the new fault location to the options list if it doesn't already exist
    if (!faultLocationOptions.includes(newFaultLocationName.trim())) {
      // In a real application, you would make an API call to save this to the database
      faultLocationOptions.push(newFaultLocationName.trim());
      setFormData({
        ...formData,
        LocationOfFault: newFaultLocationName.trim(),
      });
      setNewFaultLocationName("");
      setShowAddFaultLocationModal(false);
      setSuccess("New fault location added successfully!");
    } else {
      setError("This fault location already exists!");
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
        className="fixed-modal"
      >
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="fw-bold">
            {initialData ? "Edit Fault" : "Add New Fault"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-3 py-3">
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-3 border-0 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <span className="me-2">⚠️</span>
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
            className="professional-form"
          >
            {/* System Information Section */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-2"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
                  System Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formSystemID">
                      <Form.Label className="fw-semibold">
                        System <span className="text-danger ms-1">*</span>
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="SystemID"
                          value={formData.SystemID}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          aria-required="true"
                          className="form-control-modern"
                          style={{ flex: 1 }}
                        >
                          {systemOptions.map((system) => (
                            <option key={system} value={system}>
                              {system}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-primary"
                          className="btn-modern-outline"
                          onClick={() => setShowAddSystemModal(true)}
                          disabled={isSubmitting}
                        >
                          +
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        Please select the system.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formReportedBy">
                      <Form.Label className="fw-semibold">
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
                        className="form-control-modern"
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
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-2"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-warning d-flex align-items-center">
                  Location Details
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formLocation">
                      <Form.Label className="fw-semibold">
                        Location <span className="text-danger ms-1">*</span>
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="Location"
                          value={formData.Location}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          aria-required="true"
                          className="form-control-modern"
                          style={{ flex: 1 }}
                        >
                          {locationOptions.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-warning"
                          className="btn-modern-outline"
                          onClick={() => setShowAddLocationModal(true)}
                          disabled={isSubmitting}
                        >
                          +
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        Please select the location.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formLocationOfFault">
                      <Form.Label className="fw-semibold">
                        Location of Fault
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="LocationOfFault"
                          value={formData.LocationOfFault}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="form-control-modern"
                          style={{ flex: 1 }}
                        >
                          <option value="">Select location of fault</option>
                          {faultLocationOptions.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-info"
                          className="btn-modern-outline"
                          onClick={() => setShowAddFaultLocationModal(true)}
                          disabled={isSubmitting}
                        >
                          +
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Additional Details Section */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-2"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-success d-flex align-items-center">
                  Additional Details
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formSubSystem">
                      <Form.Label className="fw-semibold">
                        Sub System
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="SubSystem"
                          value={formData.SubSystem}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="form-control-modern"
                          style={{ flex: 1 }}
                        >
                          {subSystemOptions.map((subSystem) => (
                            <option key={subSystem} value={subSystem}>
                              {subSystem}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-success"
                          className="btn-modern-outline"
                          onClick={() => setShowAddSubSystemModal(true)}
                          disabled={isSubmitting}
                        >
                          +
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Fault Description Section */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-2"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-danger d-flex align-items-center">
                  Fault Description
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Form.Group className="mb-3" controlId="formDescFault">
                  <Form.Label className="fw-semibold">
                    Fault Description{" "}
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    name="DescFault"
                    as="textarea"
                    rows={4}
                    value={formData.DescFault}
                    onChange={handleChange}
                    // placeholder="Provide a detailed description of the fault, including symptoms, error messages, and any relevant information..."
                    required
                    maxLength="500"
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-describedby="descHelp"
                    className="form-control-modern"
                    style={{
                      resize: "vertical",
                      minHeight: "120px",
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a description of the fault.
                  </Form.Control.Feedback>
                  <Form.Text
                    id="descHelp"
                    className="text-muted d-flex justify-content-between align-items-center mt-2"
                  >
                    <small>
                      Be as specific as possible to help technicians understand
                      the issue
                    </small>
                    <small className="fw-medium">
                      {formData.DescFault.length}/500 characters
                    </small>
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Photos Section */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-2"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-info">Photo Attachments</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Form.Group controlId="formAddPhotos" className="mb-3">
                  <div className="d-flex align-items-center mb-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setPhotosModalOpen(true)}
                      disabled={loadingPhotos || !initialData?.id}
                      title="View Existing Photos"
                      className="btn-modern-outline me-3"
                    >
                      View Existing Photos
                    </Button>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                      aria-describedby="photosHelp"
                      className="form-control-modern"
                    />
                  </div>
                  <Form.Text id="photosHelp" className="text-muted">
                    You can upload multiple photos (JPG, PNG, GIF) to showcase
                    the fault. Maximum 10MB per file.
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
              </Card.Body>
            </Card>

            {/* Status Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-primary">
                  Status Information
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="formStatus">
                      <Form.Label className="fw-semibold">
                        Status <span className="text-danger ms-1">*</span>
                      </Form.Label>
                      <Form.Select
                        name="Status"
                        value={formData.Status}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        aria-required="true"
                        className="form-control-modern"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select the status.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Assignment Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header
                className="bg-light border-bottom-0 py-3"
                style={{
                  background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)",
                }}
              >
                <h6 className="mb-0 fw-bold text-secondary">
                  Assignment & Priority
                </h6>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-3">
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
                          disabled={
                            isSubmitting || assignablePersons.length < 2
                          }
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
                                      e.target.checked
                                        ? "selected"
                                        : "deselected"
                                    }`
                                  );
                                  if (e.target.checked) {
                                    setSelectedTechnicians((prev) => {
                                      const newSelection = [...prev, person];
                                      console.log(
                                        "New selection:",
                                        newSelection
                                      );
                                      return newSelection;
                                    });
                                  } else {
                                    setSelectedTechnicians((prev) => {
                                      const newSelection = prev.filter(
                                        (tech) => tech !== person
                                      );
                                      console.log(
                                        "New selection:",
                                        newSelection
                                      );
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
                          {selectedTechnicians.length < 2 &&
                            isGroupAssignment && (
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
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* High Priority Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-4">
                <Form.Check
                  type="checkbox"
                  id="high-priority-checkbox"
                  checked={formData.isHighPriority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isHighPriority: e.target.checked,
                    })
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
                  Check this box for critical issues requiring immediate
                  attention
                </Form.Text>

                {formData.isHighPriority && (
                  <div className="alert alert-warning mt-2 mb-0 py-2">
                    <small>
                      <strong>⚠️ High Priority Selected:</strong> This fault
                      will be flagged with a red flag for immediate attention.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>

        <Modal.Footer className="px-4 pt-0 border-0 d-flex justify-content-end gap-3">
          <Button
            variant="secondary"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="btn-modern-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="fault-form"
            disabled={isSubmitting || assignablePersons.length === 0}
            className={`btn-modern-primary d-flex align-items-center justify-content-center ${
              formData.isHighPriority ? "btn-priority" : ""
            }`}
            style={
              formData.isHighPriority
                ? {
                    background:
                      "linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)",
                  }
                : {}
            }
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
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddSystemModal(false);
              setNewSystemName("");
              setError("");
            }}
            className="btn-modern-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddSystem}
            className="btn-modern-primary"
          >
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
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddLocationModal(false);
              setNewLocationName("");
              setError("");
            }}
            className="btn-modern-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleAddLocation}
            className="btn-modern-success"
          >
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
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddSubSystemModal(false);
              setNewSubSystemName("");
              setError("");
            }}
            className="btn-modern-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleAddSubSystem}
            className="btn-modern-success"
          >
            Add Subsystem
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for adding a new fault location */}
      <Modal
        show={showAddFaultLocationModal}
        onHide={() => setShowAddFaultLocationModal(false)}
        centered
        backdrop="static"
        size="md"
      >
        <Modal.Header closeButton className="enhanced-modal-header">
          <Modal.Title className="fw-bold fs-5">
            Add New Fault Location
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && showAddFaultLocationModal && (
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
          {success && showAddFaultLocationModal && (
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
          <Form.Group controlId="formAddFaultLocation">
            <Form.Label className="fw-semibold">Fault Location Name</Form.Label>
            <Form.Control
              type="text"
              value={newFaultLocationName}
              onChange={(e) => setNewFaultLocationName(e.target.value)}
              placeholder="Enter new fault location name"
              className="border-2 shadow-sm"
              style={{
                borderColor: "#e8f5e8",
                borderRadius: "8px",
                padding: "12px",
              }}
            />
            <Form.Text className="text-muted">
              The fault location name should be unique and descriptive.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddFaultLocationModal(false);
              setNewFaultLocationName("");
              setError("");
            }}
            className="btn-modern-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="info"
            onClick={handleAddFaultLocation}
            className="btn-modern-success"
          >
            Add Fault Location
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

        .add-button {
          min-width: 80px;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .add-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .enhanced-modal-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid #dee2e6;
        }
      `}</style>
    </>
  );
}

// Add modern styling
const styles = `
  .form-control-modern {
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s ease;
    background-color: #ffffff;
  }
  
  .form-control-modern:focus {
    border-color: #4c84ff;
    box-shadow: 0 0 0 0.2rem rgba(76, 132, 255, 0.15);
    background-color: #ffffff;
  }
  
  .btn-modern-outline {
    border: 2px solid;
    border-radius: 12px;
    padding: 12px 16px;
    font-weight: 600;
    transition: all 0.2s ease;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-modern-outline:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .btn-modern-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    padding: 14px 28px;
    font-weight: 600;
    color: white;
    transition: all 0.2s ease;
  }
  
  .btn-modern-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  }
  
  .btn-modern-secondary {
    background: #6c757d;
    border: 2px solid #6c757d;
    border-radius: 12px;
    padding: 14px 28px;
    font-weight: 600;
    color: white;
    transition: all 0.2s ease;
  }
  
  .btn-modern-secondary:hover {
    background: #5a6268;
    border-color: #5a6268;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
