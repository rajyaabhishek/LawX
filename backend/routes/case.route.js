import express from "express";
import { 
  createCase, 
  getMyCases, 
  getMyApplications, 
  getAllCases,
  getCaseById,
  getCaseApplicants,
  applyForCase,
  updateApplicationStatus,
  getPublicCases,
  likeCase
} from "../controllers/case.controller.js";
import { protectRoute, checkUserRole, checkPremiumUser, optionalAuth, trackActivity } from "../middleware/auth.middleware.js";
import Case from "../models/Case.js";

const router = express.Router();

// ====================================
// Public routes with optional authentication (enhanced for signed-in users)
// ====================================
router.get("/public", optionalAuth, trackActivity, getPublicCases);
router.get("/", optionalAuth, trackActivity, getAllCases);
router.get("/:caseId", optionalAuth, trackActivity, getCaseById);

// ====================================
// Protected routes (require authentication)
// ====================================
router.use(protectRoute);

// Create a new case (premium users only)
router.post("/", checkPremiumUser(), createCase);

// Get cases posted by the current user
router.get("/my/cases", getMyCases);

// Get cases the current user has applied to
router.get("/my/applications", getMyApplications);

// ====================================
// Case Application Endpoints
// ====================================

// Apply for a case (anyone can apply)
router.post(
  "/:caseId/apply", 
  applyForCase
);

// Get applicants for a specific case (case owner only)
router.get(
  "/:caseId/applicants", 
  getCaseApplicants
);

// Update application status (case owner only)
router.patch(
  "/:caseId/applications/:applicationId/status", 
  updateApplicationStatus
);

// ====================================
// Case Management Endpoints (for case owners)
// ====================================

// Update case status (e.g., Open, In Progress, Closed, Cancelled)
router.patch("/:caseId/status", async (req, res) => {
  // Implementation would go here
});

// Like/Unlike a case
router.post("/:caseId/like", likeCase);

// Update case details
router.patch("/:caseId", async (req, res) => {
  // Implementation would go here
});

// Delete a case
router.delete("/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user._id;
    
    // Find the case
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Check if the current user is the case owner
    if (caseDoc.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this case' 
      });
    }
    
    // Check if case has accepted applications
    const hasAcceptedApplications = caseDoc.applications.some(app => app.status === 'accepted');
    if (hasAcceptedApplications) {
      return res.status(400).json({ 
        error: 'Cannot delete case with accepted applications' 
      });
    }
    
    // Delete the case
    await Case.findByIdAndDelete(caseId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Case deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete case' 
    });
  }
});

export default router;