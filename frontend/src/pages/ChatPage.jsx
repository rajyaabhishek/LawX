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
  Divider
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import { useSocket } from "../context/SocketContext";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";

const ChatPage = () => {
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingNetwork, setLoadingNetwork] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();
    const navigate = useNavigate();
    const setConversationsState = useSetRecoilState(conversationsAtom);
    const [networkUsers, setNetworkUsers] = useState([]);
    // userAuthenticated and authCheckComplete states are removed.

    // New useEffect for redirection based on currentUser
    useEffect(() => {
        // currentUser is from useRecoilValue(userAtom)
        // App.jsx should prevent rendering ChatPage if not authenticated.
        // This is a safeguard or handles cases where userAtom is cleared during the session.
        if (!currentUser?._id) {
            console.log('ChatPage: currentUser not found, redirecting to login.');
            navigate('/login');
        }
    }, [currentUser, navigate]);

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
            if (!currentUser?._id) {
                console.log('Skipping conversations fetch: No current user.');
                setLoadingConversations(false); // Ensure loading is stopped
                return;
            }

            setLoadingConversations(true);
            try {
                console.log("Fetching conversations with axiosInstance...");
                const response = await axiosInstance.get("/messages/conversations");
                const data = response.data;

                console.log("Conversations data:", data);
                setConversations(data);

                if (data.length > 0 && !selectedConversation?._id) {
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
                    navigate('/login'); // App.jsx should handle localStorage clearing via its auth logic
                } else {
                    showToast("Error", error.response?.data?.message || "Failed to load conversations", "error");
                }
            } finally {
                setLoadingConversations(false);
            }
        };

        getConversations();
    }, [currentUser, showToast, setConversations, setSelectedConversation, navigate]); // Removed selectedConversation from deps

    // Handle search input change with debounce
    const handleSearchChange = async (e) => {
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
                const { data } = await axiosInstance.get(`/users/search?q=${encodeURIComponent(value.trim())}`);
                console.log("Search results:", data);
                
                // Filter out current user from results
                const currentUserId = currentUser?._id;
                const filteredResults = Array.isArray(data) 
                    ? data.filter(user => user._id && user._id !== currentUserId)
                    : [];
                    
                setSearchResults(filteredResults);
                setShowSearchResults(true);
            } catch (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Search error response:', error.response.data);
                    
                    if (error.response.status === 401) {
                        // Handle unauthorized (token expired or invalid)
                        showToast('Session expired. Please log in again.', 'error');
                        // You might want to redirect to login here
                        return;
                    }
                    
                    throw new Error(error.response.data.message || `Error: ${error.response.status}`);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('No response received:', error.request);
                    throw new Error('No response from server. Please check your connection.');
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error setting up request:', error.message);
                    throw error;
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            
            // Don't show error toast for empty search results
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
    };
    
    // Use ref for timeout ID
    const searchTimeout = useRef(null);
    
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        
        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        
        // Set new timeout
        if (value.trim()) {
            searchTimeout.current = setTimeout(() => {
                handleSearchChange({ target: { value } });
            }, 300);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    // Handle user selection from search results
    const handleUserSelect = async (user) => {
        try {
            console.log('Starting handleUserSelect with user:', user);
            
            // Validate user object
            if (!user || typeof user !== 'object' || !user._id) {
                console.error('Invalid user object:', user);
                showToast("Error", "Invalid user selected", "error");
                return;
            }

            // Ensure currentUser is available - this is a critical check
            if (!currentUser || !currentUser._id) {
                console.error('Current user not available', currentUser);
                showToast("Error", "You must be logged in to start a conversation", "error");
                
                // Clear any selection and abort early to prevent further processing
                setSelectedConversation(null);
                setSearchText('');
                setShowSearchResults(false);
                setSearchResults([]);
                return;
            }

            // Prevent messaging yourself
            if (user._id === currentUser._id) {
                showToast("Error", "You cannot message yourself", "error");
                return;
            }

            // Log user information to help with debugging
            console.log('Selected user details:', {
                userId: user._id,
                username: user.username,
                profilePic: user.profilePic || user.profilePicture
            });
            console.log('Current user details:', {
                userId: currentUser._id,
                username: currentUser.username,
                profilePic: currentUser.profilePic || currentUser.profilePicture
            });

            // Check if conversation already exists with this user
            const existingConversation = conversations.find(conv => {
                const participantsMatch = Array.isArray(conv.participants) && 
                    conv.participants.some(p => 
                        p && typeof p === 'object' && p._id && 
                        p._id.toString() === user._id.toString()
                    );
                    
                const participantDetailsMatch = Array.isArray(conv.participantDetails) && 
                    conv.participantDetails.some(p => 
                        p && typeof p === 'object' && p._id && 
                        p._id.toString() === user._id.toString()
                    );
                    
                return participantsMatch || participantDetailsMatch;
            });

            console.log('Existing conversation found:', !!existingConversation);

            if (existingConversation) {
                // Find the other participant
                let otherParticipant = null;
                
                // First try to find in participantDetails
                if (Array.isArray(existingConversation.participantDetails)) {
                    otherParticipant = existingConversation.participantDetails.find(p => 
                        p && p._id && p._id.toString() !== currentUser._id.toString()
                    );
                }
                
                // If not found, try participants
                if (!otherParticipant && Array.isArray(existingConversation.participants)) {
                    otherParticipant = existingConversation.participants.find(p => 
                        p && p._id && p._id.toString() !== currentUser._id.toString()
                    );
                }
                
                // If still not found, use the user object directly
                if (!otherParticipant) {
                    console.log('Creating otherParticipant from user object');
                    otherParticipant = {
                        _id: user._id,
                        username: user.username,
                        name: user.name || user.username,
                        profilePic: user.profilePic || user.profilePicture
                    };
                }
                
                // Select existing conversation
                const newSelectedConversation = {
                    _id: existingConversation._id,
                    userId: otherParticipant._id,
                    userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                    username: otherParticipant.username,
                    name: otherParticipant.name || otherParticipant.username,
                    mock: !!existingConversation.mock
                };
                
                console.log('Selecting existing conversation:', newSelectedConversation);
                setSelectedConversation(newSelectedConversation);
            } else {
                // Create new mock conversation
                const conversationId = `mock-${Date.now()}`;
                
                // Ensure we have complete user details
                const userDetails = {
                    _id: user._id,
                    username: user.username,
                    name: user.name || user.username,
                    profilePic: user.profilePic || user.profilePicture
                };
                
                // Ensure we have complete current user details
                const currentUserDetails = {
                    _id: currentUser._id,
                    username: currentUser.username,
                    name: currentUser.name || currentUser.username,
                    profilePic: currentUser.profilePic || currentUser.profilePicture
                };
                
                const newConversation = {
                    _id: conversationId,
                    participants: [userDetails, currentUserDetails],
                    participantDetails: [userDetails],
                    lastMessage: {
                        text: "",
                        sender: null,
                        seen: true,
                        createdAt: new Date()
                    },
                    mock: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Create the selected conversation object
                const newSelectedConversation = {
                    _id: conversationId,
                    userId: user._id,
                    userProfilePic: user.profilePic || user.profilePicture,
                    username: user.username,
                    name: user.name || user.username,
                    mock: true
                };

                console.log('Creating new conversation:', {
                    newConversation,
                    newSelectedConversation
                });

                // Add to conversations list and select it
                setConversations(prev => [newConversation, ...prev]);
                setSelectedConversation(newSelectedConversation);
            }
            
            // Reset search
            setSearchText('');
            setShowSearchResults(false);
            setSearchResults([]);
            
        } catch (error) {
            console.error('Error in handleUserSelect:', error);
            showToast("Error", "Failed to start conversation", "error");
        }
    };

    // New loading state based on currentUser
    if (!currentUser?._id) {
        // This state should ideally be brief as the useEffect above would navigate away,
        // or App.jsx wouldn't have routed here.
        return (
            <Flex justify="center" align="center" h="calc(100vh - 100px)" p={4}>
                <Text fontSize="xl">Loading user data...</Text>
            </Flex>
        );
    }
    
    return (
        <Flex gap='4' flexDirection={{ base: "column", md: "row" }} p={4} h="calc(100vh - 100px)">
            {/* Left sidebar - Conversations */}
            <Box 
                flex={{ base: 1, md: 1 }} 
                maxW={{ base: "100%", md: "400px" }} 
                bg={useColorModeValue("white", "gray.800")} 
                p={4} 
                borderRadius='md'
                borderWidth="1px"
                overflowY="auto"
            >
                <Flex flexDirection='column' gap={4}>
                    <Text fontSize='2xl' fontWeight='bold' color={useColorModeValue("gray.800", "white")}>
                        Messages
                    </Text>
                    
                    {/* Search Bar */}
                    <Box position="relative" mb={4}>
                        <Flex gap={2}>
                    <Input
                        placeholder='Search for a user...'
                        value={searchText}
                        onChange={handleInputChange}
                        onFocus={() => currentUser?._id && searchText.trim() && setShowSearchResults(true)}
                        bg={useColorModeValue("gray.100", "gray.700")}
                        border="none"
                        isDisabled={!currentUser?._id}
                        _focus={{
                            bg: useColorModeValue("white", "gray.600"),
                            boxShadow: "sm"
                        }}
                        pr="12"
                    />
                    <Button 
                        type="button"
                        colorScheme="blue"
                        px={6}
                        isLoading={searchingUser}
                        isDisabled={!currentUser?._id}
                        onClick={() => {
                            if (currentUser?._id && searchText.trim()) {
                                handleSearchChange({ target: { value: searchText } });
                            } else if (!currentUser?._id) {
                                showToast("Error", "You must be logged in to search for users", "error");
                            }
                        }}
                        aria-label="Search users"
                    >
                        <SearchIcon />
                    </Button>
                </Flex>
                        
                        {/* Search Results Dropdown */}
                        {showSearchResults && searchText.trim() && searchResults.length > 0 && currentUser?._id && (
                            <Box
                                position="absolute"
                                top="100%"
                                left={0}
                                right={0}
                                mt={1}
                                bg={useColorModeValue("white", "gray.800")}
                                border="1px"
                                borderColor={useColorModeValue("gray.200", "gray.600")}
                                borderRadius="md"
                                boxShadow="lg"
                                zIndex={10}
                                maxH="300px"
                                overflowY="auto"
                            >
                                {searchResults.length > 0 ? (
                                    <VStack align="stretch" spacing={0} divider={<Divider />}>
                                        {searchResults.map((user) => (
                                            <HStack 
                                                key={user._id}
                                                p={3}
                                                _hover={{
                                                    bg: useColorModeValue("gray.50", "gray.700"),
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => {
                                                    // Double-check authentication before handling user selection
                                                    if (currentUser && currentUser._id) {
                                                        handleUserSelect(user);
                                                    } else {
                                                        showToast("Error", "You must be logged in to start a conversation", "error");
                                                    }
                                                }}
                                            >
                                                <Avatar 
                                                    size="sm" 
                                                    src={user.profilePic || user.profilePicture} 
                                                    name={user.name || user.username}
                                                />
                                                <Box>
                                                    <Text fontWeight="medium">{user.name || user.username}</Text>
                                                    <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                                                        @{user.username}
                                                    </Text>
                                                </Box>
                                                {onlineUsers.includes(user._id) && (
                                                    <Box 
                                                        ml="auto" 
                                                        w="2" 
                                                        h="2" 
                                                        bg="green.500" 
                                                        borderRadius="full"
                                                    />
                                                )}
                                            </HStack>
                                        ))}
                                    </VStack>
                                ) : searchText.trim() ? (
                                    <Text p={3} color={useColorModeValue("gray.500", "gray.400")} textAlign="center">
                                        No users found
                                    </Text>
                                ) : null}
                            </Box>
                        )}
                    </Box>

                    {/* Conversations List */}
                    <Box overflowY="auto" flex={1}>
                        {loadingConversations ? (
                            // Loading skeletons
                            [...Array(5)].map((_, i) => (
                                <Flex key={i} gap={4} p={2} borderRadius='md' _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
                                    <SkeletonCircle size='12' />
                                    <Flex flexDirection="column" justify="center" flex={1}>
                                        <Skeleton height='16px' width='70%' mb={2} />
                                        <Skeleton height='12px' width='50%' />
                                    </Flex>
                                </Flex>
                            ))
                        ) : conversations.length === 0 ? (
                            // No conversations
                            <Flex justify="center" align="center" h="200px">
                                <Text color="gray.500" textAlign="center">
                                    No conversations yet. Search for a user to start chatting!
                                </Text>
                            </Flex>
                        ) : (
                            // Conversations list
                            conversations.map((conversation) => {
                                const otherParticipant = conversation.participants?.find(p => p._id !== currentUser._id);
                                if (!otherParticipant) return null;
                                
                                return (
                                    <Conversation
                                        key={conversation._id}
                                        conversation={{
                                            ...conversation,
                                            userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                                            username: otherParticipant.username,
                                            lastMessage: conversation.lastMessage,
                                            _id: conversation._id,
                                            userId: otherParticipant._id,
                                            mock: conversation.mock
                                        }}
                                        isOnline={onlineUsers.includes(otherParticipant._id)}
                                        isSelected={selectedConversation?._id === conversation._id}
                                        onClick={() => {
                                            setSelectedConversation({
                                                _id: conversation._id,
                                                userId: otherParticipant._id,
                                                username: otherParticipant.username,
                                                userProfilePic: otherParticipant.profilePic || otherParticipant.profilePicture,
                                                mock: conversation.mock
                                            });
                                        }}
                                    />
                                );
                            })
                        )}
                    </Box>
                </Flex>
            </Box>

            {/* Right side - Messages */}
            <Box 
                flex={2} 
                bg={useColorModeValue("white", "gray.800")} 
                borderRadius='md' 
                borderWidth="1px"
                display="flex"
                flexDirection="column"
                overflow="hidden"
            >
                {(!selectedConversation?._id && !selectedConversation?.userId) ? (
                    <Flex 
                        align='center' 
                        justify='center' 
                        h='100%' 
                        bg={useColorModeValue("gray.50", "gray.800")}
                    >
                        <Box textAlign="center" p={6}>
                            <Text fontSize='xl' fontWeight="medium" mb={2} color={useColorModeValue("gray.600", "gray.300")}>
                                Select a conversation
                            </Text>
                            <Text color={useColorModeValue("gray.500", "gray.400")} fontSize="sm">
                                Choose an existing chat or start a new conversation
                            </Text>
                        </Box>
                    </Flex>
                ) : (
                    <MessageContainer 
                        key={selectedConversation._id || selectedConversation.userId}
                        selectedConversation={selectedConversation}
                    />
                )}
            </Box>
        </Flex>
    );
};

export default ChatPage;