import { useState, useCallback } from "react";

export function useFaultNotes(token) {
  const [notes, setNotes] = useState({}); // { [faultId]: [note objects] }
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(
    async (faultId) => {
      if (!token || !faultId) return;
      
      setLoading(prev => ({ ...prev, [faultId]: true }));
      setError(null);
      
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/faults/notes/${faultId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!res.ok) {
          if (res.status === 404) {
            // No notes found for this fault
            setNotes((prev) => ({ ...prev, [faultId]: [] }));
            return;
          }
          throw new Error(`Failed to fetch notes: ${res.status}`);
        }
        
        const data = await res.json();
        setNotes((prev) => ({ ...prev, [faultId]: data || [] }));
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setNotes((prev) => ({ ...prev, [faultId]: [] }));
      } finally {
        setLoading(prev => ({ ...prev, [faultId]: false }));
      }
    },
    [token]
  );

  const addNote = useCallback(
    async ({ FaultID, Notes }) => {
      if (!token) throw new Error("Authentication required.");
      if (!Notes || Notes.trim() === '') throw new Error("Notes cannot be empty.");
      
      setError(null);
      
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/faults/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ FaultID, Notes: Notes.trim() }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save note");
        }
        
        const data = await res.json();
        setNotes((prev) => ({
          ...prev,
          [FaultID]: [data.note, ...(prev[FaultID] || [])],
        }));
        
        return data.note;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [token]
  );

  const editNote = useCallback(
    async ({ id, Notes, FaultID }) => {
      if (!token) throw new Error("Authentication required.");
      if (!Notes || Notes.trim() === '') throw new Error("Notes cannot be empty.");
      
      setError(null);
      
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/faults/notes/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ Notes: Notes.trim() }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to edit note");
        }
        
        const data = await res.json();
        setNotes((prev) => ({
          ...prev,
          [FaultID]: (prev[FaultID] || []).map((note) => 
            note.id === id ? data.note : note
          ),
        }));
        
        return data.note;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [token]
  );

  const deleteNote = useCallback(
    async ({ id, FaultID }) => {
      if (!token) throw new Error("Authentication required.");
      
      setError(null);
      
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/faults/notes/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to delete note");
        }
        
        setNotes((prev) => ({
          ...prev,
          [FaultID]: (prev[FaultID] || []).filter((note) => note.id !== id),
        }));
        
        return true;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [token]
  );

  const clearNotesCache = useCallback(() => {
    setNotes({});
    setError(null);
  }, []);

  return { 
    notes, 
    loading, 
    error, 
    fetchNotes, 
    addNote, 
    editNote, 
    deleteNote,
    clearNotesCache 
  };
}