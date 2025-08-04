import React from "react";
import { Pie } from "react-chartjs-2";
import { Card, Row, Col, Table } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const Activecharts = ({ faults, onStatusClick }) => {
  const navigate = useNavigate();

  // Calculate overall fault statistics
  const overallStats = {
    inProgress: faults.filter((f) => f.Status === "In Progress").length,
    pending: faults.filter((f) => f.Status === "Pending").length,
    closed: faults.filter((f) => f.Status === "Closed").length,
    resolved: faults.filter((f) => f.Status === "Resolved").length,
  };

  // Group faults by technician
  const technicianStats = faults.reduce((acc, fault) => {
    if (!fault.AssignTo) return acc;

    if (!acc[fault.AssignTo]) {
      acc[fault.AssignTo] = {
        inProgress: 0,
        pending: 0,
        closed: 0,
        resolved: 0,
      };
    }

    if (fault.Status === "In Progress") {
      acc[fault.AssignTo].inProgress++;
    } else if (fault.Status === "Pending") {
      acc[fault.AssignTo].pending++;
    } else if (fault.Status === "Closed") {
      acc[fault.AssignTo].closed++;
    }
    if (fault.Status === "Resolved") {
      acc[fault.AssignTo].resolved++;
    }

    return acc;
  }, {});

  // Chart configuration for overall stats
  const chartData = {
    labels: ["In Progress", "Pending", "Closed", "Resolved"],
    datasets: [
      {
        data: [
          overallStats.inProgress,
          overallStats.pending,
          overallStats.closed,
          overallStats.resolved,
        ],
        backgroundColor: [
          "rgba(255, 193, 7, 0.8)", // yellow for in progress
          "rgba(13, 202, 240, 0.8)", // cyan for pending
          "rgba(25, 135, 84, 0.8)", // green for closed
          "rgba(108, 117, 125, 0.8)",
        ],
        borderColor: [
          "rgba(255, 193, 7, 1)",
          "rgba(13, 202, 240, 1)",
          "rgba(25, 135, 84, 1)",
          "rgba(108, 117, 125, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: "Overall Active Faults Distribution",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total =
              overallStats.inProgress +
              overallStats.pending +
              overallStats.closed;
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Add state for selected technician and status
  const [selectedTechnician, setSelectedTechnician] = React.useState(null);
  const [selectedStatus, setSelectedStatus] = React.useState(null);

  // Handle status click
  const handleStatusClick = (status) => {
    // Build query parameters
    const params = new URLSearchParams();
    if (selectedTechnician) params.append("technician", selectedTechnician);
    params.append("status", status);

    // Navigate to details page with query parameters
    navigate(`/details?${params.toString()}`);

    if (onStatusClick) {
      onStatusClick(selectedTechnician, status);
    }
  };

  // Handle technician click
  const handleTechnicianClick = (technician) => {
    setSelectedTechnician(
      selectedTechnician === technician ? null : technician
    );

    if (selectedStatus) {
      // If a status is already selected, navigate to details
      const params = new URLSearchParams();
      params.append("technician", technician);
      params.append("status", selectedStatus);
      navigate(`/details?${params.toString()}`);

      if (onStatusClick) {
        onStatusClick(technician, selectedStatus);
      }
    }
  };

  return (
    <div className="p-4">
      <h3
        className="mb-4 responsive-title"
        style={{ color: "#001f3f", fontWeight: "600" }}
      >
        Active Faults Overview
      </h3>

      <Row className="g-4">
        {/* Left Side - Chart Section */}
        <Col lg={7} md={12}>
          <Card className="shadow-sm h-100 chart-card">
            <Card.Body className="d-flex flex-column">
              <div
                className="chart-container"
                style={{ minHeight: "300px", height: "calc(100vh - 500px)" }}
              >
                <Pie
                  data={chartData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        ...chartOptions.plugins.legend,
                        position: window.innerWidth < 768 ? "bottom" : "right",
                      },
                    },
                  }}
                />
              </div>
              {/* Summary Stats Below Chart */}
              <div className="d-flex flex-wrap justify-content-around mt-auto pt-3 border-top stats-container">
                <div className="text-center stats-item">
                  <h3
                    className="stats-number"
                    style={{ color: "rgba(255, 193, 7, 1)" }}
                  >
                    {overallStats.inProgress}
                  </h3>
                  <div className="stats-label">In Progress</div>
                </div>
                <div className="text-center stats-item">
                  <h3
                    className="stats-number"
                    style={{ color: "rgba(13, 202, 240, 1)" }}
                  >
                    {overallStats.pending}
                  </h3>
                  <div className="stats-label">Pending</div>
                </div>
                <div className="text-center stats-item">
                  <h3
                    className="stats-number"
                    style={{ color: "rgba(25, 135, 84, 1)" }}
                  >
                    {overallStats.closed}
                  </h3>
                  <div className="stats-label">Closed</div>
                </div>
                <div className="text-center stats-item">
                  <h3
                    className="stats-number"
                    style={{ color: "rgba(108, 117, 125, 1)" }}
                  >
                    {overallStats.resolved}
                  </h3>
                  <div className="stats-label">Resolved</div>
                </div>

                <div className="text-center stats-item">
                  <h3 className="stats-number" style={{ color: "#001f3f" }}>
                    {overallStats.inProgress +
                      overallStats.pending +
                      overallStats.closed +
                      overallStats.resolved}
                  </h3>
                  <div className="stats-label">Total</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side - Technicians Grid */}
        <Col lg={5} md={12}>
          <Card className="shadow-sm h-100 grid-card">
            <Card.Body>
              <h4 className="mb-4 responsive-subtitle">
                Technicians' Active Faults
              </h4>
              <div
                className="table-responsive"
                style={{
                  maxHeight: "calc(100vh - 300px)",
                  minHeight: "300px",
                  overflowY: "auto",
                }}
              >
                <Table bordered hover className="table-fixed-header mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Technician Name</th>
                      <th className="text-center">In Progress</th>
                      <th className="text-center">Pending</th>
                      <th className="text-center">Closed</th>
                      <th className="text-center">Resolved</th>
                      <th className="text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(technicianStats).map(
                      ([technician, stats]) => (
                        <tr key={technician}>
                          <td
                            onClick={() => handleTechnicianClick(technician)}
                            style={{ cursor: "pointer" }}
                          >
                            {technician}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning">
                              {stats.inProgress}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-info">
                              {stats.pending}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success">
                              {stats.closed}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">
                              {stats.resolved}
                            </span>
                          </td>
                          <td className="text-center">
                            <strong>
                              {stats.inProgress +
                                stats.pending +
                                stats.closed +
                                stats.resolved}
                            </strong>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .table-fixed-header thead th {
          position: sticky;
          top: 0;
          background-color: #f8f9fa;
          z-index: 1;
        }
        
        .badge {
          font-size: 0.9rem;
          padding: 0.5em 0.8em;
        }

        .table-responsive {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 31, 63, 0.2) transparent;
        }

        .table-responsive::-webkit-scrollbar {
          width: 6px;
        }

        .table-responsive::-webkit-scrollbar-track {
          background: transparent;
        }

        .table-responsive::-webkit-scrollbar-thumb {
          background-color: rgba(0, 31, 63, 0.2);
          border-radius: 3px;
        }

        /* Responsive Styles */
        .responsive-title {
          font-size: calc(1.5rem + 0.5vw);
        }

        .responsive-subtitle {
          font-size: calc(1.2rem + 0.3vw);
        }

        .chart-card, .grid-card {
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .stats-container {
          gap: 1rem;
        }

        .stats-item {
          flex: 1;
          min-width: 100px;
          padding: 0.5rem;
        }

        .stats-number {
          font-size: calc(1.5rem + 0.3vw);
          margin-bottom: 0.5rem;
        }

        .stats-label {
          font-size: calc(0.8rem + 0.1vw);
          white-space: nowrap;
        }

        .table-fixed-header {
          font-size: calc(0.8rem + 0.1vw);
        }

        .badge {
          font-size: calc(0.75rem + 0.1vw);
          padding: 0.4em 0.6em;
        }

        /* Media Queries */
        @media (max-width: 992px) {
          .chart-container {
            height: 400px !important;
          }

          .stats-container {
            margin-top: 1rem !important;
          }
        }

        @media (max-width: 768px) {
          .stats-item {
            min-width: 80px;
          }

          .table-responsive {
            max-height: 400px !important;
          }
        }

        @media (max-width: 576px) {
          .p-4 {
            padding: 1rem !important;
          }

          .stats-number {
            font-size: 1.5rem;
          }

          .stats-label {
            font-size: 0.8rem;
          }
        }

        /* Enhanced scrollbar styles */
        .table-responsive {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 31, 63, 0.2) transparent;
        }

        .table-responsive::-webkit-scrollbar {
          width: 6px;
        }

        .table-responsive::-webkit-scrollbar-track {
          background: transparent;
        }

        .table-responsive::-webkit-scrollbar-thumb {
          background-color: rgba(0, 31, 63, 0.2);
          border-radius: 3px;
        }

        .table-responsive::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 31, 63, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Activecharts;
