import React, { useEffect, useState, useRef, useCallback } from "react";
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

const assignablePersons = [
  "John Doe",
  "Jane Smith",
  "Alex Johnson",
  "Emily Davis",
];

export default function Dashboard({
  userInfo,
  notifications,
  setNotifications,
  onLogout,
}) {
  const [showFooterInfo, setShowFooterInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();

  const [showNewFaultModal, setShowNewFaultModal] = useState(false);
  const [editFault, setEditFault] = useState(null);

  const [faults, setFaults] = useState([]);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showTable, setShowTable] = useState(false);
  const [resolvedFaults, setResolvedFaults] = useState([]);
  const [view, setView] = useState(""); // '', 'faults', or 'resolved'
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // adjust items per page here
  const handleViewChange = async (newView) => {
  
  setView(newView);
  setCurrentPage(1);
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const url =
      newView === "resolved"
        ? "http://localhost:5000/api/faults?status=closed"
        : "http://localhost:5000/api/faults?status=open";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (newView === "resolved") setResolvedFaults(data);
    else setFaults(data);

    setView(newView); // update view state
  } catch (err) {
    console.error("Error fetching faults:", err);
  }
};


  // Helper to get token & handle missing token error
  const getTokenOrError = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return null;
    }
    return token;
  };

  // Fetch faults
  const fetchFaults = useCallback(async () => {
    const token = getTokenOrError();
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/faults", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      const data = await response.json();
      setFaults(
        data.map((fault) => ({
          id: fault.id,
          SystemID: fault.SystemID,
          SectionID: fault.SectionID,
          ReportedBy: fault.ReportedBy,
          Location: fault.Location,
          DescFault: fault.DescFault,
          Status: fault.Status,
          AssignTo: fault.AssignTo,
          DateTime: fault.DateTime,
        }))
      );
      setError("");
    } catch (err) {
      setError(`Error fetching faults: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notifications as read when notifications dropdown opens
  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.isRead)) {
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    }
  }, [showNotifications, notifications, setNotifications]);

  // Delete fault handler
  const handleDeleteFault = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fault?")) return;

    const token = getTokenOrError();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/faults/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      setFaults((prev) => prev.filter((f) => f.id !== id));
      setError("");
    } catch (err) {
      setError(`Error deleting fault: ${err.message}`);
    }
  };

  // Update fault handler
  const handleUpdateFault = async (data) => {
    const token = getTokenOrError();
    if (!token) throw new Error("Authentication required");

    try {
      const response = await fetch(`http://localhost:5000/api/faults/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          SystemID: parseInt(data.SystemID, 10),
          Location: data.Location,
          DescFault: data.DescFault,
          ReportedBy: data.ReportedBy,
          AssignTo: data.AssignTo,
          Status: data.Status,
          SectionID: parseInt(data.SectionID, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update fault");
      }

      const result = await response.json();
      setFaults((prev) =>
        prev.map((f) => (f.id === result.fault.id ? result.fault : f))
      );
      setEditFault(null);
      return true;
    } catch (err) {
      setError(`Error updating fault: ${err.message}`);
      throw err;
    }
  };

  // Mark fault resolved
  const handleMarkResolved = async (id) => {
    const token = getTokenOrError();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/faults/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Status: "closed",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();
      setFaults((prev) =>
         prev.filter((f) => f.id !== id)
      );
      
      setError("");
    } catch (err) {
      setError(`Error marking as resolved: ${err.message}`);
    }
  };

  // Create new fault handler
  const handleNewFaultSubmit = async (data) => {
    const token = getTokenOrError();
    if (!token) throw new Error("Authentication required");

    try {
      const response = await fetch("http://localhost:5000/api/faults", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          SystemID: parseInt(data.SystemID, 10),
          Location: data.Location,
          LocFaultID: null,
          DescFault: data.DescFault,
          ReportedBy: data.ReportedBy,
          ExtNo: null,
          AssignTo: data.AssignTo,
          Status: data.Status,
          SectionID: parseInt(data.SectionID, 10),
          FaultForwardID: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create fault");
      }

      const result = await response.json();
      setFaults((prev) => [...prev, result.fault]);
      return true;
    } catch (err) {
      throw new Error(`Error creating fault: ${err.message}`);
    }
  };

  // Filter faults for display
  const filteredFaults = faults.filter((fault) => {
    if (!fault || typeof fault !== "object") return false;
    const description = fault.DescFault || "";
    const location = fault.Location || "";
    const reportedBy = fault.ReportedBy || "";

    const matchesSearch =
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "open" && fault.Status.toLowerCase() !== "closed") ||
      fault.Status.toLowerCase() === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFaults.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFaults = filteredFaults.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Sidebar link click handler helper
  const handleFilterClick = (status) => {
    if (filterStatus === status && showTable) {
      setShowTable(false);
    } else {
      setFilterStatus(status);
      setShowTable(true);
      setSearchTerm("");
    }
  };
    return (
    <>
      {/* Navbar */}
      <nav
        className="navbar navbar-dark fixed-top shadow-sm"
        style={{ height: 60, backgroundColor: "#001f3f" }}
      >
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div style={{ width: 120 }}></div>
          <span className="navbar-brand mb-0 h1 mx-auto">
            ⚡ N F M System Version 1.0.1
          </span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button
                variant="link"
                className="text-white p-0"
                onClick={() => setShowNotifications((v) => !v)}
                style={{ fontSize: "1.3rem" }}
                aria-label="Toggle Notifications"
              >
                <BellFill />
                {notifications.some((n) => !n.isRead) && (
                  <span
                    className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0"
                    style={{ fontSize: "0.7rem", lineHeight: 1, fontWeight: "bold" }}
                  >
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div
                  className="position-absolute"
                  style={{
                    top: 35,
                    right: 0,
                    backgroundColor: "white",
                    color: "#222",
                    width: 280,
                    maxHeight: 300,
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    borderRadius: 8,
                    zIndex: 1500,
                  }}
                >
                  {notifications.length === 0 ? (
                    <div style={{ padding: 10 }}>No notifications</div>
                  ) : (
                    notifications.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          padding: 10,
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

      {/* Main Content */}
      <Container fluid className="pt-5 mt-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              type="button"
              className="btn-close float-end"
              onClick={() => setError("")}
              aria-label="Close"
            />
          </div>
        )}
        <Row>
          {/* Sidebar */}
          <Col
            xs={2}
            className="bg-dark text-white sidebar p-3 position-fixed vh-100"
            style={{ top: 60, left: 0, zIndex: 1040 }}
          >
            <div className="glass-sidebar-title mb-4 text-center">
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
                  className="nav-link btn btn-link text-white p-0"
                  onClick={() => {
                    handleViewChange("faults");
                    setShowTable(true);
                  }}
                >
                  📋 Fault Review Panel
                </button>
                <button
                  className="nav-link btn btn-link text-white p-0"
                  onClick={() => {
                    handleViewChange("resolved");
                    setShowTable(true);
                  }}
                >
                  ✅ Resolved Faults
                </button>
              </li>
            </ul>
          </Col>

          {/* Main Dashboard Content */}
          <Col
            className="ms-auto d-flex flex-column"
            style={{
              marginLeft: "16.6666667%",
              width: "calc(100% - 16.6666667%)",
              height: "calc(100vh - 60px)",
              overflow: "hidden",
              paddingLeft: 0,
              maxWidth: "82%",
            }}
          >
            {/* Conditionally show faults table or resolved faults table */}
            {showTable && view === "faults" && (
              <Tabs defaultActiveKey="faults" id="fault-tabs" className="custom-tabs" justify>
                <Tab eventKey="faults" title={<span className="tab-title-lg">🚧 Faults Review Panel</span>}>
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
                    <strong>Total Faults:</strong> {filteredFaults.length}
                  </div>
                  <Row style={{ height: "calc(100vh - 60px - 130px - 80px)", overflowY: "auto" }}>
                    <Card className="shadow-sm w-100" style={{ minWidth: 0 }}>
                      <Card.Body className="p-0 d-flex flex-column">
                        <Table
                          striped
                          bordered
                          hover
                          responsive
                          className="table-fixed-header table-fit mb-0 flex-grow-1 align-middle custom-align-table"
                          aria-label="Faults Table"
                        >
                          <colgroup>
                            <col style={{ width: "3.5%", textAlign: "center" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "7.5%" }} />
                          </colgroup>
                          <thead className="sticky-top bg-light">
                            <tr>
                              <th className="text-center">ID</th>
                              <th className="text-center">System ID</th>
                              <th className="text-center">Section ID</th>
                              <th>Reported By</th>
                              <th>Location</th>
                              <th>Description</th>
                              <th className="text-center">Status</th>
                              <th>Assigned To</th>
                              <th>Reported At</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentFaults.map((fault) => (
                              <tr key={fault.id} className="table-row-hover">
                                <td className="text-center">{fault.id}</td>
                                <td className="text-center">{fault.SystemID}</td>
                                <td className="text-center">{fault.SectionID}</td>
                                <td>{fault.ReportedBy}</td>
                                <td>{fault.Location}</td>
                                <td className="description-col">{fault.DescFault}</td>
                                <td className="text-center">{fault.Status}</td>
                                <td>{fault.AssignTo}</td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  {fault.DateTime
                                    ? new Date(fault.DateTime).toLocaleString()
                                    : ""}
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-1 mb-1"
                                    onClick={() => setEditFault(fault)}
                                    aria-label={`Edit fault ${fault.id}`}
                                  >
                                    Edit
                                  </Button>

                                  {fault.Status.toLowerCase() !== "closed" && (
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      className="me-1 mb-1"
                                      onClick={() => handleMarkResolved(fault.id)}
                                      aria-label={`Mark fault ${fault.id} as resolved`}
                                    >
                                      Mark as Resolved
                                    </Button>
                                  )}

                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteFault(fault.id)}
                                    aria-label={`Delete fault ${fault.id}`}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

                        {/* Pagination Controls */}
                        <nav
                          aria-label="Fault pagination"
                          className="mt-3 px-3"
                          style={{ flexShrink: 0 }}
                        >
                          <ul className="pagination justify-content-center mb-0">
                            <li
                              className={`page-item ${
                                currentPage === 1 ? "disabled" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                                }
                                aria-label="Previous page"
                              >
                                Previous
                              </button>
                            </li>

                            {[...Array(totalPages)].map((_, idx) => {
                              const pageNum = idx + 1;
                              return (
                                <li
                                  key={pageNum}
                                  className={`page-item ${
                                    currentPage === pageNum ? "active" : ""
                                  }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(pageNum)}
                                    aria-current={
                                      currentPage === pageNum ? "page" : undefined
                                    }
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            })}

                            <li
                              className={`page-item ${
                                currentPage === totalPages || totalPages === 0
                                  ? "disabled"
                                  : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                  )
                                }
                                aria-label="Next page"
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </Card.Body>
                    </Card>
                  </Row>
                </Tab>
              </Tabs>
            )}

            {showTable && view === "resolved" && <></>}
              
              
            
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer
        className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="mb-2 mb-sm-0">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => alert("Contact support at support@nfm.lk")}
            aria-label="Contact support"
          >
            Support
          </Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0" aria-live="polite">
          Total Faults: {faults.length} | Unread Notifications:{" "}
          {notifications.filter((n) => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => setShowFooterInfo((v) => !v)}
            aria-expanded={showFooterInfo}
            aria-controls="footer-info"
          >
            {showFooterInfo ? "Hide Info" : "Show Info"}
          </Button>
          {showFooterInfo && (
            <div
              id="footer-info"
              className="mt-1"
              style={{ fontSize: "0.75rem", opacity: 0.8 }}
            >
              © 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      {/* New / Edit Fault Modal */}
      <NewFaultModal
        show={showNewFaultModal || Boolean(editFault)}
        handleClose={() => {
          setShowNewFaultModal(false);
          setEditFault(null);
        }}
        handleAdd={editFault ? handleUpdateFault : handleNewFaultSubmit}
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
        .table-fit td, .table-fit th {
          font-size: 0.98rem;
          padding: 0.45rem 0.5rem;
          vertical-align: middle;
        }
        .custom-align-table th, .custom-align-table td {
          vertical-align: middle !important;
          text-align: left;
        }
        .custom-align-table th.text-center, .custom-align-table td.text-center {
          text-align: center !important;
        }
        .custom-align-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .custom-align-table td.description-col {
          white-space: normal;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .tab-title-lg {
          font-size: 1.35rem;
          font-weight: 700;
          color: #001f3f;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }
        .description-col {
          max-width: 180px;
          white-space: normal;
          overflow-wrap: break-word;
          word-break: break-word;
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
        .glass-sidebar-title {
          background: rgba(255, 255, 255, 0.13);
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          border-radius: 16px;
          backdrop-filter: blur(8px);
          color: #001f3f;
          font-weight: 700;
          font-size: 1.5rem;
          padding: 0.7rem 0.5rem 0.7rem 0.5rem;
          margin-bottom: 1.2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        }
        .sidebar-title-text {
          color: #dfe3e7ff;
          font-weight: 600;
          font-size: 1.50rem;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.08);
        }
      `}</style>
    </>
  );
}

