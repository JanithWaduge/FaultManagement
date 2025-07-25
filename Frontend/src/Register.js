import React, { useState } from "react";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export default function Register({ onRegisterSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: formData.role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(result.message || "Username or email already exists");
        }
        throw new Error(result.message || "Registration failed");
      }

      // Automatically log in the user after successful registration
      const loginResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password,
          }),
        }
      );

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginResult.message || "Auto-login failed");
      }

      if (!loginResult.user?.role) {
        throw new Error("Invalid user data received");
      }

      // Store token and user data
      localStorage.setItem("token", loginResult.token);
      localStorage.setItem("user", JSON.stringify(loginResult.user));

      // Call success callback
      if (onRegisterSuccess) {
        onRegisterSuccess(loginResult.user);
      }

      // Navigate to home
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#12345b",
          borderRadius: "16px",
          padding: "2rem",
          color: "white",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h3 className="mb-4 text-center">Create New Account</h3>

        {error && <div className="mb-3 alert alert-danger">{error}</div>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              style={{
                backgroundColor: "#102c4a",
                borderColor: "#345b96",
                color: "white",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              style={{
                backgroundColor: "#102c4a",
                borderColor: "#345b96",
                color: "white",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                style={{
                  backgroundColor: "#102c4a",
                  borderColor: "#345b96",
                  color: "white",
                }}
              />
              <InputGroup.Text
                style={{
                  backgroundColor: "#102c4a",
                  borderColor: "#345b96",
                  cursor: "pointer",
                }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlash color="lightgray" />
                ) : (
                  <Eye color="lightgray" />
                )}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              style={{
                backgroundColor: "#102c4a",
                borderColor: "#345b96",
                color: "white",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              style={{
                backgroundColor: "#102c4a",
                borderColor: "#345b96",
                color: "white",
              }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
            </Form.Select>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{
                backgroundColor: "#345b96",
                border: "none",
                borderRadius: "8px",
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              style={{
                borderRadius: "8px",
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
