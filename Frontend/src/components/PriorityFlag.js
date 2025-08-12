import React from "react";

const PriorityFlag = ({ priority, fault }) => {
  // Check if fault is overdue (more than a week old)
  const isOverdue = () => {
    if (!fault || !fault.DateTime || fault.Status === "Closed") return false;
    const faultDate = new Date(fault.DateTime);
    const currentDate = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return (currentDate - faultDate) > weekInMs;
  };

  const overdue = isOverdue();

  // Show overdue warning with high priority
  if (overdue && priority === "High") {
    return (
      <span className="d-flex align-items-center" style={{ gap: "2px" }}>
        <span
          className="overdue-flag"
          title="OVERDUE - This fault is more than a week old!"
          style={{ 
            fontSize: "1.1rem", 
            animation: "pulse 2s infinite",
            filter: "drop-shadow(0 0 3px rgba(220, 53, 69, 0.6))"
          }}
        >
          ⚠️
        </span>
        <span
          className="high-priority-flag"
          title="High Priority Fault - Requires Immediate Attention"
        >
          🚩
        </span>
      </span>
    );
  }

  // Show only overdue warning
  if (overdue) {
    return (
      <span
        className="overdue-flag"
        title="OVERDUE - This fault is more than a week old!"
        style={{ 
          fontSize: "1.1rem", 
          animation: "pulse 2s infinite",
          filter: "drop-shadow(0 0 3px rgba(220, 53, 69, 0.6))"
        }}
      >
        ⚠️
      </span>
    );
  }

  // Only show red flag if priority is High
  if (priority === "High") {
    return (
      <span
        className="high-priority-flag"
        title="High Priority Fault - Requires Immediate Attention"
      >
        🚩
      </span>
    );
  }

  // Show dash for normal priority
  return <span className="text-muted priority-placeholder">—</span>;
};

export default PriorityFlag;
