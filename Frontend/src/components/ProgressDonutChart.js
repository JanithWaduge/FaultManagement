import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Card } from "react-bootstrap";

Chart.register(ArcElement, Tooltip, Legend);

const ProgressDonutChart = ({ data, title, userName, colors }) => {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: colors || [
          "#ffc107", // Pending - Yellow
          "#17a2b8", // In Progress - Cyan
          "#dc3545", // Hold - Red
          "#28a745", // Closed - Green
        ],
        borderWidth: 2,
        borderColor: "#fff",
        hoverBorderWidth: 3,
        hoverBorderColor: "#333",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: "500",
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const color = data.datasets[0].backgroundColor[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: color,
                  strokeStyle: color,
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: "60%",
  };

  // Calculate total faults
  const totalFaults = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-light text-center py-3">
        <h6 className="mb-1 text-primary">
          <i className="fas fa-chart-pie me-2"></i>
          Fault Status Overview
        </h6>
        {userName && (
          <small className="text-muted">
            Welcome, <strong>{userName}</strong>
          </small>
        )}
      </Card.Header>
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <div style={{ width: "100%", height: "250px", position: "relative" }}>
          <Doughnut data={chartData} options={options} />
          <div 
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}
          >
            <div className="fw-bold fs-4 text-primary">{totalFaults}</div>
            <div className="small text-muted">Total Faults</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProgressDonutChart;
