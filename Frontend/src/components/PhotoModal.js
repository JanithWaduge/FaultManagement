import React, { useState } from "react";
import { Modal, Image, Button } from "react-bootstrap";

export function PhotoModal({ show, photos, onHide, title = "Fault Photos" }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"; // Match your backend URL

  const handleImageClick = (photoPath) => {
    const normalizedPath = photoPath.replace(/\\/g, '/');
    setSelectedImage(normalizedPath);
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {photos.map((photo) => {
                const normalizedPath = photo.PhotoPath.replace(/\\/g, '/');
                const src = `${baseUrl}/${normalizedPath}`; // Full URL with relative path
                return (
                  <div key={photo.PhotoId} style={{ flex: "0 0 auto" }}>
                    <Image
                      src={src}
                      thumbnail
                      style={{ maxWidth: 150, maxHeight: 150, objectFit: "cover", cursor: "pointer" }}
                      alt={normalizedPath.split('/').pop() || 'Photo'}
                      onClick={() => handleImageClick(photo.PhotoPath)}
                      onError={(e) => console.error("Thumbnail load error:", e, { src, photoPath: photo.PhotoPath })}
                    />
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
            <Image
              src={`${baseUrl}/${selectedImage.replace(/\\/g, '/')}`}
              fluid
              style={{ maxHeight: "80vh", objectFit: "contain" }}
              alt="Full-size photo"
              onError={(e) => console.error("Large image load error:", e, { src: `${baseUrl}/${selectedImage.replace(/\\/g, '/')}` })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseLargeImage}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}