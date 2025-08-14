// Frontend/src/services/technicianService.js

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class TechnicianService {
  // Get the authorization token from localStorage
  getAuthToken() {
    return localStorage.getItem("token");
  }

  // Get headers with authentication
  getHeaders() {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Fetch all technicians
  async getAllTechnicians() {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch technicians: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.technicians,
        totalCount: data.totalCount,
      };
    } catch (error) {
      console.error("Error fetching technicians:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get technician by ID
  async getTechnicianById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians/${id}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch technician: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.technician,
      };
    } catch (error) {
      console.error("Error fetching technician:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create new technician
  async createTechnician(technicianData) {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(technicianData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to create technician: ${response.statusText}`
        );
      }

      return {
        success: true,
        data: data.technician,
        message: data.message,
      };
    } catch (error) {
      console.error("Error creating technician:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update technician
  async updateTechnician(id, technicianData) {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians/${id}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(technicianData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to update technician: ${response.statusText}`
        );
      }

      return {
        success: true,
        data: data.technician,
        message: data.message,
      };
    } catch (error) {
      console.error("Error updating technician:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete technician (soft delete)
  async deleteTechnician(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to delete technician: ${response.statusText}`
        );
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error deleting technician:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate technician data before sending to API
  validateTechnicianData(data) {
    const errors = [];

    if (!data.username || data.username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (!data.email || !this.validateEmail(data.email)) {
      errors.push("Valid email address is required");
    }

    if (!data.password || data.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Simple email validation
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get technician statistics (if needed for dashboard)
  async getTechnicianStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/technicians/stats`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch technician stats: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        success: true,
        data: data.stats,
      };
    } catch (error) {
      console.error("Error fetching technician stats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export a singleton instance
const technicianService = new TechnicianService();
export default technicianService;
