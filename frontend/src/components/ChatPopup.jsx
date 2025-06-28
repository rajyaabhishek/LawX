import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Icon,
  IconButton,
  Divider,
  useColorModeValue,
  Skeleton,
  SkeletonCircle,
  Button,
  Badge,
  Image,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  SearchIcon,
  SettingsIcon,
  CloseIcon,
  MinusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  AttachmentIcon,
  ArrowLeftIcon
} from "@chakra-ui/icons";
import { FiSend } from "react-icons/fi";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useUser, useAuth } from "@clerk/clerk-react";
import Conversation from "./Conversation";
import MessageContainer from "./MessageContainer";
import { useSocket } from "../context/SocketContext";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";

const ChatPopup = ({ isOpen, onClose }) => {
  const { user: currentUser, isSignedIn } = useUser();
  
  // Don't render if not signed in or not open - move this before other hooks
  if (!isOpen || !isSignedIn || !currentUser) return null;

  const [isMinimized, setIsMinimized] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const [currentUserData, setCurrentUserData] = useState(null);
  const showToast = useShowToast();
  const { socket, onlineUsers } = useSocket();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchTimeout = useRef(null);

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const chatWidth = useBreakpointValue({ base: "100vw", lg: `${width}px` });
  const chatHeight = useBreakpointValue({ 
    base: "100vh", 
    lg: "calc(100vh - 100px)" 
  });
  const chatPosition = useBreakpointValue({
    base: { 
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    lg: {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      top: "80px"
    }
  });

  // Function to refresh conversations list
  const refreshConversations = useCallback(async () => {
    console.log('ChatPopup: Refreshing conversations list...');
    try {
      const response = await axiosInstance.get("/messages/conversations");
      console.log('ChatPopup: New conversations:', response.data);
      setConversations(response.data);
      return response.data;
    } catch (error) {
      console.error('ChatPopup: Error refreshing conversations:', error);
      return [];
    }
  }, [setConversations]);

  // Get current user's MongoDB ID

  // Get current user data (including MongoDB ID for legacy message comparison)
  useEffect(() => {
    const getCurrentUserData = async () => {
      if (!currentUser?.id || !isSignedIn) {
        console.log('ChatPopup: Skipping user data fetch - not ready', { currentUser: !!currentUser, isSignedIn });
        return;
      }
      
      console.log('ChatPopup: Fetching current user data...');
      try {
        const token = await getToken();
        const { data } = await axiosInstance.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('ChatPopup: Current user data fetched:', data);
        const fetchedUser = data?.user || data; // Support both response shapes
        setCurrentUserData(fetchedUser);
      } catch (error) {
        console.error('ChatPopup: Error fetching current user data:', error);
      }
    };

    getCurrentUserData();
  }, [currentUser?.id, isSignedIn, getToken]);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const leftPanelBg = useColorModeValue("white", "gray.850");
  const rightPanelBg = useColorModeValue("gray.50", "gray.800");

  // Load conversations on mount
  useEffect(() => {
    const getConversations = async () => {
      if (!currentUser?.id || !isOpen || !isSignedIn) {
        console.log('Skipping conversations fetch: not signed in or chat not open');
        return;
      }

      // Wait a moment to ensure axios interceptor is set up
      await new Promise(resolve => setTimeout(resolve, 100));

      setLoadingConversations(true);
      try {
        console.log('ChatPopup: Fetching conversations for user:', currentUser.id);
        const response = await axiosInstance.get("/messages/conversations");
        const data = response.data;
        console.log("Conversations data:", data);
        setConversations(data);

        if (data.length > 0 && !selectedConversation?._id) {
          const firstConversation = data[0];
          if (firstConversation.participantDetails && Array.isArray(firstConversation.participantDetails) && firstConversation.participantDetails.length > 0) {
            const otherParticipant = firstConversation.participantDetails[0];
            if (otherParticipant?._id && otherParticipant?.username) {
              setSelectedConversation({
                _id: firstConversation._id,
                userId: otherParticipant._id,
                username: otherParticipant.username,
                userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        showToast("Error", "Failed to load conversations", "error");
      } finally {
        setLoadingConversations(false);
      }
    };

    getConversations();
  }, [currentUser?.id, isOpen, isSignedIn, showToast]);

  // Socket listener for seen messages
  useEffect(() => {
    socket?.on("messagesSeen", ({ conversationId }) => {
      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (conversation._id === conversationId) {
            return {
              ...conversation,
              lastMessage: {
                ...conversation.lastMessage,
                seen: true,
              },
            };
          }
          return conversation;
        });
        return updatedConversations;
      });
    });
  }, [socket]);

  // Load messages when conversation changes
  useEffect(() => {
    const getMessages = async () => {
      if (!selectedConversation?.userId || !currentUser?.id || !isSignedIn) {
        console.log('ChatPopup: Required data not available for messages:', { 
          selectedConversation: !!selectedConversation, 
          userId: !!selectedConversation?.userId,
          currentUser: !!currentUser,
          currentUserId: !!currentUser?.id,
          isSignedIn
        });
        setMessages([]);
        return;
      }
      
      // Wait a moment to ensure axios interceptor is set up
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoadingConversations(true);
      try {
        console.log('ChatPopup: Fetching messages for user:', selectedConversation.userId);
        console.log('ChatPopup: Selected conversation:', selectedConversation);
        const { data } = await axiosInstance.get(`/messages/${selectedConversation.userId}`);
        console.log('ChatPopup: Messages loaded successfully:', data);
        setMessages(data || []);
      } catch (error) {
        console.error('ChatPopup: Error loading messages:', error);
        
        // If it's a 404, it might be a new conversation - initialize empty messages
        if (error.response?.status === 404) {
          console.log('ChatPopup: 404 error - initializing empty messages for new conversation');
          setMessages([]);
        } else {
          showToast("Error", error.response?.data?.message || error.message, "error");
        }
      } finally {
        setLoadingConversations(false);
      }
    };

    getMessages();
  }, [selectedConversation, currentUser, isSignedIn, showToast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle incoming messages from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('Received new message:', message);
      
      // If this message is for the current conversation, add it to messages
      if (selectedConversation?._id === message.conversationId || 
          selectedConversation?.userId === message.sender?._id || 
          selectedConversation?.userId === message.sender) {
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg._id === message._id);
          if (messageExists) return prev;
          
          return [...prev, message];
        });
      }

      // Update conversations list
      setConversations(prev => {
        return prev.map(conv => 
          conv._id === message.conversationId 
            ? { 
                ...conv, 
                lastMessage: {
                  text: message.text || "New message",
                  sender: message.sender,
                  seen: message.sender === currentUser?.id,
                  createdAt: new Date()
                }
              } 
            : conv
        );
      });
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation, currentUser]);

  // Search functionality
  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      setSearchingUser(true);
      console.log('=== ChatPopup Search Debug ===');
      console.log('Search query:', value);
      console.log('Current user:', currentUser);
      console.log('Attempting to call:', `/users/search/connected?q=${encodeURIComponent(value.trim())}`);
      
      // Use the new connected users search endpoint
      const { data } = await axiosInstance.get(`/users/search/connected?q=${encodeURIComponent(value.trim())}`);
      
      console.log('Search response received:', data);
      console.log('Search response type:', Array.isArray(data));
      console.log('Search response length:', data?.length);
      
      const currentUserId = currentUser?.id;
      const filteredResults = Array.isArray(data) 
        ? data.filter(user => user._id && user._id !== currentUserId)
        : [];
        
      console.log('Filtered results:', filteredResults);
      console.log('Setting search results...');
      
      setSearchResults(filteredResults);
      setShowSearchResults(true);
      
      console.log('Search completed successfully');
    } catch (error) {
      console.error('=== Search Error Debug ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      
      setSearchResults([]);
      setShowSearchResults(false);
      
      // Show user-friendly error messages
      if (error.response?.status === 401) {
        showToast("Authentication Error", "Please sign in again", "error");
      } else if (error.response?.status === 404) {
        showToast("Info", "No connected users found matching your search", "info");
      } else if (error.response?.data?.length === 0) {
        showToast("Info", "No connected users found", "info");
      } else {
        showToast("Info", "Only connected users can be messaged. Connect with users to start chatting!", "info");
      }
    } finally {
      setSearchingUser(false);
    }
  }, [currentUser, showToast]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchText(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.trim()) {
      searchTimeout.current = setTimeout(() => {
        handleSearchChange({ target: { value } });
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [handleSearchChange]);

  // User selection for new conversation
  const handleUserSelect = useCallback(async (user) => {
    console.log('=== ChatPopup: handleUserSelect called ===');
    console.log('ChatPopup: User clicked:', user);
    
    if (!user || !user._id) {
      console.error('ChatPopup: Invalid user object:', user);
      return;
    }

    try {
      // Clear search first
      setSearchText('');
      setShowSearchResults(false);
      setSearchResults([]);
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => {
        return Array.isArray(conv.participantDetails) && 
               conv.participantDetails.some(p => p._id === user._id);
      });

      if (existingConversation) {
        console.log('ChatPopup: Found existing conversation:', existingConversation._id);
        
        const conversationData = {
          _id: existingConversation._id,
          userId: user._id,
          username: user.username || user.name,
          userProfilePic: user.profilePic || user.profilePicture,
          name: user.name || user.username,
        };
        
        console.log('ChatPopup: Setting existing conversation:', conversationData);
        setSelectedConversation(conversationData);
      } else {
        console.log('ChatPopup: Creating new conversation with:', user.username || user.name);
        
        const newConversation = {
          _id: null,
          userId: user._id,
          userProfilePic: user.profilePic || user.profilePicture,
          username: user.username || user.name,
          name: user.name || user.username,
          mock: true
        };

        console.log('ChatPopup: Setting new conversation:', newConversation);
        setSelectedConversation(newConversation);
        setMessages([]);
      }
      
      console.log('=== ChatPopup: User selection completed ===');
      
    } catch (error) {
      console.error('ChatPopup: Error in handleUserSelect:', error);
      showToast("Error", "Failed to select user", "error");
    }
  }, [currentUser, conversations, showToast]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (message) => {
    if (!message?.trim() || !selectedConversation?.userId || !currentUser?.id) return;

    const originalMessageText = message;
    
    try {
      // Create optimistic message - USE MONGODB ID
      const tempId = Date.now().toString();
      const newMessage = {
        _id: tempId,
        text: originalMessageText,
        sender: currentUserData?._id || currentUser.id, // Use MongoDB ID for consistency
        conversationId: selectedConversation._id || tempId,
        createdAt: new Date(),
        seen: false,
        isOptimistic: true
      };
      


      // Add message to local state immediately (optimistic update)
      setMessages(prev => [...prev, newMessage]);

      // Send message via API
      try {
        const response = await axiosInstance.post("/messages", {
          recipientId: selectedConversation.userId,
          message: originalMessageText
        });
        
        console.log('Message sent successfully:', response.data);
        
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? { ...response.data, isOptimistic: false } : msg
          )
        );

        // Emit via socket for real-time updates to other users
        if (socket) {
          socket.emit("sendMessage", {
            ...response.data,
            recipientId: selectedConversation.userId,
            conversationId: selectedConversation._id || response.data.conversationId,
          });
        }

        // If this was a new conversation, update the selected conversation with the real conversation ID
        if (!selectedConversation._id && response.data.conversationId) {
          console.log('ChatPopup: Updating conversation ID from null to:', response.data.conversationId);
          setSelectedConversation(prev => ({
            ...prev,
            _id: response.data.conversationId,
            mock: false
          }));
        }

        // Always refresh conversations list when a new conversation is created or when this was a mock conversation
        if (selectedConversation.mock || !selectedConversation._id) {
          console.log('ChatPopup: Refreshing conversations list after new conversation');
          await refreshConversations();
        }

      } catch (apiError) {
        console.error('API send failed:', apiError);
        
        // Remove optimistic message on API error
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        
        // Show error message
        showToast("Error", apiError.response?.data?.error || "Failed to send message", "error");
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showToast("Error", "Failed to send message", "error");
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
    }
  }, [selectedConversation, currentUser, currentUserData, socket, showToast, refreshConversations]);

  // Resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(600, Math.min(1200, startWidth - (e.clientX - startX)));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width]);

  // Mobile version uses Drawer
  const handleUpgradeToPremium = () => {
    onClose();
    navigate('/premium');
  };
  
  if (isMobile) {

    const renderConversationList = () => (
      <Box w="full" h="full" overflowY="auto">
        {/* Search Bar */}
        <Box p={3} position="relative">
          <InputGroup size="md">
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search people..."
              value={searchText}
              onChange={handleInputChange}
              bg={useColorModeValue("gray.100", "gray.700")}
              borderRadius="full"
            />
          </InputGroup>

          {showSearchResults && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              zIndex={20}
              maxHeight="250px"
              overflowY="auto"
              mt={1}
              boxShadow="lg"
            >
              {searchingUser ? (
                <Flex align="center" justify="center" p={4}>
                  <Skeleton height="20px" width="100px" />
                </Flex>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <Flex
                    key={user._id}
                    align="center"
                    p={3}
                    _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                    cursor="pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Avatar size="sm" src={user.profilePicture || user.profilePic} name={user.name} mr={3} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {user.name}
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        @{user.username}
                      </Text>
                    </VStack>
                  </Flex>
                ))
              ) : (
                <Flex align="center" justify="center" p={4}>
                  <Text color={mutedText} fontSize="sm">
                    No users found
                  </Text>
                </Flex>
              )}
            </Box>
          )}
        </Box>

        {/* Conversations */}
        <Box>
          {loadingConversations ? (
            [...Array(4)].map((_, i) => (
              <Flex key={i} gap={3} alignItems="center" p={3}>
                <SkeletonCircle size="10" />
                <VStack align="start" flex="1" spacing={1}>
                  <Skeleton h="10px" w="80px" />
                  <Skeleton h="8px" w="60%" />
                </VStack>
              </Flex>
            ))
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => {
              const otherParticipant = Array.isArray(conversation.participantDetails)
                ? conversation.participantDetails.find(p => p._id !== currentUser?.id) || conversation.participantDetails[0]
                : null;

              if (!otherParticipant) return null;

              const displayConversation = {
                ...conversation,
                username: otherParticipant.username || otherParticipant.name,
                userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                userId: otherParticipant._id
              };

              return (
                <Box
                  key={conversation._id}
                  onClick={() => {
                    setSelectedConversation({
                      _id: conversation._id,
                      userId: otherParticipant._id,
                      username: otherParticipant.username,
                      userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                    });
                  }}
                >
                  <Conversation
                    conversation={displayConversation}
                    isOnline={onlineUsers.includes(otherParticipant?.clerkId) || onlineUsers.includes(otherParticipant?._id)}
                    isSelected={selectedConversation?._id === conversation._id}
                  />
                </Box>
              );
            })
          ) : (
            <Flex align="center" justify="center" h="200px">
              <Text color={mutedText}>No conversations yet</Text>
            </Flex>
          )}
        </Box>
      </Box>
    );

    return (
      <Drawer 
        isOpen={isOpen} 
        onClose={onClose} 
        size="full" 
        placement="right"
        variant=""
        blockScrollOnMount={false}
      >
        <DrawerOverlay />
        <DrawerContent 
          display="flex" 
          flexDirection="column"
          maxHeight="100dvh"
          height="100%"
          className="chat-container-mobile"
          css={{
            '--safezone-top': 'env(safe-area-inset-top, 0px)',
            '--safezone-bottom': 'env(safe-area-inset-bottom, 0px)',
            '--safezone-left': 'env(safe-area-inset-left, 0px)',
            '--safezone-right': 'env(safe-area-inset-right, 0px)',
          }}
        >
          <DrawerHeader 
            borderBottomWidth="1px" 
            p={4}
            position="relative"
            flexShrink={0}
            className="mobile-chat-header"
          >
            <HStack justify="space-between" w="100%">
              <HStack spacing={2}>
                <Box w="24px" h="24px" bg="orange.500" borderRadius="full" />
                <Text fontWeight="bold" color={textColor} fontSize="lg">
                  {selectedConversation._id ? 'Chat' : 'Chats'}
                </Text>
              </HStack>
              
              {selectedConversation._id ? (
                <Box
                  as="button"
                  className="mobile-chat-back-button mobile-touch-feedback"
                  onClick={() => setSelectedConversation({})}
                  aria-label="Back to conversations"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="40px"
                  h="40px"
                  borderRadius="50%"
                  bg="transparent"
                  _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                  transition="all 0.2s ease"
                >
                  <ChevronLeftIcon boxSize={5} />
                </Box>
              ) : (
                <HStack>
                  <Button 
                    size="sm" 
                    colorScheme="orange" 
                    variant="outline"
                    onClick={handleUpgradeToPremium}
                    className="mobile-touch-feedback"
                    minH="44px"
                  >
                    Premium
                  </Button>
                  <DrawerCloseButton position="relative" top={0} right={0} />
                </HStack>
              )}
            </HStack>
          </DrawerHeader>
          
          <DrawerBody 
            p={0} 
            flex="1" 
            display="flex" 
            flexDirection="column"
            className="mobile-scroll-container"
            css={{
              '--keyboard-inset': '0px',
              '@supports (height: 100svh)': {
                height: 'calc(100dvh - var(--chakra-sizes-16) - var(--safezone-top) - var(--safezone-bottom))',
              },
              '@supports not (height: 100svh)': {
                height: 'calc(100vh - var(--chakra-sizes-16) - var(--safezone-top) - var(--safezone-bottom))',
              },
            }}
          >
            {selectedConversation._id ? (
              <MessageContainer 
                onlineUsers={onlineUsers} 
                isMobile={true}
              />
            ) : (
              renderConversationList()
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version
  return (
    <Box
      {...chatPosition}
      width={chatWidth}
      maxHeight={chatHeight}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="2xl"
      zIndex={9999}
      overflow="hidden"
      ref={chatRef}
      css={{
        '@supports (height: 100svh)': {
          maxHeight: '100dvh',
        },
        '@supports not (height: 100svh)': {
          maxHeight: '100vh',
        },
      }}
    >
      {/* Resize handle */}
      <Box
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        width="4px"
        cursor="ew-resize"
        bg="transparent"
        _hover={{ bg: "blue.200" }}
        onMouseDown={handleMouseDown}
        zIndex={10}
      />

      {/* Main Header */}
      <Flex
        bg={headerBg}
        p={3}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <HStack spacing={2}>
          <Box w="24px" h="24px" bg="orange.500" borderRadius="full" />
          <Text fontWeight="bold" color={textColor} fontSize="lg">
            Chats
          </Text>
        </HStack>

        <HStack spacing={2}>
          {selectedConversation._id && (
            <>
              <Avatar 
                size="sm" 
                src={selectedConversation.userProfilePic} 
                name={selectedConversation.username}
              />
              <Text fontWeight="bold" color={textColor} fontSize="md">
                {selectedConversation.username}
              </Text>
            </>
          )}
          <IconButton
            icon={<CloseIcon />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </HStack>
      </Flex>

      {/* Content - Two Panel Layout */}
      <Flex height="calc(100% - 60px)">
        {/* Left Panel - Conversations List (Even Narrower) */}
        <Box
          w="240px"
          bg={leftPanelBg}
          borderRight="1px solid"
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
        >
          {/* Search */}
          <Box p={3} position="relative">
            <InputGroup size="sm">
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search people..."
                value={searchText}
                onChange={handleInputChange}
                bg={useColorModeValue("gray.100", "gray.700")}
                border="none"
                borderRadius="full"
                _focus={{ bg: useColorModeValue("white", "gray.600"), border: "1px solid", borderColor: "blue.500" }}
              />
            </InputGroup>

            {/* Search Results */}
            {showSearchResults && (
              <Box
                position="absolute"
                top="100%"
                left={3}
                right={3}
                bg={bgColor}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                zIndex={10}
                maxHeight="200px"
                overflowY="auto"
                mt={1}
                boxShadow="lg"
              >
                {searchingUser ? (
                  <Flex align="center" justify="center" p={4}>
                    <Skeleton height="20px" width="100px" />
                  </Flex>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <Flex
                      key={user._id}
                      align="center"
                      p={3}
                      _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                      cursor="pointer"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar size="sm" src={user.profilePicture || user.profilePic} name={user.name} mr={3} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {user.name}
                        </Text>
                        <Text fontSize="xs" color={mutedText}>
                          @{user.username}
                        </Text>
                      </VStack>
                    </Flex>
                  ))
                ) : (
                  <Flex align="center" justify="center" p={4}>
                    <Text color={mutedText} fontSize="sm">
                      No users found
                    </Text>
                  </Flex>
                )}
              </Box>
            )}
          </Box>

          {/* Conversations List */}
          <Box flex="1" overflowY="auto">
            {loadingConversations ? (
              [...Array(3)].map((_, i) => (
                <Flex key={i} gap={3} alignItems="center" p={3}>
                  <SkeletonCircle size="10" />
                  <VStack align="start" flex="1" spacing={1}>
                    <Skeleton h="10px" w="80px" />
                    <Skeleton h="8px" w="60%" />
                  </VStack>
                </Flex>
              ))
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                // Extract participant details for display
                const otherParticipant = Array.isArray(conversation.participantDetails) 
                  ? conversation.participantDetails.find(p => p._id !== currentUser?.id) || conversation.participantDetails[0]
                  : null;

                // Create display conversation object
                const displayConversation = {
                  ...conversation,
                  username: otherParticipant?.username || otherParticipant?.name || 'Unknown User',
                  userProfilePic: otherParticipant?.profilePic || otherParticipant?.profilePicture,
                  userId: otherParticipant?._id
                };

                return (
                  <Box
                    key={conversation._id}
                    onClick={() => {
                      if (otherParticipant) {
                        setSelectedConversation({
                          _id: conversation._id,
                          userId: otherParticipant._id,
                          username: otherParticipant.username || otherParticipant.name,
                          userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                        });
                      }
                    }}
                  >
                    <Conversation
                      conversation={displayConversation}
                      isOnline={onlineUsers.includes(otherParticipant?.clerkId) || onlineUsers.includes(otherParticipant?._id)}
                      isSelected={selectedConversation?._id === conversation._id}
                    />
                  </Box>
                );
              })
            ) : (
              <Flex align="center" justify="center" height="200px">
                <Text color={mutedText} fontSize="sm">No conversations yet</Text>
              </Flex>
            )}
          </Box>
        </Box>

        {/* Right Panel - Chat View (Wider) */}
        <Box 
          flex="1" 
          bg={rightPanelBg} 
          display="flex" 
          flexDirection="column"
          position="relative"
          css={{
            '@supports (height: 100svh)': {
              height: '100dvh',
            },
            '@supports not (height: 100svh)': {
              height: '100vh',
            },
          }}
        >
          {selectedConversation?.userId ? (
            <>
              {/* Messages Area */}
              <Box 
                flex="1" 
                overflowY="auto" 
                p={4}
                css={{
                  '--safezone-top': 'env(safe-area-inset-top, 0px)',
                  '--safezone-bottom': 'env(safe-area-inset-bottom, 0px)',
                  '--safezone-left': 'env(safe-area-inset-left, 0px)',
                  '--safezone-right': 'env(safe-area-inset-right, 0px)',
                  '@supports (height: 100svh)': {
                    maxHeight: 'calc(100dvh - 120px - var(--safezone-bottom))',
                  },
                  '@supports not (height: 100svh)': {
                    maxHeight: 'calc(100vh - 120px - var(--safezone-bottom))',
                  },
                }}
              >
                {loadingConversations ? (
                  // Loading skeleton
                  [...Array(3)].map((_, i) => (
                    <Flex
                      key={i}
                      gap={2}
                      alignItems="center"
                      p={2}
                      borderRadius="md"
                      alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
                      maxW="70%"
                      mb={3}
                    >
                      {i % 2 === 0 && <SkeletonCircle size={8} />}
                      <VStack align="start" flex="1" spacing={1}>
                        <Skeleton h="16px" w="200px" />
                        <Skeleton h="12px" w="150px" />
                      </VStack>
                      {i % 2 !== 0 && <SkeletonCircle size={8} />}
                    </Flex>
                  ))
                ) : messages.length > 0 ? (
                  <VStack spacing={2} align="stretch" w="100%">
                    {messages.map((message, index) => {
                      // Handle both Clerk ID and MongoDB ObjectId for legacy messages
                      const currentUserClerkId = currentUser?.id;
                      const currentUserMongoId = currentUserData?._id || '6826c5f75ada7d1e6d24698c'; // Fallback to known MongoDB ID
                      
                      // Check ownership - try Clerk ID first, then MongoDB ID if available
                      let isOwnMessage = false;
                      if (currentUserClerkId && message.sender === currentUserClerkId) {
                        isOwnMessage = true;
                      } else if (currentUserMongoId && String(message.sender) === String(currentUserMongoId)) {
                        isOwnMessage = true;
                      }
                      
                      // Debug logging for first few messages only
                      if (index < 2) {
                        console.log(`ChatPopup Message ${index}:`, {
                          sender: message.sender,
                          currentUserClerkId,
                          currentUserMongoId,
                          isOwnMessage,
                          text: message.text?.substring(0, 20) + '...'
                        });
                      }
                      
                      const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender !== message.sender);
                      const showTimestamp = index === messages.length - 1 || 
                        messages[index + 1]?.sender !== message.sender ||
                        (new Date(messages[index + 1]?.createdAt) - new Date(message.createdAt)) > 300000; // 5 minutes
                      
                      return (
                        <Flex 
                          key={message._id} 
                          justify={isOwnMessage ? "flex-end" : "flex-start"} 
                          mb={3}
                          w="100%"
                        >
                          <Flex 
                            direction={isOwnMessage ? "row-reverse" : "row"} 
                            align="flex-end" 
                            gap={2}
                            maxW="75%"
                          >
                            {/* Avatar for received messages only */}
                            {!isOwnMessage && (
                              <Box minW="32px" display="flex" justifyContent="center" alignSelf="flex-end">
                                {showAvatar && (
                                  <Avatar 
                                    size="sm" 
                                    src={selectedConversation.userProfilePic} 
                                    name={selectedConversation.username} 
                                  />
                                )}
                              </Box>
                            )}
                            
                            {/* Message Content */}
                            <Box>
                              {/* Username for received messages */}
                              {!isOwnMessage && showAvatar && (
                                <Text fontSize="xs" color={mutedText} mb={1} ml={1}>
                                  {selectedConversation.username}
                                </Text>
                              )}
                              
                              {/* Message Bubble */}
                              <Box 
                                bg={isOwnMessage 
                                  ? useColorModeValue("blue.500", "blue.400")
                                  : useColorModeValue("gray.100", "gray.600")
                                }
                                color={isOwnMessage 
                                  ? "white" 
                                  : useColorModeValue("gray.800", "white")
                                }
                                px={4}
                                py={3}
                                borderRadius="2xl"
                                borderBottomLeftRadius={!isOwnMessage && showAvatar ? "sm" : "2xl"}
                                borderBottomRightRadius={isOwnMessage && showAvatar ? "sm" : "2xl"}
                                shadow="sm"
                                position="relative"
                                minW="60px"
                              >
                                <Text fontSize="sm" lineHeight="1.4" wordBreak="break-word">
                                  {message.text}
                                </Text>
                              </Box>
                              
                              {/* Timestamp */}
                              {showTimestamp && (
                                <Text 
                                  fontSize="xs" 
                                  color={mutedText} 
                                  mt={1}
                                  textAlign={isOwnMessage ? "right" : "left"}
                                  mx={1}
                                >
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Text>
                              )}
                            </Box>
                          </Flex>
                        </Flex>
                      );
                    })}
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </VStack>
                ) : (
                  <Flex align="center" justify="center" height="100%">
                    <Text color={mutedText}>Start a conversation!</Text>
                  </Flex>
                )}
              </Box>

              {/* Input Area */}
              <Box
                p={4}
                pt={3}
                borderTop="1px solid"
                borderColor={borderColor}
                bg={bgColor}
                position="sticky"
                bottom="0"
                left="0"
                right="0"
                zIndex="docked"
                css={{
                  '--safezone-bottom': 'env(safe-area-inset-bottom, 0px)',
                  paddingBottom: 'calc(0.75rem + var(--safezone-bottom))',
                }}
              >
                <Flex align="center" gap={3}>
                  <Input
                    placeholder="Type a message..."
                    flex="1"
                    borderRadius="3xl"
                    bg={useColorModeValue("gray.50", "gray.700")}
                    border="1px solid"
                    borderColor={useColorModeValue("gray.200", "gray.600")}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        handleSendMessage(messageText);
                        setMessageText('');
                      }
                    }}
                    _focus={{ 
                      bg: useColorModeValue("white", "gray.600"), 
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)"
                    }}
                    py={3}
                    px={4}
                    fontSize="md"
                    inputMode="text"
                    enterKeyHint="send"
                  />
                  <IconButton
                    icon={<FiSend />}
                    size="md"
                    borderRadius="full"
                    colorScheme="blue"
                    variant={messageText.trim() ? "solid" : "ghost"}
                    onClick={() => {
                      if (messageText.trim()) {
                        handleSendMessage(messageText);
                        setMessageText('');
                      }
                    }}
                    isDisabled={!messageText.trim()}
                    _hover={{
                      transform: "scale(1.05)",
                    }}
                    transition="all 0.2s"
                  />
                </Flex>
              </Box>
            </>
          ) : (
            <Flex align="center" justify="center" height="100%">
              <Text color={mutedText}>Select a conversation to start messaging</Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default ChatPopup; 