import React, { useState } from "react";
import { Card, Button, Form, InputGroup } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons";

const mockUsers = {
  michael: {
    name: "Michael Smith",
    avatarUrl: "https://i.pravatar.cc/100?img=3",
    password: "admin123",
    role: "admin",  // <-- add role here
  },

  emily: {
    name: "Emily Davis",
    avatarUrl: "https://i.pravatar.cc/100?img=15",
    password: "password456",
    role: "user",  // <-- add role here
  },
};

export default function LoginPage({ onLogin, onRegisterClick }) {
  console.log("LoginPage rendered");
  const [step, setStep] = useState(1);
  const [usernameInput, setUsernameInput] = useState("");
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const usernameKey = usernameInput.trim().toLowerCase();

    if (!usernameKey) {
      alert("Please enter your username");
      return;
    }

    if (mockUsers[usernameKey]) {
      setUser(mockUsers[usernameKey]);
      setStep(2);
    } else {
      alert("User not found");
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim() === "") {
      alert("Please enter your password");
      return;
    }

    if (password === user.password) {
      onLogin({
        name: user.name,
        email: `${usernameInput}@example.com`,
        role: user.role,
        avatarUrl: user.avatarUrl,
     });
    } else {
      alert("Incorrect password");
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
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "#12345b",
          borderRadius: "16px",
          padding: "2rem",
          color: "white",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
        }}
      >
        {step === 1 && (
          <>
            <h3 className="mb-4">Welcome!<br></br> What's your username?</h3>
            <Form onSubmit={handleUsernameSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.trimStart())}
                  autoFocus
                  style={{
                    backgroundColor: "#102c4a",
                    borderColor: "#345b96",
                    color: "white",
                    textAlign: "center",
                  }}
                />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                style={{ borderRadius: "8px", width: "100%" }}
              >
                Next
              </Button>
            </Form>

            {onRegisterClick && (
              <Button
                variant="link"
                className="mt-3 text-light"
                onClick={() => {
                  console.log("Register clicked");
                  onRegisterClick();
                }}
                style={{ textDecoration: "underline", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Register New User
              </Button>
            )}
          </>
        )}

        {step === 2 && user && (
          <>
            <div className="mb-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="rounded-circle"
                width="100"
                height="100"
                style={{ objectFit: "cover" }}
              />
              <h4 className="mt-3">{user.name}</h4>
            </div>
            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group className="mb-3" style={{ textAlign: "left" }}>
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
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
                    onClick={() => setShowPassword((v) => !v)}
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
              <Button
                type="submit"
                variant="primary"
                style={{ borderRadius: "8px", width: "100%" }}
              >
                Login
              </Button>
            </Form>

            <Button
              variant="link"
              className="mt-3 text-light"
              onClick={() => {
                setStep(1);
                setPassword("");
                setUsernameInput("");
                setUser(null);
              }}
            >
              Change User
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
