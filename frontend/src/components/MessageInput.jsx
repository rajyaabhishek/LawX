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

  // Auto-focus input when conversation changes
  useEffect(() => {
    if (selectedConversation?._id) {
      inputRef.current?.focus();
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

  return (
    <Box 
      p={1} 
      borderTopWidth="1px"
      bg={useColorModeValue("white", "gray.800")}
    >
      <form onSubmit={handleSendMessage}>
        <InputGroup size="sm">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            borderRadius="full"
            bg={useColorModeValue("gray.100", "gray.700")}
            border="none"
            _focus={{
              bg: useColorModeValue("white", "gray.600"),
              boxShadow: "sm"
            }}
            pr="12"
            size="sm"
          />
          <InputRightElement>
            <IconButton
              type="submit"
              aria-label="Send message"
              icon={<FiSend />}
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              isLoading={isSending}
              isDisabled={!messageText.trim() || isSending}
            />
          </InputRightElement>
        </InputGroup>
      </form>
    </Box>
  );
};

export default MessageInput;
