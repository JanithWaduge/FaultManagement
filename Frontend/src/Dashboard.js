import React, { useEffect, useRef, useState, useMemo } from "react";
import { Table, Button, Container, Row, Col, Card, Tabs, Tab, Modal, Image } from "react-bootstrap";
import { BellFill } from "react-bootstrap-icons";
import UserProfileDisplay from "./UserProfileDisplay";
import NewFaultModal from "./NewFaultModal";
import NotesModal from "./NotesModal";
import Activecharts from "./components/Activecharts";
import TechnicianCards from "./components/TechnicianCards";
import { useFaultNotes } from "./useFaultNotes";
import PhotoUploadForm from "./PhotoUploadForm";
import { PhotoModal } from "./components/PhotoModal";
import { useMultiFaults } from "./useMultiFaults";

const assignablePersons = ["John Doe", "Jane Smith", "Alex Johnson", "Emily Davis"];

function FaultsTable({ faults, onEdit, onMarkResolved, isResolved, page, setPage, max, onOpenEditModal, onOpenNotesModal }) {
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const token = localStorage.getItem("token");

  const handlePhotosClick = async (faultId) => {
    setLoadingPhotos(true);
    try {
      const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      const url = `${baseUrl}/api/photos/fault/${faultId}`;
      
      console.log("Fetching photos from:", url);
      console.log("Token:", token ? "Present" : "Missing");
      
      const res = await fetch(url, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const photos = await res.json();
      console.log("Photos fetched successfully:", photos);
      setSelectedPhotos(photos);
      setPhotosModalOpen(true);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setSelectedPhotos([]);
      setPhotosModalOpen(true);
      alert(`Failed to load photos: ${error.message}`);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleUploadSuccess = (faultId) => {
    setUploadModalOpen(null);
    handlePhotosClick(faultId);
  };

  return (
    <>
      <Row style={{ height: "calc(100vh - 60px - 130px - 80px)", overflowY: "auto" }}>
        <Card className="glass-card w-100" style={{ background: "rgba(255,255,255,0.95)", borderRadius: 20 }}>
          <Card.Body className="p-3 d-flex flex-column">
            <div className="table-responsive">
              <Table responsive className="table-fixed-header table-fit mb-0 flex-grow-1 align-middle custom-align-table table-borderless glass-table" aria-label="Faults Table">
                <colgroup className="d-none d-lg-table-column-group">
                  {[3.5, 6, 10, 10, 10, 18, 7, 10, 7.5, !isResolved && 5, 7.5, 10].filter(Boolean).map((w, i) =>
                    <col key={i} style={{ width: `${w}%`, textAlign: w === 3.5 ? "center" : "left" }} />
                  )}
                </colgroup>
                <thead className="sticky-top bg-light">
                  <tr>
                    {["ID", "Systems", "Reported By", "Location", "Location of Fault", "Description", "Status", "Assigned To", "Reported At", !isResolved && "Actions", "Photos", "Notes"].filter(Boolean).map((h, i) => (
                      <th key={i} className={i === 0 || i === 1 || (!isResolved && i === 9) || i === 10 ? "text-center" : i === 3 ? "d-none d-md-table-cell" : i === 4 ? "d-none d-lg-table-cell" : i === 8 ? "d-none d-md-table-cell" : ""}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faults.length === 0 ? (
                    <tr>
                      <td colSpan={isResolved ? 11 : 12} className="text-center text-muted py-4">
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
                        <td className="d-none d-md-table-cell">{f.Location}</td>
                        <td className="d-none d-lg-table-cell">{f.LocationOfFault}</td>
                        <td className="description-col">{f.DescFault}</td>
                        <td>
                          <select
                            value={f.Status}
                            onChange={async (e) => {
                              if (!isResolved)
                                try {
                                  await onEdit({ ...f, Status: e.target.value });
                                } catch (err) {
                                  alert("Failed to update status: " + err.message);
                                }
                            }}
                            className={`form-select form-select-sm status-${f.Status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                            disabled={isResolved}
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
                            {["In Progress", "Pending", "Closed"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{f.AssignTo}</td>
                        <td className="d-none d-md-table-cell" style={{ whiteSpace: "nowrap" }}>
                          {f.DateTime ? new Date(f.DateTime).toLocaleString() : ""}
                        </td>
                        {!isResolved && (
                          <td className="text-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => onOpenEditModal(f)}
                            >
                              Edit
                            </Button>
                          </td>
                        )}
                        <td className="text-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handlePhotosClick(f.id)}
                            title="View Photos"
                            disabled={loadingPhotos}
                            className="me-1"
                          >
                            📷
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => setUploadModalOpen(f.id)}
                            title="Upload Photo"
                          >
                            ➕
                          </Button>
                        </td>
                        <td>
                          <Button variant="outline-info" size="sm" onClick={() => onOpenNotesModal(f)} className="px-2 py-1" style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>📝 Notes</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            <nav className="mt-3 px-3" style={{ flexShrink: 0 }}>
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(Math.max(page - 1, 1))}>Previous</button>
                </li>
                {Array.from({ length: max }).map((_, idx) => (
                  <li key={idx + 1} className={`page-item ${page === idx + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === max || max === 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(Math.min(page + 1, max))}>Next</button>
                </li>
              </ul>
            </nav>
          </Card.Body>
        </Card>
      </Row>

      <PhotoModal
        show={photosModalOpen}
        photos={selectedPhotos}
        onHide={() => { setPhotosModalOpen(false); setSelectedPhotos([]); }}
        title="Fault Photos"
      />

      <Modal show={uploadModalOpen !== null} onHide={() => setUploadModalOpen(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload Photo for Fault {uploadModalOpen}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PhotoUploadForm faultId={uploadModalOpen} onUploadSuccess={() => handleUploadSuccess(uploadModalOpen)} />
        </Modal.Body>
      </Modal>
    </>
  );
}

export default function Dashboard({ userInfo, notifications, setNotifications, onLogout }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [selectedFaultForNotes, setSelectedFaultForNotes] = useState(null);
  const [footerInfo, setFooterInfo] = useState(false);
  const [filteredTechnician, setFilteredTechnician] = useState(null);
  const [filteredStatus, setFilteredStatus] = useState(null);
  const [detailedView, setDetailedView] = useState(false);
  const [err, setErr] = useState("");
  const notifRef = useRef();

  // Get data from useMultiFaults hook
  const {
    open,
    resolved,
    create,
    update,
    remove,
    resolve,
    error: faultsError,
    setOpen,
    setResolved,
  } = useMultiFaults();

  const token = localStorage.getItem("token");
  const { notes, loading, error: notesError, fetchNotes, addNote, editNote, deleteNote } = useFaultNotes(token);

  // Set error from faults hook
  useEffect(() => {
    if (faultsError) {
      setErr(faultsError);
    }
  }, [faultsError]);

  useEffect(() => {
    if (showNotif) setNotifications(n => n.map(e => ({ ...e, isRead: true })));
    const outside = (e) => { 
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); 
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [showNotif, setNotifications]);

  const currentFaultArr = view === "faults" ? open : resolved;
  const sortedFaults = useMemo(() => [...currentFaultArr].sort((a, b) => b.id - a.id), [currentFaultArr]);
  const filtered = useMemo(() => 
    sortedFaults.filter(f => 
      f && [f.DescFault, f.Location, f.LocationOfFault, f.ReportedBy, f.SystemID]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    ), 
    [sortedFaults, search]
  );

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filtered]);
  const max = Math.ceil(filtered.length / 10);
  const current = filtered.slice((page - 1) * 10, page * 10);

  const openEditModal = (fault) => { setEdit(fault); setModal(true); };
  const openNotesModal = (fault) => { setSelectedFaultForNotes(fault); setNotesModal(true); };

  const handleStatusClick = (technician, status) => {
    setFilteredTechnician(technician);
    setFilteredStatus(status);
    setDetailedView(true);
    setView(status === "Closed" ? "resolved" : "faults");
    setSearch(technician || "");
  };

  const handleTechnicianClick = (technician) => {
    setFilteredTechnician(technician);
    setFilteredStatus(null);
    setDetailedView(true);
    setView("faults");
    setSearch(technician);
  };

  const sidebarItems = [
    { label: "+ Add Fault", onClick: () => { setModal(true); setEdit(null); } },
    { label: "📋 Fault Review Panel", onClick: () => setView("faults"), active: view === "faults" },
    { label: "✅ Resolved Faults", onClick: () => setView("resolved"), active: view === "resolved" },
    { label: "📊 Active Chart", onClick: () => setView("active-chart"), active: view === "active-chart" }
  ];

  // Fixed handleAdd function
  const handleAdd = async (data) => {
    try {
      console.log("handleAdd called with data:", data);
      
      let result;
      if (data.id) {
        // Update existing fault
        console.log("Updating existing fault with ID:", data.id);
        result = await update(data);
      } else {
        // Create new fault
        console.log("Creating new fault");
        result = await create(data);
      }
      
      console.log("handleAdd result:", result);
      
      // Verify we have a valid result with ID
      if (!result || !result.id) {
        throw new Error("No fault ID returned from operation");
      }
      
      // Return the complete fault object
      return result;
    } catch (error) {
      console.error("Error in handleAdd:", error);
      setErr(error.message);
      throw error;
    }
  };

  return (
    <>
      <nav className="navbar navbar-dark fixed-top shadow-sm" style={{ height: 60, backgroundColor: "#001f3f" }}>
        <Container fluid className="d-flex justify-content-between align-items-center">
          <div style={{ width: 120 }} />
          <span 
            className="navbar-brand mb-0 h1 mx-auto" 
            style={{ cursor: "pointer" }} 
            onClick={() => (window.location.href = "/")} 
            title="Go to Dashboard"
          >
            ⚡ N F M System Version 1.0.1
          </span>
          <div className="d-flex align-items-center gap-3 position-relative">
            <div ref={notifRef} style={{ position: "relative" }}>
              <Button variant="link" className="text-white p-0" onClick={() => setShowNotif(v => !v)} style={{ fontSize: "1.3rem" }}>
                <BellFill />
                {notifications.some(n => !n.isRead) && <span className="position-absolute top-0 end-0 bg-danger text-white rounded-circle px-2 py-0" style={{ fontSize: "0.7rem", lineHeight: 1, fontWeight: "bold" }}>{notifications.filter(n => !n.isRead).length}</span>}
              </Button>
              {showNotif && (
                <div className="position-absolute" style={{ top: 35, right: 0, backgroundColor: "white", color: "#222", width: 280, maxHeight: 300, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: 8, zIndex: 1500 }}>
                  {notifications.length === 0 ? <div style={{ padding: 10 }}>No notifications</div> : notifications.map(note => <div key={note.id} style={{ padding: 10, borderBottom: "1px solid #eee", backgroundColor: note.isRead ? "#f8f9fa" : "white", fontWeight: note.isRead ? "normal" : "600" }}>{note.message}</div>)}
                </div>
              )}
            </div>
            <Button className="glass-button" size="sm" onClick={onLogout}>Logout</Button>
            <UserProfileDisplay user={userInfo} />
          </div>
        </Container>
      </nav>

      <Container fluid className="pt-5 mt-4">
        {err && (
          <div className="alert alert-danger" role="alert">
            {err}
            <button
              type="button"
              className="btn-close float-end"
              onClick={() => setErr("")}
            />
          </div>
        )}
        
        <Row>
          <Col xs={2} className="bg-dark text-white sidebar p-3 position-fixed vh-100" style={{ top: 60, left: 0, zIndex: 1040 }}>
            <div className="glass-sidebar-title mb-4 text-center" onClick={() => setView("")} style={{ cursor: "pointer" }} title="Return to Dashboard">
              <span className="sidebar-title-text">Dashboard</span>
            </div>
            <ul className="nav flex-column">
              {sidebarItems.map((item, i) => (
                <li key={i} className="nav-item mb-2">
                  <button className={`nav-link btn btn-link text-white p-0${item.active ? " fw-bold" : ""}`} onClick={item.onClick}>{item.label}</button>
                </li>
              ))}
            </ul>
          </Col>

          <Col className="ms-auto d-flex flex-column" style={{ marginLeft: "16.666667%", width: "calc(100% - 16.666667%)", height: "calc(100vh - 60px)", overflow: "hidden", paddingLeft: 0, maxWidth: "82%" }}>
            {!view ? (
              <div className="p-4">
                <h2 className="mb-4 text-center">👋 Welcome to NFM System</h2>
                <TechnicianCards
                  technicians={assignablePersons}
                  faults={[...open, ...resolved]}
                  onTechnicianClick={handleTechnicianClick}
                  onStatusClick={handleStatusClick}
                />
              </div>
            ) : (
              <Tabs activeKey={view} className="custom-tabs" justify>
                {["faults", "resolved", "active-chart"].map((tabKey) => (
                  <Tab
                    key={tabKey}
                    eventKey={tabKey}
                    title={
                      <span className="tab-title-lg">
                        {tabKey === "faults"
                          ? "🚧 Faults Review Panel"
                          : tabKey === "resolved"
                          ? "✅ Resolved Faults"
                          : "📊 Active Chart"}
                      </span>
                    }
                  >
                    {view === tabKey &&
                      (tabKey === "active-chart" ? (
                        <Activecharts
                          faults={[...open, ...resolved]}
                          onStatusClick={handleStatusClick}
                        />
                      ) : (
                        <>
                          <Row className="mb-3 px-3">
                            <Col md={4} className="mb-2">
                              <input
                                type="text"
                                className="form-control"
                                placeholder={`Search ${tabKey}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                            </Col>
                          </Row>
                          <div className="mb-2 px-3">
                            <strong>
                              Total {tabKey === "faults" ? "Faults" : "Resolved Faults"}:
                            </strong>{" "}
                            {filtered.length}
                          </div>
                          <FaultsTable
                            faults={current}
                            onEdit={update}
                            onMarkResolved={resolve}
                            isResolved={tabKey === "resolved"}
                            page={page}
                            setPage={setPage}
                            max={max}
                            onOpenEditModal={openEditModal}
                            onOpenNotesModal={openNotesModal}
                          />
                        </>
                      ))}
                  </Tab>
                ))}
              </Tabs>
            )}
          </Col>
        </Row>
      </Container>

      <footer className="fixed-bottom text-white py-2 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center shadow" style={{ backgroundColor: "#001f3f" }}>
        <div className="mb-2 mb-sm-0">
          <Button className="glass-button" size="sm" onClick={() => alert("Contact support at support@nfm.lk")}>Support</Button>
        </div>
        <div className="text-center flex-grow-1 mb-2 mb-sm-0">
          Total Open: {open.length} | Resolved: {resolved.length} | Unread Notifications: {notifications.filter(n => !n.isRead).length}
        </div>
        <div className="text-center text-sm-end">
          <Button className="glass-button" size="sm" onClick={() => setFooterInfo(v => !v)}>
            {footerInfo ? "Hide Info" : "Show Info"}
          </Button>
          {footerInfo && (
            <div className="mt-1" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              © 2025 Network Fault Management System. All rights reserved.
            </div>
          )}
        </div>
      </footer>

      <NewFaultModal
        show={modal}
        handleClose={() => {
          setModal(false);
          setEdit(null);
        }}
        handleAdd={handleAdd}
        assignablePersons={assignablePersons}
        initialData={edit}
      />
      
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

      <style>{`
        .status-in-progress-row, .status-in-progress-row td { background-color: #fff3cd !important; }
        .status-pending-row, .status-pending-row td { background-color: #cff4fc !important; }
        .status-closed-row, .status-closed-row td { background-color: #d1e7dd !important; }
        .form-select.status-in-progress { border-color: #ffc107; background-color: #fff3cd; }
        .form-select.status-pending { border-color: #0dcaf0; background-color: #cff4fc; }
        .form-select.status-closed { border-color: #198754; background-color: #d1e7dd; }
        .form-select.status-in-progress:focus { border-color: #ffc107; box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25); }
        .form-select.status-pending:focus { border-color: #0dcaf0; box-shadow: 0 0 0 0.25rem rgba(13, 202, 240, 0.25); }
        .form-select.status-closed:focus { border-color: #198754; box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25); }
        .glass-button { background: rgba(255, 255, 255, 0.1); border: 1.5px solid rgba(255, 255, 255, 0.4); border-radius: 12px; backdrop-filter: blur(10px); color: white; font-weight: 600; padding: 0.4rem 0.9rem; transition: all 0.3s ease-in-out; cursor: pointer; }
        .glass-button:hover { background: rgba(255, 255, 255, 0.35); color: #001f3f; transform: scale(1.07); box-shadow: 0 0 8px rgba(255, 255, 255, 0.6); }
        .custom-tabs .nav-link { font-weight: 600; color: #001f3f; border-radius: 10px; transition: all 0.3s ease; }
        .custom-tabs .nav-link.active { background: linear-gradient(to right, #00c6ff, #0072ff); color: white !important; box-shadow: 0 0 8px rgba(0, 114, 255, 0.5); }
        .table-fixed-header thead.sticky-top th { position: sticky; top: 0; z-index: 10; background: linear-gradient(180deg, #001f3f, #002952); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .table-fit td, .table-fit th { font-size: 0.98rem; padding: 0.45rem 0.5rem; vertical-align: middle; }
        .custom-align-table th, .custom-align-table td { vertical-align: middle !important; text-align: left; }
        .custom-align-table th.text-center, .custom-align-table td.text-center { text-align: center !important; }
        .custom-align-table td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .custom-align-table td.description-col { white-space: normal; overflow-wrap: break-word; word-break: break-word; }
        .tab-title-lg { font-size: 1.35rem; font-weight: 700; color: #001f3f; letter-spacing: 0.5px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); }
        .description-col { max-width: 180px; white-space: normal; overflow-wrap: break-word; word-break: break-word; }
        .table-row-hover:hover { filter: brightness(95%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .glass-table { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1); }
        .glass-table thead th { background: linear-gradient(180deg, #001f3f, #002952); color: white; font-weight: 600; padding: 1rem 0.5rem; border-bottom: 2px solid rgba(255, 255, 255, 0.1); text-transform: uppercase; font-size: 0.9rem; letter-spacing: 0.5px; }
        .glass-table tbody tr { transition: all 0.3s ease; border-bottom: 1px solid rgba(0, 31, 63, 0.05); }
        .glass-table tbody tr:last-child { border-bottom: none; }
        .glass-table tbody td { padding: 1rem 0.5rem; }
        .status-in-progress-row { background: linear-gradient(145deg, rgba(255, 243, 205, 0.7), rgba(255, 243, 205, 0.9)) !important; backdrop-filter: blur(5px); }
        .status-pending-row { background: linear-gradient(145deg, rgba(207, 244, 252, 0.7), rgba(207, 244, 252, 0.9)) !important; backdrop-filter: blur(5px); }
        .status-closed-row { background: linear-gradient(145deg, rgba(209, 231, 221, 0.7), rgba(209, 231, 221, 0.9)) !important; backdrop-filter: blur(5px); }
        .table-row-hover:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); cursor: pointer; }
        .form-control, .form-select { font-size: 1rem; border-radius: 8px; }
        .sidebar { background-color: #001f3f !important; height: 100vh; position: fixed; top: 60px; left: 0; z-index: 1040; overflow-y: auto; width: 16.6666667%; }
        .sidebar .nav-link.btn-link { font-size: 1rem; padding: 0.35rem 0.7rem; height: 2.1rem; border-radius: 8px; font-weight: 600; letter-spacing: 0.2px; }
        .sidebar .nav-link.btn-link:hover, .sidebar .nav-link.btn-link:focus { background-color: rgba(255, 255, 255, 0.18); color: #0072ff; }
        .glass-sidebar-title { background: rgba(255, 255, 255, 0.13); border: 1.5px solid rgba(255, 255, 255, 0.35); border-radius: 16px; backdrop-filter: blur(8px); color: #001f3f; font-weight: 700; font-size: 1.5rem; padding: 0.7rem 0.5rem 0.7rem 0.5rem; margin-bottom: 1.2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.07); transition: all 0.3s ease; cursor: pointer; }
        .glass-sidebar-title:hover { background: rgba(255, 255, 255, 0.25); transform: translateY(-2px); box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2); }
        .glass-sidebar-title:active { transform: translateY(0); }
        .sidebar-title-text { color: #dfe3e7ff; font-weight: 600; font-size: 1.50rem; letter-spacing: 0.5px; text-shadow: 1px 1px 2px rgba(0,0,0,0.08); pointer-events: none; }
        .performance-card { transition: all 0.3s ease; background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 31, 63, 0.1); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1); }
        .performance-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.15); }
        .tech-avatar { background: linear-gradient(135deg, #001f3f, #0072ff); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; }
        .performance-stats { display: flex; flex-direction: column; gap: 0.8rem; }
        .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(0, 31, 63, 0.05); border-radius: 8px; transition: all 0.2s ease; }
        .stat-item:hover { background: rgba(0, 31, 63, 0.1); }
        .stat-label { font-size: 0.9rem; color: #4a5568; }
        .stat-value { font-weight: bold; color: #2d3748; }
        .stat-item.completed { background: rgba(25, 135, 84, 0.1); }
        .stat-item.resolved { background: rgba(108, 117, 125, 0.1); }
        .stat-item.in-progress { background: rgba(255, 193, 7, 0.1); }
        .stat-item.pending { background: rgba(13, 202, 240, 0.1); }
        .donut-chart-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .donut-chart { width: 120px; height: 120px; }
        .circular-chart { display: block; margin: 10px auto; max-width: 100%; max-height: 250px; transform: rotate(-90deg); }
        .donut-segment { transition: all 0.3s ease; }
        .donut-segment.completed { stroke: #198754; }
        .donut-segment.resolved { stroke: #6c757d; }
        .donut-segment.in-progress { stroke: #ffc107; }
        .donut-segment.pending { stroke: #0dcaf0; }
        .donut-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; font-size: 0.8rem; }
        .legend-item { display: flex; align-items: center; gap: 0.3rem; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .legend-dot.completed { background-color: #198754; }
        .legend-dot.resolved { background-color: #6c757d; }
        .legend-dot.in-progress { background-color: #ffc107; }
        .legend-dot.pending { background-color: #0dcaf0; }
        .clickable-card { cursor: pointer; transition: all 0.3s ease; }
        .clickable-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0, 31, 63, 0.15); }
        .clickable-card:active { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0, 31, 63, 0.1); }
        @media (max-width: 992px) { .description-col { max-width: 120px; } .table-fit td, .table-fit th { font-size: 0.9rem; padding: 0.4rem 0.35rem; } }
        @media (max-width: 768px) { .description-col { max-width: 100px; } .table-fit td, .table-fit th { font-size: 0.85rem; padding: 0.35rem 0.3rem; } .form-select-sm { font-size: 0.75rem; padding: 0.15rem 0.5rem; } .btn-sm { padding: 0.25rem 0.4rem; font-size: 0.75rem; } }
        @media (max-width: 576px) { .table-responsive { overflow-x: auto; } .description-col { max-width: 80px; } }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .clickable-status { cursor: pointer; transition: all 0.2s ease; }
        .clickable-status:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .legend-item.clickable-status { cursor: pointer; transition: all 0.2s ease; border-radius: 4px; padding: 2px 4px; }
        .legend-item.clickable-status:hover { background-color: rgba(0, 31, 63, 0.1); }
      `}</style>
    </>
  );
}