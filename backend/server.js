import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import connectionRoutes from "./routes/connection.route.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notification.route.js";
import postRoutes from "./routes/post.route.js";
import userRoutes from "./routes/user.route.js";
import caseRoutes from "./routes/case.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:5180"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'userId'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Handle preflight requests
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (corsOptions.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
});

app.use(cors(corsOptions));

app.use(express.json({ limit: "5mb" })); // parse JSON request bodies
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/cases", caseRoutes);
app.use("/api/v1/payments", paymentRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "..", "frontend", "dist", "index.html"));
	});
}

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	connectDB();
});
