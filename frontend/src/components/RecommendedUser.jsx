import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
	Flex, 
	VStack, 
	Text, 
	Button, 
	HStack,
	useColorModeValue,
	Spinner,
	IconButton
} from "@chakra-ui/react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import PremiumAvatar from "./PremiumAvatar";

const RecommendedUser = ({ user }) => {
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	// Theme colors
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	const { data: connectionStatus, isLoading } = useQuery({
		queryKey: ["connectionStatus", user._id],
		queryFn: () => axiosInstance.get(`/connections/status/${user._id}`),
	});

	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent successfully");

			// Optimistically update cache so button shows pending immediately
			queryClient.setQueryData([
				"connectionStatus",
				user._id,
			], { data: { status: "pending" } });

			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			const errorMessage = error.response?.data?.message || error.response?.data?.error || "An error occurred";
			toast.error(errorMessage);
			
			// If connection request already exists, update UI to show pending state
			if (errorMessage === "Connection request already sent") {
				queryClient.setQueryData([
					"connectionStatus",
					user._id,
				], { data: { status: "pending" } });
			}
		},
	});

	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred");
		},
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred");
		},
	});

	const renderButton = () => {
		if (isLoading) {
			return (
				<Button size="sm" isDisabled>
					<Spinner size="xs" mr={2} />
					Loading...
				</Button>
			);
		}

		switch (connectionStatus?.data?.status) {
			case "pending":
				return (
					<Button
						size="sm"
						variant="outline"
						colorScheme="gray"
						leftIcon={<Clock size={16} />}
						isDisabled
						borderColor="gray.300"
						color="gray.600"
						_dark={{ 
							borderColor: "gray.600", 
							color: "gray.400",
							_hover: { borderColor: "gray.500" }
						}}
					>
						Pending
					</Button>
				);
			case "received":
				return (
					<HStack spacing={2}>
						<IconButton
							aria-label="Accept request"
							icon={<Check size={16} />}
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
							onClick={() => acceptRequest(connectionStatus.data.requestId)}
						/>
						<IconButton
							aria-label="Reject request"
							icon={<X size={16} />}
							size="sm"
							variant="outline"
							colorScheme="red"
							onClick={() => rejectRequest(connectionStatus.data.requestId)}
						/>
					</HStack>
				);
			case "connected":
				return (
					<Button
						size="sm"
						variant="outline"
						colorScheme="gray"
						leftIcon={<UserCheck size={16} />}
						isDisabled
						borderColor="gray.300"
						color="gray.600"
						bg="gray.50"
						_dark={{ 
							borderColor: "gray.600", 
							color: "gray.400",
							bg: "gray.800"
						}}
					>
						Connected
					</Button>
				);
			default:
				return (
					<Button
						size="sm"
						variant="outline"
						colorScheme="blue"
						leftIcon={<UserPlus size={16} />}
						onClick={handleConnect}
					>
						Connect
					</Button>
				);
		}
	};

	const handleConnect = () => {
		if (connectionStatus?.data?.status === "not_connected") {
			sendConnectionRequest(user._id);
		}
	};

	// If the recommended user is the same as the logged-in user, do not render anything
	if (authUser?._id === user._id) {
		return null;
	}

	// Hide if already connected
	if (connectionStatus?.data?.status === "connected") {
		return null;
	}

	return (
		<Flex justify="space-between" align="center" mb={4}>
			<Flex 
				as={Link} 
				to={`/profile/${user.username}`} 
				align="center" 
				flex={1}
				_hover={{ textDecoration: "none" }}
			>
				<PremiumAvatar
					src={user.profilePicture || "/avatar.png"}
					name={user.name}
					user={user}
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
						{user.name}
					</Text>
					<Text fontSize="xs" color={mutedText} noOfLines={1}>
						{user.headline}
					</Text>
				</VStack>
			</Flex>
			{renderButton()}
		</Flex>
	);
};
export default RecommendedUser;
