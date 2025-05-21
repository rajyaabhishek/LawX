import { Flex, Text, useColorModeValue, Avatar, Divider, Skeleton, SkeletonCircle, Box } from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useCallback, useEffect, useRef, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";
import { axiosInstance } from "../lib/axios";

const MessageContainer = () => {
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const messageEndRef = useRef(null);
  const messageQueue = useRef([]);
  const isProcessingQueue = useRef(false);

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
              participants: [message.sender, currentUser._id],
              lastMessage: {
                text: message.text || "Image",
                sender: message.sender,
                seen: message.sender === currentUser._id,
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
                  seen: message.sender === currentUser._id,
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
      if (!document.hasFocus() && message.sender !== currentUser._id) {
        const sound = new Audio('/notification.mp3');
        sound.play().catch(e => console.error('Error playing sound:', e));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation, currentUser._id, queueMessage, setConversations]);

  // Mark messages as seen when conversation is opened
  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (!selectedConversation || !socket || !messages.length) return;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === currentUser._id || lastMessage.seen) return;
      
      try {
        await axiosInstance.post(`/messages/${selectedConversation._id}/seen`);
        socket.emit("markMessagesAsSeen", {
          conversationId: selectedConversation._id,
          userId: currentUser._id,
        });
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    };

    markMessagesAsSeen();
  }, [selectedConversation, messages, socket, currentUser._id]);

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
      if (!selectedConversation?.userId || !currentUser?._id) {
        console.log('Required data not available:', { 
          selectedConversation: !!selectedConversation, 
          userId: !!selectedConversation?.userId,
          currentUser: !!currentUser,
          currentUserId: !!currentUser?._id
        });
        return;
      }
      
      setLoadingMessages(true);
      try {
        const { data } = await axiosInstance.get(`/api/v1/messages/${selectedConversation.userId}`);
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
        showToast("Error", error.response?.data?.error || error.message, "error");
        
        // If it's a 404, it might be a new conversation - initialize empty messages
        if (error.response?.status === 404) {
          setMessages([]);
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

  if (!selectedConversation) {
    return (
      <Flex
        flex='70'
        bg={useColorModeValue("gray.200", "gray.dark")}
        borderRadius="md"
        p={4}
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
          Select a conversation to start chatting
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      flex='70'
      bg={useColorModeValue("gray.200", "gray.dark")}
      borderRadius="md"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <Flex p={4} alignItems="center" borderBottomWidth="1px">
        <Avatar 
          src={selectedConversation.userProfilePic} 
          name={selectedConversation.username}
          size="sm"
          mr={3}
        />
        <Box>
          <Text fontWeight="bold" display="flex" alignItems="center">
            {selectedConversation.username}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {onlineUsers.includes(selectedConversation.userId) ? "Online" : "Offline"}
          </Text>
        </Box>
      </Flex>

      {/* Messages */}
      <Flex 
        flex={1} 
        p={4} 
        overflowY="auto" 
        flexDirection="column"
        bg={useColorModeValue("white", "gray.700")}
      >
        {loadingMessages ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <Flex
              key={i}
              gap={2}
              alignItems="center"
              p={1}
              borderRadius="md"
              alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
              maxW="70%"
            >
              {i % 2 === 0 && <SkeletonCircle size={8} />}
              <Flex flexDirection="column" gap={2}>
                <Skeleton h="16px" w="200px" />
                <Skeleton h="12px" w="150px" />
              </Flex>
              {i % 2 !== 0 && <SkeletonCircle size={8} />}
            </Flex>
          ))
        ) : messages.length === 0 ? (
          // No messages yet
          <Flex flex={1} alignItems="center" justifyContent="center">
            <Text color="gray.500">No messages yet. Start the conversation!</Text>
          </Flex>
        ) : (
          // Messages list
          messages.map((message) => (
            <Box 
              key={message._id} 
              ref={messages.length - 1 === messages.indexOf(message) ? messageEndRef : null}
            >
              <Message 
                message={message} 
                ownMessage={currentUser._id === message.sender} 
              />
            </Box>
          ))
        )}
      </Flex>

      {/* Message input */}
      <Box p={4} borderTopWidth="1px">
        <MessageInput 
          onSendMessage={async (message, img) => {
            if (!message.trim() && !img) return;
            
            try {
              // Optimistic update
              const tempId = Date.now().toString();
              const newMessage = {
                _id: tempId,
                text: message,
                sender: currentUser._id,
                conversationId: selectedConversation?._id || tempId,
                img: img || "",
                createdAt: new Date(),
                isOptimistic: true,
                seen: false
              };
              
              setMessages(prev => [...prev, newMessage]);
              
              // Send message via socket
              socket.emit("sendMessage", {
                ...newMessage,
                recipientId: selectedConversation.userId,
                sender: currentUser._id,
                createdAt: new Date().toISOString()
              });
              
              // Scroll to bottom
              setTimeout(() => {
                messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
              
            } catch (error) {
              console.error('Error sending message:', error);
              showToast("Error", "Failed to send message. Please try again.", "error");
            }
          }}
        />
      </Box>
    </Flex>
  );
};

export default MessageContainer;
