import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./Dashboard";
import DashboardViewOnly from "./DashboardViewOnly";
import LoginPage from "./LoginPage";
import Register from "./Register";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Mock fault data
  const [faults, setFaults] = useState([
    {
      id: 1,
      systemID: "SYS001",
      sectionID: "SEC001",
      reportedBy: "Michael Smith",
      location: "Server Room",
      description: "Router malfunction",
      urgency: "high",
      status: "open",
      assignedTo: "John Doe",
      reportedAt: "2025-07-11 09:30 AM",
    },
    {
      id: 2,
      systemID: "SYS002",
      sectionID: "SEC002",
      reportedBy: "Emily Davis",
      location: "Office Floor",
      description: "Switch port failure",
      urgency: "medium",
      status: "closed",
      assignedTo: "Jane Smith",
      reportedAt: "2025-07-10 02:15 PM",
    },
  ]);

  const [notifications, setNotifications] = useState([]);

  // Fault handlers (add/update/delete)
  const handleNewFault = (faultData) => {
     const maxId = faults.length > 0 ? Math.max(...faults.map(f => f.id)) : 0;

    const newFault = {
      id: maxId + 1, // Incremental ID based on existing faults
      reportedAt: new Date().toLocaleString(),
      ...faultData,
    };
    setFaults((prev) => [...prev, newFault]);
    setNotifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `New fault reported: ${faultData.description}`,
        isRead: false,
      },
    ]);
  };

  const handleUpdateFault = (updatedFault) => {
    setFaults((prev) =>
      prev.map((f) => (f.id === updatedFault.id ? updatedFault : f))
    );
  };

  const handleDeleteFault = (id) => {
    setFaults((prev) => prev.filter((f) => f.id !== id));
  };

  // Login handler: expects user object with at least {role, name}
  const handleLogin = (user) => {
    if (!user || !user.role) {
      alert("Login failed: missing role in user data.");
      return;
    }
    setUserInfo(user);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setUserInfo(null);
    setLoggedIn(false);
  };

  // Protected Route wrapper component
  const RequireAuth = ({ children }) => {
    if (!loggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Wrapper to use navigate in LoginPage
  const LoginWrapper = () => {
    const navigate = useNavigate();

    return (
      <LoginPage
        onLogin={handleLogin}
        onRegisterClick={() => navigate("/register")}
      />
    );
  };

  // Wrapper for Register page to pass onRegisterSuccess and onCancel properly
  const RegisterWrapper = () => {
    const navigate = useNavigate();

    return (
      <Register
        onRegisterSuccess={(user) => {
          handleLogin(user); // user must contain role!
          navigate("/");
        }}
        onCancel={() => navigate("/login")}
      />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={loggedIn ? <Navigate to="/" replace /> : <LoginWrapper />}
        />
        <Route
          path="/register"
          element={loggedIn ? <Navigate to="/" replace /> : <RegisterWrapper />}
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              {userInfo?.role === "admin" ? (
                <Dashboard
                  faults={faults}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  userInfo={userInfo}
                  onLogout={handleLogout}
                  onNewFault={handleNewFault}
                  onUpdateFault={handleUpdateFault}
                  onDeleteFault={handleDeleteFault}
                />
              ) : userInfo?.role === "user" ? (
                <DashboardViewOnly
                  faults={faults}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  userInfo={userInfo}
                  onLogout={handleLogout}
                  onNewFault={handleNewFault} 
                />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <h2>Unauthorized Access</h2>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
