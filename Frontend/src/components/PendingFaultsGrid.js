import React, { useState, useMemo } from "react";
import { Card, Table, Form, Row, Col } from "react-bootstrap";

const PendingFaultsGrid = ({ pendingFaults }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("DateTime");
  const [sortDirection, setSortDirection] = useState("desc");

  // Filter and sort pending faults
  const filteredAndSortedFaults = useMemo(() => {
    if (!pendingFaults || pendingFaults.length === 0) return [];

    let filtered = pendingFaults.filter((fault) =>
      Object.values(fault).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Sort faults
    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "DateTime") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [pendingFaults, searchTerm, sortField, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Truncate long text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field)
      return <span className="sort-icon neutral">⇅</span>;
    return sortDirection === "asc" ? (
      <span className="sort-icon asc">▲</span>
    ) : (
      <span className="sort-icon desc">▼</span>
    );
  };

  return (
    <Card
      className="shadow-lg border-0"
      style={{ height: "600px", display: "flex", flexDirection: "column" }}
    >
      <Card.Header
        className="bg-gradient-primary border-0"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Row className="align-items-center">
          <Col md={6}>
            <h5 className="mb-0 fw-bold">
              <i className="fas fa-exclamation-triangle me-2"></i>
              All Pending Faults ({filteredAndSortedFaults.length})
            </h5>
          </Col>
          <Col md={6}>
            <div className="position-relative">
              <i
                className="fas fa-search position-absolute"
                style={{
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                  fontSize: "14px",
                }}
              ></i>
              <Form.Control
                type="text"
                placeholder="Search pending faults..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
                style={{
                  paddingLeft: "35px",
                  borderRadius: "20px",
                  border: "1px solid #e9ecef",
                }}
              />
            </div>
          </Col>
        </Row>
      </Card.Header>

      <Card.Body className="p-0" style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            overflow: "auto",
          }}
        >
          <Table
            hover
            className="mb-0 modern-table"
            style={{ minWidth: "900px" }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "#f8f9fa",
                zIndex: 10,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <tr>
                <th
                  style={{
                    cursor: "pointer",
                    width: "80px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("id")}
                  className="sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      ID
                    </span>
                    {getSortIcon("id")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "120px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("SystemID")}
                  className="sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      System
                    </span>
                    {getSortIcon("SystemID")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "120px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("SubSystem")}
                  className="d-none d-lg-table-cell sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Sub System
                    </span>
                    {getSortIcon("SubSystem")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    minWidth: "250px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("DescFault")}
                  className="sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Description
                    </span>
                    {getSortIcon("DescFault")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "120px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("Location")}
                  className="d-none d-md-table-cell sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Location
                    </span>
                    {getSortIcon("Location")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "120px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("LocationOfFault")}
                  className="d-none d-lg-table-cell sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Fault Location
                    </span>
                    {getSortIcon("LocationOfFault")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "130px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("ReportedBy")}
                  className="d-none d-md-table-cell sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Reported By
                    </span>
                    {getSortIcon("ReportedBy")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "130px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("AssignTo")}
                  className="sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Assigned To
                    </span>
                    {getSortIcon("AssignTo")}
                  </div>
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    width: "150px",
                    padding: "16px 12px",
                  }}
                  onClick={() => handleSort("DateTime")}
                  className="d-none d-lg-table-cell sortable-header"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className="fw-bold"
                      style={{ color: "#000000", fontSize: "16px" }}
                    >
                      Date Reported
                    </span>
                    {getSortIcon("DateTime")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFaults.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <div className="empty-state">
                      <i className="fas fa-search fa-3x mb-3 text-muted"></i>
                      <h6 className="text-muted">
                        {searchTerm
                          ? "No pending faults match your search"
                          : "No pending faults found"}
                      </h6>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedFaults.map((fault, index) => (
                  <tr
                    key={fault.id}
                    className={`table-row ${
                      index % 2 === 0 ? "row-even" : "row-odd"
                    }`}
                  >
                    <td style={{ padding: "16px 12px" }} className="fw-bold">
                      <span className="id-badge">#{fault.id}</span>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <span className="system-badge">{fault.SystemID}</span>
                    </td>
                    <td
                      style={{ padding: "16px 12px" }}
                      className="d-none d-lg-table-cell"
                    >
                      <span className="subsystem-text">
                        {fault.SubSystem || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <div className="description-cell" title={fault.DescFault}>
                        {truncateText(fault.DescFault, 60)}
                      </div>
                    </td>
                    <td
                      style={{ padding: "16px 12px" }}
                      className="d-none d-md-table-cell"
                    >
                      <span className="location-text">{fault.Location}</span>
                    </td>
                    <td
                      style={{ padding: "16px 12px" }}
                      className="d-none d-lg-table-cell"
                    >
                      <span className="location-text">
                        {fault.LocationOfFault || "N/A"}
                      </span>
                    </td>
                    <td
                      style={{ padding: "16px 12px" }}
                      className="d-none d-md-table-cell"
                    >
                      <span className="reporter-text">{fault.ReportedBy}</span>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <span className="assignee-text">{fault.AssignTo}</span>
                    </td>
                    <td
                      style={{ padding: "16px 12px" }}
                      className="d-none d-lg-table-cell"
                    >
                      <span className="date-text">
                        {formatDate(fault.DateTime)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      <style>{`
        .modern-table {
          margin-bottom: 0;
        }
        
        .sortable-header {
          transition: all 0.2s ease;
          user-select: none;
        }
        
        .sortable-header:hover {
          background-color: #e9ecef !important;
          transform: translateY(-1px);
        }
        
        .sort-icon {
          margin-left: 4px;
          font-size: 12px;
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        
        .sort-icon.neutral {
          color: #6c757d;
        }
        
        .sort-icon.asc {
          color: #28a745;
          opacity: 1;
        }
        
        .sort-icon.desc {
          color: #dc3545;
          opacity: 1;
        }
        
        .table-row {
          transition: all 0.2s ease;
          border: none;
        }
        
        .table-row:hover {
          background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 100%) !important;
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .row-even {
          background-color: #ffffff;
        }
        
        .row-odd {
          background-color: #f8f9fa;
        }
        
        .id-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
        }
        
        .system-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 15px;
          font-size: 15px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .assignee-text {
          color: #000000;
          font-size: 16px;
          font-weight: 600;
        }
        
        .subsystem-text {
          color: #000000;
          font-size: 16px;
          font-style: italic;
          font-weight: 500;
        }
        
        .description-cell {
          color: #000000;
          line-height: 1.4;
          font-size: 16px;
          font-weight: 500;
        }
        
        .location-text {
          color: #000000;
          font-size: 16px;
          font-weight: 500;
        }
        
        .reporter-text {
          color: #000000;
          font-size: 16px;
          font-weight: 600;
        }
        
        .date-text {
          color: #000000;
          font-size: 15px;
          font-family: monospace;
          font-weight: 500;
        }
        
        .empty-state {
          padding: 2rem;
        }
        
        .empty-state i {
          opacity: 0.3;
        }
        
        /* Custom scrollbar styling */
        .card-body > div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .card-body > div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .card-body > div::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        
        .card-body > div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modern-table th, .modern-table td {
            font-size: 15px;
            padding: 12px 8px !important;
          }
          
          .id-badge, .system-badge {
            font-size: 13px;
            padding: 4px 8px;
          }
          
          .subsystem-text, .description-cell, .location-text, .reporter-text {
            font-size: 14px;
          }
          
          .date-text {
            font-size: 13px;
          }
        }
        
        @media (max-width: 576px) {
          .modern-table th, .modern-table td {
            font-size: 14px;
            padding: 8px 6px !important;
          }
          
          .id-badge, .system-badge {
            font-size: 12px;
            padding: 3px 6px;
          }
          
          .subsystem-text, .description-cell, .location-text, .reporter-text {
            font-size: 13px;
          }
          
          .date-text {
            font-size: 12px;
          }
        }
      `}</style>
    </Card>
  );
};

export default PendingFaultsGrid;
