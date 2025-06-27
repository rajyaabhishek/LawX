import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { ExternalLink, Eye, MessageSquare, ThumbsUp, Trash2, UserPlus, Briefcase, Users, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
	Box,
	VStack,
	HStack,
	Text,
	Heading,
	Avatar,
	Badge,
	IconButton,
	Spinner,
	Center,
	useColorModeValue,
	Button,
	Divider,
	Icon
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";

const NotificationsPage = () => {
	const showToast = useShowToast();
	const queryClient = useQueryClient();

	// Theme colors
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const cardBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => axiosInstance.get("/notifications"),
	});

	const { mutate: markAsReadMutation } = useMutation({
		mutationFn: (id) => axiosInstance.put(`/notifications/${id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			// Remove toast notification as requested
		},
	});

	const { mutate: deleteNotificationMutation } = useMutation({
		mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			// Remove toast notification as requested
		},
	});

	const renderNotificationIcon = (type) => {
		switch (type) {
			case "like":
				return <Icon as={ThumbsUp} color="blue.500" boxSize={4} />;
			case "comment":
				return <Icon as={MessageSquare} color="green.500" boxSize={4} />;
			case "connectionAccepted":
				return <Icon as={UserPlus} color="purple.500" boxSize={4} />;
			case "new_case":
				return <Icon as={Briefcase} color="blue.600" boxSize={4} />;
			case "case_application":
				return <Icon as={Users} color="orange.500" boxSize={4} />;
			case "case_application_accepted":
				return <Icon as={CheckCircle} color="green.500" boxSize={4} />;
			case "case_application_rejected":
				return <Icon as={XCircle} color="red.500" boxSize={4} />;
			default:
				return <Icon as={MessageSquare} color="gray.500" boxSize={4} />;
		}
	};

	const renderNotificationContent = (notification) => {
		switch (notification.type) {
			case "like":
				return (
					<Text fontSize="sm">
						<Text as="span" fontWeight="bold">{notification.relatedUser.name}</Text> liked your post
					</Text>
				);
			case "comment":
				return (
					<Text fontSize="sm">
						<Link to={`/profile/${notification.relatedUser.username}`}>
							<Text as="span" fontWeight="bold" color="blue.500" _hover={{ textDecoration: "underline" }}>
								{notification.relatedUser.name}
							</Text>
						</Link>{" "}
						commented on your post
					</Text>
				);
			case "connectionAccepted":
				return (
					<Text fontSize="sm">
						<Link to={`/profile/${notification.relatedUser.username}`}>
							<Text as="span" fontWeight="bold" color="blue.500" _hover={{ textDecoration: "underline" }}>
								{notification.relatedUser.name}
							</Text>
						</Link>{" "}
						accepted your connection request
					</Text>
				);
			case "new_case":
				return (
					<Text fontSize="sm">
						A new case has been posted that matches your expertise:{" "}
						{notification.relatedCase && (
							<Link to={`/cases/${notification.relatedCase._id}`}>
								<Text as="span" fontWeight="bold" color="blue.600" _hover={{ textDecoration: "underline" }}>
									{notification.relatedCase.title}
								</Text>
							</Link>
						)}
					</Text>
				);
			case "case_application":
				return (
					<Text fontSize="sm">
						<Link to={`/profile/${notification.relatedUser.username}`}>
							<Text as="span" fontWeight="bold" color="blue.500" _hover={{ textDecoration: "underline" }}>
								{notification.relatedUser.name}
							</Text>
						</Link>{" "}
						has applied to your case:{" "}
						{notification.relatedCase && (
							<Link to={`/cases/${notification.relatedCase._id}`}>
								<Text as="span" fontWeight="bold" color="blue.600" _hover={{ textDecoration: "underline" }}>
									{notification.relatedCase.title}
								</Text>
							</Link>
						)}
					</Text>
				);
			case "case_application_accepted":
				return (
					<Text fontSize="sm" color="green.600">
						🎉 Your application has been accepted for case:{" "}
						{notification.relatedCase && (
							<Link to={`/cases/${notification.relatedCase._id}`}>
								<Text as="span" fontWeight="bold" color="blue.600" _hover={{ textDecoration: "underline" }}>
									{notification.relatedCase.title}
								</Text>
							</Link>
						)}
					</Text>
				);
			case "case_application_rejected":
				return (
					<Text fontSize="sm" color="red.600">
						Your application has been declined for case:{" "}
						{notification.relatedCase && (
							<Link to={`/cases/${notification.relatedCase._id}`}>
								<Text as="span" fontWeight="bold" color="blue.600" _hover={{ textDecoration: "underline" }}>
									{notification.relatedCase.title}
								</Text>
							</Link>
						)}
					</Text>
				);
			default:
				return <Text fontSize="sm">{notification.message}</Text>;
		}
	};

	return (
		<Box
			maxW="4xl"
			mx="auto"
			p={{ base: 4, md: 6 }}
			minH="calc(100vh - 120px)"
			bg={bgColor}
		>
			<VStack spacing={6} align="stretch">
				<Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
					<HStack justify="space-between" align="center" mb={6}>
						<Heading size="lg" color={textColor}>Notifications</Heading>
						{notifications?.data?.length > 0 && (
							<Badge colorScheme="blue" px={2} py={1} borderRadius="full">
								{notifications.data.filter(n => !n.read).length} New
							</Badge>
						)}
					</HStack>

					{isLoading ? (
						<Center py={12}>
							<Spinner size="lg" color="blue.500" />
						</Center>
					) : notifications && notifications.data.length > 0 ? (
						<VStack spacing={4} align="stretch">
							{notifications.data.map((notification, index) => (
								<Box key={notification._id}>
									<Box
										bg={!notification.read ? "blue.50" : "transparent"}
										borderRadius="lg"
										p={4}
										border="1px solid"
										borderColor={!notification.read ? "blue.200" : borderColor}
										_hover={{ shadow: "sm", borderColor: "blue.300" }}
										transition="all 0.2s"
									>
										<HStack align="start" spacing={4}>
											<Link to={`/profile/${notification.relatedUser?.username}`}>
												<Avatar
													src={notification.relatedUser?.profilePicture || "/avatar.png"}
													name={notification.relatedUser?.name}
													size="md"
												/>
											</Link>

											<VStack align="start" flex="1" spacing={2}>
												<HStack align="center" spacing={2}>
													<Box
														p={2}
														bg={useColorModeValue("gray.100", "gray.700")}
														borderRadius="full"
													>
														{renderNotificationIcon(notification.type)}
													</Box>
													<Box flex="1">
														{renderNotificationContent(notification)}
													</Box>
												</HStack>

												<Text fontSize="xs" color={mutedText}>
													{formatDistanceToNow(new Date(notification.createdAt), {
														addSuffix: true,
													})}
												</Text>


											</VStack>

											<HStack spacing={2}>
												{!notification.read && (
													<IconButton
														aria-label="Mark as read"
														icon={<Icon as={Eye} />}
														size="sm"
														colorScheme="blue"
														variant="ghost"
														onClick={() => markAsReadMutation(notification._id)}
													/>
												)}

												<IconButton
													aria-label="Delete notification"
													icon={<Icon as={Trash2} />}
													size="sm"
													colorScheme="red"
													variant="ghost"
													onClick={() => deleteNotificationMutation(notification._id)}
												/>
											</HStack>
										</HStack>
									</Box>
									{index < notifications.data.length - 1 && <Divider />}
								</Box>
							))}
						</VStack>
					) : (
						<Center py={12}>
							<VStack spacing={4}>
								<Icon as={MessageSquare} boxSize={16} color="gray.400" />
								<Heading size="md" color={textColor}>No Notifications</Heading>
								<Text color={mutedText} textAlign="center">
									You're all caught up! New notifications will appear here.
								</Text>
							</VStack>
						</Center>
					)}
				</Box>
			</VStack>
		</Box>
	);
};

export default NotificationsPage;
