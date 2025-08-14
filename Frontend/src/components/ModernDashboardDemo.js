import React, { useState } from "react";
import { Container, Row, Col, Button, Card, Tab, Tabs } from "react-bootstrap";
import EnhancedPendingFaultsTable from "./EnhancedPendingFaultsTable";
import ModernTechnicianCards from "./ModernTechnicianCards";

// Sample data for demonstration
const sampleFaults = [
  {
    id: 1,
    SystemID: "SYS001",
    DescFault: "Network connectivity issues in building A",
    Status: "In Progress",
    AssignTo: "John Doe",
    ReportedBy: "Alice Smith",
    Location: "Building A",
    LocationOfFault: "Server Room 1",
    DateTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isHighPriority: true,
    Priority: "High",
  },
  {
    id: 2,
    SystemID: "SYS002",
    DescFault: "Printer malfunction in office 205",
    Status: "Pending",
    AssignTo: "Jane Smith",
    ReportedBy: "Bob Johnson",
    Location: "Building B",
    LocationOfFault: "Office 205",
    DateTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isHighPriority: false,
    Priority: "Normal",
  },
  {
    id: 3,
    SystemID: "SYS003",
    DescFault: "HVAC system not responding to temperature controls",
    Status: "Hold",
    AssignTo: "Mike Wilson",
    ReportedBy: "Sarah Davis",
    Location: "Building C",
    LocationOfFault: "Mechanical Room",
    DateTime: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    isHighPriority: false,
    Priority: "Normal",
  },
  {
    id: 4,
    SystemID: "SYS004",
    DescFault: "Emergency lighting system failure",
    Status: "In Progress",
    AssignTo: "John Doe",
    ReportedBy: "Tom Brown",
    Location: "Building A",
    LocationOfFault: "Stairwell B",
    DateTime: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago (overdue)
    isHighPriority: true,
    Priority: "High",
  },
  {
    id: 5,
    SystemID: "SYS005",
    DescFault: "Access card reader not working",
    Status: "Pending",
    AssignTo: "Jane Smith",
    ReportedBy: "Lisa Wilson",
    Location: "Building D",
    LocationOfFault: "Main Entrance",
    DateTime: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    isHighPriority: false,
    Priority: "Normal",
  },
  {
    id: 6,
    SystemID: "SYS006",
    DescFault: "Fire alarm system showing false alarms",
    Status: "Closed",
    AssignTo: "Mike Wilson",
    ReportedBy: "David Lee",
    Location: "Building B",
    LocationOfFault: "Fire Panel Room",
    DateTime: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    ClosedAt: new Date(Date.now() - 86400000).toISOString(), // Closed 1 day ago
    isHighPriority: true,
    Priority: "High",
  },
];

const sampleTechnicians = [
  "John Doe",
  "Jane Smith",
  "Mike Wilson",
  "Sarah Johnson",
  "David Brown",
];

const ModernDashboardDemo = () => {
  const [selectedFault, setSelectedFault] = useState(null);
  const [activeTab, setActiveTab] = useState("enhanced-table");

  const handleViewDetails = (fault) => {
    setSelectedFault(fault);
    console.log("Viewing fault details:", fault);
    // In real implementation, this would open a modal or navigate to details page
  };

  const handleTechnicianClick = (technician) => {
    console.log("Technician clicked:", technician);
    // In real implementation, this would filter faults by technician
  };

  return (
    <div className="dashboard-modern">
      <Container fluid>
        {/* Modern Header */}
        <div className="dashboard-header text-center mb-5">
          <h1 className="dashboard-title">Enhanced Dashboard UI</h1>
          <p className="dashboard-subtitle">
            Modern, responsive components for the Fault Management System
          </p>
        </div>

        {/* Demo Tabs */}
        <Card className="glass-card mb-4">
          <Card.Body>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="nav-pills mb-4"
              justify
            >
              <Tab eventKey="enhanced-table" title="Enhanced Faults Table">
                <div className="fade-in">
                  <EnhancedPendingFaultsTable
                    faults={sampleFaults}
                    onViewDetails={handleViewDetails}
                    title="Enhanced Pending Faults"
                  />
                </div>
              </Tab>

              <Tab
                eventKey="modern-technicians"
                title="Modern Technician Cards"
              >
                <div className="fade-in">
                  <ModernTechnicianCards
                    technicians={sampleTechnicians}
                    faults={sampleFaults}
                    onTechnicianClick={handleTechnicianClick}
                    showAddButton={true}
                  />
                </div>
              </Tab>

              <Tab eventKey="combined-view" title="Combined Layout">
                <div className="fade-in">
                  <Row className="g-4">
                    <Col lg={8}>
                      <EnhancedPendingFaultsTable
                        faults={sampleFaults}
                        onViewDetails={handleViewDetails}
                        title="All Pending Faults"
                      />
                    </Col>
                    <Col lg={4}>
                      <ModernTechnicianCards
                        technicians={sampleTechnicians}
                        faults={sampleFaults}
                        onTechnicianClick={handleTechnicianClick}
                        showAddButton={true}
                      />
                    </Col>
                  </Row>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

        {/* Feature Highlights */}
        <Row className="g-4 mb-5 stagger-animation">
          <Col md={4}>
            <Card className="glass-card card-hover h-100">
              <Card.Body className="text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-table text-primary"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>
                <h5>Enhanced Table</h5>
                <p className="text-muted">
                  Advanced filtering, sorting, pagination, and bulk operations
                  with modern styling
                </p>
                <ul className="list-unstyled text-start">
                  <li>✅ Real-time search</li>
                  <li>✅ Multi-column sorting</li>
                  <li>✅ Bulk selection</li>
                  <li>✅ Export functionality</li>
                  <li>✅ Responsive design</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="glass-card card-hover h-100">
              <Card.Body className="text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-people text-success"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>
                <h5>Modern Technician Cards</h5>
                <p className="text-muted">
                  Beautiful glass-morphism cards with workload visualization and
                  quick actions
                </p>
                <ul className="list-unstyled text-start">
                  <li>✅ Workload indicators</li>
                  <li>✅ Status tracking</li>
                  <li>✅ Skill specializations</li>
                  <li>✅ Performance metrics</li>
                  <li>✅ Quick assign actions</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="glass-card card-hover h-100">
              <Card.Body className="text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-palette text-warning"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>
                <h5>Modern Design System</h5>
                <p className="text-muted">
                  Consistent design language with CSS custom properties and
                  smooth animations
                </p>
                <ul className="list-unstyled text-start">
                  <li>✅ Glass morphism effects</li>
                  <li>✅ Smooth animations</li>
                  <li>✅ Gradient backgrounds</li>
                  <li>✅ Custom scrollbars</li>
                  <li>✅ Theme support ready</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Usage Instructions */}
        <Card className="glass-card">
          <Card.Header className="glass-header">
            <h5 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Integration Instructions
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Enhanced Pending Faults Table</h6>
                <p className="text-muted">
                  Replace your existing AllPendingFaultsTable component with
                  EnhancedPendingFaultsTable:
                </p>
                <div className="bg-light p-3 rounded">
                  <code>
                    {`import EnhancedPendingFaultsTable from './components/EnhancedPendingFaultsTable';

// Replace in Dashboard.js
<EnhancedPendingFaultsTable
  faults={open}
  onViewDetails={(fault) => openEditModal(fault)}
  title="All Pending Faults"
/>`}
                  </code>
                </div>
              </Col>
              <Col md={6}>
                <h6>Modern Technician Cards</h6>
                <p className="text-muted">
                  Replace SimplifiedTechnicianCards with ModernTechnicianCards:
                </p>
                <div className="bg-light p-3 rounded">
                  <code>
                    {`import ModernTechnicianCards from './components/ModernTechnicianCards';

// Replace in Dashboard.js
<ModernTechnicianCards
  technicians={assignablePersons}
  faults={[...open, ...resolved]}
  onTechnicianClick={handleTechnicianClick}
  showAddButton={true}
/>`}
                  </code>
                </div>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="text-center">
              <Button
                variant="primary"
                className="btn-modern btn-gradient-primary me-3"
                onClick={() => setActiveTab("combined-view")}
              >
                <i className="bi bi-eye me-2"></i>
                View Combined Layout
              </Button>
              <Button
                variant="outline-primary"
                className="btn-modern"
                onClick={() =>
                  window.open("https://react-bootstrap.github.io/", "_blank")
                }
              >
                <i className="bi bi-book me-2"></i>
                React Bootstrap Docs
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Selected Fault Details */}
        {selectedFault && (
          <Card className="glass-card mt-4">
            <Card.Header className="glass-header">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-eye me-2"></i>
                  Selected Fault Details
                </h6>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setSelectedFault(null)}
                >
                  <i className="bi bi-x"></i>
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>ID:</strong> #{selectedFault.id}
                  </p>
                  <p>
                    <strong>System:</strong> {selectedFault.SystemID}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`badge bg-${
                        selectedFault.Status === "In Progress"
                          ? "primary"
                          : selectedFault.Status === "Pending"
                          ? "warning"
                          : "secondary"
                      } ms-2`}
                    >
                      {selectedFault.Status}
                    </span>
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Assigned To:</strong> {selectedFault.AssignTo}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedFault.Location}
                  </p>
                  <p>
                    <strong>Priority:</strong>
                    {selectedFault.isHighPriority && (
                      <span className="badge bg-danger ms-2">High</span>
                    )}
                  </p>
                </Col>
                <Col xs={12}>
                  <p>
                    <strong>Description:</strong> {selectedFault.DescFault}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default ModernDashboardDemo;
