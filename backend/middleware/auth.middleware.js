import { createClerkClient, verifyToken } from '@clerk/backend';
import User from "../models/user.model.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

// Helper function for rate limiting
const checkRateLimit = (identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) => {
	const now = Date.now();
	const windowStart = now - windowMs;
	
	if (!rateLimitStore.has(identifier)) {
		rateLimitStore.set(identifier, []);
	}
	
	const requests = rateLimitStore.get(identifier);
	// Remove old requests outside the window
	const validRequests = requests.filter(timestamp => timestamp > windowStart);
	
	if (validRequests.length >= maxRequests) {
		return false;
	}
	
	validRequests.push(now);
	rateLimitStore.set(identifier, validRequests);
	return true;
};

export const protectRoute = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
		const userAgent = req.headers['user-agent'] || 'unknown';
		const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

		// Rate limiting check
		const rateLimitKey = `${clientIP}:${userAgent}`;
		if (!checkRateLimit(rateLimitKey)) {
			return res.status(429).json({ 
				message: "Too many requests. Please try again later.",
				error: "RATE_LIMIT_EXCEEDED"
			});
		}

		if (!token) {
			return res.status(401).json({ 
				message: "Unauthorized - No Token Provided",
				error: "NO_TOKEN"
			});
		}

		// Verify the Clerk session token
		try {
			const sessionToken = token;
			console.log('🔍 Verifying Clerk token for session...');
			const verificationResult = await verifyToken(sessionToken, {
				secretKey: process.env.CLERK_SECRET_KEY
			});
			
			if (!verificationResult || verificationResult.error || !verificationResult.sub) {
				console.log('❌ Invalid session or missing sub:', verificationResult);
				return res.status(401).json({ 
					message: "Unauthorized - Invalid Token",
					error: "INVALID_TOKEN"
				});
			}

			console.log('✅ Session verified, user ID:', verificationResult.sub);

			// Get the Clerk user
			const clerkUser = await clerkClient.users.getUser(verificationResult.sub);
			
			if (!clerkUser) {
				console.log('❌ Clerk user not found for ID:', verificationResult.sub);
				return res.status(401).json({ 
					message: "Unauthorized - User not found",
					error: "USER_NOT_FOUND"
				});
			}

			console.log('✅ Clerk user found:', {
				id: clerkUser.id,
				email: clerkUser.emailAddresses[0]?.emailAddress,
				publicMetadata: clerkUser.publicMetadata
			});

			// Try to find the user in MongoDB by clerkId
			let mongoUser = await User.findOne({ clerkId: verificationResult.sub });
			
			// If user doesn't exist in MongoDB, create a new record
			if (!mongoUser) {
				console.log("Creating new user in MongoDB for Clerk user:", verificationResult.sub);
				
				const username = clerkUser.username || 
					clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 
					`user_${verificationResult.sub.slice(-8)}`;
				
				mongoUser = new User({
					clerkId: verificationResult.sub,
					name: clerkUser.fullName || clerkUser.firstName || 'User',
					username: username,
					email: clerkUser.emailAddresses[0]?.emailAddress || '',
					profilePicture: clerkUser.imageUrl || '',
					isPremium: clerkUser.publicMetadata?.isPremium || false,
					subscription: clerkUser.publicMetadata?.subscription || {
						plan: 'free',
						status: 'inactive'
					}
				});
				
				try {
					await mongoUser.save();
				} catch (saveError) {
					console.error("Error saving new user to MongoDB:", saveError);
					// Handle duplicate key error by fetching the existing user (by email or username) and updating clerkId if missing
					if (saveError?.code === 11000) {
						let existingUser = null;
						// Prefer lookup by email if available
						if (mongoUser.email) {
							existingUser = await User.findOne({ email: mongoUser.email });
						}
						// Fallback to username lookup
						if (!existingUser && mongoUser.username) {
							existingUser = await User.findOne({ username: mongoUser.username });
						}
						// If we found an existing user, ensure we use that record
						if (existingUser) {
							// If Clerk ID is missing or mismatched, update it
							if (existingUser.clerkId !== verificationResult.sub) {
								existingUser.clerkId = verificationResult.sub;
								await existingUser.save();
								console.log("✅ Synced existing MongoDB user with current Clerk ID");
							}

							// Always use the existing, persisted MongoDB document
							mongoUser = existingUser;
						}
					}
					// Continue with the clerkUser data even if MongoDB save fails
				}
			} else {
				// Update user's premium status from Clerk metadata
				const isPremium = clerkUser.publicMetadata?.isPremium || false;
				const subscription = clerkUser.publicMetadata?.subscription || mongoUser.subscription;
				const isVerified = clerkUser.publicMetadata?.isVerified || mongoUser.isVerified || isPremium; // Premium users are automatically verified
				
				if (mongoUser.isPremium !== isPremium || 
					mongoUser.isVerified !== isVerified ||
					JSON.stringify(mongoUser.subscription) !== JSON.stringify(subscription)) {
					
					mongoUser.isPremium = isPremium;
					mongoUser.isVerified = isVerified;
					mongoUser.subscription = subscription;
					
					try {
						await mongoUser.save();
						console.log(`✅ Updated user premium status: isPremium=${isPremium}, isVerified=${isVerified}`);
					} catch (updateError) {
						console.error("Error updating user in MongoDB:", updateError);
					}
				}
			}

			// Set user data on request object
			req.user = {
				...mongoUser.toObject(),
				clerkId: verificationResult.sub,
				clerkUser: clerkUser
			};
			
			console.log('✅ req.user set with clerkId:', req.user.clerkId);
			
			req.sessionInfo = {
				clientIP,
				userAgent,
				loginTime: new Date(),
				rateLimitKey,
				sessionId: verificationResult.sid || 'unknown'
			};

		} catch (clerkError) {
			console.error("Clerk authentication error:", clerkError);
			return res.status(401).json({ 
				message: "Unauthorized - Authentication Failed",
				error: "AUTH_FAILED",
				details: clerkError.message
			});
		}

		next();
	} catch (error) {
		console.error("Error in protectRoute middleware:", error.message);
		res.status(500).json({ 
			message: "Internal server error",
			error: "INTERNAL_ERROR"
		});
	}
};

export const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

		// For guest mode, we don't require authentication
		// If token exists, try to authenticate, otherwise continue as guest
		if (token) {
			try {
				const verificationResult = await verifyToken(token, {
					secretKey: process.env.CLERK_SECRET_KEY
				});
				
				if (verificationResult && !verificationResult.error && verificationResult.sub) {
					const clerkUser = await clerkClient.users.getUser(verificationResult.sub);
					
					if (clerkUser) {
						let mongoUser = await User.findOne({ clerkId: verificationResult.sub });
						
						if (mongoUser) {
							req.user = {
								...mongoUser.toObject(),
								clerkId: verificationResult.sub,
								clerkUser: clerkUser
							};
							req.isAuthenticated = true;
						}
					}
				}
			} catch (error) {
				console.log("Optional auth failed, continuing as guest:", error.message);
			}
		}

		req.isAuthenticated = req.isAuthenticated || false;
		req.isGuest = !req.isAuthenticated;
		next();
	} catch (error) {
		console.log("Error in optionalAuth middleware:", error.message);
		req.isAuthenticated = false;
		req.isGuest = true;
		next();
	}
};

export const checkUserRole = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ 
				error: "Unauthorized - Authentication required",
				code: "AUTH_REQUIRED"
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ 
				error: "Access forbidden: insufficient permissions",
				code: "INSUFFICIENT_PERMISSIONS",
				required: roles,
				current: req.user.role
			});
		}

		next();
	};
};

export const checkPremiumUser = () => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ 
				error: "Unauthorized - Authentication required",
				code: "AUTH_REQUIRED"
			});
		}

		if (!req.user.isPremium || !req.user.isVerified) {
			return res.status(403).json({ 
				error: "Access forbidden: premium account required",
				code: "PREMIUM_REQUIRED",
				isPremium: req.user.isPremium,
				isVerified: req.user.isVerified
			});
		}

		next();
	};
};

export const trackActivity = async (req, res, next) => {
	try {
		if (req.user) {
			// Update user's last activity asynchronously
			User.findByIdAndUpdate(req.user._id, { 
				lastActivity: new Date() 
			}).catch(err => console.error("Error updating user activity:", err));
		}
		next();
	} catch (error) {
		console.log("Error in trackActivity middleware:", error.message);
		next();
	}
};

// Cleanup rate limit store periodically
setInterval(() => {
	const now = Date.now();
	const fifteenMinutesAgo = now - 15 * 60 * 1000;
	
	for (const [key, requests] of rateLimitStore.entries()) {
		const validRequests = requests.filter(timestamp => timestamp > fifteenMinutesAgo);
		if (validRequests.length === 0) {
			rateLimitStore.delete(key);
		} else {
			rateLimitStore.set(key, validRequests);
		}
	}
}, 5 * 60 * 1000); // Cleanup every 5 minutes
