import { 
	Box, 
	VStack, 
	Text, 
	Image, 
	useColorModeValue,
	Divider,
	Flex,
	Icon,
	Badge,
	HStack
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, Briefcase, FileText, UserCheck, Plus, Search } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import usePremium from "../hooks/usePremium";
import { useAuthContext } from "../context/AuthContext";

export default function Sidebar({ user: passedUser, onItemClick }) {
	const { user: clerkUser } = useUser(); // Get user directly from Clerk
	const { isPremium, subscription, isLoading } = usePremium();
	const { currentUser, isLoading: authLoading } = useAuthContext();

	// Use Clerk user if available, fallback to passed user
	const user = clerkUser || passedUser;

	// Return early if user is not loaded yet
	if (!user) {
		return null;
	}

	// Use the most reliable premium status - prioritize Clerk data
	const userIsPremium = user?.publicMetadata?.isPremium || isPremium || currentUser?.isPremium || false;
	const userIsVerified = currentUser?.isVerified || user?.publicMetadata?.isPremium || false; // Premium users are auto-verified

	// Debug logging - can be removed in production
	if (process.env.NODE_ENV === 'development') {
		console.log('Sidebar Premium Status:', {
			clerkPremium: user?.publicMetadata?.isPremium,
			hookPremium: isPremium,
			contextPremium: currentUser?.isPremium,
			finalPremium: userIsPremium
		});
	}

	const cardBg = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");
	const hoverBg = useColorModeValue("blue.50", "blue.900");
	const linkColor = useColorModeValue("gray.700", "gray.200");

	const NavItem = ({ to, icon, children, isDisabled = false, centered = false }) => (
		<Box
			as={isDisabled ? 'div' : Link}
			to={!isDisabled ? to : undefined}
			display="flex"
			alignItems="center"
			justifyContent={centered ? "center" : "space-between"}
			py={3}
			px={4}
			borderRadius="md"
			color={isDisabled ? mutedText : linkColor}
			_hover={!isDisabled ? {
				bg: "blue.500",
				color: "white"
			} : {}}
			transition="all 0.2s"
			cursor={isDisabled ? "not-allowed" : "pointer"}
			opacity={isDisabled ? 0.6 : 1}
			onClick={!isDisabled && onItemClick ? onItemClick : undefined}
			w={centered ? "fit-content" : "100%"}
			mx={centered ? "auto" : 0}
		>
			<HStack spacing={3}>
				<Icon as={icon} boxSize={5} />
				<Text fontSize={{ base: "md", md: "sm" }} fontWeight="medium">{children}</Text>
			</HStack>
		</Box>
	);

	const PremiumNavItem = ({ to, icon, children }) => (
		<NavItem 
			to={to} 
			icon={icon} 
			isDisabled={!userIsPremium}
		
		>
			{children}
		</NavItem>
	);

	return (
		<Box 
			w="100%" 
			h="100%" 
			bg={cardBg} 
			overflowY="auto"
		>
		

			

			<Box p={4}>
				<VStack spacing={2} align="stretch">
					<NavItem to="/" icon={Home}>
						Home
					</NavItem>
					<NavItem to="/browse-cases" icon={Briefcase}>
						Browse Cases
					</NavItem>
					<NavItem to="/network" icon={UserPlus}>
						Network
					</NavItem>
					{/* My Applications (available to all authenticated users) */}
					<NavItem to="/my-applications" icon={UserCheck}>
						My Applications
					</NavItem>
					{/* Connections nav item removed as feature is deprecated. Users can access connections via Network page. */}
				

					{/* Premium Features Section */}
					{userIsPremium && (
						<>
							<Box pt={3} pb={1} textAlign="center">
								<HStack justify="center">
									<Text fontSize="sm" fontWeight="bold" color="gold">
										Premium Features
									</Text>
								</HStack>
								<Divider mt={1} />
							</Box>
							
							<VStack spacing={2} align="center">
								<PremiumNavItem to="/create-case" icon={Plus}>
									Post a Case
								</PremiumNavItem>
								<PremiumNavItem to="/my-cases" icon={FileText}>
									My Cases
								</PremiumNavItem>
							</VStack>
						</>
					)}

					
					

					{/* Show locked premium features for non-premium users */}
					{!userIsPremium && (
						<>
							<Box pt={3} pb={1} textAlign="center">
								<HStack justify="center">
									<Text fontSize="sm" fontWeight="bold" color={mutedText}>
										Premium Features
									</Text>
								</HStack>
								<Divider mt={1} />
							</Box>
							
							<VStack spacing={2} align="center">
								<PremiumNavItem to="/premium" icon={Plus}>
									Post a Case
								</PremiumNavItem>
								<PremiumNavItem to="/premium" icon={FileText}>
									My Cases
								</PremiumNavItem>
							</VStack>
							
							
						</>
					)}
				</VStack>
			</Box>
		</Box>
	);
}
