import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";

const inputStyle = {
  backgroundColor: "#102c4a",
  borderColor: "#345b96",
  color: "white",
};

const cancelBtnStyle = {
  backgroundColor: "#345b96",
  borderColor: "#2c4a7f",
  color: "white",
  fontWeight: "600",
  minWidth: "100px",
};

const registerBtnStyle = {
  backgroundColor: "#ff6f00",
  borderColor: "#e65c00",
  color: "white",
  fontWeight: "600",
  minWidth: "100px",
};

export default function Register({ onRegisterSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !role.trim()
    ) {
      alert("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert(`User "${username}" registered successfully with role "${role}"!`);

    // Pass user info back to App
    onRegisterSuccess({
      name: username,
      email,
      role,
      avatarUrl: "https://i.pravatar.cc/100", // Placeholder avatar
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#0b1e39",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <Card
        style={{
          maxWidth: 400,
          width: "100%",
          backgroundColor: "#12345b",
          borderRadius: 16,
          padding: "2rem",
          color: "white",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
        }}
      >
        <h3 className="mb-4">Register New User</h3>
        <Form onSubmit={handleSubmit} aria-label="Register form">
          <Form.Group className="mb-3" controlId="registerUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              aria-required="true"
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              aria-required="true"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              aria-required="true"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerConfirmPassword">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              aria-required="true"
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="registerRole">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
              aria-required="true"
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="guest">Guest</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button
              variant="secondary"
              onClick={onCancel}
              style={cancelBtnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#2c4a7f")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = cancelBtnStyle.backgroundColor)
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              style={registerBtnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#27ae60")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = registerBtnStyle.backgroundColor)
              }
            >
              Register
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
