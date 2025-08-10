import React from "react";

const PriorityFlag = ({ priority }) => {
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
