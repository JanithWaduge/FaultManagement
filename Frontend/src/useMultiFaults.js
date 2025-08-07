import { useState, useEffect } from "react";

export function useMultiFaults() {
  const [open, setOpen] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  const fetchAllFaults = async () => {
    if (!token) return setErr("No authentication token.");
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/faults`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch faults");
      const data = await res.json();
      setOpen(data.filter((f) => f.Status?.toLowerCase() !== "closed"));
      setResolved(data.filter((f) => f.Status?.toLowerCase() === "closed"));
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    fetchAllFaults();
  }, []);

  const apiCall = async (method, endpoint, data) => {
    if (!token) throw new Error("Authentication required.");
    const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/faults${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: data ? JSON.stringify(data.SectionID === "" ? { ...data, SectionID: null } : data) : undefined,
    });
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(error.message || `Failed to ${method.toLowerCase()} fault`);
    }
    return resp.json();
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
    const result = await apiCall("POST", "", data);
    result.fault.Status.toLowerCase() === "closed"
      ? setResolved((r) => [...r, result.fault])
      : setOpen((o) => [...o, result.fault]);
    return result.fault; // Return the fault object with id
  };

  const update = async (data) => {
    const result = await apiCall("PUT", `/${data.id}`, data);
    updateState(result.fault);
    return result.fault; // Return the fault object with id
  };

  const remove = async (id) => {
    await apiCall("DELETE", `/${id}`);
    setOpen((o) => o.filter((f) => f.id !== id));
    setResolved((r) => r.filter((f) => f.id !== id));
  };

  const resolve = async (id) => {
    try {
      const fault = open.find((f) => f.id === id);
      if (!fault) throw new Error("Fault not found in open list.");
      const result = await apiCall("PUT", `/${id}`, { ...fault, Status: "Closed" });
      setOpen((o) => o.filter((f) => f.id !== id));
      setResolved((r) => (r.some((f) => f.id === id) ? r : [...r, result.fault]));
    } catch (error) {
      setErr(error.message);
    }
  };

  return { open, resolved, create, update, remove, resolve, err, setErr, fetchAllFaults };
}