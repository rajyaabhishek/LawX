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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Flex
      flex='70'
      bg={useColorModeValue("white", "gray.800")}
      borderRadius={{ base: 0, md: "md" }}
      p={0}
      flexDirection="column"
      h="100vh"
      maxW="100%"
      position="relative"
    >
      <Flex 
        w="full" 
        h="60px" 
        alignItems="center" 
        gap={3} 
        px={4}
        py={2}
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        bg={useColorModeValue("white", "gray.800")}
        position="sticky"
        top={0}
        zIndex={1}
      >
        <Icon
          as={ArrowLeft}
          display={{ base: "block", md: "none" }}
          onClick={() => setSelectedConversation({ _id: "", userId: "" })}
          cursor="pointer"
          boxSize={5}
        />
        {selectedConversation.userProfilePic && (
          <Avatar 
            src={selectedConversation.userProfilePic} 
            size="sm"
            name={selectedConversation.username}
          />
        )}
        <Box>
          <Text fontWeight='600' color={useColorModeValue("gray.800", "white")} noOfLines={1}>
            {selectedConversation.username}
          </Text>
          <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>
            {onlineUsers.includes(selectedConversation.userId) ? 'Online' : 'Offline'}
          </Text>
        </Box>
      </Flex>
      <Flex 
        flexDir="column" 
        flex={1} 
        p={3} 
        overflowY="auto"
        h="calc(100vh - 120px)"
        bg={useColorModeValue("gray.50", "gray.900")}
      >
        {loadingMessages &&
          [...Array(5)].map((_, i) => (
            <Flex key={i} gap={2} alignItems={"center"} p={1} borderRadius={"md"}>
              <SkeletonCircle size={"7"} />
              <Flex w={"full"} flexDirection={"column"} gap={2}>
                <Skeleton h='12px' w='125px' />
              </Flex>
            </Flex>
          ))
        }

        {!loadingMessages &&
          messages.map((message) => (
            <Flex
              key={message._id}
              direction={"column"}
              ref={messages.length - 1 === messages.indexOf(message) ? messageEndRef : null}
            >
              <Message
                message={message}
                ownMessage={message.sender?.toString() !== selectedConversation.userId}
                key={message._id}
              />
            </Flex>
          ))
        }
      </Flex>

      <MessageInput onSendMessage={handleOptimisticSend} />
    </Flex>
  );
};

export default MessageContainer;
