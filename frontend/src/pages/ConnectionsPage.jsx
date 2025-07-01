import { useState, useMemo } from "react";
import { 
	Box, 
	Grid, 
	VStack,
	Text,
	Heading,
	HStack,
	Icon,
	Badge,
	Input,
	InputGroup,
	InputLeftElement,
	useColorModeValue
} from "@chakra-ui/react";
import { Users, Search, UserCheck, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";
import UserCard from "../components/UserCard";

const ConnectionsPage = () => {
	const { user } = useUser();
	const [searchTerm, setSearchTerm] = useState("");

	// Query for user connections
	const { data: connections, isLoading } = useQuery({
		queryKey: ["connections"],
		queryFn: () => axiosInstance.get("/connections"),
	});

	// Filter connections based on search term
	const filteredConnections = useMemo(() => {
		if (!connections?.data || !searchTerm) return connections?.data || [];
		
		const term = searchTerm.toLowerCase();
		return connections.data.filter(connection => 
			connection.name?.toLowerCase().includes(term) ||
			connection.username?.toLowerCase().includes(term) ||
			connection.headline?.toLowerCase().includes(term)
		);
	}, [connections?.data, searchTerm]);

	// Theme colors
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const cardBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<VStack spacing={6} align="stretch">
			<Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
				{/* Search Bar */}
				{connections?.data?.length > 0 && (
					<Box mb={6}>
						<InputGroup>
							<InputLeftElement pointerEvents='none'>
								<Icon as={Search} color="gray.300" />
							</InputLeftElement>
							<Input
								placeholder="Search connections by name, username, or headline..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								bg={useColorModeValue("gray.50", "gray.700")}
								border="1px solid"
								borderColor={borderColor}
								_focus={{
									borderColor: "blue.500",
									boxShadow: "0 0 0 1px blue.500"
								}}
							/>
						</InputGroup>
					</Box>
				)}

				{/* No Connections State */}
				{(!connections?.data || connections.data.length === 0) && (
					<Box textAlign="center" mb={6}>
						<Icon as={Users} boxSize={12} color="gray.400" mb={4} />
						<Heading size="md" mb={2} color={textColor}>No Connections Yet</Heading>
						<Text color={mutedText}>
							You don't have any connections at the moment.
						</Text>
						<Text color={mutedText} mt={2}>
							Visit the Network page to discover people you may know!
						</Text>
					</Box>
				)}

				{/* Connections */}
				{filteredConnections.length > 0 && (
					<Box mb={6}>
						<HStack mb={4}>
							<Heading size="md" color={textColor}>My Connections</Heading>
							<Badge colorScheme="blue">
								{filteredConnections.length}
							</Badge>
						</HStack>
						<Grid templateColumns={{ base: "1fr", md: "1fr", lg: "repeat(2, 1fr)" }} gap={3}>
							{filteredConnections.map((connection) => (
								<UserCard 
									key={connection._id} 
									user={connection} 
									isConnection={true} 
									compact={true}
								/>
							))}
						</Grid>
					</Box>
				)}

				{/* No Search Results */}
				{searchTerm && filteredConnections.length === 0 && connections?.data?.length > 0 && (
					<Box textAlign="center" mt={8}>
						<Icon as={Search} boxSize={12} color="gray.400" mb={4} />
						<Heading size="md" mb={2} color={textColor}>No Results Found</Heading>
						<Text color={mutedText}>
							No connections match your search for "{searchTerm}"
						</Text>
					</Box>
				)}
			</Box>
		</VStack>
	);
};

export default ConnectionsPage; 