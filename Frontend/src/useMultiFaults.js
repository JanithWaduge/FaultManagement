import { useState, useEffect } from "react";

export function useMultiFaults() {
  const [open, setOpen] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [err, setErr] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchAllFaults = async () => {
    const token = getToken();
    if (!token) {
      setErr("No authentication token found. Please login again.");
      return;
    }

    try {
      const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      console.log("Fetching faults from:", `${baseUrl}/api/faults`);
      console.log("Token present:", !!token);

      const res = await fetch(`${baseUrl}/api/faults`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Response status:", res.status);

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setErr("Session expired. Please login again.");
        // Redirect to login page
        window.location.href = "/";
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch faults: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log("Fetched faults:", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected array");
      }

      setOpen(data.filter((f) => f.Status?.toLowerCase() !== "closed"));
      setResolved(data.filter((f) => f.Status?.toLowerCase() === "closed"));
      setErr("");
    } catch (e) {
      console.error("Error fetching faults:", e);
      setErr(e.message);
    }
  };

  useEffect(() => {
    fetchAllFaults();
  }, []);

  const apiCall = async (method, endpoint, data) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    const url = `${baseUrl}/api/faults${endpoint}`;
    
    console.log(`${method} request to:`, url);
    console.log("Data:", data);

    try {
      const resp = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: data ? JSON.stringify(data.SectionID === "" ? { ...data, SectionID: null } : data) : undefined,
      });

      console.log("Response status:", resp.status);

      if (resp.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw new Error("Session expired. Please login again.");
      }

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Error response:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || `Failed to ${method.toLowerCase()} fault` };
        }
        throw new Error(error.message || `Failed to ${method.toLowerCase()} fault`);
      }

      const result = await resp.json();
      console.log("API response:", result);
      return result;
    } catch (error) {
      console.error(`API call error (${method} ${endpoint}):`, error);
      throw error;
    }
  };

  const updateState = (fault) => {
    if (fault.Status.toLowerCase() === "closed") {
      setOpen((o) => o.filter((f) => f.id !== fault.id));
      setResolved((r) =>
        r.some((f) => f.id === fault.id) ? r.map((f) => (f.id === fault.id ? fault : f)) : [...r, fault]
      );
    } else {
      setOpen((o) => o.map((f) => (f.id === fault.id ? fault : f)));
      setResolved((r) => r.filter((f) => f.id !== fault.id));
    }
  };

  const create = async (data) => {
    try {
      const result = await apiCall("POST", "", data);
      console.log("Create result:", result);
      
      // Handle different response formats
      const fault = result.fault || result;
      
      if (!fault || !fault.id) {
        throw new Error("Invalid response: no fault ID returned");
      }

      // Update state
      if (fault.Status.toLowerCase() === "closed") {
        setResolved((r) => [...r, fault]);
      } else {
        setOpen((o) => [...o, fault]);
      }
      
      return fault;
    } catch (error) {
      console.error("Create error:", error);
      setErr(error.message);
      throw error;
    }
  };

  const update = async (data) => {
    try {
      const result = await apiCall("PUT", `/${data.id}`, data);
      console.log("Update result:", result);
      
      // Handle different response formats
      const fault = result.fault || result;
      
      if (!fault || !fault.id) {
        throw new Error("Invalid response: no fault ID returned");
      }

      updateState(fault);
      return fault;
    } catch (error) {
      console.error("Update error:", error);
      setErr(error.message);
      throw error;
    }
  };

  const remove = async (id) => {
    try {
      await apiCall("DELETE", `/${id}`);
      setOpen((o) => o.filter((f) => f.id !== id));
      setResolved((r) => r.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Remove error:", error);
      setErr(error.message);
      throw error;
    }
  };

  const resolve = async (id) => {
    try {
      const fault = open.find((f) => f.id === id);
      if (!fault) throw new Error("Fault not found in open list.");
      
      const result = await apiCall("PUT", `/${id}`, { ...fault, Status: "Closed" });
      const updatedFault = result.fault || result;
      
      setOpen((o) => o.filter((f) => f.id !== id));
      setResolved((r) => (r.some((f) => f.id === id) ? r : [...r, updatedFault]));
    } catch (error) {
      console.error("Resolve error:", error);
      setErr(error.message);
      throw error;
    }
  };

  return { 
    open, 
    resolved, 
    create, 
    update, 
    remove, 
    resolve, 
    error: err, 
    setErr, 
    fetchAllFaults, 
    setOpen, 
    setResolved 
  };
}