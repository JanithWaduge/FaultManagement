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
  Badge,
} from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";
import Activecharts from "./components/Activecharts"; // Add this import

export default function DashboardViewOnly({
  userInfo,
  faults,
  notifications,
  setNotifications,
  onLogout,
  onNewFault,
}) {
  const [showFooterInfo, setShowFooterInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewFaultModal, setShowNewFaultModal] = useState(false); // modal control
  const notifRef = useRef();

  const assignablePersons = ["John Doe", "Jane Smith", "Alex Johnson"];

  const [view, setView] = useState(""); // Add this for view management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // New Fault form state
  const [newFaultData, setNewFaultData] = useState({
    systemID: "",
    sectionID: "",
    reportedBy: userInfo?.name || "", // default to current user
    location: "",
    description: "",
    urgency: "medium",
    status: "open",
    assignedTo: "",
  });

  const filteredFaults = faults.filter((fault) => {
    const matchesSearch =
      fault.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency =
      filterUrgency === "all" || fault.urgency === filterUrgency;
    const matchesStatus =
      filterStatus === "all" || fault.status === filterStatus;

    return matchesSearch && matchesUrgency && matchesStatus;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.isRead)) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    }
  }, [showNotifications, notifications, setNotifications]);

  // Handle new fault form input change
  const handleNewFaultChange = (e) => {
    const { name, value } = e.target;
    setNewFaultData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle new fault submission
  const handleAddNewFault = () => {
    // Basic validation
    if (
      !newFaultData.systemID.trim() ||
      !newFaultData.sectionID.trim() ||
      !newFaultData.reportedBy.trim() ||
      !newFaultData.location.trim() ||
      !newFaultData.description.trim() ||
      !newFaultData.urgency.trim() ||
      !newFaultData.status.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onNewFault(newFaultData);
    setShowNewFaultModal(false);
    // Reset form
    setNewFaultData({
      systemID: "",
      sectionID: "",
      reportedBy: userInfo?.name || "",
      location: "",
      description: "",
      urgency: "medium",
      status: "open",
      assignedTo: "",
    });
  };

  // Separate faults by status
  const open = faults.filter((f) => f.status !== "Closed");
  const resolved = faults.filter((f) => f.status === "Closed");

  return (
    <>
      <nav
        className="navbar navbar-dark fixed-top shadow-sm"
        style={{ height: 60, backgroundColor: "#001f3f" }}
      >
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          <div style={{ width: 120 }}></div>
          <span
            className="navbar-brand mb-0 h1 mx-auto"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location.href = "/")}
            title="Go to Dashboard"
          >
            ⚡ N F M System Version 1.0.1 (View Only)
          </span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button
                variant="link"
                className="text-white p-0"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ fontSize: "1.3rem" }}
              >
                <BellFill />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span
                    className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0"
                    style={{
                      fontSize: "0.7rem",
                      lineHeight: "1",
                      fontWeight: "bold",
                    }}
                  >
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div
                  className="position-absolute"
                  style={{
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
                  }}
                >
                  {notifications.length === 0 ? (
                    <div style={{ padding: "10px" }}>No notifications</div>
                  ) : (
                    notifications.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                          backgroundColor: note.isRead ? "#f8f9fa" : "white",
                          fontWeight: note.isRead ? "normal" : "600",
                        }}
                      >
                        {note.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button className="glass-button" size="sm" onClick={onLogout}>
              Logout
            </Button>
            <UserProfileDisplay user={userInfo} />
          </div>
        </Container>
      </nav>

      <Container fluid className="pt-5 mt-4">
        <Row>
          <Col
            xs={2}
            className="bg-dark text-white sidebar p-3 position-fixed vh-100"
            style={{ top: 60, left: 0, zIndex: 1040 }}
          >
            <div
              className="glass-sidebar-title mb-4 text-center"
              onClick={() => setView("")}
              style={{ cursor: "pointer" }}
              title="Return to Dashboard"
            >
              <span className="sidebar-title-text">Dashboard</span>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white p-0"
                  onClick={() => setShowNewFaultModal(true)}
                >
                  + Add Fault
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link btn btn-link text-white p-0${
                    view === "faults" ? " fw-bold" : ""
                  }`}
                  onClick={() => setView("faults")}
                >
                  📋 Fault Review Panel
                </button>
                <button
                  className={`nav-link btn btn-link text-white p-0${
                    view === "resolved" ? " fw-bold" : ""
                  }`}
                  onClick={() => setView("resolved")}
                >
                  ✅ Resolved Faults
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link btn btn-link text-white p-0${
                    view === "active-chart" ? " fw-bold" : ""
                  }`}
                  onClick={() => setView("active-chart")}
                >
                  📊 Active Chart
                </button>
              </li>
            </ul>
          </Col>

          <Col
            className="ms-auto d-flex flex-column"
            style={{
              marginLeft: "16.666667%",
              width: "calc(100% - 16.666667%)",
              height: "calc(100vh - 60px)",
              overflow: "hidden",
              paddingLeft: 0,
              maxWidth: "82%",
            }}
          >
            {!view ? (
              <div className="p-4">
                <h2 className="mb-4 text-center">👋 Welcome to NFM System</h2>
                <Row>
                  {assignablePersons.map((technician) => {
                    const techFaults = [...open, ...resolved].filter(
                      (f) => f.AssignTo === technician
                    );
                    const completedFaults = techFaults.filter(
                      (f) => f.Status === "Closed"
                    );
                    const inProgressFaults = techFaults.filter(
                      (f) => f.Status === "In Progress"
                    );
                    const pendingFaults = techFaults.filter(
                      (f) => f.Status === "Pending"
                    );

                    return (
                      <Col key={technician} md={3} className="mb-4">
                        <Card className="glass-card h-100 performance-card">
                          <Card.Body>
                            <Card.Title className="d-flex align-items-center mb-3">
                              <span className="tech-avatar">
                                {technician
                                  .split(" ")
                                  .map((word) => word[0])
                                  .join("")}
                              </span>
                              <span className="ms-2">{technician}</span>
                            </Card.Title>
                            <div className="donut-chart-container mb-3">
                              <div className="donut-chart">
                                <svg
                                  viewBox="0 0 36 36"
                                  className="circular-chart"
                                >
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15.91549430918954"
                                    fill="transparent"
                                    stroke="#f3f3f3"
                                    strokeWidth="1"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15.91549430918954"
                                    fill="transparent"
                                    stroke="#198754"
                                    strokeWidth="3"
                                    strokeDasharray={`${
                                      (completedFaults.length /
                                        techFaults.length) *
                                        100 || 0
                                    }, 100`}
                                    className="donut-segment completed"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15.91549430918954"
                                    fill="transparent"
                                    stroke="#ffc107"
                                    strokeWidth="3"
                                    strokeDasharray={`${
                                      (inProgressFaults.length /
                                        techFaults.length) *
                                        100 || 0
                                    }, 100`}
                                    strokeDashoffset={`${
                                      -(
                                        (completedFaults.length /
                                          techFaults.length) *
                                        100
                                      ) || 0
                                    }`}
                                    className="donut-segment in-progress"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15.91549430918954"
                                    fill="transparent"
                                    stroke="#0dcaf0"
                                    strokeWidth="3"
                                    strokeDasharray={`${
                                      (pendingFaults.length /
                                        techFaults.length) *
                                        100 || 0
                                    }, 100`}
                                    strokeDashoffset={`${
                                      -(
                                        ((completedFaults.length +
                                          inProgressFaults.length) /
                                          techFaults.length) *
                                        100
                                      ) || 0
                                    }`}
                                    className="donut-segment pending"
                                  />
                                  <text
                                    x="18"
                                    y="18.5"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="8"
                                    fill="#2d3748"
                                    transform="rotate(90, 18, 18.5)"
                                  >
                                    {techFaults.length}
                                  </text>
                                </svg>
                              </div>
                              <div className="donut-legend">
                                <div className="legend-item">
                                  <span className="legend-dot completed"></span>
                                  <span>Completed</span>
                                </div>
                                <div className="legend-item">
                                  <span className="legend-dot in-progress"></span>
                                  <span>In Progress</span>
                                </div>
                                <div className="legend-item">
                                  <span className="legend-dot pending"></span>
                                  <span>Pending</span>
                                </div>
                              </div>
                            </div>
                            <div className="performance-stats">
                              <div className="stat-item">
                                <span className="stat-label">
                                  Total Assigned
                                </span>
                                <span className="stat-value">
                                  {techFaults.length}
                                </span>
                              </div>
                              <div className="stat-item completed">
                                <span className="stat-label">Completed</span>
                                <span className="stat-value">
                                  {completedFaults.length}
                                </span>
                              </div>
                              <div className="stat-item in-progress">
                                <span className="stat-label">In Progress</span>
                                <span className="stat-value">
                                  {inProgressFaults.length}
                                </span>
                              </div>
                              <div className="stat-item pending">
                                <span className="stat-label">Pending</span>
                                <span className="stat-value">
                                  {pendingFaults.length}
                                </span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ) : (
              <Tabs activeKey={view} className="custom-tabs" justify>
                <Tab
                  eventKey="faults"
                  title={
                    <span className="tab-title-lg">🚧 Faults Review Panel</span>
                  }
                >
                  {view === "faults" && (
                    <>
                      <Row className="mb-3 px-3">
                        <Col md={4} className="mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search faults..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search faults"
                          />
                        </Col>
                      </Row>
                      <div className="mb-2 px-3">
                        <strong>Total Faults:</strong> {open.length}
                      </div>
                      <Card className="shadow-sm mt-3">
                        <Card.Body className="p-0">
                          <Table
                            striped
                            bordered
                            hover
                            responsive
                            className="table-fixed-header table-lg mb-0"
                          >
                            <thead className="sticky-top bg-light">
                              <tr>
                                <th>ID</th>
                                <th>System ID</th>
                                <th>Section ID</th>
                                <th>Reported By</th>
                                <th>Location</th>
                                <th>Description</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Reported At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFaults.map((fault) => (
                                <tr key={fault.id} className="table-row-hover">
                                  <td>{fault.id}</td>
                                  <td>{fault.systemID}</td>
                                  <td>{fault.sectionID}</td>
                                  <td>{fault.reportedBy}</td>
                                  <td>{fault.location}</td>
                                  <td className="description-col">
                                    {fault.description}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge bg-${getUrgencyColor(
                                        fault.urgency
                                      )}`}
                                    >
                                      {fault.urgency}
                                    </span>
                                  </td>
                                  <td>{fault.status}</td>
                                  <td>{fault.assignedTo}</td>
                                  <td>{fault.reportedAt}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </>
                  )}
                </Tab>

                <Tab
                  eventKey="resolved"
                  title={
                    <span className="tab-title-lg">✅ Resolved Faults</span>
                  }
                >
                  {view === "resolved" && (
                    <>
                      <Row className="mb-3 px-3">
                        <Col md={4} className="mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search resolved faults..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search resolved faults"
                          />
                        </Col>
                      </Row>
                      <div className="mb-2 px-3">
                        <strong>Total Resolved Faults:</strong>{" "}
                        {resolved.length}
                      </div>
                      <Card className="shadow-sm mt-3">
                        <Card.Body className="p-0">
                          <Table
                            striped
                            bordered
                            hover
                            responsive
                            className="table-fixed-header table-lg mb-0"
                          >
                            <thead className="sticky-top bg-light">
                              <tr>
                                <th>ID</th>
                                <th>System ID</th>
                                <th>Section ID</th>
                                <th>Reported By</th>
                                <th>Location</th>
                                <th>Description</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Reported At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resolved
                                .filter((fault) =>
                                  fault.description
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map((fault) => (
                                  <tr
                                    key={fault.id}
                                    className="table-row-hover"
                                  >
                                    <td>{fault.id}</td>
                                    <td>{fault.systemID}</td>
                                    <td>{fault.sectionID}</td>
                                    <td>{fault.reportedBy}</td>
                                    <td>{fault.location}</td>
                                    <td className="description-col">
                                      {fault.description}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge bg-${getUrgencyColor(
                                          fault.urgency
                                        )}`}
                                      >
                                        {fault.urgency}
                                      </span>
                                    </td>
                                    <td>{fault.status}</td>
                                    <td>{fault.assignedTo}</td>
                                    <td>{fault.reportedAt}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </>
                  )}
                </Tab>

                <Tab
                  eventKey="active-chart"
                  title={<span className="tab-title-lg">📊 Active Chart</span>}
                >
                  {view === "active-chart" && (
                    <Activecharts faults={[...open, ...resolved]} />
                  )}
                </Tab>
              </Tabs>
            )}
          </Col>
        </Row>
      </Container>

      <footer
        className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="mb-2 mb-sm-0">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => alert("Contact support at support@nfm.lk")}
          >
            Support
          </Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0">
          Total Faults: {faults.length} | Unread Notifications:{" "}
          {notifications.filter((n) => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => setShowFooterInfo(!showFooterInfo)}
          >
            {showFooterInfo ? "Hide Info" : "Show Info"}
          </Button>
          {showFooterInfo && (
            <div className="mt-1" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              &copy; 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      {/* New Fault Modal */}
      <Modal
        show={showNewFaultModal}
        onHide={() => setShowNewFaultModal(false)}
        centered
        size="lg"
        className="fault-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title as="h4" className="text-primary fw-bold">
            <span className="fs-4">📝 Add New Fault</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form className="glass-form p-3">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formSystemID">
                  <Form.Label className="text-muted fw-bold">
                    System ID
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="systemID"
                    value={newFaultData.systemID}
                    onChange={handleNewFaultChange}
                    placeholder="Enter system ID"
                    className="glass-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formSectionID">
                  <Form.Label className="text-muted fw-bold">
                    Section ID
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="sectionID"
                    value={newFaultData.sectionID}
                    onChange={handleNewFaultChange}
                    placeholder="Enter section ID"
                    className="glass-input"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formReportedBy">
                  <Form.Label className="text-muted fw-bold">
                    Reported By
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="reportedBy"
                    value={newFaultData.reportedBy}
                    onChange={handleNewFaultChange}
                    placeholder="Enter reporter name"
                    disabled
                    className="glass-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formLocation">
                  <Form.Label className="text-muted fw-bold">
                    Location
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={newFaultData.location}
                    onChange={handleNewFaultChange}
                    placeholder="Enter location"
                    className="glass-input"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label className="text-muted fw-bold">
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newFaultData.description}
                onChange={handleNewFaultChange}
                placeholder="Enter fault description"
                className="glass-input"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formUrgency">
                  <Form.Label className="text-muted fw-bold">
                    Urgency Level
                  </Form.Label>
                  <Form.Select
                    name="urgency"
                    value={newFaultData.urgency}
                    onChange={handleNewFaultChange}
                    className={`glass-input status-${newFaultData.urgency}`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formStatus">
                  <Form.Label className="text-muted fw-bold">Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={newFaultData.status}
                    onChange={handleNewFaultChange}
                    className={`glass-input status-${newFaultData.status}`}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formAssignedTo">
                  <Form.Label className="text-muted fw-bold">
                    Assign To
                  </Form.Label>
                  <Form.Select
                    name="assignedTo"
                    value={newFaultData.assignedTo}
                    onChange={handleNewFaultChange}
                    className="glass-input"
                  >
                    <option value="">Select Technician</option>
                    {assignablePersons.map((person) => (
                      <option key={person} value={person}>
                        {person}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="light"
            onClick={() => setShowNewFaultModal(false)}
            className="me-2 glass-button-secondary"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddNewFault}
            className="px-4 glass-button-primary"
          >
            Add Fault
          </Button>
        </Modal.Footer>
      </Modal>

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

        /* Add these new styles */
      .sidebar {
        background-color: #001f3f !important;
        height: 100vh;
        position: fixed;
        top: 60px;
        left: 0;
        z-index: 1040;
        overflow-y: auto;
        width: 16.6666667%;
      }

      .glass-sidebar-title {
        background: rgba(255, 255, 255, 0.13);
        border: 1.5px solid rgba(255, 255, 255, 0.35);
        border-radius: 16px;
        backdrop-filter: blur(8px);
        color: #001f3f;
        font-weight: 700;
        font-size: 1.5rem;
        padding: 0.7rem 0.5rem;
        margin-bottom: 1.2rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        transition: all 0.3s ease;
      }

      .sidebar-title-text {
        color: #dfe3e7ff;
        font-weight: 600;
        font-size: 1.50rem;
        letter-spacing: 0.5px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.08);
        pointer-events: none;
      }

      .sidebar .nav-link.btn-link {
        font-size: 1rem;
        padding: 0.35rem 0.7rem;
        height: 2.1rem;
        border-radius: 8px;
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .sidebar .nav-link.btn-link:hover,
      .sidebar .nav-link.btn-link:focus {
        background-color: rgba(255, 255, 255, 0.18);
        color: #0072ff;
      }

      /* Performance Card Styles */
      .performance-card {
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 31, 63, 0.1);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
      }
      
      .performance-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.15);
      }
      
      .tech-avatar {
        background: linear-gradient(135deg, #001f3f, #0072ff);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.1rem;
      }

      /* Donut Chart Styles */
      .donut-chart-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .donut-chart {
        width: 120px;
        height: 120px;
      }

      .circular-chart {
        display: block;
        margin: 10px auto;
        max-width: 100%;
        max-height: 250px;
        transform: rotate(-90deg);
      }

      .donut-segment {
        transition: all 0.3s ease;
      }

      .donut-segment.completed {
        stroke: #198754;
      }

      .donut-segment.in-progress {
        stroke: #ffc107;
      }

      .donut-segment.pending {
        stroke: #0dcaf0;
      }

      .donut-legend {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.8rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .legend-dot.completed {
        background-color: #198754;
      }

      .legend-dot.in-progress {
        background-color: #ffc107;
      }

      .legend-dot.pending {
        background-color: #0dcaf0;
      }

      /* Form Modal Styles */
      .fault-modal .modal-content {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 16px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
      }

      .glass-form {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 31, 63, 0.05);
      }

      .glass-input {
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(0, 31, 63, 0.2) !important;
        border-radius: 8px !important;
        backdrop-filter: blur(4px);
        padding: 0.6rem 1rem;
        transition: all 0.3s ease;
        font-size: 0.95rem;
      }

      .glass-input:focus {
        box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.2) !important;
        border-color: #0072ff !important;
      }

      .glass-input:disabled {
        background: rgba(240, 240, 240, 0.9) !important;
      }

      .glass-button-primary {
        background: linear-gradient(135deg, #0072ff, #00c6ff);
        border: none;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .glass-button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 114, 255, 0.4);
      }

      .glass-button-secondary {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 31, 63, 0.2);
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .glass-button-secondary:hover {
        background: rgba(0, 31, 63, 0.05);
        transform: translateY(-2px);
      }

      /* Status Colors */
      .status-high {
        border-color: #dc3545 !important;
        background-color: rgba(220, 53, 69, 0.1) !important;
      }

      .status-medium {
        border-color: #ffc107 !important;
        background-color: rgba(255, 193, 7, 0.1) !important;
      }

      .status-low {
        border-color: #6c757d !important;
        background-color: rgba(108, 117, 125, 0.1) !important;
      }

      .status-open {
        border-color: #0dcaf0 !important;
        background-color: rgba(13, 202, 240, 0.1) !important;
      }

      .status-closed {
        border-color: #198754 !important;
        background-color: rgba(25, 135, 84, 0.1) !important;
      }
      `}</style>
    </>
  );
}

function getUrgencyColor(level) {
  switch (level) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "secondary";
    default:
      return "light";
  }
}
