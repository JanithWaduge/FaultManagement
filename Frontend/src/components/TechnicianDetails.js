import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Table, Container, Card, Row, Col, Badge } from "react-bootstrap";

const TechnicianDetails = ({ userInfo }) => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name || "");
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Verify authentication and parameter on mount
  useEffect(() => {
    if (!userInfo) {
      setError("Please log in to view technician details");
      setLoading(false);
      return;
    }
    if (!name) {
      setError("Invalid technician name");
      setLoading(false);
    }
  }, [name, userInfo]);

  useEffect(() => {
    const fetchTechnicianFaults = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Please log in to view technician details");
        }

        const response = await fetch(
          `http://localhost:5000/api/faults/technician/${encodeURIComponent(
            decodedName
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view technician details");
          }
          throw new Error("Failed to fetch technician details");
        }

        const data = await response.json();
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data received from server");
        }

        console.log("Fetched data:", data); // Debug log
        setFaults(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err); // Debug log
        setError(err.message);
        setLoading(false);
      }
    };

    if (decodedName) {
      fetchTechnicianFaults();
    }
  }, [decodedName]);

  const getStatusBadge = (status) => {
    const statusColors = {
      "In Progress": "warning",
      Pending: "info",
      Closed: "success",
      Open: "danger",
    };
    return <Badge bg={statusColors[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="text-center text-danger">Error: {error}</div>
      </Container>
    );
  }

  // Ensure faults is an array before calculating statistics
  const stats = {
    total: Array.isArray(faults) ? faults.length : 0,
    inProgress: Array.isArray(faults)
      ? faults.filter((f) => f.Status === "In Progress").length
      : 0,
    pending: Array.isArray(faults)
      ? faults.filter((f) => f.Status === "Pending").length
      : 0,
    resolved: Array.isArray(faults)
      ? faults.filter((f) => f.Status === "Closed").length
      : 0,
  };

  return (
    <Container className="mt-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>{decodedName}'s Details</h2>
            {!showDetails && (
              <button
                className="btn btn-primary"
                onClick={() => setShowDetails(true)}
              >
                View Detailed History
              </button>
            )}
          </div>

          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h6>Total Faults</h6>
                  <h3>{stats.total}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-warning">
                <Card.Body>
                  <h6>In Progress</h6>
                  <h3 className="text-warning">{stats.inProgress}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-info">
                <Card.Body>
                  <h6>Pending</h6>
                  <h3 className="text-info">{stats.pending}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-success">
                <Card.Body>
                  <h6>Resolved</h6>
                  <h3 className="text-success">{stats.resolved}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {showDetails ? (
            <>
              <h4 className="mb-3">Fault History</h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Fault ID</th>
                      <th>System</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Reported At</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(faults) && faults.length > 0 ? (
                      faults.map((fault) => (
                        <tr key={fault._id || fault.FaultID}>
                          <td>{fault.FaultID || "N/A"}</td>
                          <td>{fault.System || "N/A"}</td>
                          <td>{fault.Description || "No description"}</td>
                          <td>{getStatusBadge(fault.Status || "Unknown")}</td>
                          <td>
                            {fault.ReportedAt
                              ? new Date(fault.ReportedAt).toLocaleString()
                              : "N/A"}
                          </td>
                          <td>
                            <Badge
                              bg={
                                fault.Priority === "High"
                                  ? "danger"
                                  : fault.Priority === "Medium"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {fault.Priority || "Low"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No faults found for this technician
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center mt-5">
              <h4>Performance Summary</h4>
              <p className="text-muted">
                Click "View Detailed History" to see complete fault records
              </p>
              <div className="mt-4">
                <h5>Resolution Rate</h5>
                <div className="progress" style={{ height: "25px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${(stats.resolved / stats.total) * 100}%`,
                    }}
                  >
                    {Math.round((stats.resolved / stats.total) * 100)}% Resolved
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TechnicianDetails;
