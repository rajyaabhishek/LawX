import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";
import Case from "../models/Case.js";

export const getSuggestedConnections = async (req, res) => {
	try {
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

		if (req.body.profilePicture) {
			const result = await cloudinary.uploader.upload(req.body.profilePicture);
			updatedData.profilePicture = result.secure_url;
		}

		if (req.body.bannerImg) {
			const result = await cloudinary.uploader.upload(req.body.bannerImg);
			updatedData.bannerImg = result.secure_url;
		}

		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		res.json(user);
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ message: "Server error" });
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
        
        const searchQuery = {
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ]
        };
        
        console.log('MongoDB query:', JSON.stringify(searchQuery, null, 2));
        
        const users = await User.find(searchQuery)
            .select('username name profilePicture profilePic')
            .limit(10);
            
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
