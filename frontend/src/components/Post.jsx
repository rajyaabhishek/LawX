import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { 
	Box, 
	Flex, 
	Avatar, 
	Text, 
	Image, 
	Button, 
	VStack, 
	HStack, 
	Input, 
	Divider,
	useColorModeValue,
	IconButton,
	Badge
} from "@chakra-ui/react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { Loader, MessageCircle, Send, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuthContext } from "../context/AuthContext";
import PostAction from "./PostAction";

const Post = ({ post }) => {
	const { currentUser, isSignedIn, isGuestMode } = useAuthContext();
	const { postId } = useParams();

	const [showComments, setShowComments] = useState(false);
	const [newComment, setNewComment] = useState("");
	const [comments, setComments] = useState(post.comments || []);
	
	// Safe user checks for guest mode
	const isOwner = isSignedIn && currentUser && post.author && currentUser._id === post.author._id;

	// Determine if the current user has liked the post (robust ID comparison)
	const isLiked = useMemo(() => {
		if (!isSignedIn || !currentUser || !Array.isArray(post.likes)) return false;
		return post.likes.some((id) => {
			const idStr = typeof id === "object" && id !== null && id.toString ? id.toString() : id;
			return idStr === currentUser._id;
		});
	}, [isSignedIn, currentUser, post.likes]);

	// Like count that supports both number and array formats
	const likesCount = useMemo(() => {
		if (typeof post.likes === "number") return post.likes;
		if (Array.isArray(post.likes)) return post.likes.length;
		return 0;
	}, [post.likes]);

	const queryClient = useQueryClient();

	// Theme colors
	const cardBg = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");
	const commentBg = useColorModeValue("gray.50", "gray.700");
	const inputBg = useColorModeValue("gray.100", "gray.600");

	const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
		mutationFn: async () => {
			await axiosInstance.delete(`/posts/delete/${post._id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			toast.success("Post deleted successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: createComment, isPending: isAddingComment } = useMutation({
		mutationFn: async (newComment) => {
			const res = await axiosInstance.post(`/posts/${post._id}/comment`, { content: newComment });
			return res.data;
		},
		onSuccess: (updatedPost) => {
			// Update the posts cache with the server response
			queryClient.setQueryData(["posts"], (oldPosts) => {
				if (!oldPosts) return oldPosts;
				
				return oldPosts.map((p) => {
					if (p._id === post._id) {
						return updatedPost;
					}
					return p;
				});
			});
			
			// Also update the individual post cache
			queryClient.setQueryData(["post", postId], updatedPost);
			
			// Update local comments state
			setComments(updatedPost.comments || []);
			
			toast.success("Comment added successfully");
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to add comment");
		},
	});

	const { mutate: likePost, isPending: isLikingPost } = useMutation({
        mutationKey: ['likePost', post._id],
		mutationFn: async () => {
            const res = await axiosInstance.post(`/posts/${post._id}/like`);
            return res.data;
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            await queryClient.cancelQueries({ queryKey: ["post", postId] });

            // Snapshot the previous value
            const previousPosts = queryClient.getQueryData(["posts"]);
            const previousPost = queryClient.getQueryData(["post", postId]);

            // Optimistically update posts list
            queryClient.setQueryData(["posts"], (oldPosts) => {
                if (!oldPosts) return oldPosts;
                
                return oldPosts.map((p) => {
                    if (p._id === post._id) {
                        const newLikes = Array.isArray(p.likes) ? [...p.likes] : [];
                        const alreadyLiked = newLikes.includes(currentUser._id);
                        
                        if (alreadyLiked) {
                            // Remove like
                            return {
                                ...p,
                                likes: newLikes.filter(id => id !== currentUser._id)
                            };
                        } else {
                            // Add like
                            return {
                                ...p,
                                likes: [...newLikes, currentUser._id]
                            };
                        }
                    }
                    return p;
                });
            });

            // Optimistically update individual post if it exists
            if (previousPost) {
                queryClient.setQueryData(["post", postId], (oldPost) => {
                    if (!oldPost) return oldPost;
                    
                    const newLikes = Array.isArray(oldPost.likes) ? [...oldPost.likes] : [];
                    const alreadyLiked = newLikes.includes(currentUser._id);
                    
                    if (alreadyLiked) {
                        return {
                            ...oldPost,
                            likes: newLikes.filter(id => id !== currentUser._id)
                        };
                    } else {
                        return {
                            ...oldPost,
                            likes: [...newLikes, currentUser._id]
                        };
                    }
                });
            }

            // Return context for rollback
            return { previousPosts, previousPost };
        },
        onSuccess: (updatedPost, variables, context) => {
            // Update with server response to ensure accuracy
            queryClient.setQueryData(["posts"], (oldPosts) => {
                if (!oldPosts) return oldPosts;
                
                return oldPosts.map((p) => {
                    if (p._id === post._id) {
                        return updatedPost;
                    }
                    return p;
                });
            });
            
            // Also update the individual post cache
            queryClient.setQueryData(["post", postId], updatedPost);
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousPosts) {
                queryClient.setQueryData(["posts"], context.previousPosts);
            }
            if (context?.previousPost) {
                queryClient.setQueryData(["post", postId], context.previousPost);
            }
            
            toast.error(error.response?.data?.message || "Failed to update like");
        }
 	});

	const handleDeletePost = () => {
		if (!window.confirm("Are you sure you want to delete this post?")) return;
		deletePost();
	};

	const handleLikePost = async () => {
		if (isLikingPost || !isSignedIn) return;
		
		if (isGuestMode) {
			// Trigger auth modal for guest users
			window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
			toast.error("Please sign up to like posts");
			return;
		}
		
		likePost();
	};

	const handleAddComment = async (e) => {
		e.preventDefault();
		
		if (!isSignedIn) {
			// Trigger auth modal for guest users
			window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
			toast.error("Please sign up to comment");
			return;
		}
		
		if (newComment.trim()) {
			createComment(newComment);
			setNewComment("");
			// Don't update local state here - let the server response handle it
			// This prevents duplicate comments and ensures data consistency
		}
	};

	const handleCommentClick = () => {
		if (!isSignedIn) {
			// Trigger auth modal for guest users
			window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
			toast.error("Please sign up to view comments");
			return;
		}
		setShowComments(!showComments);
	};

	// NEW: Share post handler
	const handleSharePost = () => {
		if (!isSignedIn) {
			// Trigger auth modal for guest users
			window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
			toast.error("Please sign up to share posts");
			return;
		}

		const shareUrl = `${window.location.origin}/post/${post._id}`;
		const shareData = {
			title: "Check out this post on LawX",
			text: post?.content?.slice(0, 100) || "Interesting post on LawX",
			url: shareUrl,
		};

		if (navigator.share) {
			navigator.share(shareData)
				.then(() => {
					toast.success("Post shared successfully");
				})
				.catch((err) => {
					// If user cancels share, silently ignore
					if (err && err.name !== "AbortError") {
						toast.error("Unable to share post");
					}
				});
		} else if (navigator.clipboard) {
			navigator.clipboard.writeText(shareUrl)
				.then(() => {
					toast.success("Link copied to clipboard");
				})
				.catch(() => {
					toast.error("Unable to copy link to clipboard");
				});
		} else {
			// Fallback method using a temporary textarea element
			try {
				const textarea = document.createElement("textarea");
				textarea.value = shareUrl;
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
				toast.success("Link copied to clipboard");
			} catch {
				toast.error("Unable to share post");
			}
		}
	};

	return (
		<Box 
			bg={cardBg} 
			borderRadius="lg" 
			boxShadow="sm" 
			border="1px"
			borderColor={useColorModeValue("gray.200", "gray.700")}
			overflow="hidden"
			w="100%"
		>
			<Box p={{ base: 3, md: 4 }}>
				<Flex justify="space-between" align="flex-start" mb={4}>
					<Flex align="center">
						<Avatar
							as={Link}
							to={`/profile/${post?.author?.username}`}
							src={post.author?.profilePicture || "/avatar.png"}
							name={post.author?.name || "User"}
							size={{ base: "sm", md: "md" }}
							mr={{ base: 2, md: 3 }}
						/>
						<VStack align="flex-start" spacing={0}>
							<Text 
								as={Link} 
								to={`/profile/${post?.author?.username}`}
								fontWeight="semibold" 
								color={textColor}
								fontSize={{ base: "sm", md: "md" }}
								_hover={{ color: "blue.500" }}
							>
								{post.author?.name || "Unknown User"}
							</Text>
							<Text fontSize="xs" color={mutedText} display={{ base: "none", sm: "block" }}>
								{post.author?.headline || ""}
							</Text>
							<Text fontSize="xs" color={mutedText}>
								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
							</Text>
						</VStack>
					</Flex>
					{isOwner && (
						<IconButton
							aria-label="Delete post"
							icon={isDeletingPost ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
							onClick={handleDeletePost}
							variant="ghost"
							colorScheme="red"
							size="sm"
						/>
					)}
				</Flex>
				
				<Text 
					mb={4} 
					color={textColor}
					fontSize={{ base: "sm", md: "md" }}
					lineHeight="1.5"
				>
					{post.content}
				</Text>
				
				{post.image && (
					<Image 
						src={post.image} 
						alt="Post content" 
						borderRadius="lg" 
						w="full" 
						mb={4}
						maxH={{ base: "300px", md: "400px" }}
						objectFit="cover"
					/>
				)}

				<Flex 
					justify="space-between" 
					color={mutedText}
					direction={{ base: "row", md: "row" }}
					wrap="wrap"
					gap={{ base: 1, md: 2 }}
				>
					<PostAction
						icon={<ThumbsUp size={16} color={isLiked ? "#3182CE" : undefined} fill={isLiked ? "#3182CE" : "none"} />}
						text={`Like (${likesCount})`}
						onClick={handleLikePost}
						isActive={isLiked}
					/>

					<PostAction
						icon={<MessageCircle size={16} />}
						text={`Comment (${comments.length})`}
						onClick={handleCommentClick}
					/>
					<PostAction 
						icon={<Share2 size={16} />} 
						text="Share" 
						onClick={handleSharePost}
					/>
				</Flex>
			</Box>

			{showComments && isSignedIn && (
				<Box px={{ base: 3, md: 4 }} pb={{ base: 3, md: 4 }}>
					<Divider mb={4} />
					<VStack spacing={3} align="stretch" mb={4} maxH="60" overflowY="auto">
						{comments.map((comment) => (
							<Flex key={comment._id || Math.random()} bg={commentBg} p={{ base: 2, md: 3 }} borderRadius="md" align="flex-start">
								<Avatar
									src={comment.user?.profilePicture || "/avatar.png"}
									name={comment.user?.name || "User"}
									size="sm"
									mr={{ base: 2, md: 3 }}
									flexShrink={0}
								/>
								<VStack align="flex-start" spacing={1} flex={1}>
									<HStack spacing={2} flexWrap="wrap">
										<Text fontWeight="semibold" fontSize="sm" color={textColor}>
											{comment.user?.name || "Unknown User"}
										</Text>
										<Text fontSize="xs" color={mutedText}>
											{formatDistanceToNow(new Date(comment.createdAt))}
										</Text>
									</HStack>
									<Text fontSize="sm" color={textColor} wordBreak="break-word">
										{comment.content}
									</Text>
								</VStack>
							</Flex>
						))}
					</VStack>

					<form onSubmit={handleAddComment}>
						<Flex direction={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
							<Input
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Add a comment..."
								bg={inputBg}
								border="none"
								borderRadius={{ base: "md", sm: "full" }}
								borderLeftRadius={{ base: "md", sm: "full" }}
								borderRightRadius={{ base: "md", sm: "none" }}
								_focus={{
									bg: useColorModeValue("white", "gray.500"),
									borderColor: "blue.500",
								}}
								flex={1}
								fontSize={{ base: "sm", md: "md" }}
							/>
							<Button
								type="submit"
								colorScheme="blue"
								borderRadius={{ base: "md", sm: "full" }}
								borderLeftRadius={{ base: "md", sm: "none" }}
								borderRightRadius={{ base: "md", sm: "full" }}
								isLoading={isAddingComment}
								loadingText="Posting..."
								px={{ base: 4, md: 6 }}
								size={{ base: "sm", md: "md" }}
								w={{ base: "100%", sm: "auto" }}
							>
								Post
							</Button>
						</Flex>
					</form>
				</Box>
			)}
			
			{/* Guest mode message for interactions */}
			{isGuestMode && (
				<Box px={4} pb={4} textAlign="center">
					<Text fontSize="sm" color={mutedText}>
						Sign up to interact with posts - like, comment, and share!
					</Text>
				</Box>
			)}
		</Box>
	);
};

export default Post;
