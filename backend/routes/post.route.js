import express from "express";
import { protectRoute, optionalAuth, trackActivity } from "../middleware/auth.middleware.js";
import {
	createPost,
	getFeedPosts,
	deletePost,
	getPostById,
	createComment,
	likePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// Public routes with optional auth (guests can view, auth users get enhanced experience)
router.get("/", optionalAuth, trackActivity, getFeedPosts);
router.get("/:id", optionalAuth, trackActivity, getPostById);

// Protected routes (require authentication)
router.post("/create", protectRoute, createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/like", protectRoute, likePost);

export default router;
