import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Button,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { useSocket } from "../context/SocketContext";

const MessageInput = ({ onSendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const inputRef = useRef(null);
  const { socket } = useSocket();

  // Auto-focus input when conversation changes (only on desktop to avoid keyboard issues on mobile)
  useEffect(() => {
    if (selectedConversation?._id) {
      // Only auto-focus on desktop/tablet, not on mobile
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!isMobile && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [selectedConversation]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !selectedConversation?.userId) return;
    
    // Emit typing start
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typingStart", { 
        recipientId: selectedConversation.userId,
        conversationId: selectedConversation._id 
      });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typingStop", { 
        recipientId: selectedConversation.userId,
        conversationId: selectedConversation._id 
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation?.userId) return;
    if (isSending) return;

    setIsSending(true);
    const originalMessageText = messageText;

    try {
      // Clear input immediately for better UX
      setMessageText('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      
      // Call the parent component's optimistic update first
      if (onSendMessage) {
        onSendMessage(originalMessageText);
      }
      
      // Send the actual message via API
      const { data } = await axiosInstance.post("/messages", {
        message: originalMessageText,
        recipientId: selectedConversation.userId,
      });

      console.log('Message sent successfully via API:', data);

      // Emit via socket for real-time updates to other users
      if (socket) {
        socket.emit("sendMessage", {
          ...data,
          recipientId: selectedConversation.userId,
          conversationId: selectedConversation._id,
        });
      }

      // Update conversations list
      setConversations(prev => {
        return prev.map(conv => {
          if (conv._id === selectedConversation._id) {
            return {
              ...conv,
              lastMessage: {
                text: originalMessageText,
                sender: data.sender,
                seen: false,
                createdAt: new Date()
              },
              updatedAt: new Date()
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });

    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Error", error.response?.data?.error || "Failed to send message", "error");
      // Restore the message text on error
      setMessageText(originalMessageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Handle Enter key (without Shift for new line, with Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);
    handleTyping();

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height for the textarea
      inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  return (
    <Box 
      p={0} 
      borderTopWidth="0"
      bg="transparent"
      w="100%"
    >
      <form onSubmit={handleSendMessage} style={{ width: '100%' }}>
        <Flex gap={3} align="flex-end" w="100%">
          <Box flex={1}>
            <Textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              borderRadius={{ base: "16px", md: "20px" }}
              bg={useColorModeValue("gray.100", "gray.700")}
              border="none"
              _focus={{
                bg: useColorModeValue("white", "gray.600"),
                boxShadow: "0 0 0 2px var(--chakra-colors-blue-500)",
                borderColor: "transparent"
              }}
              _placeholder={{
                color: useColorModeValue("gray.500", "gray.400")
              }}
              size="md"
              minH="48px"
              maxH="120px"
              fontSize="16px"
              px={4}
              py={3}
              className="chat-input mobile-touch-feedback"
              transition="all 0.2s ease"
              resize="none"
              rows={1}
              lineHeight="1.4"
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              style={{
                height: 'auto',
                overflow: 'hidden'
              }}
            />
          </Box>
          
          <Button
            type="submit"
            isLoading={isSending}
            isDisabled={!messageText.trim() || isSending}
            colorScheme="blue"
            size="lg"
            borderRadius="50%"
            w="48px"
            h="48px"
            minW="48px"
            p={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            className="chat-send-button mobile-touch-feedback"
            bg={useColorModeValue("blue.500", "blue.500")}
            color="white"
            _hover={{
              bg: useColorModeValue("blue.600", "blue.600"),
              transform: "scale(1.05)"
            }}
            _active={{
              transform: "scale(0.95)"
            }}
            _disabled={{
              bg: useColorModeValue("gray.300", "gray.600"),
              transform: "none",
              opacity: 0.6
            }}
            transition="all 0.2s ease"
            boxShadow="0 2px 8px rgba(66, 153, 225, 0.3)"
            flexShrink={0}
          >
            <FiSend size={20} />
          </Button>
        </Flex>
      </form>
    </Box>
  );
};

export default MessageInput;
