import React, { useState, useMemo } from "react";
import {
  Table,
  Badge,
  Card,
  Form,
  Row,
  Col,
  Button,
  Dropdown,
  InputGroup,
} from "react-bootstrap";

const EnhancedPendingFaultsTable = ({
  faults,
  onViewDetails,
  title = "All Pending Faults",
}) => {
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Enhanced filtering and sorting logic
  const filteredAndSortedFaults = useMemo(() => {
    let filtered = [...faults];

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (fault) =>
          fault.DescFault?.toLowerCase().includes(searchLower) ||
          fault.Location?.toLowerCase().includes(searchLower) ||
          fault.LocationOfFault?.toLowerCase().includes(searchLower) ||
          fault.ReportedBy?.toLowerCase().includes(searchLower) ||
          fault.AssignTo?.toLowerCase().includes(searchLower) ||
          fault.SystemID?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((fault) => fault.Status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      if (priorityFilter === "high") {
        filtered = filtered.filter(
          (fault) => fault.isHighPriority || fault.Priority === "High"
        );
      } else {
        filtered = filtered.filter(
          (fault) => !fault.isHighPriority && fault.Priority !== "High"
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

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

    return filtered;
  }, [
    faults,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedFaults.length / pageSize);
  const paginatedFaults = filteredAndSortedFaults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort column click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Check if a fault is overdue
  const isOverdue = (fault) => {
    if (!fault.DateTime || fault.Status === "Closed" || fault.Status === "Hold")
      return false;
    const faultDate = new Date(fault.DateTime);
    const currentDate = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    return currentDate - faultDate > weekInMs;
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return { bg: "primary", icon: "⚡" };
      case "Pending":
        return { bg: "warning", icon: "⏳" };
      case "Hold":
        return { bg: "secondary", icon: "⏸️" };
      case "Closed":
        return { bg: "success", icon: "✅" };
      default:
        return { bg: "info", icon: "ℹ️" };
    }
  };

  // Handle row selection
  const handleRowSelect = (faultId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(faultId)) {
      newSelected.delete(faultId);
    } else {
      newSelected.add(faultId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedFaults.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedFaults.map((f) => f.id)));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="enhanced-faults-table">
      <Card className="shadow-lg border-0 h-100">
        {/* Enhanced Header */}
        <Card.Header className="enhanced-header">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0 text-white fw-bold">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {title}
              </h5>
              <Badge bg="light" text="dark" pill className="px-3 py-2">
                {filteredAndSortedFaults.length}
              </Badge>
            </div>

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <div className="d-flex gap-2">
                <Button size="sm" variant="outline-light">
                  <i className="bi bi-download me-1"></i>
                  Export ({selectedRows.size})
                </Button>
                <Button size="sm" variant="outline-light">
                  <i className="bi bi-pencil me-1"></i>
                  Edit Selected
                </Button>
              </div>
            )}
          </div>
        </Card.Header>

        {/* Enhanced Filters */}
        <div className="p-3 bg-light border-bottom">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search faults..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>

            <Col md={2}>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Hold">Hold</option>
                <option value="Closed">Closed</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Select
                size="sm"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="normal">Normal Priority</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Select
                size="sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </Form.Select>
            </Col>

            <Col md={2} className="text-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <i className="bi bi-three-dots-vertical"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>
                    <i className="bi bi-download me-2"></i>
                    Export CSV
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <i className="bi bi-file-pdf me-2"></i>
                    Export PDF
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>

        {/* Enhanced Table */}
        <Card.Body className="p-0">
          <div className="table-responsive enhanced-table-container">
            <Table hover className="mb-0 enhanced-table">
              <thead className="enhanced-table-header">
                <tr>
                  <th className="text-center" style={{ width: "40px" }}>
                    <Form.Check
                      type="checkbox"
                      checked={
                        selectedRows.size === paginatedFaults.length &&
                        paginatedFaults.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th
                    className="text-center sortable-header"
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
                  </th>
                  <th
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
                  </th>
                  <th
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
                  </th>
                  <th
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
                  </th>
                  <th
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
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("AssignTo")}
                  >
                    Assigned To
                    {sortField === "AssignTo" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("DateTime")}
                  >
                    Reported At
                    {sortField === "DateTime" && (
                      <i
                        className={`bi bi-arrow-${
                          sortDirection === "asc" ? "up" : "down"
                        } ms-1`}
                      ></i>
                    )}
                  </th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFaults.map((fault, index) => {
                  const statusBadge = getStatusBadge(fault.Status);
                  const overdueClass = isOverdue(fault) ? " table-danger" : "";

                  return (
                    <tr
                      key={fault.id}
                      className={`enhanced-table-row${overdueClass}`}
                      onClick={() => onViewDetails && onViewDetails(fault)}
                    >
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedRows.has(fault.id)}
                          onChange={() => handleRowSelect(fault.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="text-center">
                        {(fault.isHighPriority ||
                          fault.Priority === "High") && (
                          <Badge bg="danger" className="priority-badge">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            HIGH
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="info" className="id-badge">
                          #{fault.id}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary" className="system-badge">
                          {fault.SystemID}
                        </Badge>
                      </td>
                      <td>
                        <div
                          className="description-cell"
                          title={fault.DescFault}
                        >
                          {fault.DescFault?.length > 50
                            ? `${fault.DescFault.substring(0, 50)}...`
                            : fault.DescFault}
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusBadge.bg} className="status-badge">
                          <span className="me-1">{statusBadge.icon}</span>
                          {fault.Status}
                        </Badge>
                      </td>
                      <td>
                        <span className="technician-name">
                          {fault.AssignTo || "Unassigned"}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(fault.DateTime)}
                        </small>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails && onViewDetails(fault);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredAndSortedFaults.length)}{" "}
              of {filteredAndSortedFaults.length} entries
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }

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
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </Card.Footer>
        )}
      </Card>

      {/* Enhanced Styles */}
      <style jsx>{`
        .enhanced-faults-table .enhanced-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 1rem 1.5rem;
        }

        .enhanced-table-container {
          max-height: 600px;
          overflow-y: auto;
        }

        .enhanced-table-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .enhanced-table-header th {
          border: none;
          padding: 1rem 0.75rem;
          font-weight: 600;
          color: #495057;
          vertical-align: middle;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .sortable-header:hover {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }

        .enhanced-table-row {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .enhanced-table-row:hover {
          background-color: rgba(0, 123, 255, 0.05);
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .enhanced-table-row td {
          vertical-align: middle;
          padding: 0.75rem;
          border-color: #f1f3f4;
        }

        .priority-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .id-badge {
          font-family: "Courier New", monospace;
          font-weight: 600;
          border-radius: 8px;
        }

        .system-badge {
          border-radius: 15px;
          font-weight: 500;
        }

        .status-badge {
          border-radius: 20px;
          padding: 0.4rem 0.8rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }

        .description-cell {
          font-size: 0.9rem;
          line-height: 1.4;
          color: #6c757d;
        }

        .technician-name {
          font-weight: 500;
          color: #495057;
        }

        /* Custom scrollbar */
        .enhanced-table-container::-webkit-scrollbar {
          width: 8px;
        }

        .enhanced-table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .enhanced-table-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }

        .enhanced-table-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .enhanced-header {
            padding: 0.75rem 1rem;
          }

          .enhanced-header h5 {
            font-size: 1rem;
          }

          .enhanced-table-row td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedPendingFaultsTable;
