import express from "express";
import { applyForCase } from "../controllers/user.controller.js";
import { 
  createCase, 
  getMyCases, 
  getMyApplications, 
  getAllCases,
  getCaseById,
  getCaseApplicants
} from "../controllers/case.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCases);
router.get("/:caseId", getCaseById);

// Protected routes (require authentication)
router.use(protectRoute);

// Create a new case
router.post("/", createCase);

// Get cases posted by the current user
router.get("/my/cases", getMyCases);

// Get cases the current user has applied to
router.get("/my/applications", getMyApplications);

// Apply for a case
router.post("/:caseId/apply", applyForCase);

// Get applicants for a specific case (case owner only)
router.get("/:caseId/applicants", getCaseApplicants);

export default router;