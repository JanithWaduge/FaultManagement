import React, { useState, useRef, useEffect } from "react";

export default function UserProfileDisplay({ user }) {
  const [showInfo, setShowInfo] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    // You can return null or a default avatar here if you want
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      <img
        src={user.avatarUrl || "https://i.pravatar.cc/40"}
        alt="User Avatar"
        className="rounded-circle"
        width="40"
        height="40"
        style={{ cursor: "pointer", objectFit: "cover" }}
        onClick={() => setShowInfo((prev) => !prev)}
        id="admin-avatar"
      />
      {showInfo && (
        <div
          ref={ref}
          style={{
            position: "absolute",
            top: "50px",
            right: 0,
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "10px 15px",
            width: "220px",
            color: "#222",
            fontSize: "0.9rem",
            zIndex: 1300,
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{user.name}</div>
          <div>Role: {user.role}</div>
          <div>Email: {user.email}</div>
        </div>
      )}
    </div>
  );
}
