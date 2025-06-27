import { Box, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { useUser } from "@clerk/clerk-react";
import Navbar from "./Navbar";
import Sidebar from "../Sidebar";
import ChatPopup from "../ChatPopup";
import { ChatProvider, useChatPopup } from "../../context/ChatContext";
import { useState } from "react";

const LayoutContent = ({ children }) => {
	const { isSignedIn, user } = useUser();
	const { isChatOpen, closeChat } = useChatPopup();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const sidebarBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	
	// Responsive breakpoint values
	const sidebarWidth = useBreakpointValue({ base: "100%", md: "250px" });
	const showSidebarFixed = useBreakpointValue({ base: false, md: true });
	const contentMargin = useBreakpointValue({ 
		base: "0", 
		md: isSignedIn && user ? "250px" : "0" 
	});

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<Box minH="100vh" bg={bgColor}>
			<Navbar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
			
			{/* Main Container */}
			<Box 
				pt="60px" // Account for navbar height
				minH="calc(100vh - 60px)"
				display="flex"
				position="relative"
			>
				{/* Left Sidebar - Responsive */}
				{isSignedIn && user && (
					<>
						{/* Desktop Sidebar */}
						{showSidebarFixed && (
							<Box
								w="250px"
								h="calc(100vh - 60px)"
								position="fixed"
								left={0}
								top="60px"
								bg={sidebarBg}
								borderRight="1px"
								borderColor={borderColor}
								overflowY="auto"
								zIndex={999}
								boxShadow="sm"
							>
								<Sidebar user={user} />
							</Box>
						)}
						
						{/* Mobile Sidebar Overlay */}
						{!showSidebarFixed && (
							<>
								{/* Backdrop */}
								{isSidebarOpen && (
									<Box
										position="fixed"
										top="60px"
										left={0}
										right={0}
										bottom={0}
										bg="blackAlpha.600"
										zIndex={998}
										onClick={() => setIsSidebarOpen(false)}
									/>
								)}
								
								{/* Mobile Sidebar */}
								<Box
									w={sidebarWidth}
									h="calc(100vh - 60px)"
									position="fixed"
									left={isSidebarOpen ? 0 : "-100%"}
									top="60px"
									bg={sidebarBg}
									borderRight="1px"
									borderColor={borderColor}
									overflowY="auto"
									zIndex={999}
									boxShadow="xl"
									transition="left 0.3s ease-in-out"
								>
									<Sidebar user={user} onItemClick={() => setIsSidebarOpen(false)} />
								</Box>
							</>
						)}
					</>
				)}
				
				{/* Content Area */}
				<Box
					flex="1"
					ml={contentMargin}
					maxW="100%"
					display="flex"
					justifyContent="center"
					px={{ base: 2, md: 2.5 }}
					py={{ base: 2, md: 2.5 }}
				>
					{/* Main Content Container - Full width for flexible layout */}
					<Box
						w="100%"
						maxW="1200px" // Maximum container width
					>
						{children}
					</Box>
				</Box>
			</Box>

			{/* Chat Popup */}
			{isSignedIn && user && (
				<ChatPopup isOpen={isChatOpen} onClose={closeChat} />
			)}
		</Box>
	);
};

const Layout = ({ children }) => {
	return (
		<ChatProvider>
			<LayoutContent>{children}</LayoutContent>
		</ChatProvider>
	);
};

export default Layout;
