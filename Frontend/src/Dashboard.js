import React, { useEffect, useRef, useState, useMemo } from "react";
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
import NewFaultModal from "./NewFaultModal";
import NotesModal from "./NotesModal";
import Activecharts from "./components/Activecharts";
import { useFaultNotes } from "./useFaultNotes";

const assignablePersons = [
  "John Doe",
  "Jane Smith",
  "Alex Johnson",
  "Emily Davis",
];

function useMultiFaults() {
  const [open, setOpen] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  const fetchAllFaults = async () => {
    if (!token) return setErr("No authentication token.");
    try {
      // Fetch all faults at once
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/faults`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!res.ok) throw new Error("Failed to fetch faults");
      
      const data = await res.json();
      
      // Separate open and resolved faults
      const openFaults = data.filter(fault => 
        fault.Status && fault.Status.toLowerCase() !== "closed"
      );
      const resolvedFaults = data.filter(fault => 
        fault.Status && fault.Status.toLowerCase() === "closed"
      );
      
      setOpen(openFaults);
      setResolved(resolvedFaults);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    fetchAllFaults();
  }, []);

  const create = async (data) => {
    if (!token) throw new Error("Authentication required.");
    const resp = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/faults`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(
        error.message ||
          "Failed to create fault. Server response: " +
            (error.message || "Unknown error")
      );
    }
    const result = await resp.json();
    if (result.fault.Status.toLowerCase() === "closed") {
      setResolved((r) => [...r, result.fault]);
    } else {
      setOpen((o) => [...o, result.fault]);
    }
    return true;
  };

  const update = async (data) => {
    if (!token) throw new Error("Authentication required.");
    const dataToSend = { ...data };
    if (dataToSend.SectionID === "") dataToSend.SectionID = null;

    const resp = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/faults/${data.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      }
    );

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(error.message || "Failed to update fault");
    }

    const result = await resp.json();
    const updatedFault = result.fault;

    if (updatedFault.Status.toLowerCase() === "closed") {
      setOpen((o) => o.filter((f) => f.id !== updatedFault.id));
      setResolved((r) => {
        const exists = r.some((f) => f.id === updatedFault.id);
        if (exists)
          return r.map((f) => (f.id === updatedFault.id ? updatedFault : f));
        return [...r, updatedFault];
      });
    } else {
      setOpen((o) =>
        o.map((f) => (f.id === updatedFault.id ? updatedFault : f))
      );
      setResolved((r) => r.filter((f) => f.id !== updatedFault.id));
    }
    return true;
  };

  const remove = async (id) => {
    if (!token) return;
    const resp = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/faults/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(error.message || "Failed to delete fault");
    }
    setOpen((o) => o.filter((f) => f.id !== id));
    setResolved((r) => r.filter((f) => f.id !== id));
  };

  const resolve = async (id) => {
    if (!token) return setErr("No authentication token.");
    try {
      const fault = open.find((f) => f.id === id);
      if (!fault) throw new Error("Fault not found in open list.");

      const payload = {
        SystemID: fault.SystemID,
        Location: fault.Location,
        LocationOfFault: fault.LocationOfFault,
        DescFault: fault.DescFault,
        ReportedBy: fault.ReportedBy,
        AssignTo: fault.AssignTo,
        SectionID: fault.SectionID,
        Status: "Closed",
      };

      const resp = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/faults/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to mark as resolved");
      }

      const result = await resp.json();
      setOpen((o) => o.filter((f) => f.id !== id));
      setResolved((r) => {
        if (r.some((f) => f.id === id)) return r;
        return [...r, result.fault];
      });
    } catch (error) {
      setErr(error.message);
    }
  };

  return { open, resolved, create, update, remove, resolve, err, setErr, fetchAllFaults };
}

function FaultsTable({
  faults,
  onEdit,
  onDelete,
  onMarkResolved,
  isResolved,
  page,
  setPage,
  max,
  onOpenEditModal,
  onOpenNotesModal,
}) {
  return (
    <Row
      style={{ height: "calc(100vh - 60px - 130px - 80px)", overflowY: "auto" }}
    >
      <Card
        className="glass-card w-100"
        style={{
          minWidth: 0,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
        }}
      >
        <Card.Body className="p-3 d-flex flex-column">
          <Table
            responsive
            className="table-fixed-header table-fit mb-0 flex-grow-1 align-middle custom-align-table table-borderless glass-table"
            aria-label="Faults Table"
          >
            <colgroup>
              <col style={{ width: "3.5%", textAlign: "center" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7.5%" }} />
              {!isResolved && <col style={{ width: "5%" }} />}
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead className="sticky-top bg-light">
              <tr>
                <th className="text-center">ID</th>
                <th className="text-center">Systems</th>
                <th>Reported By</th>
                <th>Location</th>
                <th>Location of Fault</th>
                <th>Description</th>
                <th className="text-center">Status</th>
                <th>Assigned To</th>
                <th>Reported At</th>
                {!isResolved && <th className="text-center">Actions</th>}
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {faults.length === 0 ? (
                <tr>
                  <td
                    colSpan={isResolved ? 10 : 11}
                    className="text-center text-muted py-4"
                  >
                    No faults.
                  </td>
                </tr>
              ) : (
                faults.map((f) => (
                  <tr
                    key={f.id}
                    className={`table-row-hover ${
                      f.Status === "In Progress"
                        ? "status-in-progress-row"
                        : f.Status === "Pending"
                        ? "status-pending-row"
                        : f.Status === "Closed"
                        ? "status-closed-row"
                        : ""
                    }`}
                  >
                    <td className="text-center">{f.id}</td>
                    <td className="text-center">{f.SystemID}</td>
                    <td>{f.ReportedBy}</td>
                    <td>{f.Location}</td>
                    <td>{f.LocationOfFault}</td>
                    <td className="description-col">{f.DescFault}</td>
                    <td>
                      <select
                        value={f.Status}
                        onChange={async (e) => {
                          if (isResolved) return;
                          const updatedFault = { ...f, Status: e.target.value };
                          try {
                            await onEdit(updatedFault);
                          } catch (err) {
                            alert("Failed to update status: " + err.message);
                          }
                        }}
                        className={`form-select form-select-sm status-${f.Status.toLowerCase().replace(
                          /\s+/g,
                          "-"
                        )}`}
                        disabled={isResolved}
                        aria-label={`Change status for fault ${f.id}`}
                        style={{
                          backgroundColor:
                            f.Status === "In Progress"
                              ? "#fff3cd"
                              : f.Status === "Pending"
                              ? "#cff4fc"
                              : f.Status === "Closed"
                              ? "#d1e7dd"
                              : "",
                          color: "#000",
                          fontWeight: "500",
                        }}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>{f.AssignTo}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {f.DateTime ? new Date(f.DateTime).toLocaleString() : ""}
                    </td>
                    {!isResolved && (
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1 mb-1"
                          onClick={() => onOpenEditModal(f)}
                          aria-label={`Edit fault ${f.id}`}
                        >
                          Edit
                        </Button>
                      </td>
                    )}
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => onOpenNotesModal(f)}
                        className="px-2 py-1"
                        style={{
                          whiteSpace: "nowrap",
                          fontSize: "0.85rem",
                        }}
                      >
                        📝 Notes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          <nav
            aria-label="Fault pagination"
            className="mt-3 px-3"
            style={{ flexShrink: 0 }}
          >
            <ul className="pagination justify-content-center mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage(Math.max(page - 1, 1))}
                  aria-label="Previous page"
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: max }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${page === pageNum ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(pageNum)}
                      aria-current={page === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  </li>
                );
              })}
              <li
                className={`page-item ${
                  page === max || max === 0 ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage(Math.min(page + 1, max))}
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
  );
}

export default function Dashboard({
  userInfo,
  notifications,
  setNotifications,
  onLogout,
}) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState(""); // 'faults' or 'resolved'
  const [showNotif, setShowNotif] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [selectedFaultForNotes, setSelectedFaultForNotes] = useState(null);
  const notifRef = useRef();
  const [footerInfo, setFooterInfo] = useState(false);

  const { open, resolved, create, update, remove, resolve, err, setErr, fetchAllFaults } =
    useMultiFaults();

  // Initialize notes hook
  const token = localStorage.getItem("token");
  const {
    notes,
    loading,
    error: notesError,
    fetchNotes,
    addNote,
    editNote,
    deleteNote,
    clearNotesCache,
  } = useFaultNotes(token);

  useEffect(() => {
    if (showNotif)
      setNotifications((n) => n.map((e) => ({ ...e, isRead: true })));
    function outside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotif(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [showNotif, setNotifications]);

  const currentFaultArr = view === "faults" ? open : resolved;

  // Sort faults by descending id (Newest first)
  const sortedFaults = useMemo(
    () => [...currentFaultArr].sort((a, b) => b.id - a.id),
    [currentFaultArr]
  );

  // Filter by search term
  const filtered = useMemo(() => {
    return sortedFaults.filter((f) => {
      if (!f) return false;
      const haystack = [
        f.DescFault,
        f.Location,
        f.LocationOfFault,
        f.ReportedBy,
        f.SystemID,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [sortedFaults, search]);

  // Pagination state
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [filtered]);
  const max = Math.ceil(filtered.length / 10);
  const current = filtered.slice((page - 1) * 10, page * 10);

  // Open modal in edit mode
  function openEditModal(fault) {
    setEdit(fault);
    setModal(true);
  }

  // Open notes modal
  function openNotesModal(fault) {
    setSelectedFaultForNotes(fault);
    setNotesModal(true);
  }

  return (
    <>
      {/* Navbar */}
      <nav
        className="navbar navbar-dark fixed-top shadow-sm"
        style={{ height: 60, backgroundColor: "#001f3f" }}
      >
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          <div style={{ width: 120 }} />
          <span className="navbar-brand mb-0 h1 mx-auto">
            ⚡ N F M System Version 1.0.1
          </span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button
                variant="link"
                className="text-white p-0"
                onClick={() => setShowNotif((v) => !v)}
                style={{ fontSize: "1.3rem" }}
                aria-label="Toggle Notifications"
              >
                <BellFill />
                {notifications.some((n) => !n.isRead) && (
                  <span
                    className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0"
                    style={{
                      fontSize: "0.7rem",
                      lineHeight: 1,
                      fontWeight: "bold",
                    }}
                  >
                    {notifications.filter((n) => !n.isRead).length}
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

      <Container fluid className="pt-5 mt-4">
        {err && (
          <div className="alert alert-danger" role="alert">
            {err}{" "}
            <button
              type="button"
              className="btn-close float-end"
              onClick={() => setErr("")}
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
                  onClick={() => {
                    setModal(true);
                    setEdit(null);
                  }}
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
              <li className="nav-item mb-2">
                <button
                  className={`nav-link btn btn-link text-white p-0${
                    view === "user-performance" ? " fw-bold" : ""
                  }`}
                  onClick={() => setView("user-performance")}
                >
                  👥 User Performance
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white p-0"
                  onClick={fetchAllFaults}
                >
                  🔄 Refresh Data
                </button>
              </li>
            </ul>
          </Col>

          {/* Main Content */}
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
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="text-center text-muted">
                  <h2 className="mb-4">👋 Welcome to NFM System</h2>
                  <p className="lead">
                    Please select an option from the sidebar to get started.
                  </p>
                </div>
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
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search faults"
                          />
                        </Col>
                      </Row>
                      <div className="mb-2 px-3">
                        <strong>Total Faults:</strong> {filtered.length}
                      </div>
                      <FaultsTable
                        faults={current}
                        onEdit={update}
                        onMarkResolved={resolve}
                        isResolved={false}
                        page={page}
                        setPage={setPage}
                        max={max}
                        onOpenEditModal={openEditModal}
                        onOpenNotesModal={openNotesModal}
                      />
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
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search resolved faults"
                          />
                        </Col>
                      </Row>
                      <div className="mb-2 px-3">
                        <strong>Total Resolved Faults:</strong>{" "}
                        {filtered.length}
                      </div>
                      <FaultsTable
                        faults={current}
                        isResolved={true}
                        page={page}
                        setPage={setPage}
                        max={max}
                        onOpenNotesModal={openNotesModal}
                      />
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
                <Tab
                  eventKey="user-performance"
                  title={
                    <span className="tab-title-lg">👥 User Performance</span>
                  }
                >
                  {view === "user-performance" && (
                    <div className="p-4">
                      <h3>User Performance</h3>
                      <p>
                        User performance metrics and analytics will be displayed
                        here.
                      </p>
                    </div>
                  )}
                </Tab>
              </Tabs>
            )}
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
          >
            Support
          </Button>
        </div>
        <div
          className="text-center flex-grow-1 mb-2 mb-sm-0"
          aria-live="polite"
        >
          Total Open: {open.length} | Resolved: {resolved.length} | Unread
          Notifications: {notifications.filter((n) => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button
            className="glass-button"
            size="sm"
            onClick={() => setFooterInfo((v) => !v)}
            aria-expanded={footerInfo}
            aria-controls="footer-info"
          >
            {footerInfo ? "Hide Info" : "Show Info"}
          </Button>
          {footerInfo && (
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

      {/* New/Edit Fault Modal */}
      <NewFaultModal
        show={modal}
        handleClose={() => {
          setModal(false);
          setEdit(null);
        }}
        handleAdd={edit ? update : create}
        assignablePersons={assignablePersons}
        initialData={edit}
      />

      {/* Notes Modal */}
      <NotesModal
        show={notesModal}
        onHide={() => {
          setNotesModal(false);
          setSelectedFaultForNotes(null);
        }}
        fault={selectedFaultForNotes}
        notes={notes}
        loading={loading}
        error={notesError}
        onAddNote={addNote}
        onEditNote={editNote}
        onDeleteNote={deleteNote}
        onFetchNotes={fetchNotes}
      />

      {/* Styles */}
      <style>{`
        /* Status Colors */
        .status-in-progress-row {
          background-color: #fff3cd !important;
        }
        .status-pending-row {
          background-color: #cff4fc !important;
        }
        .status-closed-row {
          background-color: #d1e7dd !important;
        }
        .status-in-progress-row td {
          background-color: #fff3cd !important;
        }
        .status-pending-row td {
          background-color: #cff4fc !important;
        }
        .status-closed-row td {
          background-color: #d1e7dd !important;
        }
        .form-select.status-in-progress {
          border-color: #ffc107;
          background-color: #fff3cd;
        }
        .form-select.status-pending {
          border-color: #0dcaf0;
          background-color: #cff4fc;
        }
        .form-select.status-closed {
          border-color: #198754;
          background-color: #d1e7dd;
        }
        .form-select.status-in-progress:focus {
          border-color: #ffc107;
          box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
        }
        .form-select.status-pending:focus {
          border-color: #0dcaf0;
          box-shadow: 0 0 0 0.25rem rgba(13, 202, 240, 0.25);
        }
        .form-select.status-closed:focus {
          border-color: #198754;
          box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
        }
        
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
          background: linear-gradient(180deg, #001f3f, #002952);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          filter: brightness(95%);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .glass-table {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        }
        .glass-table thead th {
          background: linear-gradient(180deg, #001f3f, #002952);
          color: white;
          font-weight: 600;
          padding: 1rem 0.5rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }
        .glass-table tbody tr {
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(0, 31, 63, 0.05);
        }
        .glass-table tbody tr:last-child {
          border-bottom: none;
        }
        .glass-table tbody td {
          padding: 1rem 0.5rem;
        }
        .status-in-progress-row {
          background: linear-gradient(145deg, rgba(255, 243, 205, 0.7), rgba(255, 243, 205, 0.9)) !important;
          backdrop-filter: blur(5px);
        }
        .status-pending-row {
          background: linear-gradient(145deg, rgba(207, 244, 252, 0.7), rgba(207, 244, 252, 0.9)) !important;
          backdrop-filter: blur(5px);
        }
        .status-closed-row {
          background: linear-gradient(145deg, rgba(209, 231, 221, 0.7), rgba(209, 231, 221, 0.9)) !important;
          backdrop-filter: blur(5px);
        }
        .table-row-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          cursor: pointer;
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