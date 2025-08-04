import React, { useState } from "react";
import { Row, Col, Card, Table, Button, Badge } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";

const TechnicianCards = ({
  technicians,
  faults,
  onTechnicianClick,
  onStatusClick,
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [filteredFaults, setFilteredFaults] = useState([]);

  // Handler for status clicks
  const handleStatusClick = (technician, status, e) => {
    e?.stopPropagation();

    // Filter faults by technician and status
    let filtered = [...faults];

    if (technician) {
      filtered = filtered.filter((f) => f.AssignTo === technician);
    }

    if (status) {
      filtered = filtered.filter((f) => f.Status === status);
    }

    // Update state
    setSelectedTechnician(technician);
    setSelectedStatus(status);
    setFilteredFaults(filtered);
    setShowDetailView(true);

    // Call the parent handler if provided
    if (onStatusClick) {
      onStatusClick(technician, status);
    }
  };

  // Handler for technician card clicks
  const handleTechnicianClick = (technician) => {
    // Filter faults by technician
    const filtered = faults.filter((f) => f.AssignTo === technician);

    // Update state
    setSelectedTechnician(technician);
    setSelectedStatus(null);
    setFilteredFaults(filtered);
    setShowDetailView(true);

    // Call the parent handler if provided
    if (onTechnicianClick) {
      onTechnicianClick(technician);
    }
  };

  // Handler to go back to cards view
  const handleBackToCards = () => {
    setShowDetailView(false);
    setSelectedTechnician(null);
    setSelectedStatus(null);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "warning";
      case "Pending":
        return "info";
      case "Closed":
        return "success";
      case "Resolved":
        return "secondary";
      default:
        return "primary";
    }
  };

  // If we're showing detail view, render the details grid
  if (showDetailView) {
    return (
      <div className="fault-details-container animate-fade-in">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Button
                  variant="outline-primary"
                  className="me-3"
                  onClick={handleBackToCards}
                >
                  <ArrowLeft size={20} className="me-1" /> Back to Dashboard
                </Button>
                <h2 className="d-inline-block mb-0">
                  {selectedTechnician
                    ? `${selectedTechnician}'s ${selectedStatus || ""} Faults`
                    : selectedStatus
                    ? `All ${selectedStatus} Faults`
                    : "Fault Details"}
                </h2>
                <Badge bg="primary" className="ms-3">
                  {filteredFaults.length}{" "}
                  {filteredFaults.length === 1 ? "Record" : "Records"}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-center">ID</th>
                        <th className="text-center">Systems</th>
                        <th>Reported By</th>
                        <th className="d-none d-md-table-cell">Location</th>
                        <th className="d-none d-lg-table-cell">
                          Location of Fault
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
                            className="text-center py-5 text-muted"
                          >
                            No records found for the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredFaults.map((fault) => (
                          <tr
                            key={fault.id}
                            className={`status-${fault.Status?.toLowerCase().replace(
                              /\s+/g,
                              "-"
                            )}-row`}
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
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="me-1"
                              >
                                📝 Notes
                              </Button>
                              {fault.Status !== "Closed" && (
                                <Button variant="outline-primary" size="sm">
                                  Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <style jsx>{`
          .fault-details-container {
            padding: 1rem;
          }

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

          .description-col {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .status-badge {
            font-size: 0.85rem;
            padding: 0.4em 0.8em;
          }

          /* Status row highlights */
          .status-in-progress-row {
            background-color: rgba(255, 193, 7, 0.05);
          }

          .status-pending-row {
            background-color: rgba(13, 202, 240, 0.05);
          }

          .status-closed-row {
            background-color: rgba(25, 135, 84, 0.05);
          }

          .status-resolved-row {
            background-color: rgba(108, 117, 125, 0.05);
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
              className="glass-card h-100 performance-card clickable-card"
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
                          handleStatusClick(technician, "Pending", e)
                        }
                      >
                        <span className="legend-dot pending"></span>
                        <span>Pending</span>
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
                      <div className="stat-item">
                        <span className="stat-label">Active</span>
                        <span className="stat-value">{activeFaults}</span>
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
      <style jsx>{`
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
