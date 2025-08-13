import React, { useMemo } from "react";
import { Card, ListGroup, Badge } from "react-bootstrap";

const SimplifiedTechnicianCards = ({
  technicians,
  faults,
  onTechnicianClick,
}) => {
  // Calculate statistics for each technician
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
      };
    });

    // Count faults for each technician
    faults.forEach((fault) => {
      // Handle multiple technicians (comma-separated)
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
          if (fault.Status === "Closed") stats[tech].closed++;

          // Count high priority
          if (fault.isHighPriority || fault.Priority === "High") {
            stats[tech].highPriority++;
          }

          // Count overdue
          const isOverdue = () => {
            if (
              !fault.DateTime ||
              fault.Status === "Closed" ||
              fault.Status === "Hold"
            )
              return false;
            const faultDate = new Date(fault.DateTime);
            const currentDate = new Date();
            const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            return currentDate - faultDate > weekInMs;
          };

          if (isOverdue()) {
            stats[tech].overdue++;
          }
        }
      });
    });

    return stats;
  }, [technicians, faults]);

  // Get status badge color
  const getStatusColor = (count) => {
    if (count === 0) return "secondary";
    if (count > 5) return "danger";
    if (count > 2) return "warning";
    return "success";
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Technician Status</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {technicians.map((tech) => (
            <ListGroup.Item
              key={tech}
              action
              onClick={() => onTechnicianClick(tech)}
              className="d-flex justify-content-between align-items-center py-3"
            >
              <div>
                <div className="fw-bold">{tech}</div>
                <div>
                  <small className="text-muted">
                    Assigned: {technicianStats[tech].assigned}
                  </small>
                </div>
              </div>
              <div>
                {technicianStats[tech].inProgress > 0 && (
                  <Badge
                    bg={getStatusColor(technicianStats[tech].inProgress)}
                    className="me-1"
                    pill
                  >
                    {technicianStats[tech].inProgress}
                  </Badge>
                )}

                {technicianStats[tech].highPriority > 0 && (
                  <span
                    className="text-danger me-1"
                    title="High Priority Tasks"
                  >
                    ⚑
                  </span>
                )}

                {technicianStats[tech].overdue > 0 && (
                  <span className="text-danger" title="Overdue Tasks">
                    ⏰
                  </span>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
      <Card.Footer className="bg-light">
        <div className="d-flex justify-content-between small text-muted">
          <span>Total: {technicians.length}</span>
          <span>
            <i
              className="bi bi-circle-fill text-success me-1"
              style={{ fontSize: "0.7rem" }}
            ></i>
            Available
          </span>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default SimplifiedTechnicianCards;
