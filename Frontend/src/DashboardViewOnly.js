import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Container, Row, Col, Card, Tabs, Tab } from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";
import NewFaultModal from "./NewFaultModal";

const assignablePersons = ["John Doe", "Jane Smith", "Alex Johnson", "Emily Davis"];

// Helper: Sort faults descending by DateTime (latest first)
function sortFaultsDescByDate(faults) {
  return faults.slice().sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
}

function useMultiFaults() {
  const [open, setOpen] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  // Initial fetch
  const fetchOpen = async () => {
    if (!token) return setErr("No authentication token.");
    try {
      const res = await fetch("http://localhost:5000/api/faults?status=open", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch open faults");
      const openFaults = await res.json();
      setOpen(sortFaultsDescByDate(openFaults));
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };

  const fetchResolved = async () => {
    if (!token) return setErr("No authentication token.");
    try {
      const res = await fetch("http://localhost:5000/api/faults?status=closed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch resolved faults");
      const data = await res.json();
      // Filter and sort descending
      const closedFaults = data.filter(f => f.Status.toLowerCase() === "closed");
      setResolved(sortFaultsDescByDate(closedFaults));
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };

  // Only fetch on mount
  useEffect(() => {
    fetchOpen();
    fetchResolved();
  }, []);

  // Create a new fault
  const create = async (data) => {
    if (!token) throw new Error("Authentication required.");
    const resp = await fetch("http://localhost:5000/api/faults", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create fault");
    }
    const result = await resp.json();

    // Insert new fault into open or resolved list, keeping descending order
    if (result.fault.Status.toLowerCase() === "closed") {
      setResolved(r => sortFaultsDescByDate([result.fault, ...r]));
    } else {
      setOpen(o => sortFaultsDescByDate([result.fault, ...o]));
    }
    return true;
  };

  return { open, resolved, create, err, setErr };
}

function usePagination(list, perPage = 10) {
  const [page, setPage] = useState(1);
  const max = Math.ceil(list.length / perPage);
  const current = list.slice((page - 1) * perPage, page * perPage);
  React.useEffect(() => setPage(1), [list]);
  return { current, page, setPage, max };
}

export default function DashboardViewOnly({ userInfo, notifications, setNotifications, onLogout }) {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("faults"); // 'faults' or 'resolved'
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef();
  const [footerInfo, setFooterInfo] = useState(false);

  const { open, resolved, create, err, setErr } = useMultiFaults();

  // Notifications dropdown & mark read
  useEffect(() => {
    if (showNotif) setNotifications(n => n.map(e => ({ ...e, isRead: true })));
    function outside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [showNotif, setNotifications]);

  const currentFaultArr = view === "faults" ? open : resolved;

  const filtered = React.useMemo(() => {
    return currentFaultArr.filter(f => {
      if (!f) return false;
      // Include multiple relevant fields for search
      const haystack = [f.DescFault, f.Location, f.LocationOfFault, f.ReportedBy, f.SystemID].join(" ").toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [currentFaultArr, search]);

  const { current, page, setPage, max } = usePagination(filtered);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-dark fixed-top shadow-sm" style={{ height: 60, backgroundColor: "#001f3f" }}>
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div style={{ width: 120 }} />
          <span className="navbar-brand mb-0 h1 mx-auto">⚡ N F M System Version 1.0.1</span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button
                variant="link"
                className="text-white p-0"
                onClick={() => setShowNotif(v => !v)}
                style={{ fontSize: "1.3rem" }}
                aria-label="Toggle Notifications"
              >
                <BellFill />
                {notifications.some(n => !n.isRead) && (
                  <span
                    className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0"
                    style={{ fontSize: "0.7rem", lineHeight: 1, fontWeight: "bold" }}
                  >
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </Button>
              {showNotif && (
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
                    notifications.map(note => (
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

      <Container fluid className="pt-5 mt-4">
        {err && (
          <div className="alert alert-danger" role="alert">
            {err}{" "}
            <button type="button" className="btn-close float-end" onClick={() => setErr("")} aria-label="Close" />
          </div>
        )}
        <Row>
          {/* Sidebar */}
          <Col xs={2} className="bg-dark text-white sidebar p-3 position-fixed vh-100" style={{ top: 60, left: 0, zIndex: 1040 }}>
            <div className="glass-sidebar-title mb-4 text-center">
              <span className="sidebar-title-text">Dashboard</span>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <button className="nav-link btn btn-link text-white p-0" onClick={() => setModal(true)}>
                  + Add Fault
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link btn btn-link text-white p-0${view === "faults" ? " fw-bold" : ""}`}
                  onClick={() => setView("faults")}
                >
                  📋 Fault Review Panel
                </button>
                <button
                  className={`nav-link btn btn-link text-white p-0${view === "resolved" ? " fw-bold" : ""}`}
                  onClick={() => setView("resolved")}
                >
                  ✅ Resolved Faults
                </button>
              </li>
            </ul>
          </Col>

          {/* Main Content */}
          <Col
            className="ms-auto d-flex flex-column"
            style={{ marginLeft: "16.666667%", width: "calc(100% - 16.666667%)", height: "calc(100vh - 60px)", overflow: "hidden", paddingLeft: 0, maxWidth: "82%" }}
          >
            <Tabs activeKey={view} className="custom-tabs" justify>
              <Tab eventKey="faults" title={<span className="tab-title-lg">🚧 Faults Review Panel</span>}>
                {view === "faults" && (
                  <>
                    <Row className="mb-3 px-3">
                      <Col md={4} className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search faults..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          aria-label="Search faults"
                        />
                      </Col>
                    </Row>
                    <div className="mb-2 px-3">
                      <strong>Total Faults:</strong> {filtered.length}
                    </div>
                    <FaultsTable faults={current} isResolved={false} page={page} setPage={setPage} max={max} />
                  </>
                )}
              </Tab>

              <Tab eventKey="resolved" title={<span className="tab-title-lg">✅ Resolved Faults</span>}>
                {view === "resolved" && (
                  <>
                    <Row className="mb-3 px-3">
                      <Col md={4} className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search resolved faults..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          aria-label="Search resolved faults"
                        />
                      </Col>
                    </Row>
                    <div className="mb-2 px-3">
                      <strong>Total Resolved Faults:</strong> {filtered.length}
                    </div>
                    <FaultsTable faults={current} isResolved={true} page={page} setPage={setPage} max={max} />
                  </>
                )}
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer
        className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow"
        style={{ backgroundColor: "#001f3f" }}
      >
        <div className="mb-2 mb-sm-0">
          <Button className="glass-button" size="sm" onClick={() => alert("Contact support at support@nfm.lk")}>
            Support
          </Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0" aria-live="polite">
          Total Open: {open.length} | Resolved: {resolved.length} | Unread Notifications:{" "}
          {notifications.filter(n => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => setFooterInfo(v => !v)}
            aria-expanded={footerInfo}
            aria-controls="footer-info"
          >
            {footerInfo ? "Hide Info" : "Show Info"}
          </Button>
          {footerInfo && (
            <div id="footer-info" className="mt-1" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              © 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      {/* New Fault Modal */}
      <NewFaultModal show={modal} handleClose={() => setModal(false)} handleAdd={create} assignablePersons={assignablePersons} />

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

function FaultsTable({ faults, isResolved, page, setPage, max }) {
  return (
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
              <col style={{ width: "4%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
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
              </tr>
            </thead>
            <tbody>
              {faults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    No faults.
                  </td>
                </tr>
              ) : (
                faults.map(f => (
                  <tr key={f.id} className="table-row-hover">
                    <td className="text-center">{f.id}</td>
                    <td className="text-center">{f.SystemID}</td>
                    <td className="text-center">{f.SectionID}</td>
                    <td>{f.ReportedBy}</td>
                    <td>{f.Location}</td>
                    <td className="description-col">{f.DescFault}</td>
                    <td className="text-center">{f.Status}</td>
                    <td>{f.AssignTo}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{f.DateTime ? new Date(f.DateTime).toLocaleString() : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          <nav aria-label="Fault pagination" className="mt-3 px-3" style={{ flexShrink: 0 }}>
            <ul className="pagination justify-content-center mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(Math.max(page - 1, 1))} aria-label="Previous page">
                  Previous
                </button>
              </li>
              {Array.from({ length: max }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <li key={pageNum} className={`page-item ${page === pageNum ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(pageNum)} aria-current={page === pageNum ? "page" : undefined}>
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              <li className={`page-item ${page === max || max === 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(Math.min(page + 1, max))} aria-label="Next page">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </Card.Body>
      </Card>
    </Row>
  );
}
