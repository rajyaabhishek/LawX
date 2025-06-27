import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		clerkId: {
			type: String,
			unique: true,
			sparse: true, // Allows for existing users without clerkId
		},
		name: {
			type: String,
			required: true,
		},
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: false }, // Optional since Clerk handles auth
		profilePicture: {
			type: String,
			default: "",
		},
		bannerImg: {
			type: String,
			default: "",
		},
		headline: {
			type: String,
			default: "LawX User",
		},
		location: {
			type: String,
			default: "Earth",
		},
		about: {
			type: String,
			default: "",
		},
		skills: [String],
		experience: [
			{
				title: String,
				company: String,
				startDate: Date,
				endDate: Date,
				description: String,
			},
		],
		education: [
			{
				school: String,
				fieldOfStudy: String,
				startYear: Number,
				endYear: Number,
			},
		],
		connections: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		role: {
			type: String,
			enum: ['user', 'lawyer', 'admin'],
			default: 'user',
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		isPremium: {
			type: Boolean,
			default: false,
		},
		subscription: {
			plan: {
				type: String,
				enum: ['free', 'monthly', 'yearly'],
				default: 'free'
			},
			status: {
				type: String,
				enum: ['active', 'inactive', 'cancelled', 'expired'],
				default: 'inactive'
			},
			startDate: {
				type: Date,
				default: null
			},
			endDate: {
				type: Date,
				default: null
			},
			paymentId: {
				type: String,
				default: null
			},
			orderId: {
				type: String,
				default: null
			},
			amount: {
				type: Number,
				default: 0
			},
			currency: {
				type: String,
				        default: 'INR'
			}
		},
		specialization: [String], // For lawyers
		barLicenseNumber: String, // For lawyer verification
		rating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		lastLogin: {
			type: Date,
			default: null,
		},
		lastActivity: {
			type: Date,
			default: Date.now,
		},
		loginCount: {
			type: Number,
			default: 0,
		},
		sessionInfo: {
			lastIP: {
				type: String,
				default: null,
			},
			lastUserAgent: {
				type: String,
				default: null,
			},
		},
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
