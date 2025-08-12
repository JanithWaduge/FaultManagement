import React, { useState } from "react";
import { Modal, Image, Button } from "react-bootstrap";

export function PhotoModal({ show, photos, onHide, title = "Fault Photos" }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"; // Match your backend URL

  const handleImageClick = (photo) => {
    setSelectedImage(photo);
  };

  const handleCloseLargeImage = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {photos.length === 0 ? (
            <p>No photos available for this fault.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
              {photos.map((photo) => {
                const normalizedPath = photo.PhotoPath.replace(/\\/g, '/');
                const src = `${baseUrl}/${normalizedPath}`; // Full URL with relative path
                
                // Format the upload date and time
                const formatUploadDateTime = (uploadedAt) => {
                  if (!uploadedAt) return 'Unknown date';
                  const date = new Date(uploadedAt);
                  return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                };

                return (
                  <div key={photo.PhotoId} style={{ flex: "0 0 auto", textAlign: "center" }}>
                    <Image
                      src={src}
                      thumbnail
                      style={{ maxWidth: 150, maxHeight: 150, objectFit: "cover", cursor: "pointer" }}
                      alt={normalizedPath.split('/').pop() || 'Photo'}
                      onClick={() => handleImageClick(photo)}
                      onError={(e) => console.error("Thumbnail load error:", e, { src, photoPath: photo.PhotoPath })}
                    />
                    <div style={{ 
                      marginTop: "5px", 
                      fontSize: "0.75rem", 
                      color: "#666", 
                      maxWidth: "150px",
                      wordWrap: "break-word"
                    }}>
                      <div style={{ fontWeight: "500" }}>
                        {formatUploadDateTime(photo.UploadedAt)}
                      </div>
                      {photo.UploadedBy && (
                        <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                          By: {photo.UploadedBy}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>

      {selectedImage && (
        <Modal show={true} onHide={handleCloseLargeImage} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Photo Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ textAlign: "center" }}>
              <Image
                src={`${baseUrl}/${selectedImage.PhotoPath.replace(/\\/g, '/')}`}
                fluid
                style={{ maxHeight: "70vh", objectFit: "contain" }}
                alt="Full-size photo"
                onError={(e) => console.error("Large image load error:", e, { src: `${baseUrl}/${selectedImage.PhotoPath.replace(/\\/g, '/')}` })}
              />
              
              {/* Upload Information */}
              <div style={{ 
                marginTop: "15px", 
                padding: "10px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px",
                fontSize: "0.9rem",
                color: "#495057"
              }}>
                <div style={{ marginBottom: "5px" }}>
                  <strong>Upload Date & Time:</strong>{' '}
                  {selectedImage.UploadedAt ? 
                    new Date(selectedImage.UploadedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    }) : 'Unknown'
                  }
                </div>
                {selectedImage.UploadedBy && (
                  <div>
                    <strong>Uploaded By:</strong> {selectedImage.UploadedBy}
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseLargeImage}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}