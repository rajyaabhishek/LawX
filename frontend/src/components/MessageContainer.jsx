import { Flex, Text, useColorModeValue, Avatar, Divider, Skeleton, SkeletonCircle, Box, Icon } from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useCallback, useEffect, useRef, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useUser } from "@clerk/clerk-react";
import { useSocket } from "../context/SocketContext";
import { axiosInstance } from "../lib/axios";
import { ArrowLeft } from "lucide-react";
import { BsCheck2All } from "react-icons/bs";
import { formatMessageTimestamp } from "../utils/dateUtils";
import useKeyboardHeight from "../hooks/useKeyboardHeight";

const MessageContainer = ({ onlineUsers = [] }) => {
  const showToast = useShowToast();
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentMongoUser, setCurrentMongoUser] = useState(null);
  const { socket } = useSocket();
  const [onlineUsersState, setOnlineUsersState] = useState(onlineUsers);
  const setConversations = useSetRecoilState(conversationsAtom);
  const { user: currentUser, isSignedIn } = useUser();
  const messageEndRef = useRef(null);
  const { keyboardHeight, isKeyboardOpen } = useKeyboardHeight();
  const messagesContainerRef = useRef(null);

  // Remove extra bottom gap on mobile by setting safe area inset to 0
  const safeAreaBottom = 0;

  // Optimistically add new message to UI before server response
  const handleOptimisticSend = (text) => {
    if (!currentUser || !selectedConversation?._id) return;

    const tempMessage = {
      _id: `temp_${Date.now()}`, // temporary ID
      conversationId: selectedConversation._id,
      sender: currentMongoUser?._id || currentUser.id,
      text,
      createdAt: new Date().toISOString(),
      seen: false,
      optimistic: true,
    };

    setMessages(prev => [...prev, tempMessage]);
  };
  const messageQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  // TEMPORARY: Let's test with a simple manual approach first
  useEffect(() => {
    if (currentUser?.id) {
      // Create a mock MongoDB user object for testing
      const mockMongoUser = {
        _id: `temp_${currentUser.id}`, // Temporary ID based on Clerk ID
        clerkId: currentUser.id,
        username: currentUser.username || 'testuser'
      };
      setCurrentMongoUser(mockMongoUser);
      console.log('🧪 TESTING: Set mock MongoDB user:', mockMongoUser);
    }
  }, [currentUser]);

  // Debug currentMongoUser state changes
  useEffect(() => {
    console.log('🔍 currentMongoUser state changed:', currentMongoUser);
  }, [currentMongoUser]);

  // Process message queue to handle messages in order
  const processMessageQueue = useCallback(() => {
    if (isProcessingQueue.current || messageQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    const messageToProcess = messageQueue.current.shift();
    
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const messageExists = prev.some(msg => msg._id === messageToProcess._id);
      if (messageExists) return prev;
      
      return [...prev, messageToProcess];
    });
    
    // Process next message in queue after a short delay
    setTimeout(() => {
      isProcessingQueue.current = false;
      if (messageQueue.current.length > 0) {
        processMessageQueue();
      }
    }, 50);
  }, []);
  
  // Add message to queue and process
  const queueMessage = useCallback((message) => {
    messageQueue.current.push(message);
    processMessageQueue();
  }, [processMessageQueue]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // If this is a new conversation, update the conversations list
      const updateConversations = (prev) => {
        // Check if conversation already exists
        const existingConv = prev.find(c => c._id === message.conversationId);
        
        if (!existingConv) {
          // This is a new conversation
          return [
            {
              _id: message.conversationId,
              participants: [message.sender, currentUser.id],
              lastMessage: {
                text: message.text || "Image",
                sender: message.sender,
                seen: message.sender === currentUser.id,
                createdAt: new Date()
              },
              participantDetails: [
                {
                  _id: message.sender._id || message.sender,
                  username: message.sender.username || selectedConversation?.username,
                  profilePic: message.sender.profilePic || selectedConversation?.userProfilePic
                }
              ]
            },
            ...prev
          ];
        }
        
        // Update existing conversation
        return prev.map(conv => 
          conv._id === message.conversationId 
            ? { 
                ...conv, 
                lastMessage: {
                  text: message.text || "Image",
                  sender: message.sender,
                  seen: message.sender === currentUser.id,
                  createdAt: new Date()
                }
              } 
            : conv
        );
      };
      
      setConversations(updateConversations);
      
      // If this message is for the current conversation, add it to the messages
      if (selectedConversation?._id === message.conversationId || 
          (selectedConversation?.userId === message.sender?._id || selectedConversation?.userId === message.sender)) {
        queueMessage(message);
      }

      // Play sound if window is not focused and it's not our own message
      if (!document.hasFocus() && message.sender !== currentUser.id) {
        const sound = new Audio('/notification.mp3');
        sound.play().catch(e => console.error('Error playing sound:', e));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation, currentUser.id, queueMessage, setConversations]);

  // Mark messages as seen when conversation is opened
  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (!selectedConversation || !socket || !messages.length) return;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === currentUser.id || lastMessage.seen) return;
      
      try {
        await axiosInstance.post(`/messages/${selectedConversation._id}/seen`);
        socket.emit("markMessagesAsSeen", {
          conversationId: selectedConversation._id,
          userId: currentUser.id,
        });
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    };

    markMessagesAsSeen();
  }, [selectedConversation, messages, socket, currentUser.id]);

  // Handle messages seen event
  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({ conversationId }) => {
      if (selectedConversation?._id === conversationId) {
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            seen: true
          }))
        );
      }
    };

    socket.on("messagesSeen", handleMessagesSeen);
    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket, selectedConversation]);

  // Load messages when conversation changes
  useEffect(() => {
    const getMessages = async () => {
      // Make sure both currentUser and selectedConversation are available
      if (!selectedConversation?.userId || !currentUser?.id || !isSignedIn) {
        console.log('Required data not available:', { 
          selectedConversation: !!selectedConversation, 
          userId: !!selectedConversation?.userId,
          currentUser: !!currentUser,
          currentUserId: !!currentUser?.id,
          isSignedIn
        });
        return;
      }
      
      setLoadingMessages(true);
      try {
        console.log('Fetching messages for user:', selectedConversation.userId);
        const { data } = await axiosInstance.get(`/messages/${selectedConversation.userId}`);
        console.log('Messages loaded successfully:', data);
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
        
        // If it's a 404, it might be a new conversation - initialize empty messages
        if (error.response?.status === 404) {
          setMessages([]);
          console.log('404 error - initializing empty messages for new conversation');
        } else {
          showToast("Error", error.response?.data?.message || error.message, "error");
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    getMessages();
  }, [selectedConversation, currentUser, showToast]);

  // Enhanced scroll to bottom when new messages arrive or keyboard state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };

    // Add delays to ensure proper scrolling after layout changes
    if (isKeyboardOpen) {
      // When keyboard opens, wait a bit longer for layout to settle
      setTimeout(scrollToBottom, 400);
    } else {
      // When keyboard closes or new messages arrive
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isKeyboardOpen, keyboardHeight]);

  // Calculate dynamic heights for mobile with proper viewport units
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const headerHeight = 60;
  const inputContainerHeight = 80;
  
  // Use consistent viewport units and safe area calculations
  const messagesContainerHeight = isMobile 
    ? `calc(100dvh - ${headerHeight}px - ${inputContainerHeight}px - ${keyboardHeight}px - env(safe-area-inset-bottom, 0px))`
    : `calc(100vh - 140px)`;

  return (
    <Flex
      flex='70'
      bg={useColorModeValue("white", "gray.800")}
      borderRadius={{ base: 0, md: "md" }}
      p={0}
      m={0}
      flexDirection="column"
      h="100%"
      maxW="100%"
      w="100%"
      position="relative"
      className="chat-container-mobile"
      overflow="hidden"
      style={{
        margin: 0,
        padding: 0,
        borderRadius: isMobile ? 0 : undefined,
        boxShadow: isMobile ? 'none' : undefined,
        border: isMobile ? 'none' : undefined
      }}
    >
      {/* Enhanced Mobile Chat Header */}
      <Flex 
        w="full" 
        h={`${headerHeight}px`}
        alignItems="center" 
        gap={3} 
        px={{ base: 3, md: 4 }}
        py={2}
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        bg={useColorModeValue("white", "gray.800")}
        position="sticky"
        top={0}
        zIndex={20}
        className="mobile-chat-header"
        boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
        flexShrink={0}
        borderRadius={0}
        m={0}
        style={{
          margin: 0,
          borderRadius: 0,
          width: '100%'
        }}
      >
        <Box
          as="button"
          display={{ base: "flex", md: "none" }}
          onClick={() => setSelectedConversation({ _id: "", userId: "" })}
          className="mobile-chat-back-button mobile-touch-feedback"
          alignItems="center"
          justifyContent="center"
          w="40px"
          h="40px"
          borderRadius="50%"
          bg="transparent"
          _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          transition="all 0.2s ease"
        >
          <Icon as={ArrowLeft} boxSize={5} color={useColorModeValue("gray.700", "gray.300")} />
        </Box>
        
        <Box position="relative">
          {selectedConversation.userProfilePic && (
            <Avatar 
              src={selectedConversation.userProfilePic} 
              size="sm"
              name={selectedConversation.username}
              className="conversation-avatar"
            />
          )}
          {onlineUsers.includes(selectedConversation.userId) && (
            <Box className="online-indicator" />
          )}
        </Box>
        
        <Box flex={1} minW={0}>
          <Text fontWeight='600' color={useColorModeValue("gray.800", "white")} noOfLines={1} fontSize="md">
            {selectedConversation.username}
          </Text>
          <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>
            {onlineUsers.includes(selectedConversation.userId) ? 'Online' : 'Offline'}
          </Text>
        </Box>
      </Flex>
      
      {/* Messages Container with Enhanced Mobile Layout */}
      <Box 
        ref={messagesContainerRef}
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        h={messagesContainerHeight}
        bg={useColorModeValue("gray.50", "gray.900")}
        className="chat-message-container mobile-scroll-container"
        position="relative"
        w="100%"
        m={0}
        p={0}
        style={{
          margin: 0,
          padding: 0,
          width: '100%',
          // Use the safer calc method for height
          height: isMobile 
            ? `calc(100dvh - ${headerHeight}px - ${inputContainerHeight}px - ${keyboardHeight}px)` 
            : `calc(100vh - 140px)`
        }}
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
        {loadingMessages ? (
          <Flex flexDir="column" gap={4} p={4}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Flex key={i} gap={3} justify={i % 2 === 0 ? "flex-start" : "flex-end"}>
                {i % 2 === 0 && <SkeletonCircle size="8" />}
                <Box
                  bg={useColorModeValue("gray.200", "gray.700")}
                  p={3}
                  borderRadius="18px"
                  maxW="250px"
                  className="mobile-skeleton"
                >
                  <Skeleton height="14px" />
                </Box>
                {i % 2 !== 0 && <SkeletonCircle size="8" />}
              </Flex>
            ))}
          </Flex>
        ) : (
          <Flex flexDir="column" gap={1} px={3} py={4} pb={6}>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender === currentMongoUser?._id || message.sender === currentUser?.id;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender !== message.sender);
              
              return (
                <Box key={message._id} className="chat-message" mb={2}>
                  <Flex justify={isOwnMessage ? "flex-end" : "flex-start"} w="100%">
                    <Flex
                      direction={isOwnMessage ? "row-reverse" : "row"}
                      align="flex-end"
                      gap={2}
                      maxW={{ base: "90%", md: "85%" }}
                    >
                      {/* Avatar for received messages */}
                      {!isOwnMessage && (
                        <Box minW="32px" h="32px" display="flex" justifyContent="center" alignSelf="flex-end">
                          {showAvatar && (
                            <Avatar 
                              size="xs" 
                              src={selectedConversation.userProfilePic} 
                              name={selectedConversation.username}
                            />
                          )}
                        </Box>
                      )}
                      
                      {/* Message Bubble */}
                      <Box
                        bg={isOwnMessage ? "blue.500" : useColorModeValue("white", "gray.700")}
                        color={isOwnMessage ? "white" : useColorModeValue("gray.800", "white")}
                        borderRadius="18px"
                        p={3}
                        shadow={isOwnMessage ? "none" : "sm"}
                        border={isOwnMessage ? "none" : "1px solid"}
                        borderColor={useColorModeValue("gray.200", "gray.600")}
                        wordBreak="break-word"
                        position="relative"
                        className="chat-message-bubble"
                      >
                        {message.img && (
                          <img
                            src={message.img}
                            alt="Message"
                            style={{
                              width: "100%",
                              maxWidth: "200px",
                              borderRadius: "8px",
                              marginBottom: message.text ? "8px" : "0",
                            }}
                          />
                        )}
                        
                        {message.text && (
                          <Text fontSize="sm" mb={1}>
                            {message.text}
                          </Text>
                        )}
                        
                        <Flex align="center" justify="flex-end" gap={1} mt={1}>
                          <Text fontSize="xs" color={isOwnMessage ? "whiteAlpha.700" : "gray.500"}>
                            {formatMessageTimestamp(message.createdAt)}
                          </Text>
                          {isOwnMessage && message.seen && (
                            <Icon as={BsCheck2All} color="blue.200" boxSize={3} />
                          )}
                        </Flex>
                      </Box>
                      
                      {/* Avatar for sent messages */}
                      {isOwnMessage && (
                        <Box minW="32px" h="32px" display="flex" justifyContent="center" alignSelf="flex-end">
                          <Avatar 
                            size="xs" 
                            src={currentUser?.imageUrl}
                            name={currentUser?.username || currentUser?.firstName}
                          />
                        </Box>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
            <div ref={messageEndRef} />
          </Flex>
        )}
      </Box>

      {/* Message Input Container */}
      <Box 
        bg={useColorModeValue("white", "gray.800")}
        borderTop="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        p={3}
        className="chat-input-container"
        position="sticky"
        bottom={0}
        zIndex={10}
        w="100%"
        h={`${inputContainerHeight}px`}
        flexShrink={0}
        style={{
          margin: 0,
          width: '100%',
          paddingBottom: `${safeAreaBottom}px`
        }}
      >
        <MessageInput onOptimisticSend={handleOptimisticSend} />
      </Box>
    </Flex>
  );
};

export default MessageContainer;
