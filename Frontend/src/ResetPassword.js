import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address.");
      return;
    }
    alert(`Password reset link sent to ${email}`);
    setEmail("");
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundColor: "#0b2447" }}
    >
      <div
        className="card shadow p-4"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "15px",
          backgroundColor: "#102b52",
          color: "#ffffff",
        }}
      >
        <h4 className="text-center mb-4">Reset Password</h4>
        <form onSubmit={handleReset}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Enter your email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Send Reset Link
          </button>
        </form>
        <div className="text-center mt-3">
  <button
    className="btn btn-link text-info text-decoration-none p-0"
    onClick={() => window.location.href = "/login"}
  >
    ← Back to Login
  </button>
</div>
      </div>
    </div>
  );
}
