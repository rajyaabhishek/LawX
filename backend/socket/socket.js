import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization", "userId"],
		exposedHeaders: ["Content-Type", "Authorization"],
		preflight: true,
		optionsSuccessStatus: 204
	},
	
	// Handle preflight requests
	handlePreflightRequest: (req, res) => {
		res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, userId');
		res.header('Access-Control-Allow-Credentials', 'true');
		res.status(204).end();
	}
});

export const getRecipientSocketId = (recipientId) => {
	return userSocketMap[recipientId];
};

const userSocketMap = {}; // userId: socketId

io.on("connection", (socket) => {
	console.log("user connected", socket.id);
	const userId = socket.handshake.query.userId;

	if (userId != "undefined") userSocketMap[userId] = socket.id;
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	socket.on("sendMessage", async (messageData) => {
		try {
			const { recipientId, ...message } = messageData;
			
			// Find or create conversation
			let conversation = await Conversation.findOne({
				participants: { $all: [message.sender, recipientId] },
			});

			if (!conversation) {
				conversation = new Conversation({
					participants: [message.sender, recipientId],
					lastMessage: {
						text: message.text || "Image",
						sender: message.sender,
						createdAt: new Date()
					},
				});
				await conversation.save();
			}

			// Create new message
			const newMessage = new Message({
				...message,
				conversationId: conversation._id,
			});

			await Promise.all([
				newMessage.save(),
				conversation.updateOne({
					lastMessage: {
						text: message.text || "Image",
						sender: message.sender,
						createdAt: new Date()
					},
				}),
			]);

			const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username profilePic');
			
			// Emit to recipient
			const recipientSocketId = getRecipientSocketId(recipientId);
			if (recipientSocketId) {
				io.to(recipientSocketId).emit("newMessage", populatedMessage);
			}

			// Emit back to sender
			socket.emit("newMessage", populatedMessage);

		} catch (error) {
			console.error('Error in sendMessage socket:', error);
			socket.emit('messageError', { error: 'Failed to send message' });
		}
	});

	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		try {
			await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
			await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
			io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
		} catch (error) {
			console.log(error);
		}
	});

	socket.on("disconnect", () => {
		console.log("user disconnected");
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

export { io, server, app };
