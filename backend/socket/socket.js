import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174"
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "userId", "content-type"],
  exposedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173", 
      "http://localhost:5174"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["content-type"],
    exposedHeaders: ["content-type"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowUpgrades: true,
  httpCompression: true,
  cookie: false
});

// Track connected users and their socket IDs
const userSocketMap = {}; // userId: socketId
const userRooms = {};     // userId: Set of room names

/**
 * Get the socket ID of a connected user
 * @param {string} userId - User ID to look up
 * @returns {string|null} Socket ID if connected, null otherwise
 */
export const getRecipientSocketId = (userId) => {
  return userSocketMap[userId] || null;
};

/**
 * Emit a notification to a specific user
 * @param {string} userIdOrClerkId - ID of the user to notify (can be MongoDB ObjectId or Clerk ID)
 * @param {Object} notification - Notification data to send
 * @returns {boolean} True if notification was sent, false if user is offline
 */
export const emitNotification = async (userIdOrClerkId, notification) => {
  try {
    // Try to find socket by Clerk ID first (most common case)
    let socketId = getRecipientSocketId(userIdOrClerkId);
    
    // If not found and it looks like a MongoDB ObjectId, try to find by clerkId
    if (!socketId && userIdOrClerkId.length === 24) {
      const user = await User.findById(userIdOrClerkId);
      if (user && user.clerkId) {
        socketId = getRecipientSocketId(user.clerkId);
      }
    }
    
    if (socketId) {
      io.to(socketId).emit('newNotification', notification);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error emitting notification:', error);
    return false;
  }
};

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  const userId = socket.handshake.query.userId;
  
  if (!userId) {
    console.warn("Connection attempt without userId");
    return socket.disconnect(true);
  }

  // Store the user's socket ID and set up presence
  userSocketMap[userId] = socket.id;
  console.log(`User ${userId} connected with socket ${socket.id}`);
  
  // Join user to their personal room for direct messaging
  socket.join(`user_${userId}`);
  
  // Track user's rooms
  userRooms[userId] = new Set([`user_${userId}`]);
  
  // Notify others that this user is now online
  socket.broadcast.emit('userOnline', { userId });
  
  // Send the updated online users list to everyone
  io.emit('onlineUsers', Object.keys(userSocketMap));
  
  // Send any pending notifications to the user
  const sendPendingNotifications = async () => {
    try {
      // First find the user's MongoDB ObjectId using their Clerk ID
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        console.warn(`User not found for Clerk ID: ${userId}`);
        return;
      }
      
      const userObjectId = user._id;
      
      // Mark notifications as delivered
      await Notification.updateMany(
        { 
          recipient: userObjectId, 
          delivered: { $ne: true } 
        },
        { 
          $set: { 
            delivered: true,
            deliveredAt: new Date() 
          } 
        }
      );
      
      // Get undelivered notifications
      const notifications = await Notification.find({
        recipient: userObjectId,
        read: false
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('relatedUser', 'name username profilePicture')
      .populate('relatedCase', 'title');
      
      if (notifications.length > 0) {
        socket.emit('initialNotifications', notifications);
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  };
  
  sendPendingNotifications();

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected (${socket.id})`);
    
    // Only clean up if this was the last connection for this user
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      
      // Notify others that this user is now offline
      socket.broadcast.emit('userOffline', { userId });
      
      // Clean up rooms
      if (userRooms[userId]) {
        userRooms[userId].forEach(room => {
          socket.leave(room);
        });
        delete userRooms[userId];
      }
      
      // Update online users list
      io.emit('onlineUsers', Object.keys(userSocketMap));
    }
  });
  
  // Handle message sending
  socket.on("sendMessage", async (messageData) => {
    try {
      console.log('Socket sendMessage received:', messageData);
      
      // This socket handler should only be used for real-time updates, not creating messages
      // The actual message creation is handled by the HTTP API endpoint
      // We'll just emit the message to the recipient for real-time updates
      
      const { recipientId, conversationId, ...messageInfo } = messageData;
      
      if (!messageInfo.sender || !recipientId) {
        return socket.emit('error', { message: 'Sender and recipient are required' });
      }
      
      // Emit to the recipient's room for real-time updates
      const recipientSocketId = getRecipientSocketId(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newMessage', messageData);
      }
      
      // Also emit to sender's other tabs/connections
      socket.emit('messageSent', {
        conversationId: conversationId,
        message: messageData
      });
      
    } catch (error) {
      console.error('Error in socket sendMessage:', error);
      socket.emit('error', { 
        message: 'Failed to send message',
        error: error.message 
      });
    }
  });
  
  // Handle notification read
  socket.on('markNotificationRead', async ({ notificationId }) => {
    try {
      if (!notificationId) {
        return socket.emit('error', { message: 'Notification ID is required' });
      }
      
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { 
          $set: { 
            read: true,
            readAt: new Date() 
          } 
        },
        { new: true }
      );
      
      if (!notification) {
        return socket.emit('error', { message: 'Notification not found' });
      }
      
      // Emit back to the user to update the UI
      socket.emit('notificationRead', { notificationId });
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { 
        message: 'Failed to mark notification as read',
        error: error.message 
      });
    }
  });
  
  // Handle case application status update
  socket.on('caseApplicationStatus', async ({ caseId, applicationId, status }) => {
    try {
      if (!caseId || !applicationId || !['accepted', 'rejected'].includes(status)) {
        return socket.emit('error', { 
          message: 'Case ID, application ID, and valid status are required' 
        });
      }
      
      // This would be handled by the case controller, but we'll acknowledge it
      socket.emit('caseApplicationStatusUpdated', { 
        caseId, 
        applicationId, 
        status 
      });
      
    } catch (error) {
      console.error('Error updating case application status:', error);
      socket.emit('error', { 
        message: 'Failed to update application status',
        error: error.message 
      });
    }
  });
  
  // Handle typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    try {
      if (!conversationId || !userId) {
        return;
      }
      
      // Broadcast to all participants in the conversation except the sender
      socket.to(`conversation_${conversationId}`).emit('userTyping', {
        conversationId,
        userId,
        isTyping
      });
      
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });
  
  // Handle joining a conversation room
  socket.on('joinConversation', (conversationId) => {
    if (!conversationId) return;
    
    const roomName = `conversation_${conversationId}`;
    socket.join(roomName);
    
    // Track this room for the user
    if (!userRooms[userId]) {
      userRooms[userId] = new Set();
    }
    userRooms[userId].add(roomName);
    
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });
  
  // Handle leaving a conversation room
  socket.on('leaveConversation', (conversationId) => {
    if (!conversationId) return;
    
    const roomName = `conversation_${conversationId}`;
    socket.leave(roomName);
    
    // Remove from user's room tracking
    if (userRooms[userId]) {
      userRooms[userId].delete(roomName);
    }
    
    console.log(`User ${userId} left conversation ${conversationId}`);
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Export the io instance and utility functions
export { io, server, app };

export default io;
