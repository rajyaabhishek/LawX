import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
	Box, 
	Flex, 
	Image, 
	Button, 
	Text, 
	useColorModeValue,
	useColorMode,
	Badge,
	Icon,
	HStack,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	useBreakpointValue
} from "@chakra-ui/react";
import { Bell, MessageSquare, Crown, Sun, Moon, Search, User, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { axiosInstance } from "../../lib/axios";
import { useState } from "react";
import { useChatPopup } from "../../context/ChatContext";

const Navbar = ({ onMenuClick, isSidebarOpen, isChatPage = false }) => {
	const { isSignedIn, user } = useUser();
	const { signOut } = useClerk();
	const queryClient = useQueryClient();

	const { toggleChat } = useChatPopup();

	const [searchQuery, setSearchQuery] = useState("");
	const { colorMode, toggleColorMode } = useColorMode();
	const isDark = colorMode === "dark";
	const navigate = useNavigate();
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);

	// Responsive breakpoint values
	const showMobileMenu = useBreakpointValue({ base: true, md: false });
	const showDesktopSearch = useBreakpointValue({ base: false, md: true });
	const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
	const iconSize = useBreakpointValue({ base: 16, md: 20 });

	// Debug logging
	console.log('Navbar render - user:', user, 'isSignedIn:', isSignedIn);

	const { data: notifications } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => axiosInstance.get("/notifications"),
		enabled: !!isSignedIn,
	});

	// Theme values - ALL useColorModeValue calls at top level
	const bgColor = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.700", "white");
	const hoverColor = useColorModeValue("gray.900", "gray.300");
	const inputBg = useColorModeValue("gray.50", "gray.700");
	const placeholderColor = useColorModeValue("gray.500", "gray.400");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const inputBorderColor = useColorModeValue("gray.300", "gray.600");
	const inputHoverBorderColor = useColorModeValue("gray.400", "gray.500");
	const inputHoverBg = useColorModeValue("white", "gray.600");
	const inputFocusBg = useColorModeValue("white", "gray.600");
	const iconHoverBg = useColorModeValue("gray.100", "gray.700");

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			// Navigate to search page with search query and default to cases tab
			navigate(`/search?q=${encodeURIComponent(searchQuery)}&tab=cases`);
			// Close mobile search after navigation
			setIsSearchExpanded(false);
		} else {
			// Navigate to search page without query
			navigate('/search');
			setIsSearchExpanded(false);
		}
	};

	const toggleMobileSearch = () => {
		setIsSearchExpanded(!isSearchExpanded);
		if (!isSearchExpanded) {
			// Focus the input when expanding
			setTimeout(() => {
				const input = document.querySelector('#mobile-search-input');
				if (input) input.focus();
			}, 100);
		}
	};

	const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;

	return (
		<Box 
			as="nav" 
			bg={bgColor} 
			position="fixed" 
			top={0} 
			left={0}
			right={0}
			zIndex={1000}
			borderBottom="1px solid"
			borderBottomColor={borderColor}
			h="60px"
		>
					<Box maxW="100%" px={{ base: 2, md: 4 }} h="100%">
			<Flex justify="space-between" align="center" h="100%">
				<Flex align="center" spacing={{ base: 2, md: 4 }}>
					{/* Mobile Menu Button */}
					{isSignedIn && showMobileMenu && !isSearchExpanded && (
						<IconButton
							aria-label="Menu"
							icon={<Icon as={Menu} size={iconSize} />}
							variant="ghost"
							color={textColor}
							size={buttonSize}
							onClick={onMenuClick}
							_hover={{ color: hoverColor, bg: iconHoverBg }}
						/>
					)}
					
					{/* Mobile Search Back Button */}
					{showMobileMenu && isSearchExpanded && (
						<IconButton
							aria-label="Close search"
							icon={<Icon as={X} size={iconSize} />}
							variant="ghost"
							color={textColor}
							size={buttonSize}
							onClick={() => setIsSearchExpanded(false)}
							_hover={{ color: hoverColor, bg: iconHoverBg }}
						/>
					)}
					
					<Box as={Link} to="/" display="flex" alignItems="center" gap={2}>
						<Image h={{ base: 6, md: 8 }} borderRadius="md" src="/small-logo.png" alt="LawX" />
						<Text 
							fontSize={{ base: "lg", md: "xl" }}
							fontWeight="bold" 
							color={textColor}
							display={{ base: isSearchExpanded ? "none" : "none", sm: isSearchExpanded ? "none" : "block" }}
						>
							LawX
						</Text>
					</Box>
					
					{/* Desktop Search Bar */}
					{isSignedIn && showDesktopSearch && (
						<Box ml={8}>
							<form onSubmit={handleSearchSubmit}>
								<InputGroup size="md" maxW="500px">
									<InputLeftElement pointerEvents="none">
										<Icon as={Search} color={placeholderColor} />
									</InputLeftElement>
									<Input
										placeholder="Search LawX"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										bg={inputBg}
										border="1px solid"
										borderColor={inputBorderColor}
										borderRadius="full"
										_hover={{ 
											borderColor: inputHoverBorderColor,
											bg: inputHoverBg
										}}
										_focus={{ 
											borderColor: "blue.500", 
											boxShadow: "0 0 0 1px blue.500",
											bg: inputFocusBg
										}}
										fontSize="14px"
									/>
								</InputGroup>
							</form>
						</Box>
					)}

					{/* Mobile Expanded Search Bar */}
					{isSignedIn && showMobileMenu && isSearchExpanded && (
						<Box flex="1" ml={2}>
							<form onSubmit={handleSearchSubmit}>
								<InputGroup size="md">
									<InputLeftElement pointerEvents="none">
										<Icon as={Search} color={placeholderColor} />
									</InputLeftElement>
									<Input
										id="mobile-search-input"
										placeholder="Search LawX"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										bg={inputBg}
										border="1px solid"
										borderColor={inputBorderColor}
										borderRadius="full"
										_hover={{ 
											borderColor: inputHoverBorderColor,
											bg: inputHoverBg
										}}
										_focus={{ 
											borderColor: "blue.500", 
											boxShadow: "0 0 0 1px blue.500",
											bg: inputFocusBg
										}}
										fontSize="14px"
									/>
								</InputGroup>
							</form>
						</Box>
					)}
				</Flex>
					
									<HStack spacing={{ base: 1, md: 4 }}>
					{isSignedIn ? (
						<>
							{/* Mobile Search Button */}
							{!showDesktopSearch && !isSearchExpanded && (
								<IconButton
									aria-label="Search"
									icon={<Search size={iconSize} />}
									variant="ghost"
									color={textColor}
									size={buttonSize}
									onClick={toggleMobileSearch}
									_hover={{ color: hoverColor, bg: iconHoverBg }}
								/>
							)}

							{/* Hide other icons when mobile search is expanded */}
							{!isSearchExpanded && (
								<>
									<IconButton
										as={Link}
										to="/notifications"
										aria-label="Notifications"
										icon={<Bell size={iconSize} />}
										variant="ghost"
										color={textColor}
										size={buttonSize}
										_hover={{ color: hoverColor, bg: iconHoverBg }}
										position="relative"
									>
										{unreadNotificationCount > 0 && (
											<Badge
												position="absolute"
												top="6px"
												right="6px"
												bg="red.500"
												color="white"
												fontSize="xs"
												borderRadius="full"
												minW={4}
												h={4}
												display="flex"
												alignItems="center"
												justifyContent="center"
											>
												{unreadNotificationCount}
											</Badge>
										)}
									</IconButton>

									<IconButton
										aria-label="Chat"
										icon={<MessageSquare size={iconSize} />}
										variant="ghost"
										color={textColor}
										size={buttonSize}
										_hover={{ color: hoverColor, bg: iconHoverBg }}
										onClick={toggleChat}
									/>

									{/* Premium Badge - Hide on very small screens */}
									{user?.publicMetadata?.isPremium && (
										<Badge 
											colorScheme="yellow" 
											variant="solid"
											fontSize="xs"
											px={2}
											py={1}
											borderRadius="full"
											display={{ base: "none", sm: "flex" }}
										>
											<Icon as={Crown} boxSize={3} mr={1} />
											Premium
										</Badge>
									)}

									{/* Premium Upgrade Button - Responsive */}
									{!user?.publicMetadata?.isPremium && !isChatPage && (
										<Button
											size={buttonSize}
											colorScheme="yellow"
											variant="outline"
											leftIcon={<Crown size={showMobileMenu ? 14 : 16} />}
											onClick={() => navigate('/premium')}
											fontSize="xs"
											px={showMobileMenu ? 2 : 3}
											display={{ base: "none", sm: "flex" }}
										>
											{showMobileMenu ? "Premium" : "Get Premium"}
										</Button>
									)}

									{/* Color Mode Toggle */}
									<IconButton
										aria-label="Toggle color mode"
										icon={colorMode === 'light' ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
										onClick={toggleColorMode}
										variant="ghost"
										color={textColor}
										size={buttonSize}
										_hover={{ color: hoverColor, bg: iconHoverBg }}
									/>

									{/* Clerk UserButton - replaces custom profile section */}
									<UserButton 
										appearance={{
											elements: {
												avatarBox: `${showMobileMenu ? 'w-7 h-7' : 'w-8 h-8'} shadow-md border-2 ${isDark ? "border-gray-600" : "border-white"}`,
												userButtonPopoverCard: `shadow-xl border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`,
												userButtonPopoverActionButton: `${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`,
												userButtonPopoverActionButtonText: `${isDark ? "text-gray-200" : "text-gray-700"} font-medium`,
												userButtonPopoverActionButtonIcon: isDark ? "text-gray-400" : "text-gray-500"
											},
											variables: {
												colorPrimary: "#3B82F6"
											},
											localization: {
												userButtonPopoverActionButton__manageAccount: "Manage Profile"
											}
										}}
										userProfileMode="navigation"
										userProfileUrl="/profile"
										afterSignOutUrl="/"
										showName={false}
									/>
								</>
							)}
						</>
					) : (
						<>
							{/* Color Mode Toggle for non-authenticated users */}
							<IconButton
								aria-label="Toggle color mode"
								icon={colorMode === 'light' ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
								onClick={toggleColorMode}
								variant="ghost"
								color={textColor}
								size={buttonSize}
								_hover={{ color: hoverColor, bg: iconHoverBg }}
							/>
						</>
					)}
				</HStack>
				</Flex>
			</Box>



			{/* Modals */}
			{/* <PremiumUpgradeModal 
				isOpen={isPremiumModalOpen} 
				onClose={() => setIsPremiumModalOpen(false)} 
			/> */}
		</Box>
	);
};
export default Navbar;
