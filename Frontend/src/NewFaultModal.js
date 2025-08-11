import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Alert, Spinner, Image } from "react-bootstrap";
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
        <Modal.Header closeButton={!isSubmitting} className="border-bottom-0">
          <Modal.Title id="new-fault-modal" className="fw-bold fs-5">
            {initialData ? "Edit Fault Report" : "New Fault Report"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
              className="mb-4"
            >
              {error}
            </Alert>
          )}

          <Form
            noValidate
            validated={validated}
            onSubmit={handleSubmit}
            autoComplete="off"
          >
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
                  <Form.Label className="fw-semibold">
                    Location of Fault
                  </Form.Label>
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

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formSubSystem">
                  <Form.Label className="fw-semibold">Sub System</Form.Label>
                  <Form.Select
                    name="SubSystem"
                    value={formData.SubSystem}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {subSystemOptions.map((subSystem) => (
                      <option key={subSystem} value={subSystem}>
                        {subSystem}
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
        .modal-body {
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 1.25rem;
        }
      `}</style>
    </>
  );
}
//test comment
