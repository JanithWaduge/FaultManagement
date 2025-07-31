import React from "react";
import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Card, Row, Col } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const Activecharts = ({ faults }) => {
  const navigate = useNavigate();
  // Group faults by technician and status
  const technicianStats = {
    "John Doe": { inProgress: 0, pending: 0, resolved: 0 },
    "Jane Smith": { inProgress: 0, pending: 0, resolved: 0 },
    "Alex Johnson": { inProgress: 0, pending: 0, resolved: 0 },
    "Emily Davis": { inProgress: 0, pending: 0, resolved: 0 },
  };

  // Count faults for each technician by status
  faults.forEach((fault) => {
    if (technicianStats[fault.AssignTo]) {
      if (fault.Status === "In Progress") {
        technicianStats[fault.AssignTo].inProgress++;
      } else if (fault.Status === "Pending") {
        technicianStats[fault.AssignTo].pending++;
      } else if (fault.Status === "Closed") {
        technicianStats[fault.AssignTo].resolved++;
      }
    }
  });

  // Chart configuration
  const createChartData = (technicianData) => ({
    labels: ["In Progress", "Pending", "Resolved"],
    datasets: [
      {
        data: [
          technicianData.inProgress,
          technicianData.pending,
          technicianData.resolved,
        ],
        backgroundColor: [
          "rgba(255, 193, 7, 0.8)", // yellow for in progress
          "rgba(13, 202, 240, 0.8)", // cyan for pending
          "rgba(25, 135, 84, 0.8)", // green for resolved
        ],
        borderColor: [
          "rgba(255, 193, 7, 1)",
          "rgba(13, 202, 240, 1)",
          "rgba(25, 135, 84, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = (technicianName) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${technicianName}'s Fault Distribution`,
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  });

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#fff",
          padding: "1rem",
          borderBottom: "2px solid #eef2f7",
          marginBottom: "1rem",
          zIndex: 1000,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#001f3f",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          Technicians' Performance Overview
        </h3>
      </div>
      <div
        className="charts-container px-4"
        style={{
          height: "calc(100vh - 250px)",
          overflowY: "auto",
          paddingBottom: "2rem",
        }}
      >
        <Row className="g-4">
          {Object.entries(technicianStats).map(([technician, stats]) => (
            <Col key={technician} md={6} className="mb-4">
              <Card
                className="chart-card h-100"
                style={{
                  minHeight: "400px",
                  transition: "transform 0.2s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                }}
              >
                <Card.Body>
                  <div
                    style={{ height: "300px", cursor: "pointer" }}
                    title={`View details for ${technician}`}
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        alert("Please log in to view technician details");
                        return;
                      }

                      // Use navigate to handle the routing
                      const url = `/technician/${encodeURIComponent(
                        technician
                      )}`;

                      // Open in new tab with full origin
                      const fullUrl = `${window.location.origin}${url}`;
                      window.open(fullUrl, "_blank");
                    }}
                  >
                    <Pie
                      data={createChartData(stats)}
                      options={chartOptions(technician)}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="d-flex justify-content-around align-items-center flex-wrap">
                      <div className="px-2">
                        <div
                          className="fw-bold"
                          style={{ color: "rgba(255, 193, 7, 1)" }}
                        >
                          {stats.inProgress}
                        </div>
                        <div className="small text-muted">In Progress</div>
                      </div>
                      <div className="px-2">
                        <div
                          className="fw-bold"
                          style={{ color: "rgba(13, 202, 240, 1)" }}
                        >
                          {stats.pending}
                        </div>
                        <div className="small text-muted">Pending</div>
                      </div>
                      <div className="px-2">
                        <div
                          className="fw-bold"
                          style={{ color: "rgba(25, 135, 84, 1)" }}
                        >
                          {stats.resolved}
                        </div>
                        <div className="small text-muted">Resolved</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-top">
                      <div className="h5 mb-0">
                        Total Faults:{" "}
                        {stats.inProgress + stats.pending + stats.resolved}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Activecharts;
