import { SearchIcon } from "@chakra-ui/icons";
import { 
  Box, 
  Button, 
  Flex, 
  Input, 
  Skeleton, 
  SkeletonCircle, 
  Text, 
  useColorModeValue,
  Avatar,
  VStack,
  HStack,
  Divider,
  Icon,
  useBreakpointValue
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useUser } from "@clerk/clerk-react";
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import { useSocket } from "../context/SocketContext";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";

const ChatPage = () => {
    // ✅ ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC BEFORE THIS POINT
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingNetwork, setLoadingNetwork] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const { user: currentUser, isSignedIn, isLoaded } = useUser();
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();
    const navigate = useNavigate();
    const setConversationsState = useSetRecoilState(conversationsAtom);
    const [networkUsers, setNetworkUsers] = useState([]);
    
    // Use ref for timeout ID
    const searchTimeout = useRef(null);
    
    // Mobile detection
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Debug selectedConversation changes
    useEffect(() => {
        console.log('=== selectedConversation changed ===');
        console.log('New selectedConversation:', selectedConversation);
        console.log('Has _id?', !!selectedConversation?._id);
        console.log('Should show MessageContainer?', !!selectedConversation?._id);
    }, [selectedConversation]);

    // ✅ ALL EFFECTS CALLED CONSISTENTLY
    // Handle redirection - but don't return early, let component render with loading state
    useEffect(() => {
        if (isLoaded && (!isSignedIn || !currentUser?.id)) {
            console.log('ChatPage: currentUser not found, redirecting to login.');
            navigate('/login');
        }
    }, [currentUser, isSignedIn, isLoaded, navigate]);

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
    }, [socket, setConversations]);

    useEffect(() => {
        const getConversations = async () => {
            if (!isLoaded || !isSignedIn || !currentUser?.id) {
                console.log('Skipping conversations fetch: No current user.');
                setLoadingConversations(false);
                return;
            }

            setLoadingConversations(true);
            try {
                console.log("Fetching conversations with axiosInstance...");
                const response = await axiosInstance.get("/messages/conversations");
                const data = response.data;

                console.log("Conversations data:", data);
                setConversations(data);

                if (!isMobile && data.length > 0 && !selectedConversation?._id) {
                    // Auto-select first conversation only on desktop/tablet
                    const firstConversation = data[0];
                    if (firstConversation.participantDetails && firstConversation.participantDetails.length > 0) {
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
                if (error.response && error.response.status === 401) {
                    console.log('ChatPage: Axios error in getConversations (401). Navigating to login.');
                    navigate('/login');
                } else {
                    showToast("Error", error.response?.data?.message || "Failed to load conversations", "error");
                }
            } finally {
                setLoadingConversations(false);
            }
        };

        getConversations();
    }, [currentUser, isSignedIn, isLoaded, showToast, setConversations, setSelectedConversation, navigate, isMobile]);

    // ✅ ALL CALLBACKS AND HANDLERS DEFINED CONSISTENTLY
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
            console.log("Searching for:", value);
            
            try {
                const { data } = await axiosInstance.get(`/users/search/connected?q=${encodeURIComponent(value.trim())}`);
                console.log("Search results:", data);
                
                const currentUserId = currentUser?.id; // Use Clerk user ID
                const filteredResults = Array.isArray(data) 
                    ? data.filter(user => user._id && user._id !== currentUserId && user.clerkId !== currentUserId)
                    : [];
                    
                setSearchResults(filteredResults);
                setShowSearchResults(true);
            } catch (error) {
                if (error.response) {
                    console.error('Search error response:', error.response.data);
                    
                    if (error.response.status === 401) {
                        showToast('Session expired', 'Please log in again.', 'error');
                        return;
                    }
                    
                    throw new Error(error.response.data.message || `Error: ${error.response.status}`);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    throw new Error('No response from server. Please check your connection.');
                } else {
                    console.error('Error setting up request:', error.message);
                    throw error;
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            
            if (error.message.includes('404')) {
                setSearchResults([]);
                setShowSearchResults(true);
                return;
            }
            
            showToast(
                'Error',
                error.message || 'Error searching for users. Please try again.',
                'error'
            );
            
            setSearchResults([]);
            setShowSearchResults(false);
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

    const handleUserSelect = useCallback(async (user) => {
        try {
            console.log('USER CLICKED:', user.name, user.username);
            
            if (!user || !user._id) {
                showToast("Error", "Invalid user selected", "error");
                return;
            }

            if (!currentUser || !currentUser.id) {
                showToast("Error", "You must be logged in to start a conversation", "error");
                return;
            }

            // Prevent messaging yourself
            if (user._id === currentUser.id || user.clerkId === currentUser.id) {
                showToast("Error", "You cannot message yourself", "error");
                return;
            }

            // Clear search immediately
            setSearchText('');
            setShowSearchResults(false);
            setSearchResults([]);

            // Check if conversation already exists
            const existingConversation = conversations.find(conv => {
                if (Array.isArray(conv.participantDetails)) {
                    return conv.participantDetails.some(p => p._id === user._id);
                }
                if (Array.isArray(conv.participants)) {
                    // Fallback for older conversation format
                    return conv.participants.some(pId => pId === user._id);
                }
                return false;
            });

            if (existingConversation) {
                // If conversation exists, select it
                const otherParticipant = existingConversation.participantDetails.find(p => p._id === user._id);
                setSelectedConversation({
                    _id: existingConversation._id,
                    userId: otherParticipant._id,
                    username: otherParticipant.username,
                    userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                });
                return;
            }

            // If no conversation, create a temporary one that will show the chat interface immediately
            setSelectedConversation({
                _id: `temp_${user._id}_${Date.now()}`, // Temporary ID for new conversations
                userId: user._id,
                username: user.username,
                userProfilePic: user.profilePic || user.profilePicture,
                isNewConversation: true, // Flag to indicate this is a new conversation
            });

        } catch (error) {
            console.error("Error handling user selection:", error);
            showToast("Error", "Could not start conversation. Please try again.", "error");
        }
    }, [currentUser, conversations, showToast, setSelectedConversation, setConversations]);
    
    const handleConversationSelect = (conversation) => {
        const { participantDetails } = conversation;
        const otherParticipant = participantDetails[0];
        setSelectedConversation({
            _id: conversation._id,
            userId: otherParticipant._id,
            username: otherParticipant.username,
            userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
        });
    };

    // ✅ CONDITIONAL RENDERING ONLY AFTER ALL HOOKS
    // If user is not authenticated, show loading state while redirect happens
    if (!isLoaded) {
        return (
            <Flex h="100vh" align="center" justify="center" bg={useColorModeValue('white', 'gray.900')}>
                <Box textAlign="center" p={6} borderRadius="lg" bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Text>Loading messages...</Text>
                </Box>
            </Flex>
        );
    }

    if (!isSignedIn || !currentUser?.id) {
        return (
            <Flex h="100vh" align="center" justify="center" bg={useColorModeValue('white', 'gray.900')}>
                <Box textAlign="center" p={6} borderRadius="lg" bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Text>Redirecting to login...</Text>
                </Box>
            </Flex>
        );
    }

    return (
        <Box
            position="relative"
            w="100%"
            h={{ base: "100dvh", md: "100vh" }}
            bg={useColorModeValue("white", "gray.800")}
            overflow="hidden"
            className="chat-page-container"
        >
            <Flex
                h="100%"
                maxW={{ base: "100%", md: "1200px" }}
                mx="auto"
                w="100%"
                bg={useColorModeValue("white", "gray.800")}
                boxShadow={{ base: "none", md: "lg" }}
                borderRadius={{ base: 0, md: "lg" }}
                overflow="hidden"
                position="relative"
            >
                {/* Conversations Sidebar */}
                <Box
                    w={{ base: "100%", md: "350px" }}
                    h="100%"
                    borderRight={{ base: "none", md: "1px solid" }}
                    borderColor={useColorModeValue("gray.200", "gray.700")}
                    display={{
                        base: (selectedConversation._id || selectedConversation.userId) ? "none" : "block",
                        md: "block"
                    }}
                    overflowY="auto"
                    bg={useColorModeValue("white", "gray.800")}
                    flexShrink={0}
                >
                    {/* Enhanced Mobile Header */}
                    <Box 
                        p={4}
                        borderBottom="1px solid" 
                        borderColor={useColorModeValue("gray.200", "gray.700")}
                        position="sticky"
                        top={0}
                        zIndex={10}
                        bg={useColorModeValue("white", "gray.800")}
                    >
                        <Text fontSize="xl" fontWeight="bold" mb={3} color={useColorModeValue("gray.800", "white")}>
                            Messages
                        </Text>
                        <form onSubmit={(e) => { e.preventDefault(); handleSearchChange({ target: { value: searchText } }); }}>
                            <Flex gap={2}>
                                <Input
                                    placeholder='Search for a user'
                                    onChange={handleInputChange}
                                    value={searchText}
                                    size="md"
                                    borderRadius="20px"
                                    flex={1}
                                    bg={useColorModeValue("gray.100", "gray.700")}
                                    border="none"
                                    _focus={{
                                        bg: useColorModeValue("white", "gray.600"),
                                        boxShadow: "0 0 0 2px var(--chakra-colors-blue-500)"
                                    }}
                                />
                                <Button 
                                    size='md' 
                                    onClick={() => handleSearchChange({ target: { value: searchText } })}
                                    colorScheme="blue"
                                    px={4}
                                    borderRadius="20px"
                                    minH="44px"
                                >
                                    <SearchIcon />
                                </Button>
                            </Flex>
                        </form>
                    </Box>
                    
                    <Box 
                        overflowY="auto" 
                        h="calc(100% - 140px)"
                        css={{
                            '&::-webkit-scrollbar': {
                                width: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.2)'),
                                borderRadius: '4px',
                            },
                        }}
                    >
                        {/* Search Results */}
                        {showSearchResults && (
                            <Box>
                                <Text px={4} py={2} fontSize="sm" fontWeight="semibold" color="gray.500">
                                    Search Results
                                </Text>
                                {searchingUser ? (
                                    <VStack spacing={3} p={4}>
                                        {Array(3).fill(0).map((_, i) => (
                                            <HStack key={i} w="100%" spacing={3}>
                                                <SkeletonCircle size="48px" />
                                                <Box flex={1}>
                                                    <Skeleton h="16px" w="70%" mb={2} />
                                                    <Skeleton h="14px" w="90%" />
                                                </Box>
                                            </HStack>
                                        ))}
                                    </VStack>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <HStack
                                            key={user._id}
                                            p={4}
                                            spacing={3}
                                            cursor="pointer"
                                            _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                                            onClick={() => handleUserSelect(user)}
                                            transition="all 0.2s"
                                            minH="72px"
                                        >
                                            <Avatar
                                                src={user.profilePic || user.profilePicture}
                                                name={user.name || user.username}
                                                size="md"
                                            />
                                            <Box flex={1} minW={0}>
                                                <Text 
                                                    fontWeight="600" 
                                                    fontSize="md"
                                                    noOfLines={1}
                                                    color={useColorModeValue("gray.800", "white")}
                                                >
                                                    {user.name || user.username}
                                                </Text>
                                                <Text 
                                                    fontSize="sm" 
                                                    color={useColorModeValue("gray.600", "gray.400")}
                                                    noOfLines={1}
                                                >
                                                    @{user.username}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    ))
                                ) : (
                                    <Flex h="100px" align="center" justify="center" textAlign="center" px={4}>
                                        <Text color="gray.500">No users found</Text>
                                    </Flex>
                                )}
                                <Divider my={2} />
                            </Box>
                        )}

                        {/* Conversations List */}
                        {!showSearchResults && (
                            <>
                                {loadingConversations ? (
                                    <VStack spacing={4} p={4}>
                                        {Array(5).fill(0).map((_, i) => (
                                            <HStack key={i} w="100%" spacing={3}>
                                                <SkeletonCircle size="48px" />
                                                <Box flex={1}>
                                                    <Skeleton h="16px" w="70%" mb={2} />
                                                    <Skeleton h="14px" w="90%" />
                                                </Box>
                                            </HStack>
                                        ))}
                                    </VStack>
                                ) : conversations.length > 0 ? (
                                    conversations.map((conversation) => {
                                        const otherParticipant = conversation.participantDetails?.find(p => p._id !== currentUser.id) || 
                                                                 conversation.participants?.find(p => p._id !== currentUser.id);
                                        return (
                                            <HStack
                                                key={conversation._id}
                                                p={4}
                                                spacing={3}
                                                cursor="pointer"
                                                _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                                                bg={selectedConversation?._id === conversation._id ? 
                                                    useColorModeValue("blue.50", "blue.900") : "transparent"}
                                                borderLeft={selectedConversation?._id === conversation._id ? 
                                                    "4px solid" : "4px solid transparent"}
                                                borderColor="blue.500"
                                                onClick={() => handleConversationSelect(conversation)}
                                                transition="all 0.2s"
                                                minH="72px"
                                            >
                                                <Box position="relative">
                                                    <Avatar
                                                        src={otherParticipant?.profilePic || otherParticipant?.profilePicture}
                                                        name={otherParticipant?.username || otherParticipant?.name}
                                                        size="md"
                                                    />
                                                    {onlineUsers.includes(otherParticipant?._id) && (
                                                        <Box
                                                            position="absolute"
                                                            bottom="0"
                                                            right="0"
                                                            w="14px"
                                                            h="14px"
                                                            bg="green.400"
                                                            borderRadius="50%"
                                                            border="2px solid white"
                                                        />
                                                    )}
                                                </Box>
                                                <Box flex={1} minW={0}>
                                                    <Text 
                                                        fontWeight="600" 
                                                        fontSize="md"
                                                        noOfLines={1}
                                                        color={useColorModeValue("gray.800", "white")}
                                                    >
                                                        {otherParticipant?.username || otherParticipant?.name || 'Unknown User'}
                                                    </Text>
                                                    <Text 
                                                        fontSize="sm" 
                                                        color={useColorModeValue("gray.600", "gray.400")}
                                                        noOfLines={1}
                                                    >
                                                        {conversation.lastMessage?.text || "Start a conversation"}
                                                    </Text>
                                                </Box>
                                            </HStack>
                                        );
                                    })
                                ) : (
                                    <Flex h="200px" align="center" justify="center" textAlign="center" px={4}>
                                        <Text color="gray.500">No conversations yet. Start a new chat!</Text>
                                    </Flex>
                                )}
                            </>
                        )}
                    </Box>
                </Box>

                {/* Chat Area */}
                <Box 
                    flex={1} 
                    h="100%"
                    display={{
                        base: (selectedConversation._id || selectedConversation.userId) ? "flex" : "none",
                        md: "flex"
                    }}
                    flexDirection="column"
                    position="relative"
                    w="100%"
                    bg={useColorModeValue("white", "gray.800")}
                    overflow="hidden"
                >
                    {(selectedConversation._id || selectedConversation.userId) ? (
                        <MessageContainer onlineUsers={onlineUsers} />
                    ) : (
                        <Flex 
                            h="100%" 
                            align="center" 
                            justify="center" 
                            textAlign="center"
                            p={4}
                            display={{ base: "none", md: "flex" }}
                        >
                            <Box>
                                <Text fontSize="xl" fontWeight="medium" mb={2}>
                                    Select a conversation
                                </Text>
                                <Text color="gray.500" fontSize="sm">
                                    Choose an existing chat or start a new one
                                </Text>
                            </Box>
                        </Flex>
                    )}
                </Box>
            </Flex>
        </Box>
    );
};

export default ChatPage;