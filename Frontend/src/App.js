import React, { useState, useEffect } from "react";
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
import TechnicianDetails from "./components/TechnicianDetails";
import FaultDetailsView from "./components/FaultDetailsView";

// Import Layout component if you have one, or create a simple one
const Layout = ({ children, onLogout }) => {
  return (
    <div className="app-layout">
      {/* Your layout components (header, sidebar, etc) would go here */}
      <main>{children}</main>
    </div>
  );
};

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [faults, setFaults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState([]); // Add this state
  const [resolved, setResolved] = useState([]); // Add this state

  // Restore session from localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser?.role) {
          setUserInfo(parsedUser);
          setLoggedIn(true);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Add effect to populate open and resolved faults
  useEffect(() => {
    if (faults.length > 0) {
      setOpen(faults.filter((fault) => fault.Status !== "Closed"));
      setResolved(faults.filter((fault) => fault.Status === "Closed"));
    }
  }, [faults]);

  // Fault handlers
  const handleNewFault = (faultData) => {
    const newFault = {
      id: Date.now(),
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

  // Auth handlers
  const handleLogin = (authData) => {
    if (!authData?.user?.role) {
      console.error("Login failed: missing role in user data");
      return;
    }

    setUserInfo(authData.user);
    setLoggedIn(true);

    if (authData.token) {
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
    }
  };

  const handleLogout = () => {
    setUserInfo(null);
    setLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Protected Route wrapper
  const RequireAuth = ({ children }) => {
    if (!loggedIn || !userInfo?.role) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Wrapper components for navigation
  const LoginWrapper = () => {
    const navigate = useNavigate();
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegisterClick={() => navigate("/register")}
      />
    );
  };

  const RegisterWrapper = () => {
    const navigate = useNavigate();
    return (
      <Register
        onRegisterSuccess={(user, token) => {
          handleLogin({ user, token });
          navigate("/");
        }}
        onCancel={() => navigate("/login")}
      />
    );
  };

  // Details wrapper with navigation
  const DetailsWrapper = () => {
    const navigate = useNavigate();
    return (
      <Layout onLogout={handleLogout}>
        <FaultDetailsView faults={faults} onBackClick={() => navigate("/")} />
      </Layout>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            loggedIn && userInfo?.role ? (
              <Navigate to="/" replace />
            ) : (
              <LoginWrapper />
            )
          }
        />
        <Route
          path="/register"
          element={
            loggedIn && userInfo?.role ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterWrapper />
            )
          }
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
              ) : (
                <DashboardViewOnly
                  faults={faults}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  userInfo={userInfo}
                  onLogout={handleLogout}
                  onNewFault={handleNewFault}
                />
              )}
            </RequireAuth>
          }
        />
        <Route
          path="/technician/:name"
          element={
            <RequireAuth>
              <TechnicianDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/details"
          element={
            <RequireAuth>
              <DetailsWrapper />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
