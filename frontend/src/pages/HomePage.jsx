import { useQuery } from "@tanstack/react-query";
import { 
	Box, 
	useColorModeValue,
	VStack,
	Icon,
	Text,
	Heading,
	Flex,
	Button
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import Post from "../components/Post";
import PostCreation from "../components/PostCreation";
import RecommendedUser from "../components/RecommendedUser";
import { axiosInstance } from "../lib/axios";
import { useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";

const HomePage = () => {
	const { isSignedIn, currentUser, isAuthenticated } = useAuthContext();
	
	const { data: authUser } = useQuery({ 
		queryKey: ["authUser"],
		enabled: isSignedIn 
	});

	const { data: recommendedUsers } = useQuery({
		queryKey: ["recommendedUsers"],
		queryFn: async () => {
			const res = await axiosInstance.get("/users/suggestions");
			return res.data;
		},
		enabled: isSignedIn
	});

	const filteredRecommendedUsers = useMemo(() => {
		if (!recommendedUsers || !authUser) return recommendedUsers;
		const connectionIds = authUser.connections || [];
		return recommendedUsers.filter(u => !connectionIds.includes(u._id));
	}, [recommendedUsers, authUser]);

	// Allow posts to load for both authenticated users and guests
	const { data: posts, isLoading: postsLoading, error: postsError } = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get("/posts");
				return res.data;
			} catch (error) {
				console.error("Error fetching posts:", error);
				throw error;
			}
		},
		enabled: true, // Enable for all users (guests and authenticated)
		retry: 3, // Retry up to 3 times
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
		staleTime: 2 * 60 * 1000, // 2 minutes - posts stay fresh for 2 minutes
		cacheTime: 5 * 60 * 1000, // 5 minutes - keep posts in cache for 5 minutes
		refetchOnWindowFocus: false, // Don't refetch when window regains focus
		refetchOnReconnect: true, // Refetch when internet reconnects
		onError: (error) => {
			console.error("Posts query error:", error);
		}
	});

	console.log("posts", posts);

	const cardBg = useColorModeValue("white", "gray.800");
	const sidebarBg = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");
	const borderColor = useColorModeValue("gray.200", "gray.700");

	return (
		<Flex 
			direction={{ base: "column", lg: "row" }}
			gap={{ base: 4, lg: 3 }} 
			align="start" 
			w="100%" 
			maxW="1200px" 
			mx="auto"
			px={{ base: 2, md: 0 }}
		>
			{/* Main Content Area - Posts */}
			<Box flex="1" w="100%" maxW={{ base: "100%", lg: "640px" }}>
				<VStack spacing={{ base: 3, md: 2 }} align="stretch">
					{/* Post Creation - Only show for signed-in users */}
					{isSignedIn && <PostCreation user={authUser} />}

					{/* Posts Feed */}
					{postsLoading && (
						<Box 
							bg={cardBg} 
							borderRadius="lg" 
							boxShadow="sm"
							border="1px"
							borderColor={borderColor}
							p={{ base: 6, md: 8 }}
							textAlign="center"
						>
							<VStack spacing={3}>
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
								<Text color={mutedText}>Loading posts...</Text>
							</VStack>
						</Box>
					)}

					{/* Error State */}
					{postsError && !postsLoading && (
						<Box 
							bg={cardBg} 
							borderRadius="lg" 
							boxShadow="sm"
							border="1px"
							borderColor="red.200"
							p={{ base: 6, md: 8 }}
							textAlign="center"
						>
							<VStack spacing={4}>
								<Icon 
									as={Users} 
									boxSize={{ base: 12, md: 16 }}
									color="red.500" 
								/>
								<Heading 
									size={{ base: "md", md: "lg" }}
									color="red.500"
								>
									Failed to Load Posts
								</Heading>
								<Text 
									color={mutedText}
									fontSize={{ base: "sm", md: "md" }}
									textAlign="center"
								>
									There was an error loading posts. Please refresh the page to try again.
								</Text>
								<Button
									colorScheme="blue"
									onClick={() => window.location.reload()}
									size="sm"
								>
									Refresh Page
								</Button>
							</VStack>
						</Box>
					)}

					{/* Render Posts */}
					{!postsLoading && !postsError && posts?.filter((p) => p && p._id)?.map((post) => (
						<Post key={post._id} post={post} />
					))}

					{/* Empty State */}
					{!postsLoading && !postsError && posts?.length === 0 && (
						<Box 
							bg={cardBg} 
							borderRadius="lg" 
							boxShadow="sm"
							border="1px"
							borderColor={borderColor}
							p={{ base: 6, md: 8 }}
							textAlign="center"
						>
							<VStack spacing={4}>
								<Icon 
									as={Users} 
									boxSize={{ base: 12, md: 16 }}
									color="blue.500" 
								/>
								<Heading 
									size={{ base: "md", md: "lg" }}
									color={textColor}
								>
									No Posts Yet
								</Heading>
								<Text 
									color={mutedText}
									fontSize={{ base: "sm", md: "md" }}
									textAlign="center"
								>
									{isSignedIn 
										? "Connect with others to start seeing posts in your feed!"
										: "Sign up to create and share posts with the community!"
									}
								</Text>
							</VStack>
						</Box>
					)}
				</VStack>
			</Box>

			{/* Right Sidebar - Recommended Users - Only show for signed-in users */}
			{isSignedIn && filteredRecommendedUsers?.length > 0 && (
				<Box 
					w={{ base: "100%", lg: "300px" }}
					display={{ base: "block", lg: "block" }}
					position={{ base: "static", lg: "sticky" }}
					top={{ base: "auto", lg: "70px" }}
					order={{ base: -1, lg: 1 }}
				>
					<Box 
						bg={sidebarBg} 
						borderRadius="lg" 
						boxShadow="sm"
						border="1px"
						borderColor={borderColor}
						p={{ base: 3, md: 4 }}
					>
						<Heading 
							size={{ base: "sm", md: "md" }}
							mb={4} 
							color={textColor}
							fontSize={{ base: "14px", md: "16px" }}
							fontWeight="600"
						>
							People you may know
						</Heading>
						<VStack spacing={3} align="stretch">
							{filteredRecommendedUsers?.slice(0, 5).map((user) => (
								<RecommendedUser key={user._id} user={user} />
							))}
						</VStack>
					</Box>
				</Box>
			)}
		</Flex>
	);
};
export default HomePage;
