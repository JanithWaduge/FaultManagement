import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  ListGroup,
  Badge,
  Button,
  Row,
  Col,
  ProgressBar,
  Dropdown,
  Alert,
} from "react-bootstrap";
import AddTechnicianModal from "./AddTechnicianModal";

const ModernTechnicianCards = ({
  technicians,
  faults,
  onTechnicianClick,
  showAddButton = true,
  onTechniciansUpdated, // New prop for refreshing technician list
}) => {
  const [showAddTechnicianModal, setShowAddTechnicianModal] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"
  const [successMessage, setSuccessMessage] = useState("");

  // Calculate enhanced statistics for each technician
  const technicianStats = useMemo(() => {
    const stats = {};

    // Initialize stats for each technician
    technicians.forEach((tech) => {
      stats[tech] = {
        assigned: 0,
        inProgress: 0,
        pending: 0,
        hold: 0,
        closed: 0,
        highPriority: 0,
        overdue: 0,
        completedThisWeek: 0,
        avgCompletionTime: 0,
        efficiency: 0,
        status: "available", // available, busy, offline
        specializations: [], // Array of skill tags
        workload: 0, // Percentage of capacity
      };
    });

    // Count faults for each technician
    faults.forEach((fault) => {
      const assignedTechs = fault.AssignTo
        ? fault.AssignTo.split(",").map((t) => t.trim())
        : [];

      assignedTechs.forEach((tech) => {
        if (stats[tech]) {
          stats[tech].assigned++;

          // Count by status
          if (fault.Status === "In Progress") stats[tech].inProgress++;
          if (fault.Status === "Pending") stats[tech].pending++;
          if (fault.Status === "Hold") stats[tech].hold++;
          if (fault.Status === "Closed") {
            stats[tech].closed++;
            // Check if closed this week
            const closedDate = new Date(fault.ClosedAt || fault.DateTime);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (closedDate >= weekAgo) {
              stats[tech].completedThisWeek++;
            }
          }

          // Count high priority
          if (fault.isHighPriority || fault.Priority === "High") {
            stats[tech].highPriority++;
          }

          // Check if overdue
          if (isOverdue(fault)) {
            stats[tech].overdue++;
          }
        }
      });
    });

    // Calculate derived metrics
    Object.keys(stats).forEach((tech) => {
      const techStats = stats[tech];
      const activeFaults = techStats.inProgress + techStats.pending;

      // Calculate workload (assuming max 10 active faults is 100% capacity)
      techStats.workload = Math.min((activeFaults / 10) * 100, 100);

      // Calculate efficiency (closed vs total handled)
      const totalHandled = techStats.closed + activeFaults;
      if (totalHandled > 0) {
        techStats.efficiency = (techStats.closed / totalHandled) * 100;
      }

      // Determine status based on workload
      if (techStats.workload >= 80) {
        techStats.status = "busy";
      } else if (techStats.workload >= 50) {
        techStats.status = "available";
      } else {
        techStats.status = "available";
      }

      // Add mock specializations (in real app, this would come from user data)
      if (tech.toLowerCase().includes("john")) {
        techStats.specializations = ["Hardware", "Network"];
      } else if (tech.toLowerCase().includes("jane")) {
        techStats.specializations = ["Software", "Database"];
      } else {
        techStats.specializations = ["General", "Support"];
      }
    });

    return stats;
  }, [technicians, faults]);

  // Check if a fault is overdue
  const isOverdue = (fault) => {
    if (!fault.DateTime || fault.Status === "Closed" || fault.Status === "Hold")
      return false;
    const faultDate = new Date(fault.DateTime);
    const currentDate = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    return currentDate - faultDate > weekInMs;
  };

  // Get workload color
  const getWorkloadColor = (workload) => {
    if (workload >= 80) return "danger";
    if (workload >= 50) return "warning";
    return "success";
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return { bg: "success", text: "Available", icon: "🟢" };
      case "busy":
        return { bg: "warning", text: "Busy", icon: "🟡" };
      case "offline":
        return { bg: "secondary", text: "Offline", icon: "⚫" };
      default:
        return { bg: "info", text: "Unknown", icon: "❓" };
    }
  };

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle technician added successfully
  const handleTechnicianAdded = async (newTechnician) => {
    setSuccessMessage(
      `Technician "${newTechnician.username}" has been added successfully!`
    );

    // Call parent component to refresh the technician list
    if (onTechniciansUpdated) {
      await onTechniciansUpdated();
    }
  };

  // Handle add technician button click
  const handleAddTechnicianClick = () => {
    setError("");
    setSuccessMessage("");
    setShowAddTechnicianModal(true);
  };

  // Render card view
  const renderCardView = () => (
    <Row className="g-3">
      {technicians.map((tech) => {
        const stats = technicianStats[tech];
        const statusInfo = getStatusBadge(stats.status);
        const activeFaults = stats.inProgress + stats.pending;

        return (
          <Col key={tech} xs={12} sm={6} lg={4} xl={3}>
            <Card className="modern-technician-card h-100">
              <Card.Body className="p-3">
                {/* Header with avatar and status */}
                <div className="d-flex align-items-center mb-3">
                  <div className="technician-avatar me-3">
                    <div className="avatar-circle">
                      {tech.substring(0, 2).toUpperCase()}
                    </div>
                    <div
                      className={`status-indicator status-${stats.status}`}
                    ></div>
                  </div>
                  <div className="flex-grow-1">
                    <h6
                      className="mb-1 technician-name"
                      onClick={() =>
                        onTechnicianClick && onTechnicianClick(tech)
                      }
                    >
                      {tech}
                    </h6>
                    <Badge bg={statusInfo.bg} className="status-badge">
                      <span className="me-1">{statusInfo.icon}</span>
                      {statusInfo.text}
                    </Badge>
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="link"
                      size="sm"
                      className="text-muted"
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>
                        <i className="bi bi-person me-2"></i>
                        View Profile
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <i className="bi bi-chat me-2"></i>
                        Send Message
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <i className="bi bi-calendar me-2"></i>
                        View Schedule
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* Workload Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Workload</small>
                    <small className="text-muted">
                      {Math.round(stats.workload)}%
                    </small>
                  </div>
                  <ProgressBar
                    variant={getWorkloadColor(stats.workload)}
                    now={stats.workload}
                    className="workload-progress"
                  />
                </div>

                {/* Specializations */}
                <div className="mb-3">
                  <div className="specializations">
                    {stats.specializations.map((skill, index) => (
                      <Badge
                        key={index}
                        bg="light"
                        text="dark"
                        className="skill-badge me-1 mb-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <Row className="text-center mb-3">
                  <Col xs={6}>
                    <div className="stat-item">
                      <div className="stat-number text-primary">
                        {activeFaults}
                      </div>
                      <div className="stat-label">Active</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="stat-item">
                      <div className="stat-number text-success">
                        {stats.completedThisWeek}
                      </div>
                      <div className="stat-label">This Week</div>
                    </div>
                  </Col>
                </Row>

                {/* Detailed Stats */}
                <div className="fault-stats">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="stat-row">
                      <i className="bi bi-play-circle text-primary me-1"></i>
                      In Progress
                    </span>
                    <Badge bg="primary" pill>
                      {stats.inProgress}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="stat-row">
                      <i className="bi bi-clock text-warning me-1"></i>
                      Pending
                    </span>
                    <Badge bg="warning" pill>
                      {stats.pending}
                    </Badge>
                  </div>
                  {stats.highPriority > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="stat-row">
                        <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                        High Priority
                      </span>
                      <Badge bg="danger" pill>
                        {stats.highPriority}
                      </Badge>
                    </div>
                  )}
                  {stats.overdue > 0 && (
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="stat-row">
                        <i className="bi bi-alarm text-danger me-1"></i>
                        Overdue
                      </span>
                      <Badge bg="danger" pill>
                        {stats.overdue}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-3 pt-2 border-top">
                  <Row className="g-1">
                    <Col xs={6}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() =>
                          onTechnicianClick && onTechnicianClick(tech)
                        }
                      >
                        <i className="bi bi-eye me-1"></i>
                        View
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100"
                      >
                        <i className="bi bi-plus me-1"></i>
                        Assign
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  // Render list view
  const renderListView = () => (
    <Card className="modern-technician-list">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Technician Overview</h6>
        <small className="text-muted">{technicians.length} technicians</small>
      </Card.Header>
      <ListGroup variant="flush">
        {technicians.map((tech) => {
          const stats = technicianStats[tech];
          const statusInfo = getStatusBadge(stats.status);

          return (
            <ListGroup.Item
              key={tech}
              className="modern-list-item"
              onClick={() => onTechnicianClick && onTechnicianClick(tech)}
            >
              <div className="d-flex align-items-center">
                <div className="technician-avatar-small me-3">
                  <div className="avatar-circle-small">
                    {tech.substring(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={`status-indicator-small status-${stats.status}`}
                  ></div>
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{tech}</h6>
                      <div className="specializations-inline">
                        {stats.specializations
                          .slice(0, 2)
                          .map((skill, index) => (
                            <Badge
                              key={index}
                              bg="light"
                              text="dark"
                              className="skill-badge-small me-1"
                            >
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="d-flex gap-2 mb-1">
                        <Badge bg="primary" pill>
                          {stats.inProgress}
                        </Badge>
                        <Badge bg="warning" pill>
                          {stats.pending}
                        </Badge>
                        {stats.highPriority > 0 && (
                          <Badge bg="danger" pill>
                            {stats.highPriority}
                          </Badge>
                        )}
                      </div>
                      <Badge bg={statusInfo.bg} className="status-badge-small">
                        {statusInfo.icon} {statusInfo.text}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2">
                    <ProgressBar
                      variant={getWorkloadColor(stats.workload)}
                      now={stats.workload}
                      size="sm"
                      className="workload-progress-small"
                    />
                  </div>
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card>
  );

  return (
    <div className="modern-technician-cards">
      {/* Success Message */}
      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage("")}
          className="mb-3"
        >
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-3"
        >
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Header with view controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-people me-2"></i>
          Technician Status
        </h5>
        <div className="d-flex gap-2">
          <div className="btn-group" role="group">
            <Button
              variant={viewMode === "cards" ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <i className="bi bi-grid"></i>
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <i className="bi bi-list"></i>
            </Button>
          </div>
          {showAddButton && (
            <Button
              variant="success"
              size="sm"
              onClick={handleAddTechnicianClick}
            >
              <i className="fas fa-user-plus me-2"></i>
              Add Technician
            </Button>
          )}
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === "cards" ? renderCardView() : renderListView()}

      {/* Add Technician Modal */}
      <AddTechnicianModal
        show={showAddTechnicianModal}
        onHide={() => setShowAddTechnicianModal(false)}
        onTechnicianAdded={handleTechnicianAdded}
      />

      {/* Modern Styles */}
      <style jsx>{`
        .modern-technician-card {
          border: none;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .modern-technician-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .technician-avatar {
          position: relative;
        }

        .avatar-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1rem;
        }

        .avatar-circle-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .status-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
        }

        .status-indicator-small {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-available {
          background-color: #28a745;
        }

        .status-busy {
          background-color: #ffc107;
        }

        .status-offline {
          background-color: #6c757d;
        }

        .technician-name {
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .technician-name:hover {
          color: #007bff;
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
        }

        .status-badge-small {
          font-size: 0.65rem;
          padding: 0.2rem 0.4rem;
          border-radius: 10px;
        }

        .workload-progress {
          height: 6px;
          border-radius: 3px;
        }

        .workload-progress-small {
          height: 4px;
          border-radius: 2px;
        }

        .skill-badge {
          font-size: 0.65rem;
          padding: 0.2rem 0.4rem;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .skill-badge-small {
          font-size: 0.6rem;
          padding: 0.15rem 0.3rem;
          border-radius: 6px;
        }

        .stat-item {
          padding: 0.5rem 0;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-row {
          font-size: 0.8rem;
          color: #6c757d;
          display: flex;
          align-items: center;
        }

        .fault-stats {
          background: rgba(248, 249, 250, 0.5);
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.85rem;
        }

        .modern-technician-list {
          border: none;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .modern-list-item {
          border: none;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modern-list-item:hover {
          background-color: rgba(0, 123, 255, 0.05);
          transform: translateX(5px);
        }

        .technician-avatar-small {
          position: relative;
        }

        .specializations-inline {
          margin-top: 0.25rem;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modern-technician-card {
            margin-bottom: 1rem;
          }

          .stat-number {
            font-size: 1.2rem;
          }

          .avatar-circle {
            width: 40px;
            height: 40px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernTechnicianCards;
