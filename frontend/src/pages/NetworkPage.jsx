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
	Badge
} from "@chakra-ui/react";
import { Users, UserPlus, UserCheck, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";
import RecommendedUser from "../components/RecommendedUser";
import FriendRequest from "../components/FriendRequest";
import UserCard from "../components/UserCard";
import useShowToast from "../hooks/useShowToast";

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

	// Filter out already connected users
	const filteredRecommendedUsers = useMemo(() => {
		if (!recommendedUsers || !connections?.data) return recommendedUsers;
		const connectionIds = connections.data.filter(conn => !conn.caseTag).map(c => c._id);
		return recommendedUsers.filter(u => !connectionIds.includes(u._id));
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
								<FriendRequest key={request.id} request={request} />
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

						{/* Case Applicants */}
						{connections.data.filter(conn => conn.caseTag?.type === 'case_applicant').length > 0 && (
							<Box mb={6}>
								<HStack mb={4}>
									<Heading size="md" color={textColor}>Case Applicants</Heading>
									<Badge colorScheme="blue">
										{connections.data.filter(conn => conn.caseTag?.type === 'case_applicant').length}
									</Badge>
								</HStack>
								<Grid templateColumns={{ base: "1fr", md: "1fr", lg: "repeat(2, 1fr)" }} gap={3}>
									{connections.data.filter(conn => conn.caseTag?.type === 'case_applicant').map((connection) => (
										<UserCard key={`applicant-${connection._id}`} user={connection} isConnection={false} compact={true} />
									))}
								</Grid>
							</Box>
						)}

						{/* Case Posters */}
						{connections.data.filter(conn => conn.caseTag?.type === 'case_poster').length > 0 && (
							<Box mb={6}>
								<HStack mb={4}>
									<Heading size="md" color={textColor}>Case Contacts</Heading>
									<Badge colorScheme="yellow">
										{connections.data.filter(conn => conn.caseTag?.type === 'case_poster').length}
									</Badge>
								</HStack>
								<Grid templateColumns={{ base: "1fr", md: "1fr", lg: "repeat(2, 1fr)" }} gap={3}>
									{connections.data.filter(conn => conn.caseTag?.type === 'case_poster').map((connection) => (
										<UserCard key={`poster-${connection._id}`} user={connection} isConnection={false} compact={true} />
									))}
								</Grid>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* People You May Know - Separate Section */}
			{filteredRecommendedUsers?.length > 0 && (
				<Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
					<Heading size="md" mb={4} color={textColor}>People You May Know</Heading>
					<VStack spacing={3} align="stretch">
						{filteredRecommendedUsers.map((usr) => (
							<RecommendedUser key={usr._id} user={usr} />
						))}
					</VStack>
				</Box>
			)}
		</VStack>
	);
};

export default NetworkPage;
