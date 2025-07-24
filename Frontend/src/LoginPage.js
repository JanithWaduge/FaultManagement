import React, { useState } from "react";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api/auth";

export default function LoginPage({ onLogin, onRegisterClick }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  const technicianList = ["John Doe", "Jane Smith", "Alex Johnson", "Emily Davis"];
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTechnician = technicianList.includes(user.username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both the username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (result.message.includes('inactive')) {
            throw new Error('Your account is inactive. Please contact support.');
          }
          throw new Error('Invalid username or password');
        }
        throw new Error(result.message || 'Login failed');
      }

      if (!result.user?.role) {
        throw new Error('Invalid user data received');
      }

      // Store token and user data
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Call parent callback
      if (onLogin) {
        onLogin({
          token: result.token,
          user: result.user
        });
      }

      // Navigate to home
      navigate('/');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      
      if (err.message.includes('inactive')) {
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#0b1e39",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "1rem",
    }}>
      <Card style={{
        maxWidth: "500px",
        width: "100%",
        backgroundColor: "#12345b",
        borderRadius: "16px",
        padding: "2rem",
        color: "white",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
      }}>
        <h3 className="mb-4 text-center">Login to your account</h3>
        
        {error && (
          <div className="mb-3 alert alert-danger">
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {showPassword ? <EyeSlash color="lightgray" /> : <Eye color="lightgray" />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            style={{ 
              borderRadius: "8px", 
              width: "100%",
              backgroundColor: "#345b96",
              border: "none"
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Form>

        <div className="mt-3 text-center">
          <span className="text-muted">Don't have an account? </span>
          <Button
            variant="link"
            className="p-0 text-light"
            onClick={onRegisterClick}
            style={{ 
              textDecoration: "underline",
              fontSize: "0.9rem",
            }}
          >
            Register here
          </Button>
        </div>
      </Card>
    </div>
  );
}