import { useState, useEffect, useMemo } from "react";
import { 
	Box, 
	Grid, 
	GridItem, 
	useColorModeValue,
	VStack,
	Text,
	Heading,
	HStack,
	Icon,
	Badge,
	Flex,
	Avatar,
	Button,
	IconButton,
	Spinner
} from "@chakra-ui/react";
import { Users, UserPlus, UserCheck, Briefcase, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";
import RecommendedUser from "../components/RecommendedUser";
import FriendRequest from "../components/FriendRequest";
import UserCard from "../components/UserCard";
import useShowToast from "../hooks/useShowToast";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Connection Request Item Component - styled like RecommendedUser
const ConnectionRequestItem = ({ request }) => {
	const queryClient = useQueryClient();
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	const { mutate: acceptRequest, isLoading: acceptLoading } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
			queryClient.invalidateQueries({ queryKey: ["connections"] });
			queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred");
		},
	});

	const { mutate: rejectRequest, isLoading: rejectLoading } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
			queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred");
		},
	});

	return (
		<Flex justify="space-between" align="center" mb={4}>
			<Flex 
				as={Link} 
				to={`/profile/${request.sender.username}`} 
				align="center" 
				flex={1}
				_hover={{ textDecoration: "none" }}
			>
				<Avatar
					src={request.sender.profilePicture || "/avatar.png"}
					name={request.sender.name}
					size="md"
					mr={3}
				/>
				<VStack align="flex-start" spacing={0}>
					<Text 
						fontWeight="semibold" 
						fontSize="sm" 
						color={textColor}
						_hover={{ color: "blue.500" }}
					>
						{request.sender.name}
					</Text>
					<Text fontSize="xs" color={mutedText} noOfLines={1}>
						{request.sender.headline || "No headline"}
					</Text>
				</VStack>
			</Flex>
			<HStack spacing={2}>
				<IconButton
					aria-label="Accept request"
					icon={acceptLoading ? <Spinner size="xs" /> : <Check size={16} />}
					size="sm"
					variant="outline"
					colorScheme="gray"
					borderColor="gray.300"
					color="gray.700"
					_hover={{ 
						borderColor: "gray.400", 
						bg: "gray.50",
						color: "gray.800"
					}}
					_dark={{ 
						borderColor: "gray.600", 
						color: "gray.300",
						_hover: { 
							borderColor: "gray.500", 
							bg: "gray.700",
							color: "gray.200"
						}
					}}
					isLoading={acceptLoading}
					onClick={() => acceptRequest(request._id)}
				/>
				<IconButton
					aria-label="Reject request"
					icon={rejectLoading ? <Spinner size="xs" /> : <X size={16} />}
					size="sm"
					variant="outline"
					colorScheme="red"
					isLoading={rejectLoading}
					onClick={() => rejectRequest(request._id)}
				/>
			</HStack>
		</Flex>
	);
};

const NetworkPage = () => {
	const { user } = useUser();
	const showToast = useShowToast();
	const [activeTab, setActiveTab] = useState("suggestions");

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: () => axiosInstance.get("/connections/requests"),
	});

	const { data: connections } = useQuery({
		queryKey: ["connections"],
		queryFn: () => axiosInstance.get("/connections"),
	});

	// Query recommended users (people you may know)
	const { data: recommendedUsers } = useQuery({
		queryKey: ["recommendedUsers"],
		queryFn: async () => {
			const res = await axiosInstance.get("/users/suggestions");
			return res.data;
		},
	});

	// Filter out already connected users from recommendations
	const allSuggestions = useMemo(() => {
		const regularConnections = connections?.data?.filter(conn => !conn.caseTag) || [];
		const connectionIds = regularConnections.map(c => c._id);
		
		// Filter recommended users to exclude already connected ones
		const filteredRecommended = recommendedUsers?.filter(u => !connectionIds.includes(u._id)) || [];
		
		return filteredRecommended;
	}, [recommendedUsers, connections]);

	// Theme colors
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const cardBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	return (
		<VStack spacing={2} align="stretch">
			{/* Connection Requests and Connections Section */}
			<Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
				{connectionRequests?.data?.length > 0 ? (
					<Box mb={8}>
						<Heading size="md" mb={4} color={textColor}>Connection Requests</Heading>
						<VStack spacing={3} align="stretch">
							{connectionRequests.data.map((request) => (
								<ConnectionRequestItem key={request.id} request={request} />
							))}
						</VStack>
					</Box>
				) : (
					<Box textAlign="center" mb={6}>
						<Icon as={UserPlus} boxSize={12} color="gray.400" mb={4} />
						<Heading size="md" mb={2} color={textColor}>No Connection Requests</Heading>
						<Text color={mutedText}>
							You don't have any pending connection requests at the moment.
						</Text>
						<Text color={mutedText} mt={2}>
							Explore suggested connections below to expand your network!
						</Text>
					</Box>
				)}

				{connections?.data?.length > 0 && (
					<Box>
						{/* Regular Connections */}
						{connections.data.filter(conn => !conn.caseTag).length > 0 && (
							<Box mb={6}>
								<Heading size="md" mb={4} color={textColor}>My Connections</Heading>
								<Grid templateColumns={{ base: "1fr", md: "1fr", lg: "repeat(2, 1fr)" }} gap={3}>
									{connections.data.filter(conn => !conn.caseTag).map((connection) => (
										<UserCard key={connection._id} user={connection} isConnection={true} compact={true} />
									))}
								</Grid>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* Suggestions Section - People You May Know */}
			{allSuggestions?.length > 0 && (
				<Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
					<Heading size="md" mb={4} color={textColor}>People You May Know</Heading>
					<VStack spacing={3} align="stretch">
						{allSuggestions.map((usr) => (
							<RecommendedUser key={usr._id} user={usr} />
						))}
					</VStack>
				</Box>
			)}
		</VStack>
	);
};

export default NetworkPage;
