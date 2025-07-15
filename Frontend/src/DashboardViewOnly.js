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
} from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";

export default function DashboardViewOnly({
  userInfo,
  faults,
  notifications,
  setNotifications,
  onLogout,
  onNewFault, // Receive onNewFault prop
}) {
  const [showFooterInfo, setShowFooterInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewFaultModal, setShowNewFaultModal] = useState(false); // Modal control
  const notifRef = useRef();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // New Fault form state
  const [newFaultData, setNewFaultData] = useState({
    SystemID: "",
    SectionID: "",
    ReportedBy: userInfo?.name || "", // Default to current user
    Location: "",
    DescFault: "",
    Urgency: "medium",
    Status: "open",
    AssignTo: "",
  });

  // Debug: Log faults to console
  useEffect(() => {
    console.log("Faults received:", faults);
    if (faults && faults.length > 0) {
      console.log("Sample fault:", faults[0]);
    } else {
      console.log("No faults data available or faults is undefined");
    }
  }, [faults]);

  // Filter faults based on search, urgency, and status
  const filteredFaults = faults?.filter((fault) => {
    if (!fault || typeof fault !== "object") return false;
    const description = fault.DescFault || "";
    const location = fault.Location || "";
    const reportedBy = fault.ReportedBy || "";

    const matchesSearch =
      !searchTerm ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUrgency = filterUrgency === "all" || fault.Urgency === filterUrgency;
    const matchesStatus = filterStatus === "all" || fault.Status === filterStatus;

    return matchesSearch && matchesUrgency && matchesStatus;
  }) || [];

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
      !newFaultData.SystemID.trim() ||
      !newFaultData.SectionID.trim() ||
      !newFaultData.ReportedBy.trim() ||
      !newFaultData.Location.trim() ||
      !newFaultData.DescFault.trim() ||
      !newFaultData.Urgency.trim() ||
      !newFaultData.Status.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onNewFault(newFaultData);
    setShowNewFaultModal(false);
    // Reset form
    setNewFaultData({
      SystemID: "",
      SectionID: "",
      ReportedBy: userInfo?.name || "",
      Location: "",
      DescFault: "",
      Urgency: "medium",
      Status: "open",
      AssignTo: "",
    });
  };

  return (
    <>
      <nav
        className="navbar navbar-dark fixed-top shadow-sm"
        style={{ height: 60, backgroundColor: "#001f3f" }}
      >
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div style={{ width: 120 }}></div>
          <span className="navbar-brand mb-0 h1 mx-auto">
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
                    style={{ fontSize: "0.7rem", lineHeight: "1", fontWeight: "bold" }}
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
        <Row className="mb-3 align-items-center">
          <Col>
            <Tabs defaultActiveKey="faults" id="fault-tabs" className="custom-tabs" justify>
              <Tab
                eventKey="faults"
                title={<span className="tab-title-lg">🚧 Faults Review Panel</span>}
              >
                {/* Add New Fault Button */}
                <div className="d-flex justify-content-end mb-2 px-3">
                  <Button variant="primary" size="sm" onClick={() => setShowNewFaultModal(true)}>
                    + New Fault
                  </Button>
                </div>

                <Row className="mb-3 px-3 pt-3">
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
                      value={filterUrgency}
                      onChange={(e) => setFilterUrgency(e.target.value)}
                    >
                      <option value="all">All Urgencies</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
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
                        {filteredFaults.length > 0 ? (
                          filteredFaults.map((fault) => (
                            <tr key={fault.id} className="table-row-hover">
                              <td>{fault.id}</td>
                              <td>{fault.SystemID}</td>
                              <td>{fault.SectionID}</td>
                              <td>{fault.ReportedBy}</td>
                              <td>{fault.Location}</td>
                              <td className="description-col">{fault.DescFault}</td>
                              <td>
                                <span className={`badge bg-${getUrgencyColor(fault.Urgency)}`}>
                                  {fault.Urgency}
                                </span>
                              </td>
                              <td>{fault.Status}</td>
                              <td>{fault.AssignTo || "Unassigned"}</td>
                              <td>{new Date(fault.DateTime).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-3">
                              No faults found. Check console for debug info.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
                {/* Debug: Display raw faults if filtering fails */}
                {faults && faults.length > 0 && filteredFaults.length === 0 && (
                  <div className="alert alert-warning mt-3">
                    Filtering excluded all faults. Raw data: {JSON.stringify(faults)}
                  </div>
                )}
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      <footer
        className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="mb-2 mb-sm-0">
          <Button className="glass-button" size="sm" onClick={() => alert("Contact support at support@nfm.lk")}>
            Support
          </Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0">
          Total Faults: {faults?.length || 0} | Unread Notifications:{" "}
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
              © 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      {/* New Fault Modal */}
      <Modal
        show={showNewFaultModal}
        onHide={() => setShowNewFaultModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Fault</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2" controlId="formSystemID">
              <Form.Label>System ID <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                name="SystemID"
                value={newFaultData.SystemID}
                onChange={handleNewFaultChange}
                placeholder="Enter system ID"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="formSectionID">
              <Form.Label>Section ID <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                name="SectionID"
                value={newFaultData.SectionID}
                onChange={handleNewFaultChange}
                placeholder="Enter section ID"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="formReportedBy">
              <Form.Label>Reported By <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="ReportedBy"
                value={newFaultData.ReportedBy}
                onChange={handleNewFaultChange}
                placeholder="Enter reporter name"
                required
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="formLocation">
              <Form.Label>Location <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="Location"
                value={newFaultData.Location}
                onChange={handleNewFaultChange}
                placeholder="Enter location"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="formDescription">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="DescFault"
                value={newFaultData.DescFault}
                onChange={handleNewFaultChange}
                placeholder="Enter description"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="formUrgency">
              <Form.Label>Urgency <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="Urgency"
                value={newFaultData.Urgency}
                onChange={handleNewFaultChange}
                required
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2" controlId="formStatus">
              <Form.Label>Status <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="Status"
                value={newFaultData.Status}
                onChange={handleNewFaultChange}
                required
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2" controlId="formAssignedTo">
              <Form.Label>Assigned To <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="AssignTo"
                value={newFaultData.AssignTo}
                onChange={handleNewFaultChange}
                placeholder="Enter assignee name"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewFaultModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddNewFault}>
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
        .badge {
          text-transform: capitalize;
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