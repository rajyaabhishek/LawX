import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		text: String,
		seen: {
			type: Boolean,
			default: false,
		},
		img: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

// Automatically delete messages after 90 days (60 * 60 * 24 * 90 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
