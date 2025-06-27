import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";
import Case from "../models/Case.js";
import { createClerkClient } from '@clerk/backend';
import { syncProfileToClerk } from "../services/clerk.service.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const getSuggestedConnections = async (req, res) => {
	try {
		if (!req.user) {
			// For guests, show some popular users (without personal recommendations)
			const suggestedUsers = await User.find({})
				.select("name username profilePicture headline")
				.sort({ loginCount: -1 }) // Show most active users
				.limit(5);
			return res.json(suggestedUsers);
		}

		const currentUser = await User.findById(req.user._id).select("connections");

		// find users who are not already connected, and also do not recommend our own profile!! right?
		const suggestedUser = await User.find({
			_id: {
				$ne: req.user._id,
				$nin: currentUser.connections,
			},
		})
			.select("name username profilePicture headline")
			.limit(3);

		res.json(suggestedUser);
	} catch (error) {
		console.error("Error in getSuggestedConnections controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPublicProfile = async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Error in getPublicProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPublicProfileByClerkId = async (req, res) => {
	try {
		const user = await User.findOne({ clerkId: req.params.clerkId }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Error in getPublicProfileByClerkId controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"username",
			"headline",
			"about",
			"location",
			"profilePicture",
			"bannerImg",
			"skills",
			"experience",
			"education",
		];

		const updatedData = {};

		for (const field of allowedFields) {
			if (req.body[field]) {
				updatedData[field] = req.body[field];
			}
		}

		// Validate username uniqueness if it's being changed
		if (req.body.username) {
			const existingUser = await User.findOne({ 
				username: req.body.username, 
				_id: { $ne: req.user._id } // Exclude current user from check
			});
			
			if (existingUser) {
				return res.status(400).json({ 
					message: "Username is already taken. Please choose a different username." 
				});
			}

			// Basic username validation
			const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
			if (!usernameRegex.test(req.body.username)) {
				return res.status(400).json({ 
					message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
				});
			}
		}

		// Validate name
		if (req.body.name && req.body.name.trim().length < 2) {
			return res.status(400).json({ 
				message: "Name must be at least 2 characters long" 
			});
		}

		if (req.body.profilePicture) {
			const result = await cloudinary.uploader.upload(req.body.profilePicture);
			updatedData.profilePicture = result.secure_url;
		}

		if (req.body.bannerImg) {
			const result = await cloudinary.uploader.upload(req.body.bannerImg);
			updatedData.bannerImg = result.secure_url;
		}

		// Update the user in MongoDB
		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		// Sync profile changes to Clerk metadata if user has clerkId
		if (user.clerkId) {
			try {
				await syncProfileToClerk(user.clerkId, req.body);
				console.log("Profile successfully synced to Clerk metadata");
			} catch (clerkError) {
				console.error("Failed to sync profile to Clerk metadata:", clerkError);
				// Don't fail the entire request if Clerk sync fails
				// The MongoDB update was successful, which is most important
			}
		}

		res.json(user);
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Search connected users for chat
export const searchConnectedUsers = async (req, res) => {
    try {
        console.log('=== Search Connected Users Request ===');
        console.log('User ID:', req.user ? req.user._id : 'Not authenticated');
        console.log('Query param:', req.query.q);
        
        const { q } = req.query;
        
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!q || q.trim() === '') {
            console.log('Empty search query');
            return res.status(200).json([]);
        }
        
        console.log(`Searching connected users matching: ${q}`);
        
        // Get the current user with their connections
        const currentUser = await User.findById(req.user._id).populate('connections');
        console.log('Current user found:', !!currentUser);
        console.log('Current user connections count:', currentUser?.connections?.length || 0);
        console.log('Current user connections:', currentUser?.connections?.map(c => ({ id: c._id, name: c.name, username: c.username })));
        
        if (!currentUser || !currentUser.connections || currentUser.connections.length === 0) {
            console.log('No connections found for user - returning empty array');
            return res.status(200).json([]);
        }
        
        // Extract connection IDs
        const connectionIds = currentUser.connections.map(conn => conn._id);
        console.log('Connection IDs to search within:', connectionIds);
        
        // Search within connected users only
        const searchQuery = {
            _id: { $in: connectionIds },
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { role: { $regex: q, $options: 'i' } },
                { 'specialization': { $in: [new RegExp(q, 'i')] } }
            ]
        };
        
        console.log('MongoDB query for connected users:', JSON.stringify(searchQuery, null, 2));
        
        const connectedUsers = await User.find(searchQuery)
            .select('username name profilePicture profilePic role specialization isVerified isPremium')
            .limit(10);
            
        console.log(`Found ${connectedUsers.length} matching connected users`);
        console.log('Matching users:', connectedUsers.map(u => ({ id: u._id, name: u.name, username: u.username })));
        
        res.status(200).json(connectedUsers);
    } catch (error) {
        console.error('Error in searchConnectedUsers:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// Search users by username or name
export const searchUsers = async (req, res) => {
    try {
        console.log('=== Search Request Received ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Query Parameters:', JSON.stringify(req.query, null, 2));
        console.log('Authenticated User:', req.user ? req.user._id : 'Not authenticated');
        
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            console.log('Empty search query');
            return res.status(200).json([]);
        }
        
        console.log(`Searching for users matching: ${q}`);
        
        // Build a fuzzy regex so that even partially correct spellings will match.
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const fuzzyPattern = escapeRegex(q.trim()).split("").join(".*");
        const fuzzyRegex = new RegExp(fuzzyPattern, "i");

        const searchQuery = {
            $or: [
                { username: { $regex: fuzzyRegex } },
                { name: { $regex: fuzzyRegex } },
                { role: { $regex: fuzzyRegex } },
                { specialization: { $in: [fuzzyRegex] } },
                { bio: { $regex: fuzzyRegex } }
            ]
        };
        
        console.log('MongoDB query:', JSON.stringify(searchQuery, null, 2));
        
        const users = await User.find(searchQuery)
            .select('username name profilePicture profilePic role specialization bio isVerified isPremium')
            .limit(15);
            
        console.log(`Found ${users.length} matching users`);
        
        // Log a sample of the results (without sensitive data)
        if (users.length > 0) {
            console.log('Sample results:', users.slice(0, 3).map(u => ({
                _id: u._id,
                username: u.username,
                name: u.name
            })));
        }
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in searchUsers:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

export const applyForCase = async (req, res) => {
	const { caseId } = req.params;
	const { message } = req.body;
	const userId = req.user._id; // assuming you have authentication middleware

	if (!message || message.length < 20) {
		return res.status(400).json({ error: "Message must be at least 20 characters" });
	}

	try {
		const caseDoc = await Case.findById(caseId);
		if (!caseDoc) return res.status(404).json({ error: "Case not found" });

		// Prevent duplicate applications
		if (caseDoc.applications.some(app => app.user.toString() === userId.toString())) {
			return res.status(400).json({ error: "You have already applied for this case" });
		}

		caseDoc.applications.push({
			user: userId,
			message,
			status: 'pending'
		});

		await caseDoc.save();
		const updatedCase = await Case.findById(caseId)
			.populate('applications.user', 'name username profilePicture')
			.populate('user', 'name username profilePicture');
		res.status(200).json({ success: true, message: "Application submitted", case: updatedCase });
	} catch (err) {
		res.status(500).json({ error: "Server error" });
	}
};

export const getCases = async (req, res) => {
	const { search } = req.query;
	let filter = {};
	if (search) {
		filter.title = { $regex: search, $options: 'i' }; // case-insensitive search
	}
	try {
		const cases = await Case.find(filter)
			.populate('user', 'name username profilePicture')
			.populate('applications.user', 'name username profilePicture');
		res.status(200).json(cases);
	} catch (err) {
		res.status(500).json({ error: "Server error" });
	}
};

// Update user role to lawyer
export const becomeLawyer = async (req, res) => {
	try {
		const { specialization, barLicenseNumber } = req.body;
		
		if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
			return res.status(400).json({ 
				error: "At least one specialization is required" 
			});
		}

		const user = await User.findByIdAndUpdate(
			req.user._id,
			{
				$set: {
					role: 'lawyer',
					isVerified: false, // Start as unverified lawyer
					specialization,
					barLicenseNumber: barLicenseNumber || undefined
				}
			},
			{ new: true }
		).select('-password');

		res.status(200).json({
			message: "Successfully upgraded to lawyer account. You can now apply for cases!",
			user
		});
	} catch (error) {
		console.error("Error in becomeLawyer controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Upgrade user to premium
export const upgradeToPremium = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			{
				$set: {
					isPremium: true,
					isVerified: true
				}
			},
			{ new: true }
		).select('-password');

		res.status(200).json({
			message: "Successfully upgraded to premium account. You can now post cases!",
			user: updatedUser
		});
	} catch (error) {
		console.error("Error in upgradeToPremium controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Get current user profile with role info
export const getCurrentUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password');
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Return in the format expected by frontend
		res.status(200).json({
			success: true,
			user: user
		});
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const ensureUserExists = async (req, res) => {
	try {
		const { clerkId } = req.params;
		
		// Verify the requesting user is trying to access their own profile
		if (req.user?.clerkId !== clerkId) {
			return res.status(403).json({ 
				error: "Forbidden - Can only ensure your own user profile",
				code: "FORBIDDEN_ACCESS"
			});
		}

		// Check if user already exists by clerkId
		let mongoUser = await User.findOne({ clerkId });
		
		if (mongoUser) {
			return res.status(200).json({
				success: true,
				message: "User already exists",
				user: mongoUser
			});
		}

		// User doesn't exist by clerkId, check if there's a user with the same email
		const clerkUser = req.user.clerkUser;
		const email = clerkUser.emailAddresses[0]?.emailAddress;
		
		if (email) {
			const existingUserByEmail = await User.findOne({ email });
			if (existingUserByEmail && !existingUserByEmail.clerkId) {
				// Update existing user with clerkId
				console.log(`Updating existing user ${existingUserByEmail.username} with clerkId: ${clerkId}`);
				
				existingUserByEmail.clerkId = clerkId;
				existingUserByEmail.profilePicture = clerkUser.imageUrl || existingUserByEmail.profilePicture;
				existingUserByEmail.isPremium = clerkUser.publicMetadata?.isPremium || existingUserByEmail.isPremium;
				existingUserByEmail.isVerified = clerkUser.publicMetadata?.isVerified || clerkUser.publicMetadata?.isPremium || existingUserByEmail.isVerified;
				existingUserByEmail.subscription = clerkUser.publicMetadata?.subscription || existingUserByEmail.subscription;
				
				await existingUserByEmail.save();
				
				return res.status(200).json({
					success: true,
					message: "Existing user updated with Clerk data",
					user: existingUserByEmail
				});
			}
		}

		// Generate a unique username to avoid conflicts
		let baseUsername = clerkUser.username || 
			email?.split('@')[0] || 
			`user_${clerkId.slice(-8)}`;
		
		let username = baseUsername;
		let counter = 1;
		
		// Check if username already exists and generate unique one if needed
		while (await User.findOne({ username })) {
			username = `${baseUsername}_${counter}`;
			counter++;
		}
		
		console.log(`Creating user with unique username: ${username}`);
		
		mongoUser = new User({
			clerkId: clerkId,
			name: clerkUser.fullName || clerkUser.firstName || 'User',
			username: username,
			email: email || '',
			profilePicture: clerkUser.imageUrl || '',
			isPremium: clerkUser.publicMetadata?.isPremium || false,
			isVerified: clerkUser.publicMetadata?.isVerified || clerkUser.publicMetadata?.isPremium || false,
			subscription: clerkUser.publicMetadata?.subscription || {
				plan: 'free',
				status: 'inactive'
			}
		});
		
		await mongoUser.save();
		
		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: mongoUser
		});

	} catch (error) {
		console.error("Error in ensureUserExists:", error);
		res.status(500).json({ 
			error: "Failed to ensure user exists",
			details: error.message
		});
	}
};
