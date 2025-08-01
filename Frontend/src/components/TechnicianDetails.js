import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Container, Card, Row, Col, Badge } from "react-bootstrap";
import { FaTools, FaHourglassHalf, FaClipboardList, FaCheckCircle } from "react-icons/fa";

const TechnicianDetails = () => {
  const [userInfo, setUserInfo] = useState(null);
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || "");
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setUserInfo(JSON.parse(user));
      } catch (err) {
        console.error("Failed to parse user", err);
        setError("Invalid user data. Please log in again.");
        setLoading(false);
      }
    } else {
      setError("Please log in to view technician details");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTechnicianFaults = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/faults/technician/${encodeURIComponent(decodedName)}`,
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
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to fetch technician details");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data received from server");
        }

        setFaults(data);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token && decodedName) {
      try {
        const parsedUser = JSON.parse(user);
        setUserInfo(parsedUser);
        fetchTechnicianFaults();
      } catch (err) {
        console.error("User parse error:", err.message);
        setError("Invalid user data");
        setLoading(false);
      }
    } else {
      setError("Please log in to view technician details");
      setLoading(false);
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

  const stats = {
    total: Array.isArray(faults) ? faults.length : 0,
    inProgress: faults.filter((f) => f.Status === "In Progress").length,
    pending: faults.filter((f) => f.Status === "Pending").length,
    resolved: faults.filter((f) => f.Status === "Closed").length,
  };

  return (
    <Container className="mt-4 p-4 rounded" style={{ backgroundColor: "#f9f9f9" }}>
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">{decodedName}'s Details</h2>
            {showDetails ? (
              <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>
                Back to Summary
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowDetails(true)}>
                View Detailed History
              </button>
            )}
          </div>

          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100 shadow border-0 bg-light">
                <Card.Body>
                  <FaTools size={30} className="mb-2 text-dark" />
                  <h6>Total Faults</h6>
                  <h3>{stats.total}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow border-0 bg-warning-subtle">
                <Card.Body>
                  <FaHourglassHalf size={30} className="mb-2 text-warning" />
                  <h6>In Progress</h6>
                  <h3 className="text-warning">{stats.inProgress}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow border-0 bg-info-subtle">
                <Card.Body>
                  <FaClipboardList size={30} className="mb-2 text-info" />
                  <h6>Pending</h6>
                  <h3 className="text-info">{stats.pending}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 shadow border-0 bg-success-subtle">
                <Card.Body>
                  <FaCheckCircle size={30} className="mb-2 text-success" />
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
                    {faults.length > 0 ? (
                      faults.map((fault) => (
                        <tr key={fault._id || fault.FaultID}>
                          <td>{fault.FaultID || "N/A"}</td>
                          <td>{fault.System || "N/A"}</td>
                          <td>{fault.Description || "No description"}</td>
                          <td>{getStatusBadge(fault.Status || "Unknown")}</td>
                          <td>{fault.ReportedAt ? new Date(fault.ReportedAt).toLocaleString() : "N/A"}</td>
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
                <div className="progress bg-light border" style={{ height: "25px", borderRadius: "12px" }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${(stats.resolved / stats.total) * 100}%`, fontWeight: "bold" }}
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
