import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";

export const getFeedPosts = async (req, res) => {
	try {
		let query = {};
		
		if (req.user) {
			// Authenticated user: show posts from connections and own posts
			query = { author: { $in: [...req.user.connections, req.user._id] } };
		} else {
			// Guest user: show recent public posts (limit to encourage signup)
			query = {};
		}

		const posts = await Post.find(query)
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture")
			.sort({ createdAt: -1 })
			.limit(req.user ? 50 : 10); // Limit posts for guests

		// For guests, don't show sensitive data
		if (!req.user) {
			const sanitizedPosts = posts.map(post => ({
				...post.toObject(),
				likes: post.likes.length, // Show count only, not user IDs
				comments: post.comments.map(comment => ({
					content: comment.content,
					user: comment.user,
					createdAt: comment.createdAt
				}))
			}));
			return res.status(200).json(sanitizedPosts);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error in getFeedPosts controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createPost = async (req, res) => {
	try {
		const { content, image } = req.body;
		let newPost;

		if (image) {
			const imgResult = await cloudinary.uploader.upload(image);
			newPost = new Post({
				author: req.user._id,
				content,
				image: imgResult.secure_url,
			});
		} else {
			newPost = new Post({
				author: req.user._id,
				content,
			});
		}

		await newPost.save();

		res.status(201).json(newPost);
	} catch (error) {
		console.error("Error in createPost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const deletePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// check if the current user is the author of the post
		if (post.author.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You are not authorized to delete this post" });
		}

		// delete the image from cloudinary as well!
		if (post.image) {
			await cloudinary.uploader.destroy(post.image.split("/").pop().split(".")[0]);
		}

		await Post.findByIdAndDelete(postId);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in delete post controller", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPostById = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId)
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture username headline");

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in getPostById controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createComment = async (req, res) => {
	try {
		const postId = req.params.id;
		const { content } = req.body;

		const post = await Post.findByIdAndUpdate(
			postId,
			{
				$push: { comments: { user: req.user._id, content } },
			},
			{ new: true }
		).populate("author", "name email username headline profilePicture");

		// create a notification if the comment owner is not the post owner
		if (post.author._id.toString() !== req.user._id.toString()) {
			const newNotification = new Notification({
				recipient: post.author,
				type: "comment",
				relatedUser: req.user._id,
				relatedPost: postId,
			});

			await newNotification.save();

			try {
				const postUrl = process.env.CLIENT_URL + "/post/" + postId;
				await sendCommentNotificationEmail(
					post.author.email,
					post.author.name,
					req.user.name,
					postUrl,
					content
				);
			} catch (error) {
				console.log("Error in sending comment notification email:", error);
			}
		}

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in createComment controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const likePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		console.log(`Like request: postId=${postId}, userId=${userId}`);

		// Validate post ID format
		if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({ message: "Invalid post ID format" });
		}

		// Find the post with a single query and populate
		const post = await Post.findById(postId)
			.populate("author", "name username profilePicture headline");

		if (!post) {
			console.log(`Post not found: ${postId}`);
			return res.status(404).json({ message: "Post not found" });
		}

		// Ensure likes array exists
		if (!Array.isArray(post.likes)) {
			post.likes = [];
		}

		const isLiked = post.likes.some(id => id.toString() === userId.toString());
		console.log(`Current like status: ${isLiked ? 'liked' : 'not liked'}`);

		if (isLiked) {
			// Unlike the post - remove user ID from likes array
			post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
			console.log(`Unliked post. New like count: ${post.likes.length}`);
		} else {
			// Like the post - add user ID to likes array
			post.likes.push(userId);
			console.log(`Liked post. New like count: ${post.likes.length}`);
			
			// Create notification if the post owner is not the user who liked
			if (post.author._id.toString() !== userId.toString()) {
				try {
					const newNotification = new Notification({
						recipient: post.author._id,
						type: "like",
						relatedUser: userId,
						relatedPost: postId,
					});

					await newNotification.save();
					console.log("Like notification created");
				} catch (notificationError) {
					console.error("Error creating like notification:", notificationError);
					// Don't fail the like operation if notification fails
				}
			}
		}

		// Save the post with updated likes
		await post.save();
		console.log(`Post saved with ${post.likes.length} likes`);

		// Return the updated post with all populated fields
		const updatedPost = await Post.findById(postId)
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture");

		console.log(`Returning post with ${updatedPost.likes.length} likes`);
		res.status(200).json(updatedPost);
	} catch (error) {
		console.error("Error in likePost controller:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
