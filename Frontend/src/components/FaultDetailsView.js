import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Table, Button, Badge } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";

const FaultDetailsView = ({ faults, onBackClick }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filteredFaults, setFilteredFaults] = useState([]);
  const technician = searchParams.get("technician");
  const status = searchParams.get("status");

  useEffect(() => {

  let filtered = [...faults];

  if (technician) {
    filtered = filtered.filter(
      (f) =>
        f.AssignTo &&
        f.AssignTo.trim().toLowerCase() === technician.trim().toLowerCase()
    );
  }

  if (status) {
    filtered = filtered.filter(
      (f) =>
        f.Status &&
        f.Status.trim().toLowerCase() === status.trim().toLowerCase()
    );
  }

  setFilteredFaults(filtered);
}, [faults, technician, status]);

  // Handle back button click
  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // Get the page title based on filters
  const getPageTitle = () => {
    if (technician && status) {
      return `${technician}'s ${status} Faults`;
    } else if (technician) {
      return `${technician}'s Faults`;
    } else if (status) {
      return `All ${status} Faults`;
    } else {
      return "Fault Details";
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress": return "warning";
      case "Pending": return "info";
      case "Closed": return "success";
      case "Resolved": return "secondary";
      default: return "primary";
    }
  };

  return (
    <Container fluid className="px-4 py-3">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant="outline-primary"
                className="me-3"
                onClick={handleBack}
              >
                <ArrowLeft size={20} className="me-1" /> Back
              </Button>
              <h2 className="d-inline-block mb-0">{getPageTitle()}</h2>
              <Badge bg="primary" className="ms-3">
                {filteredFaults.length} {filteredFaults.length === 1 ? "Record" : "Records"}
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
                      <th className="d-none d-lg-table-cell">Location of Fault</th>
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
                        <td colSpan="10" className="text-center py-5 text-muted">
                          No records found for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredFaults.map((fault) => (
                        <tr key={fault.id} className={`status-${fault.Status.toLowerCase().replace(/\s+/g, "-")}-row`}>
                          <td className="text-center">{fault.id}</td>
                          <td className="text-center">{fault.SystemID}</td>
                          <td>{fault.ReportedBy}</td>
                          <td className="d-none d-md-table-cell">{fault.Location}</td>
                          <td className="d-none d-lg-table-cell">{fault.LocationOfFault}</td>
                          <td className="description-col">{fault.DescFault}</td>
                          <td className="text-center">
                            <Badge bg={getStatusColor(fault.Status)} className="status-badge">
                              {fault.Status}
                            </Badge>
                          </td>
                          <td>{fault.AssignTo}</td>
                          <td className="d-none d-md-table-cell" style={{ whiteSpace: "nowrap" }}>
                            {fault.DateTime ? new Date(fault.DateTime).toLocaleString() : ""}
                          </td>
                          <td className="text-center">
                            <Button variant="outline-info" size="sm" className="me-1">
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
    </Container>
  );
};

export default FaultDetailsView;