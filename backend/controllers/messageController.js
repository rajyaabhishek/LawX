import mongoose from 'mongoose';
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

async function sendMessage(req, res) {
    try {
        const { recipientId, message } = req.body;
        let { img } = req.body;
        const senderId = req.user._id;

        // Validate required parameters
        if (!recipientId) {
            return res.status(400).json({ error: "Recipient ID is required" });
        }

        if (!message && !img) {
            return res.status(400).json({ error: "Message text or image is required" });
        }

        // Prevent sending message to self
        if (recipientId === senderId.toString()) {
            return res.status(400).json({ error: "You cannot message yourself" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: {
                    text: message,
                    sender: senderId,
                },
            });
            await conversation.save();
        }

        if (img) {
            // Validate image format and size
            if (!img.startsWith('data:image/')) {
                return res.status(400).json({ error: "Invalid image format" });
            }
            
            // Check image size (base64 string length as a rough estimate)
            const sizeInBytes = Math.round((img.length - 22) * 3 / 4);
            if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
                return res.status(400).json({ error: "Image too large. Maximum size is 5MB" });
            }
            
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        console.log('=== Message Creation Debug ===');
        console.log('req.user:', {
            _id: req.user._id,
            clerkId: req.user.clerkId,
            name: req.user.name
        });
        console.log('Using sender ID:', senderId);
        
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId, // Use MongoDB ObjectId for consistency
            text: message,
            img: img || "",
        });

        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text: message,
                    sender: senderId, // Use MongoDB ObjectId for consistency
                },
            }),
        ]);

        const recipientSocketId = getRecipientSocketId(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ 
            error: "An error occurred while sending the message",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

async function getMessages(req, res) {
    try {
        const { otherUserId } = req.params;
        const userId = req.user._id;

        if (!otherUserId) {
            return res.status(400).json({ error: "Other user ID is required" });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId], $size: 2 }
        }).populate('participants', '-password');

        if (!conversation) {
            // If no conversation exists, return empty array instead of 404
            return res.status(200).json([]);
        }

        // Get messages for this conversation
        const messages = await Message.find({
            conversationId: conversation._id
        })
        .sort({ createdAt: 1 })
        .lean();

        // Get the other user's Clerk ID for comparison
        const otherUser = await mongoose.model('User').findById(otherUserId).lean();
        const otherUserClerkId = otherUser?.clerkId;
        
        // Mark messages as seen if they're from the other user
        const unreadMessageIds = messages
            .filter(msg => 
                msg.sender === otherUserClerkId && 
                !msg.seen
            )
            .map(msg => msg._id);

        if (unreadMessageIds.length > 0) {
            await Message.updateMany(
                { _id: { $in: unreadMessageIds } },
                { $set: { seen: true } }
            );

            // Update last message seen status in conversation
            await Conversation.updateOne(
                { _id: conversation._id },
                { 'lastMessage.seen': true }
            );

            // Emit event to update the UI in real-time
            const { io } = await import('../socket/socket.js');
            io.to(userId.toString()).emit('messagesSeen', { conversationId: conversation._id });
        }

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ 
            error: "An error occurred while fetching messages",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

async function getConversations(req, res) {
    try {
        console.log('=== getConversations called ===');
        
        // Verify user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user._id;
        
        try {
            // First, get all conversations for the user with basic info
            const conversations = await Conversation.find({
                participants: userId,
                'lastMessage': { $exists: true }
            })
            .sort({ 'lastMessage.createdAt': -1 })
            .lean();
            
            // Process each conversation to get participant details and unread count
            const processedConversations = await Promise.all(
                conversations.map(async (conv) => {
                    try {
                        // Get other participant details (exclude current user)
                        const otherParticipantId = conv.participants.find(
                            id => id.toString() !== userId.toString()
                        );
                        
                        if (!otherParticipantId) {
                            return null;
                        }
                        
                        const [user, unreadCount] = await Promise.all([
                            // Get user details
                            mongoose.model('User').findById(
                                otherParticipantId,
                                'username name profilePic'
                            ).lean(),
                            
                            // Get unread message count
                            Message.countDocuments({
                                conversationId: conv._id,
                                seen: false,
                                sender: { $ne: userId }
                            })
                        ]);
                        
                        if (!user) {
                            return null;
                        }
                        
                        return {
                            _id: conv._id,
                            participants: conv.participants,
                            lastMessage: conv.lastMessage,
                            updatedAt: conv.updatedAt,
                            participantDetails: [user],
                            unreadCount: unreadCount || 0
                        };
                    } catch (error) {
                        console.error('Error processing conversation:', error);
                        return null;
                    }
                })
            );
            
            // Filter out any null entries and return
            const validConversations = processedConversations.filter(conv => conv !== null);
            
            return res.status(200).json(validConversations);
            
        } catch (dbError) {
            console.error('Database error in getConversations:', dbError);
            return res.status(500).json({ 
                error: 'Database error',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }
        
    } catch (error) {
        console.error('Error in getConversations:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        return res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

async function startConversation(participantIds, caseId = null) {
    try {
        // Ensure we have exactly 2 participants
        if (!Array.isArray(participantIds) || participantIds.length !== 2) {
            throw new Error('A conversation must have exactly 2 participants');
        }

        // Sort participant IDs to ensure consistency
        const [participant1, participant2] = participantIds.sort();
        
        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [participant1, participant2] },
            $or: [
                { case: caseId },
                { case: { $exists: !caseId } }
            ]
        });

        // If conversation doesn't exist, create a new one
        if (!conversation) {
            conversation = new Conversation({
                participants: [participant1, participant2],
                lastMessage: {
                    text: caseId ? 'Case discussion started' : 'Conversation started',
                    sender: participant1,
                    seen: false
                },
                case: caseId || undefined
            });
            await conversation.save();
        }

        return {
            success: true,
            conversationId: conversation._id,
            isNew: !conversation.lastMessage
        };
    } catch (error) {
        console.error('Error in startConversation:', error);
        return {
            success: false,
            error: error.message || 'Failed to start conversation'
        };
    }
}

async function markMessagesAsSeen(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID is required" });
        }

        // Mark unseen messages from the other user as seen
        const updateResult = await Message.updateMany(
            {
                conversationId,
                sender: { $ne: userId },
                seen: false
            },
            { $set: { seen: true } }
        );

        // Update lastMessage.seen in Conversation
        await Conversation.updateOne(
            { _id: conversationId },
            { 'lastMessage.seen': true }
        );

        // Emit socket event to notify the other participant
        const conversation = await Conversation.findById(conversationId).lean();
        if (conversation) {
            const otherParticipantId = conversation.participants.find(
                (id) => id.toString() !== userId.toString()
            );
            if (otherParticipantId) {
                const recipientSocketId = getRecipientSocketId(otherParticipantId.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('messagesSeen', { conversationId });
                }
            }
        }

        return res.status(200).json({ message: 'Messages marked as seen', modifiedCount: updateResult.modifiedCount });
    } catch (error) {
        console.error('Error in markMessagesAsSeen:', error);
        return res.status(500).json({ error: 'Failed to mark messages as seen' });
    }
}

export { getMessages, getConversations, sendMessage, startConversation, markMessagesAsSeen };
