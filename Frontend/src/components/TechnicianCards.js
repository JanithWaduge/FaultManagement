import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Pagination,
} from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";

const TechnicianCards = ({
  technicians,
  faults,
  onTechnicianClick,
  onStatusClick,
  userInfo, // Add userInfo prop
}) => {
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [filteredFaults, setFilteredFaults] = useState([]);

  // Log the component state on every render
  useEffect(() => {
    console.log("Component state:", {
      showDetailView,
      selectedTechnician,
      selectedStatus,
      filteredFaults: filteredFaults.length,
    });
  }, [showDetailView, selectedTechnician, selectedStatus, filteredFaults]);

  // Reset pagination when filtered faults change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredFaults]);

  // Handler for status clicks
  const handleStatusClick = (technician, status, e) => {
    // Make sure the click doesn't bubble up to the card
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log("Status clicked:", { technician, status });

    // Filter faults by technician and status
    let filtered = [...faults];

    if (technician) {
      filtered = filtered.filter(
        (f) =>
          f.AssignTo &&
          f.AssignTo.toString().trim().toLowerCase() ===
            technician.toString().trim().toLowerCase()
      );
    }

    if (status) {
      filtered = filtered.filter(
        (f) =>
          f.Status &&
          f.Status.toString().trim().toLowerCase() ===
            status.toString().trim().toLowerCase()
      );
    }

    console.log("Filtered faults count:", filtered.length);

    // Set state locally first
    setSelectedTechnician(technician);
    setSelectedStatus(status);
    setFilteredFaults(filtered);
    setShowDetailView(true);

    // IMPORTANT: Remove or comment out the parent handler call to prevent navigation
    // if (onStatusClick) {
    //   onStatusClick(technician, status);
    // }
  };

  // Handler for technician card clicks
  const handleTechnicianClick = (technician) => {
    // Filter faults by technician
    const filtered = faults.filter(
      (f) =>
        f.AssignTo &&
        f.AssignTo.trim().toLowerCase() === technician.trim().toLowerCase()
    );

    // Set the filtered faults before showing detail view
    setFilteredFaults(filtered);
    setSelectedTechnician(technician);
    setSelectedStatus(null);
    setShowDetailView(true);

    // IMPORTANT: Remove or comment out the parent handler call to prevent navigation
    // if (onTechnicianClick) {
    //   onTechnicianClick(technician);
    // }
  };

  // Handler to go back to cards view
  const handleBackToCards = () => {
    setShowDetailView(false);
    setSelectedTechnician(null);
    setSelectedStatus(null);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    if (!status) return "primary";

    switch (status.toString().toLowerCase()) {
      case "in progress":
        return "warning";
      case "pending":
        return "info";
      case "closed":
        return "success";
      case "resolved":
        return "secondary";
      default:
        return "primary";
    }
  };

  // At the top of your component function, add:
  console.log("Rendering TechnicianCards with state:", {
    showDetailView,
    filteredFaults: filteredFaults?.length,
    faults: faults?.length,
  });

  // Update your conditional rendering check
  if (showDetailView) {
    console.log("🔍 Detail view should render now!");
    console.log("Filtered faults:", filteredFaults);

    // Add pagination functionality
    const indexOfLastFault = currentPage * itemsPerPage;
    const indexOfFirstFault = indexOfLastFault - itemsPerPage;
    const currentFaults = filteredFaults.slice(
      indexOfFirstFault,
      indexOfLastFault
    );

    // Calculate page numbers
    const totalPages = Math.ceil(filteredFaults.length / itemsPerPage);

    // Generate pagination items
    const renderPaginationItems = () => {
      const items = [];

      // Previous button
      items.push(
        <Pagination.Prev
          key="prev"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        />
      );

      // Page numbers - show 5 pages at most
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + 4);

      // First page
      if (startPage > 1) {
        items.push(
          <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
            1
          </Pagination.Item>
        );
        if (startPage > 2) {
          items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
        }
      }

      // Numbered pages
      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => setCurrentPage(number)}
          >
            {number}
          </Pagination.Item>
        );
      }

      // Last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
        }
        items.push(
          <Pagination.Item
            key={totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }

      // Next button
      items.push(
        <Pagination.Next
          key="next"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages || totalPages === 0}
        />
      );

      return items;
    };

    return (
      <div className="fault-details-container animate-fade-in">
        <Row className="mb-3">
          <Col>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
              <div>
                <Button
                  variant="outline-primary"
                  className="mb-2 mb-md-0"
                  onClick={() => {
                    setShowDetailView(false);
                    setSelectedTechnician(null);
                    setSelectedStatus(null);
                    setFilteredFaults([]);
                  }}
                >
                  <ArrowLeft size={18} className="me-1" /> Back
                </Button>
              </div>
              <div className="d-flex flex-column flex-md-row align-items-md-center">
                <h2 className="h3 mb-1 mb-md-0 me-md-2">
                  {selectedTechnician
                    ? `${selectedTechnician}'s ${selectedStatus || ""} Faults`
                    : selectedStatus
                    ? `All ${selectedStatus} Faults`
                    : "Fault Details"}
                </h2>
                <Badge
                  bg="primary"
                  className="align-self-start align-self-md-auto mb-2 mb-md-0"
                >
                  {filteredFaults.length}{" "}
                  {filteredFaults.length === 1 ? "Record" : "Records"}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>

        {/* Table with paginated data */}
        <Row>
          <Col>
            <Card className="shadow-sm glass-card">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle glass-table">
                    <thead>
                      <tr>
                        <th className="text-center">ID</th>
                        <th className="text-center">System</th>
                        <th>Reported By</th>
                        <th className="d-none d-md-table-cell">Location</th>
                        <th className="d-none d-lg-table-cell">
                          Fault Location
                        </th>
                        <th>Description</th>
                        <th className="text-center">Status</th>
                        <th>Assigned To</th>
                        <th className="d-none d-md-table-cell">Reported At</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFaults.length === 0 ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="text-center py-4 text-muted"
                          >
                            <div className="my-3">
                              <i
                                className="bi bi-search fs-1 d-block mb-2"
                                style={{ opacity: 0.5 }}
                              ></i>
                              No records found for{" "}
                              {selectedTechnician
                                ? `technician ${selectedTechnician}`
                                : ""}{" "}
                              {selectedStatus
                                ? `with status ${selectedStatus}`
                                : ""}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentFaults.map((fault) => (
                          <tr
                            key={fault.id}
                            className={`status-${fault.Status?.toLowerCase().replace(
                              /\s+/g,
                              "-"
                            )}-row table-row-hover`}
                          >
                            <td className="text-center">{fault.id}</td>
                            <td className="text-center">{fault.SystemID}</td>
                            <td>{fault.ReportedBy}</td>
                            <td className="d-none d-md-table-cell">
                              {fault.Location}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {fault.LocationOfFault}
                            </td>
                            <td className="description-col">
                              {fault.DescFault}
                            </td>
                            <td className="text-center">
                              <Badge
                                bg={getStatusColor(fault.Status)}
                                className="status-badge"
                              >
                                {fault.Status}
                              </Badge>
                            </td>
                            <td>{fault.AssignTo}</td>
                            <td
                              className="d-none d-md-table-cell"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {fault.DateTime
                                ? new Date(fault.DateTime).toLocaleString()
                                : ""}
                            </td>
                            <td className="text-center">
                              <div className="d-flex flex-column flex-sm-row gap-1 justify-content-center">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="btn-sm-block"
                                >
                                  📝 Notes
                                </Button>
                                {fault.Status !== "Closed" && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="btn-sm-block"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>

              {/* Add pagination controls */}
              {filteredFaults.length > 0 && (
                <Card.Footer className="d-flex justify-content-between align-items-center py-2 bg-white border-0">
                  <div className="small text-muted">
                    Showing {indexOfFirstFault + 1} to{" "}
                    {Math.min(indexOfLastFault, filteredFaults.length)} of{" "}
                    {filteredFaults.length} records
                  </div>
                  <Pagination size="sm" className="mb-0 pagination-custom">
                    {renderPaginationItems()}
                  </Pagination>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>

        <style>{`
          .fault-details-container {
            padding: 0.75rem;
            margin-bottom: 1.5rem;
          }

          /* Animations */
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Table Styles */
          .glass-table {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
          }

          .glass-table thead th {
            background: linear-gradient(180deg, #001f3f, #002952);
            color: white;
            font-weight: 600;
            padding: 0.8rem 0.5rem;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .table-responsive {
            max-height: calc(100vh - 280px); /* Adjust for pagination */
            overflow-y: auto;
            scrollbar-width: thin;
          }

          /* Status Styles */
          .description-col {
            max-width: 160px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .status-badge {
            font-size: 0.8rem;
            padding: 0.4em 0.8em;
            white-space: nowrap;
          }

          /* Status row highlights with gradients */
          .status-in-progress-row {
            background: linear-gradient(
              145deg,
              rgba(255, 243, 205, 0.7),
              rgba(255, 243, 205, 0.9)
            ) !important;
            backdrop-filter: blur(5px);
          }

          .status-pending-row {
            background: linear-gradient(
              145deg,
              rgba(207, 244, 252, 0.7),
              rgba(207, 244, 252, 0.9)
            ) !important;
            backdrop-filter: blur(5px);
          }

          .status-closed-row {
            background: linear-gradient(
              145deg,
              rgba(209, 231, 221, 0.7),
              rgba(209, 231, 221, 0.9)
            ) !important;
            backdrop-filter: blur(5px);
          }

          .status-resolved-row {
            background: linear-gradient(
              145deg,
              rgba(233, 236, 239, 0.7),
              rgba(233, 236, 239, 0.9)
            ) !important;
            backdrop-filter: blur(5px);
          }

          .table-row-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          /* Pagination styles */
          .pagination-custom .page-item .page-link {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(0, 31, 63, 0.1);
            color: #001f3f;
            transition: all 0.2s ease;
          }

          .pagination-custom .page-item.active .page-link {
            background: linear-gradient(180deg, #001f3f, #002952);
            border-color: #001f3f;
            color: white;
            box-shadow: 0 2px 5px rgba(0, 31, 63, 0.2);
          }

          .pagination-custom .page-item .page-link:hover:not(.active) {
            background: rgba(0, 31, 63, 0.05);
            transform: translateY(-1px);
          }

          .pagination-custom .page-item.disabled .page-link {
            color: rgba(0, 31, 63, 0.4);
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    );
  }

  // Otherwise, render the technician cards
  return (
    <Row className="animate-fade-in">
      {technicians.map((technician) => {
        const techFaults = faults.filter((f) => f.AssignTo === technician);
        const completedFaults = techFaults.filter((f) => f.Status === "Closed");
        const inProgressFaults = techFaults.filter(
          (f) => f.Status === "In Progress"
        );
        const pendingFaults = techFaults.filter((f) => f.Status === "Pending");
        const resolvedFaults = techFaults.filter(
          (f) => f.Status === "Resolved"
        );

        // Calculate total active faults
        const activeFaults = inProgressFaults.length + pendingFaults.length;

        // Calculate percentages for the donut chart
        const completedPercentage = techFaults.length
          ? (completedFaults.length / techFaults.length) * 100
          : 0;
        const resolvedPercentage = techFaults.length
          ? (resolvedFaults.length / techFaults.length) * 100
          : 0;
        const inProgressPercentage = techFaults.length
          ? (inProgressFaults.length / techFaults.length) * 100
          : 0;
        const pendingPercentage = techFaults.length
          ? (pendingFaults.length / techFaults.length) * 100
          : 0;

        return (
          <Col key={technician} lg={3} md={6} sm={6} xs={12} className="mb-4">
            <Card
              className="glass-card h-100 performance-card"
              onClick={() => handleTechnicianClick(technician)}
            >
              <Card.Body className="p-3">
                <Card.Title className="d-flex align-items-center mb-2">
                  <span className="tech-avatar">
                    {technician
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <span className="ms-2 tech-name">{technician}</span>
                </Card.Title>
                <div className="card-content-wrapper">
                  <div className="donut-chart-container">
                    <div className="donut-chart">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        {/* Background circle */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#f3f3f3"
                          strokeWidth="1"
                        />

                        {/* Completed */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#198754"
                          strokeWidth="3"
                          strokeDasharray={`${completedPercentage}, 100`}
                          className="donut-segment completed"
                        />

                        {/* Resolved */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#6c757d"
                          strokeWidth="3"
                          strokeDasharray={`${resolvedPercentage}, 100`}
                          strokeDashoffset={`${-completedPercentage || 0}`}
                          className="donut-segment resolved"
                        />

                        {/* In Progress */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#ffc107"
                          strokeWidth="3"
                          strokeDasharray={`${inProgressPercentage}, 100`}
                          strokeDashoffset={`${
                            -(completedPercentage + resolvedPercentage) || 0
                          }`}
                          className="donut-segment in-progress"
                        />

                        {/* Pending */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke="#0dcaf0"
                          strokeWidth="3"
                          strokeDasharray={`${pendingPercentage}, 100`}
                          strokeDashoffset={`${
                            -(
                              completedPercentage +
                              resolvedPercentage +
                              inProgressPercentage
                            ) || 0
                          }`}
                          className="donut-segment pending"
                        />

                        {/* Center text */}
                        <text
                          x="18"
                          y="18.5"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8"
                          fill="#2d3748"
                          transform="rotate(90, 18, 18.5)"
                        >
                          {techFaults.length}
                        </text>
                      </svg>
                    </div>
                    <div className="donut-legend">
                      <div className="legend-item">
                        <span className="legend-dot total"></span>
                        <span>Total: {techFaults.length}</span>
                      </div>
                      <div
                        className="legend-item clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Pending", e)
                        }
                        style={{
                          background: "rgba(0,0,0,0.03)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        <span className="legend-dot pending"></span>
                        <span>Pending</span>
                      </div>
                      <div
                        className="legend-item clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "In Progress", e)
                        }
                      >
                        <span className="legend-dot in-progress"></span>
                        <span>In Progress</span>
                      </div>
                      <div
                        className="legend-item clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Closed", e)
                        }
                      >
                        <span className="legend-dot completed"></span>
                        <span>Closed</span>
                      </div>
                      <div
                        className="legend-item clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Resolved", e)
                        }
                      >
                        <span className="legend-dot resolved"></span>
                        <span>Resolved</span>
                      </div>
                    </div>
                  </div>
                  <div className="performance-stats">
                    <div className="stat-grid">
                      <div className="stat-item">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{techFaults.length}</span>
                      </div>
                      <div
                        className="stat-item pending clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Pending", e)
                        }
                      >
                        <span className="stat-label">Pending</span>
                        <span className="stat-value">
                          {pendingFaults.length}
                        </span>
                      </div>
                      <div
                        className="stat-item in-progress clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "In Progress", e)
                        }
                      >
                        <span className="stat-label">In Progress</span>
                        <span className="stat-value">
                          {inProgressFaults.length}
                        </span>
                      </div>
                      <div
                        className="stat-item completed clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Closed", e)
                        }
                      >
                        <span className="stat-label">Closed</span>
                        <span className="stat-value">
                          {completedFaults.length}
                        </span>
                      </div>
                      <div
                        className="stat-item resolved clickable-status"
                        onClick={(e) =>
                          handleStatusClick(technician, "Resolved", e)
                        }
                      >
                        <span className="stat-label">Resolved</span>
                        <span className="stat-value">
                          {resolvedFaults.length}
                        </span>
                      </div>
                    </div>
                    <div className="completion-rate">
                      <span className="stat-label">Completion Rate</span>
                      <span className="stat-value">
                        {techFaults.length
                          ? Math.round(
                              ((completedFaults.length +
                                resolvedFaults.length) /
                                techFaults.length) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .clickable-status {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clickable-status:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </Row>
  );
};

export default TechnicianCards;
