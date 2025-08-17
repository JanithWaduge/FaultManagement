import React, { useState } from "react";
import { Table, Badge, Card } from "react-bootstrap";

const AllPendingFaultsTable = ({ faults }) => {
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Sort faults based on current sort field and direction
  const sortedFaults = [...faults].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    // Special handling for dates
    if (sortField === "DateTime") {
      valueA = new Date(valueA || 0).getTime();
      valueB = new Date(valueB || 0).getTime();
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Handle sort column click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Check if a fault is overdue (more than a week old)
  const isOverdue = (fault) => {
    if (!fault.DateTime || fault.Status === "Closed" || fault.Status === "Hold")
      return false;
    const faultDate = new Date(fault.DateTime);
    const currentDate = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return currentDate - faultDate > weekInMs;
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return "primary";
      case "Pending":
        return "warning";
      case "Hold":
        return "secondary";
      case "Closed":
        return "success";
      default:
        return "info";
    }
  };

  // Get priority badge
  const renderPriorityBadge = (fault) => {
    if (fault.isHighPriority || fault.Priority === "High") {
      return (
        <Badge bg="danger" className="priority-badge">
          High
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="professional-table-card shadow-lg border-0 h-100">
      <Card.Header className="professional-header">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 text-white fw-bold d-flex align-items-center">
              <i className="bi bi-list-check me-2"></i>
              All Pending Faults
            </h5>
            <Badge bg="light" text="dark" pill className="professional-count-badge">
              {sortedFaults.length}
            </Badge>
          </div>
          <div className="header-actions">
            <Badge bg="warning" className="me-2">
              <i className="bi bi-clock me-1"></i>
              Active
            </Badge>
            <Badge bg="danger">
              <i className="bi bi-exclamation-triangle me-1"></i>
              {sortedFaults.filter(f => isOverdue(f)).length} Overdue
            </Badge>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="professional-table-container">
          <Table hover className="mb-0 professional-table">
            <thead className="professional-table-head">
              <tr>
                <th className="text-center professional-th" style={{ width: "5%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("isHighPriority")}
                  >
                    <i className="bi bi-flag-fill text-danger"></i>
                    {sortField === "isHighPriority" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="text-center professional-th" style={{ width: "8%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("id")}
                  >
                    <i className="bi bi-hash me-1"></i>ID
                    {sortField === "id" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "22%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("DescFault")}
                  >
                    <i className="bi bi-file-text me-1"></i>Description
                    {sortField === "DescFault" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "10%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("SystemID")}
                  >
                    <i className="bi bi-cpu me-1"></i>System
                    {sortField === "SystemID" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "10%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("LocationOfFault")}
                  >
                    <i className="bi bi-geo-alt me-1"></i>Location
                    {sortField === "LocationOfFault" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "10%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("Status")}
                  >
                    <i className="bi bi-gear me-1"></i>Status
                    {sortField === "Status" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "15%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("AssignTo")}
                  >
                    <i className="bi bi-person me-1"></i>Assigned To
                    {sortField === "AssignTo" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="professional-th" style={{ width: "15%" }}>
                  <span
                    className="professional-sortable-header"
                    onClick={() => handleSort("DateTime")}
                  >
                    <i className="bi bi-calendar me-1"></i>Reported At
                    {sortField === "DateTime" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1 sort-indicator`}
                      ></i>
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="professional-table-body">
              {sortedFaults.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="empty-state">
                      <i className="bi bi-search text-muted" style={{ fontSize: "3rem" }}></i>
                      <h6 className="text-muted mt-3">No pending faults found</h6>
                      <p className="text-muted small">All faults have been resolved or no data is available.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedFaults.map((fault, index) => (
                  <tr
                    key={fault.id}
                    className={`professional-table-row ${isOverdue(fault) ? "overdue-row" : ""} ${index % 2 === 0 ? "even-row" : "odd-row"}`}
                  >
                    <td className="text-center professional-td">
                      {fault.isHighPriority || fault.Priority === "High" ? (
                        <span className="priority-indicator">
                          <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                        </span>
                      ) : (
                        <span className="priority-placeholder">—</span>
                      )}
                    </td>
                    <td className="text-center professional-td">
                      <Badge bg="primary" className="id-badge">
                        #{fault.id}
                      </Badge>
                    </td>
                    <td className="professional-td">
                      <div className="fault-description">
                        <div className="description-text" title={fault.DescFault}>
                          {fault.DescFault}
                        </div>
                        <div className="reported-by">
                          <i className="bi bi-person-check me-1"></i>
                          <small className="text-muted">
                            {fault.ReportedBy || "Unknown"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="professional-td">
                      <div className="system-info">
                        <Badge bg="info" className="system-badge">
                          <i className="bi bi-cpu me-1"></i>
                          {fault.SystemID}
                        </Badge>
                        {fault.SubSystem && (
                          <div className="subsystem-info">
                            <small className="text-muted">
                              <i className="bi bi-diagram-3 me-1"></i>
                              {fault.SubSystem}
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="professional-td">
                      <div className="location-info">
                        <i className="bi bi-geo-alt text-primary me-1"></i>
                        <span className="location-text">
                          {fault.LocationOfFault || fault.Location || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="professional-td">
                      <div className="status-badges">
                        <Badge bg={getStatusBadge(fault.Status)} className="status-badge">
                          {fault.Status}
                        </Badge>
                        {renderPriorityBadge(fault)}
                        {isOverdue(fault) && (
                          <Badge bg="danger" className="mt-1 overdue-badge">
                            <i className="bi bi-clock me-1"></i>
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="professional-td">
                      <div className="assignee-info">
                        <i className="bi bi-person-fill text-secondary me-2"></i>
                        <span className="assignee-name">
                          {fault.AssignTo || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="professional-td">
                      <div className="date-info">
                        <i className="bi bi-calendar-event text-info me-1"></i>
                        <span className="date-text">
                          {fault.DateTime
                            ? new Date(fault.DateTime).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      <Card.Footer className="professional-footer">
        <div className="d-flex justify-content-between align-items-center">
          <div className="table-stats">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Showing {sortedFaults.length} pending faults
            </small>
          </div>
          <div className="legend-badges">
            <Badge bg="danger" className="me-2 legend-badge">
              <i className="bi bi-exclamation-triangle me-1"></i>
              High Priority
            </Badge>
            <Badge bg="warning" className="me-2 legend-badge">
              <i className="bi bi-clock me-1"></i>
              Overdue
            </Badge>
            <Badge bg="success" className="legend-badge">
              <i className="bi bi-check-circle me-1"></i>
              Active
            </Badge>
          </div>
        </div>
      </Card.Footer>

      <style jsx>{`
        /* Professional Table Card Styling */
        .professional-table-card {
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          box-shadow: 0 10px 30px rgba(0, 31, 63, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .professional-table-card:hover {
          box-shadow: 0 20px 40px rgba(0, 31, 63, 0.15);
          transform: translateY(-2px);
        }

        /* Professional Header */
        .professional-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 1.5rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .professional-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
                      linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%);
          background-size: 20px 20px;
          opacity: 0.3;
        }

        .professional-count-badge {
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.9) !important;
          color: #495057 !important;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header-actions .badge {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }

        /* Professional Table Container */
        .professional-table-container {
          max-height: 600px;
          overflow-y: auto;
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
        }

        .professional-table-container::-webkit-scrollbar {
          width: 8px;
        }

        .professional-table-container::-webkit-scrollbar-track {
          background: #f1f3f4;
          border-radius: 10px;
        }

        .professional-table-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        .professional-table-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }

        /* Professional Table Head */
        .professional-table-head {
          background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .professional-th {
          border: none;
          padding: 1.2rem 1rem;
          font-weight: 700;
          color: #495057;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          background: transparent;
          position: relative;
        }

        .professional-th::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #007bff, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .professional-sortable-header {
          cursor: pointer;
          user-select: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          color: #495057;
        }

        .professional-sortable-header:hover {
          background: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.05));
          color: #007bff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
        }

        .sort-indicator {
          color: #007bff;
          font-weight: bold;
        }

        /* Professional Table Body */
        .professional-table-body {
          background: transparent;
        }

        .professional-table-row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: none;
          position: relative;
        }

        .professional-table-row.even-row {
          background: rgba(255, 255, 255, 0.9);
        }

        .professional-table-row.odd-row {
          background: rgba(248, 249, 250, 0.9);
        }

        .professional-table-row.overdue-row {
          background: linear-gradient(135deg, rgba(220, 53, 69, 0.08), rgba(220, 53, 69, 0.03)) !important;
          border-left: 3px solid #dc3545;
        }

        .professional-td {
          padding: 1.2rem 1rem;
          border: none;
          vertical-align: middle;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* Specific Element Styling */
        .priority-indicator {
          font-size: 1.2rem;
          animation: pulse 2s infinite;
        }

        .priority-placeholder {
          color: #dee2e6;
          font-size: 1.2rem;
        }

        .id-badge {
          font-weight: 700;
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #007bff, #0056b3) !important;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .fault-description {
          max-width: 300px;
        }

        .description-text {
          font-weight: 500;
          color: #495057;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .reported-by {
          margin-top: 0.3rem;
          display: flex;
          align-items: center;
        }

        .system-badge {
          background: linear-gradient(135deg, #17a2b8, #138496) !important;
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
        }

        .subsystem-info {
          margin-top: 0.3rem;
          display: flex;
          align-items: center;
        }

        .location-info, .assignee-info, .date-info {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: #495057;
        }

        .status-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;
        }

        .status-badge {
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          border-radius: 15px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .overdue-badge {
          font-size: 0.75rem;
          animation: pulse 2s infinite;
        }

        .assignee-name {
          font-weight: 500;
          color: #495057;
        }

        .date-text {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9rem;
          color: #6c757d;
        }

        /* Empty State */
        .empty-state {
          padding: 3rem 2rem;
          text-align: center;
        }

        /* Professional Footer */
        .professional-footer {
          background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
          border: none;
          padding: 1rem 2rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .legend-badge {
          font-size: 0.75rem;
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-weight: 500;
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .professional-header {
            padding: 1rem 1.5rem;
          }
          
          .professional-td {
            padding: 0.8rem 0.5rem;
            font-size: 0.9rem;
          }
          
          .fault-description {
            max-width: 200px;
          }
        }
      `}</style>
    </Card>
  );
};

export default AllPendingFaultsTable;
