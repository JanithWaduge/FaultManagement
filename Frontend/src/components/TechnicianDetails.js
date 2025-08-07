import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Container, Card, Row, Col, Badge } from "react-bootstrap";
import {
  FaTools,
  FaHourglassHalf,
  FaClipboardList,
  FaCheckCircle,
} from "react-icons/fa";

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
        if (!token) {
          throw new Error("No authentication token found");
        }

        console.log("Fetching faults for technician:", decodedName);
        
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/faults/technician/${encodeURIComponent(
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
            throw new Error("Unauthorized. Please log in again.");
          }
          if (response.status === 404) {
            throw new Error("Technician not found or no faults assigned");
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched fault data:", data);
        
        if (!Array.isArray(data)) {
          console.warn("Invalid data format received:", data);
          setFaults([]);
        } else {
          setFaults(data);
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
        setFaults([]);
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

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      High: "danger",
      Medium: "warning",
      Low: "success",
    };
    return (
      <Badge bg={priorityColors[priority] || "secondary"}>
        {priority || "Low"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading technician details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger text-center">
          <h5>Error</h5>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </Container>
    );
  }

  const stats = {
    total: Array.isArray(faults) ? faults.length : 0,
    inProgress: faults.filter((f) => f.Status === "In Progress").length,
    pending: faults.filter((f) => f.Status === "Pending").length,
    resolved: faults.filter((f) => f.Status === "Closed").length,
  };

  const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

  return (
    <Container
      className="mt-4 p-4 rounded"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div className="mb-3">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <FaTools className="me-2 text-primary" />
              {decodedName}'s Performance
            </h2>
            {showDetails ? (
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetails(false)}
              >
                Back to Summary
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowDetails(true)}
                disabled={stats.total === 0}
              >
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
              <h4 className="mb-3">
                <FaClipboardList className="me-2" />
                Fault History ({faults.length} records)
              </h4>
              <div className="table-responsive">
                <Table striped bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Fault ID</th>
                      <th>System</th>
                      <th>Location</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Reported By</th>
                      <th>Reported At</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faults.length > 0 ? (
                      faults.map((fault, index) => (
                        <tr key={fault.id || fault.FaultID || index}>
                          <td>
                            <strong>{fault.id || fault.FaultID || "N/A"}</strong>
                          </td>
                          <td>{fault.SystemID || fault.System || "N/A"}</td>
                          <td>
                            {fault.Location || "N/A"}
                            {fault.LocationOfFault && (
                              <><br /><small className="text-muted">{fault.LocationOfFault}</small></>
                            )}
                          </td>
                          <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                            {fault.DescFault || fault.Description || "No description"}
                          </td>
                          <td>{getStatusBadge(fault.Status || "Unknown")}</td>
                          <td>{fault.ReportedBy || "N/A"}</td>
                          <td>
                            {fault.created_at || fault.ReportedAt
                              ? new Date(fault.created_at || fault.ReportedAt).toLocaleString()
                              : "N/A"}
                          </td>
                          <td>{getPriorityBadge(fault.Priority)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          <FaClipboardList size={24} className="mb-2" />
                          <p className="mb-0">No faults found for this technician</p>
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
                {stats.total > 0 
                  ? "Click 'View Detailed History' to see complete fault records"
                  : "No faults assigned to this technician yet"
                }
              </p>
              
              {stats.total > 0 && (
                <div className="mt-4">
                  <h5>Resolution Rate</h5>
                  <div
                    className="progress bg-light border mx-auto"
                    style={{ height: "25px", borderRadius: "12px", maxWidth: "400px" }}
                  >
                    <div
                      className="progress-bar bg-success d-flex align-items-center justify-content-center"
                      style={{
                        width: `${resolutionRate}%`,
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      {Math.round(resolutionRate)}% Resolved
                    </div>
                  </div>
                  <p className="mt-2 text-muted">
                    {stats.resolved} out of {stats.total} faults resolved
                  </p>
                </div>
              )}

              {stats.total > 0 && (
                <div className="mt-4">
                  <h5>Current Workload</h5>
                  <Row className="justify-content-center">
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span>Active Faults:</span>
                        <strong>{stats.inProgress + stats.pending}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Completion Rate:</span>
                        <strong className="text-success">{Math.round(resolutionRate)}%</strong>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TechnicianDetails;

//test