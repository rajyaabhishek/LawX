import { useQuery } from "@tanstack/react-query";
import { 
	Box, 
	useColorModeValue,
	VStack,
	Icon,
	Text,
	Heading,
	Flex
} from "@chakra-ui/react";
import { useUser } from "@clerk/clerk-react";
import { Users } from "lucide-react";
import Post from "../components/Post";
import PostCreation from "../components/PostCreation";
import RecommendedUser from "../components/RecommendedUser";
import { axiosInstance } from "../lib/axios";
import { useMemo } from "react";

const HomePage = () => {
	const { isSignedIn } = useUser();
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

	const { data: posts } = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			const res = await axiosInstance.get("/posts");
			return res.data;
		},
		enabled: isSignedIn
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
					{/* Post Creation */}
					<PostCreation user={authUser} />

					{/* Posts Feed */}
					{posts?.map((post) => (
						<Post key={post._id} post={post} />
					))}

					{/* Empty State */}
					{posts?.length === 0 && (
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
									Connect with others to start seeing posts in your feed!
								</Text>
							</VStack>
						</Box>
					)}
				</VStack>
			</Box>

			{/* Right Sidebar - Recommended Users */}
			{filteredRecommendedUsers?.length > 0 && (
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
