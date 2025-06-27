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
import { Home, UserPlus, Bell, Briefcase, FileText, UserCheck, Plus, Search, Crown, Lock } from "lucide-react";
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

	const NavItem = ({ to, icon, children, isPremiumFeature = false, isDisabled = false }) => (
		<Box
			as={isDisabled ? 'div' : Link}
			to={!isDisabled ? to : undefined}
			display="flex"
			alignItems="center"
			justifyContent="space-between"
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
		>
			<HStack spacing={3}>
				<Icon as={icon} boxSize={5} />
				<Text fontSize={{ base: "md", md: "sm" }} fontWeight="medium">{children}</Text>
			</HStack>
			{isPremiumFeature && (
				userIsPremium ? (
					<Badge colorScheme="gold" size="sm">
						<Icon as={Crown} boxSize={3} />
					</Badge>
				) : (
					<Icon as={Lock} boxSize={3} />
				)
			)}
		</Box>
	);

	const PremiumNavItem = ({ to, icon, children }) => (
		<NavItem 
			to={to} 
			icon={icon} 
			isPremiumFeature={true}
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
					{/* Connections nav item removed as feature is deprecated. Users can access connections via Network page. */}
				

					{/* Premium Features Section */}
					{userIsPremium && (
						<>
							<Box pt={3} pb={1}>
								<HStack>
									<Icon as={Crown} color="gold" boxSize={4} />
									<Text fontSize="sm" fontWeight="bold" color="gold">
										Premium Features
									</Text>
								</HStack>
								<Divider mt={1} />
							</Box>
							
							<PremiumNavItem to="/create-case" icon={Plus}>
								Post a Case
							</PremiumNavItem>
							<PremiumNavItem to="/my-cases" icon={FileText}>
								My Cases
							</PremiumNavItem>
							<PremiumNavItem to="/my-applications" icon={UserCheck}>
								My Applications
							</PremiumNavItem>
						</>
					)}

					
					

					{/* Show locked premium features for non-premium users */}
					{!userIsPremium && (
						<>
							<Box pt={3} pb={1}>
								<HStack>
									<Icon as={Lock} color={mutedText} boxSize={4} />
									<Text fontSize="sm" fontWeight="bold" color={mutedText}>
										Premium Features
									</Text>
								</HStack>
								<Divider mt={1} />
							</Box>
							
							<PremiumNavItem to="/premium" icon={Plus}>
								Post a Case
							</PremiumNavItem>
							<PremiumNavItem to="/premium" icon={FileText}>
								My Cases
							</PremiumNavItem>
							<PremiumNavItem to="/premium" icon={UserCheck}>
								My Applications
							</PremiumNavItem>
							
							
						</>
					)}
				</VStack>
			</Box>
		</Box>
	);
}
