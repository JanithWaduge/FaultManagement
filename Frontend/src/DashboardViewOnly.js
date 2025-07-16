import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";

// New Fault Modal Component
function NewFaultModal({
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
        SystemID: parseInt(formData.SystemID, 10),
        SectionID: parseInt(formData.SectionID, 10)
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

// Main Dashboard Component
export default function DashboardViewOnly({
  userInfo,
  notifications,
  setNotifications,
  onLogout,
}) {
  const [showFooterInfo, setShowFooterInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const [showNewFaultModal, setShowNewFaultModal] = useState(false);
  const [faults, setFaults] = useState([]);
  const [error, setError] = useState("");
  const assignablePersons = ["John Doe", "Jane Smith", "Alex Johnson", "Emily Davis"];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch faults on component mount and refresh
  useEffect(() => {
    const fetchFaults = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/faults', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mappedFaults = data.map(fault => ({
            id: fault.id,
            SystemID: fault.SystemID,
            SectionID: fault.SectionID,
            ReportedBy: fault.ReportedBy,
            Location: fault.Location,
            DescFault: fault.DescFault,
            Status: fault.Status,
            AssignTo: fault.AssignTo,
            DateTime: fault.DateTime
          }));
          setFaults(mappedFaults);
          setError("");
        } else {
          const errorData = await response.json();
          setError(`Failed to fetch faults: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        setError(`Error fetching faults: ${error.message}`);
      }
    };
    fetchFaults();
  }, []);

  // Handle click outside for notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notifications as read
  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.isRead)) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    }
  }, [showNotifications, notifications, setNotifications]);

  const handleNewFaultSubmit = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("No authentication token found. Please log in.");
      throw new Error("Authentication required");
    }
    try {
      const response = await fetch('http://localhost:5000/api/faults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          SystemID: parseInt(data.SystemID),
          Location: data.Location,
          LocFaultID: null,
          DescFault: data.DescFault,
          ReportedBy: data.ReportedBy,
          ExtNo: null,
          AssignTo: data.AssignTo,
          Status: data.Status,
          SectionID: parseInt(data.SectionID),
          FaultForwardID: null
        })
      });
      if (response.ok) {
        const result = await response.json();
        setFaults([...faults, result.fault]);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create fault');
      }
    } catch (error) {
      throw new Error(`Error creating fault: ${error.message}`);
    }
  };

  const filteredFaults = faults.filter((fault) => {
    if (!fault || typeof fault !== 'object') return false;
    const description = fault.DescFault || '';
    const location = fault.Location || '';
    const reportedBy = fault.ReportedBy || '';

    const matchesSearch =
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || (fault.Status && fault.Status.toLowerCase() === filterStatus);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <nav className="navbar navbar-dark fixed-top shadow-sm" style={{ height: 60, backgroundColor: "#001f3f" }}>
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div style={{ width: 120 }}></div>
          <span className="navbar-brand mb-0 h1 mx-auto">⚡ N F M System Version 1.0.1</span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button variant="link" className="text-white p-0" onClick={() => setShowNotifications(!showNotifications)} style={{ fontSize: "1.3rem" }}>
                <BellFill />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0" style={{ fontSize: "0.7rem", lineHeight: "1", fontWeight: "bold" }}>
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="position-absolute" style={{
                  top: "35px",
                  right: 0,
                  backgroundColor: "white",
                  color: "#222",
                  width: "280px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  zIndex: 1500,
                }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "10px" }}>No notifications</div>
                  ) : (
                    notifications.map((note) => (
                      <div key={note.id} style={{
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                        backgroundColor: note.isRead ? "#f8f9fa" : "white",
                        fontWeight: note.isRead ? "normal" : "600",
                      }}>{note.message}</div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button className="glass-button" size="sm" onClick={onLogout}>Logout</Button>
            <UserProfileDisplay user={userInfo} />
          </div>
        </Container>
      </nav>

      <Container fluid className="pt-5 mt-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button type="button" className="btn-close float-end" onClick={() => setError("")}></button>
          </div>
        )}
        <Row className="mb-3 align-items-center">
          <Col>
            <Tabs defaultActiveKey="faults" id="fault-tabs" className="custom-tabs" justify>
              <Tab eventKey="faults" title={<span className="tab-title-lg">🚧 Faults Review Panel</span>}>
                <div className="text-end mt-3 mb-2">
                  <Button variant="primary" size="sm" onClick={() => setShowNewFaultModal(true)}>
                    + New Fault
                  </Button>
                </div>
                <Row className="mb-3 px-3">
                  <Col md={4} className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search faults..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col md={3} className="mb-2">
                    <select
                      className="form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </Col>
                </Row>

                <Card className="shadow-sm">
                  <Card.Body className="p-0">
                    <Table striped bordered hover responsive className="table-fixed-header table-lg mb-0">
                      <thead className="sticky-top bg-light">
                        <tr>
                          <th>ID</th>
                          <th>System ID</th>
                          <th>Section ID</th>
                          <th>Reported By</th>
                          <th>Location</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Reported At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFaults.map((fault) => (
                          <tr key={fault.id} className="table-row-hover">
                            <td>{fault.id}</td>
                            <td>{fault.SystemID}</td>
                            <td>{fault.SectionID}</td>
                            <td>{fault.ReportedBy}</td>
                            <td>{fault.Location}</td>
                            <td className="description-col">{fault.DescFault}</td>
                            <td>{fault.Status}</td>
                            <td>{fault.AssignTo}</td>
                            <td>{new Date(fault.DateTime).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      <footer className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow" style={{ backgroundColor: "#001f3f" }}>
        <div className="mb-2 mb-sm-0">
          <Button className="glass-button" size="sm" onClick={() => alert("Contact support at support@nfm.lk")}>Support</Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0">
          Total Faults: {faults.length} | Unread Notifications: {notifications.filter((n) => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button className="glass-button" size="sm" onClick={() => setShowFooterInfo(!showFooterInfo)}>
            {showFooterInfo ? "Hide Info" : "Show Info"}
          </Button>
          {showFooterInfo && (
            <div className="mt-1" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              © 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      <NewFaultModal
        show={showNewFaultModal}
        handleClose={() => setShowNewFaultModal(false)}
        handleAdd={handleNewFaultSubmit}
        assignablePersons={assignablePersons}
      />

      <style>{`
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          color: white;
          font-weight: 600;
          padding: 0.4rem 0.9rem;
          transition: all 0.3s ease-in-out;
          cursor: pointer;
        }
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.35);
          color: #001f3f;
          transform: scale(1.07);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }
        .custom-tabs .nav-link {
          font-weight: 600;
          color: #001f3f;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .custom-tabs .nav-link.active {
          background: linear-gradient(to right, #00c6ff, #0072ff);
          color: white !important;
          box-shadow: 0 0 8px rgba(0, 114, 255, 0.5);
        }
        .table-fixed-header thead.sticky-top th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        .table-lg td, .table-lg th {
          font-size: 1.15rem;
          padding: 1rem 1.25rem;
          vertical-align: middle;
        }
        .tab-title-lg {
          font-size: 1.6rem;
          font-weight: 700;
          color: #001f3f;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }
        .description-col {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .table-row-hover:hover {
          background-color: #e6f0ff;
          cursor: pointer;
          transition: background-color 0.25s ease;
        }
        .form-control, .form-select {
          font-size: 1rem;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}