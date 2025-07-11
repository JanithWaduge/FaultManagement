// Imports
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
} from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";
import NewFaultModal from "./NewFaultModal";
import { useNavigate } from "react-router-dom";

// Component
export default function Dashboard({
  userInfo,
  faults,
  notifications,
  setNotifications,
  onLogout,
  onNewFault,
  onUpdateFault,
  onDeleteFault,
}) {
  const navigate = useNavigate();
  const [showFooterInfo, setShowFooterInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const [showNewFaultModal, setShowNewFaultModal] = useState(false);
  const [editFault, setEditFault] = useState(null);
  const assignablePersons = ["John Doe", "Jane Smith", "Alex Johnson", "Emily Davis"];
  
  
  // Handle notification dropdown close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const logout = () => {
  onLogout();
  navigate("/login");
};
  // Mark notifications as read
  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.isRead)) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    }
  }, [showNotifications, notifications, setNotifications]);

  const toggleStatus = (id) => {
    const fault = faults.find((f) => f.id === id);
    if (!fault) return;
    const updatedFault = {
      ...fault,
      status: fault.status === "open" ? "closed" : "open",
    };
    onUpdateFault(updatedFault);
  };

  const handleDeleteFault = (id) => {
    if (window.confirm("Are you sure you want to delete this fault?")) {
      onDeleteFault(id);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState("");
const [filterUrgency, setFilterUrgency] = useState("all");
const [filterStatus, setFilterStatus] = useState("all");

const filteredFaults = faults.filter((fault) => {
  const matchesSearch =
    fault.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fault.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fault.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesUrgency = filterUrgency === "all" || fault.urgency === filterUrgency;
  const matchesStatus = filterStatus === "all" || fault.status === filterStatus;

  return matchesSearch && matchesUrgency && matchesStatus;
});


  return (
    <>
      {/* Navbar */}
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
            <Button className="glass-button" size="sm" onClick={logout}>Logout</Button>

            <UserProfileDisplay user={userInfo} />
          </div>
        </Container>
      </nav>

      {/* Main Content */}
      <Container fluid className="pt-5 mt-4">
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
                          <th>Urgency</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Reported At</th>
                          <th>Actions</th>
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
                            <td className="description-col">{fault.description}</td>
                            <td><span className={`badge bg-${getUrgencyColor(fault.urgency)}`}>{fault.urgency}</span></td>
                            <td>{fault.status}</td>
                            <td>{fault.assignedTo}</td>
                            <td>{fault.reportedAt}</td>
                            <td>
                              <Button variant="outline-success" size="sm" className="me-1 mb-1" onClick={() => toggleStatus(fault.id)}>
                                {fault.status === "open" ? "Mark Closed" : "Reopen"}
                              </Button>
                              <Button variant="outline-primary" size="sm" className="me-1 mb-1" onClick={() => setEditFault(fault)}>Edit</Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteFault(fault.id)}>Delete</Button>
                            </td>
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

      {/* Footer */}
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
              &copy; 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      {/* Modal */}
      <NewFaultModal
        show={showNewFaultModal || !!editFault}
        handleClose={() => {
          setShowNewFaultModal(false);
          setEditFault(null);
        }}
        handleAdd={(data) => {
          if (editFault) {
            onUpdateFault({ ...editFault, ...data });
            setEditFault(null);
          } else {
            onNewFault(data);
          }
          setShowNewFaultModal(false);
        }}
        assignablePersons={assignablePersons}
        initialData={editFault}
      />

      {/* Styles */}
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
          font-size: 1.6rem;        /* Adjust size as needed */
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

// Helper
function getUrgencyColor(level) {
  switch (level) {
    case "high": return "danger";
    case "medium": return "warning";
    case "low": return "secondary";
    default: return "light";
  }
}
