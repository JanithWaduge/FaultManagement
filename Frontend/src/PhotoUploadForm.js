import React, { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";

function PhotoUploadForm({ faultId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a photo to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("faultId", faultId);

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/photos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload photo");
      }

      await res.json();
      setError("");
      setFile(null);
      onUploadSuccess();
      alert("Photo uploaded successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleUpload}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Select Photo</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </Form.Group>
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Upload Photo"}
      </Button>
    </Form>
  );
}

export default PhotoUploadForm;