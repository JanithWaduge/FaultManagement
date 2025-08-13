import React, { useState } from "react";
import { Table, Badge, Card } from "react-bootstrap";

const AllPendingFaultsTable = ({ faults, onViewDetails }) => {
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
    <Card className="shadow-sm border-0 h-100">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">All Pending Faults</h5>
        <Badge bg="light" text="dark" pill>
          {sortedFaults.length}
        </Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive" style={{ maxHeight: "600px" }}>
          <Table hover className="mb-0">
            <thead className="bg-light sticky-top">
              <tr>
                <th className="text-center" style={{ width: "5%" }}>
                  <span
                    className="sortable-header"
                    onClick={() => handleSort("isHighPriority")}
                  >
                    🚩
                    {sortField === "isHighPriority" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </span>
                </th>
                <th className="text-center" style={{ width: "10%" }}>
                  <span
                    className="sortable-header"
                    onClick={() => handleSort("id")}
                  >
                    ID
                    {sortField === "id" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </span>
                </th>
                <th style={{ width: "40%" }}>
                  <span
                    className="sortable-header"
                    onClick={() => handleSort("DescFault")}
                  >
                    Description
                    {sortField === "DescFault" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </span>
                </th>
                <th style={{ width: "15%" }}>
                  <span
                    className="sortable-header"
                    onClick={() => handleSort("SystemID")}
                  >
                    System
                    {sortField === "SystemID" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </span>
                </th>
                <th style={{ width: "15%" }}>
                  <span
                    className="sortable-header"
                    onClick={() => handleSort("Status")}
                  >
                    Status
                    {sortField === "Status" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFaults.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No pending faults found.
                  </td>
                </tr>
              ) : (
                sortedFaults.map((fault) => (
                  <tr
                    key={fault.id}
                    className={isOverdue(fault) ? "table-danger" : ""}
                    onClick={() => onViewDetails(fault)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="text-center">
                      {fault.isHighPriority || fault.Priority === "High" ? (
                        <span style={{ color: "red", fontSize: "1.2em" }}>
                          ⚑
                        </span>
                      ) : null}
                    </td>
                    <td className="text-center fw-bold">{fault.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div>
                          <div
                            className="text-truncate"
                            style={{ maxWidth: "300px" }}
                          >
                            {fault.DescFault}
                          </div>
                          <small className="text-muted">
                            Reported by: {fault.ReportedBy || "Unknown"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="info" pill className="text-bg-light border">
                        {fault.SystemID}
                      </Badge>
                      {fault.SubSystem && (
                        <div>
                          <small className="text-muted">
                            {fault.SubSystem}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge bg={getStatusBadge(fault.Status)} pill>
                        {fault.Status}
                      </Badge>
                      {renderPriorityBadge(fault)}
                      {isOverdue(fault) && (
                        <Badge bg="danger" className="ms-1" pill>
                          Overdue
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
      <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
        <small className="text-muted">
          Showing {sortedFaults.length} faults
        </small>
        <div>
          <Badge bg="danger" className="me-2">
            High Priority
          </Badge>
          <Badge bg="danger" pill>
            Overdue
          </Badge>
        </div>
      </Card.Footer>

      <style jsx>{`
        .sortable-header {
          cursor: pointer;
          user-select: none;
        }
        .sortable-header:hover {
          text-decoration: underline;
        }
        .priority-badge {
          margin-left: 5px;
        }
        thead.sticky-top {
          z-index: 1;
        }
      `}</style>
    </Card>
  );
};

export default AllPendingFaultsTable;
