import { sendConnectionAcceptedEmail } from "../emails/emailHandlers.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Case from "../models/Case.js";

export const sendConnectionRequest = async (req, res) => {
	try {
		const { userId } = req.params;
		const senderId = req.user._id;

		if (senderId.toString() === userId) {
			return res.status(400).json({ message: "You can't send a request to yourself" });
		}

		// check if the recipient exists
		const recipient = await User.findById(userId);
		if (!recipient) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if a pending request already exists in **either** direction
		const existingRequest = await ConnectionRequest.findOne({
			$or: [
				{ sender: senderId, recipient: userId, status: "pending" },
				{ sender: userId, recipient: senderId, status: "pending" },
			],
		});

		if (existingRequest) {
			// If the *other* user already sent us a request, return a specific message
			const iSentTheRequest = existingRequest.sender.toString() === senderId.toString();
			return res.status(400).json({
				message: iSentTheRequest
					? "Connection request already sent"
					: "You have a pending connection request from this user",
				requestId: iSentTheRequest ? undefined : existingRequest._id,
			});
		}

		const newRequest = new ConnectionRequest({
			sender: senderId,
			recipient: userId,
		});

		await newRequest.save();
		res.status(201).json({ message: "Connection request sent successfully" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

export const acceptConnectionRequest = async (req, res) => {
	try {
		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await ConnectionRequest.findById(requestId)
			.populate("sender", "name email username")
			.populate("recipient", "name username");

		if (!request) {
			return res.status(404).json({ message: "Connection request not found" });
		}

		// check if the req is for the current user
		if (request.recipient._id.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		if (request.status !== "pending") {
			return res.status(400).json({ message: "Request already processed" });
		}

		request.status = "accepted";
		await request.save();

		// if req is accepted,  update both users' connections
		await User.findByIdAndUpdate(request.sender._id, { $addToSet: { connections: userId } });
		await User.findByIdAndUpdate(userId, { $addToSet: { connections: request.sender._id } });

		res.json({ message: "Connection request accepted" });

		const senderEmail = request.sender.email;
		const senderName = request.sender.name;
		const recipientName = request.recipient.name;
		const profileUrl = process.env.CLIENT_URL + "/profile/" + request.recipient.username;

		try {
			await sendConnectionAcceptedEmail(senderEmail, senderName, recipientName, profileUrl);
		} catch (emailError) {
			console.error("Error sending connection accepted email:", emailError);
		}
	} catch (error) {
		console.error("Error in acceptConnectionRequest controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const rejectConnectionRequest = async (req, res) => {
	try {
		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await ConnectionRequest.findById(requestId);

		if (request.recipient.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		if (request.status !== "pending") {
			return res.status(400).json({ message: "Request already processed" });
		}

		request.status = "rejected";
		await request.save();

		res.json({ message: "Connection request rejected" });
	} catch (error) {
		console.error("Error in rejectConnectionRequest controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getConnectionRequests = async (req, res) => {
	try {
		// If user is not authenticated (guest mode), return empty array
		if (!req.user) {
			return res.status(200).json([]);
		}

		const userId = req.user._id;

		const requests = await ConnectionRequest.find({ recipient: userId, status: "pending" }).populate(
			"sender",
			"name username profilePicture headline connections"
		);

		res.json(requests);
	} catch (error) {
		console.error("Error in getConnectionRequests controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getUserConnections = async (req, res) => {
	try {
		// If user is not authenticated (guest mode), return empty array
		if (!req.user) {
			return res.status(200).json([]);
		}

		const userId = req.user._id;

		// Get regular connections
		const user = await User.findById(userId).populate(
			"connections",
			"name username profilePicture headline connections"
		);

		// Get case applicants for cases posted by the user
		const userCases = await Case.find({ user: userId })
			.populate({
				path: 'applications.user',
				select: 'name username profilePicture headline connections'
			})
			.select('applications title _id');

		// Extract case applicants and add case information
		const caseApplicants = [];
		userCases.forEach(caseDoc => {
			caseDoc.applications.forEach(app => {
				// Don't include if already a connection
				if (!user.connections.some(conn => conn._id.toString() === app.user._id.toString())) {
					caseApplicants.push({
						...app.user.toObject(),
						caseTag: {
							type: 'case_applicant',
							caseTitle: caseDoc.title,
							caseId: caseDoc._id,
							applicationStatus: app.status
						}
					});
				}
			});
		});

		// Get cases the user has applied to (to show case posters)
		const appliedCases = await Case.find({ "applications.user": userId })
			.populate('user', 'name username profilePicture headline connections')
			.select('user title _id applications');

		const casePosters = [];
		appliedCases.forEach(caseDoc => {
			// Don't include if already a connection
			if (!user.connections.some(conn => conn._id.toString() === caseDoc.user._id.toString())) {
				const userApplication = caseDoc.applications.find(app => 
					app.user.toString() === userId.toString()
				);
				casePosters.push({
					...caseDoc.user.toObject(),
					caseTag: {
						type: 'case_poster',
						caseTitle: caseDoc.title,
						caseId: caseDoc._id,
						applicationStatus: userApplication?.status || 'pending'
					}
				});
			}
		});

		// Combine all connections with tags
		const allConnections = [
			...user.connections.map(conn => ({ ...conn.toObject(), caseTag: null })),
			...caseApplicants,
			...casePosters
		];

		res.json(allConnections);
	} catch (error) {
		console.error("Error in getUserConnections controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const removeConnection = async (req, res) => {
	try {
		const myId = req.user._id;
		const { userId } = req.params;

		await User.findByIdAndUpdate(myId, { $pull: { connections: userId } });
		await User.findByIdAndUpdate(userId, { $pull: { connections: myId } });

		res.json({ message: "Connection removed successfully" });
	} catch (error) {
		console.error("Error in removeConnection controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getConnectionStatus = async (req, res) => {
	try {
		// If user is not authenticated (guest mode), return "not_connected"
		if (!req.user) {
			return res.json({ status: "not_connected" });
		}

		const targetUserId = req.params.userId;
		const currentUserId = req.user._id;

		// Fetch current user with only the `connections` field to minimise payload
		const currentUser = await User.findById(currentUserId).select("connections");

		// 1️⃣  Check if users are already connected
		const isConnected = currentUser.connections.some(
			(connId) => connId.toString() === targetUserId.toString()
		);
		if (isConnected) {
			return res.json({ status: "connected" });
		}

		// 2️⃣  Check for an existing *pending* request in **either** direction
		const pendingRequest = await ConnectionRequest.findOne({
			$or: [
				{ sender: currentUserId, recipient: targetUserId, status: "pending" },
				{ sender: targetUserId, recipient: currentUserId, status: "pending" },
			],
		});

		if (pendingRequest) {
			const sentByCurrentUser = pendingRequest.sender.toString() === currentUserId.toString();
			return res.json({
				status: sentByCurrentUser ? "pending" : "received",
				requestId: sentByCurrentUser ? undefined : pendingRequest._id,
			});
		}

		res.json({ status: "not_connected" });
	} catch (error) {
		console.error("Error in getConnectionStatus controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};
