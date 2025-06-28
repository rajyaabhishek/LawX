import { Box, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "../Sidebar";
import ChatPopup from "../ChatPopup";
import { ChatProvider, useChatPopup } from "../../context/ChatContext";

const LayoutContent = ({ children }) => {
	const { isSignedIn, user } = useUser();
	const { isChatOpen, closeChat } = useChatPopup();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const location = useLocation();
	
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const sidebarBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	
	// Check if current page is ChatPage (also cover potential sub-paths like /chat/123)
	const isChatPage = location.pathname.startsWith('/chat');
	
	// Handle window resize for mobile detection
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		
		checkMobile(); // Initial check
		window.addEventListener('resize', checkMobile);
		
		return () => window.removeEventListener('resize', checkMobile);
	}, []);
	
	// Responsive breakpoint values
	const sidebarWidth = useBreakpointValue({ base: "100%", md: "250px" });
	const showSidebarFixed = useBreakpointValue({ base: false, md: true });
	const contentMargin = useBreakpointValue({ 
		base: "0", 
		md: isSignedIn && user && !isChatPage ? "250px" : "0" 
	});

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	// For mobile chat page, render full-screen without any layout wrappers
	if (isChatPage && isMobile) {
		return (
			<Box 
				position="fixed"
				top={0}
				left={0}
				right={0}
				bottom={0}
				w="100vw"
				h="100vh"
				bg={useColorModeValue("white", "gray.800")}
				zIndex={9999}
				overflow="hidden"
			>
				{children}
			</Box>
		);
	}

	return (
		<Box minH="100vh" bg={isChatPage ? "transparent" : bgColor}>
			{!isChatPage && <Navbar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} isChatPage={isChatPage} />}
			
			{/* Main Container */}
			<Box 
				pt={isChatPage ? "0" : "60px"} // Account for navbar height
				minH={isChatPage ? "100vh" : "calc(100vh - 60px)"}
				display="flex"
				position="relative"
			>
				{/* Left Sidebar - Responsive */}
				{isSignedIn && user && !isChatPage && (
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
					px={isChatPage ? 0 : { base: 2, md: 2.5 }}
					py={isChatPage ? 0 : { base: 2, md: 2.5 }}
				>
					{/* Main Content Container - Full width for flexible layout */}
					<Box
						w="100%"
						maxW={isChatPage ? "100%" : "1200px"} // Maximum container width
					>
						{children}
					</Box>
				</Box>
			</Box>

			{/* Chat Popup */}
			{isSignedIn && user && !isChatPage && (
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