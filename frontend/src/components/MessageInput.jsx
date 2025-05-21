import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { IoSendSharp } from "react-icons/io5";
import { BsFillImageFill, BsEmojiSmile } from "react-icons/bs";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import useShowToast from "../hooks/useShowToast";
import usePreviewImg from "../hooks/usePreviewImg";
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
  const imageRef = useRef(null);
  const inputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleImageChange, imgUrl, setImgUrl, imgLoading } = usePreviewImg();
  const { socket } = useSocket();
  const toast = useToast();

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
    if ((!messageText.trim() && !imgUrl) || !selectedConversation?.userId) return;
    if (isSending) return;

    setIsSending(true);

    try {
      // Optimistic message object
      const tempId = Date.now().toString();
      const tempMessage = {
        _id: tempId,
        sender: selectedConversation.userId,
        text: messageText,
        conversationId: selectedConversation._id,
        createdAt: new Date(),
        isOptimistic: true,
        img: imgUrl || "",
      };

      // Call the parent's onSendMessage with the temp message
      onSendMessage(messageText, imgUrl, tempMessage);
      
      // Clear input
      setMessageText('');
      setImgUrl('');
      
      // Send the actual message
      const { data } = await axiosInstance.post("/messages", {
        message: messageText,
        recipientId: selectedConversation.userId,
        img: imgUrl,
      });

      // Update the message with the server response
      socket.emit("sendMessage", {
        ...data,
        // Keep the optimistic ID for tracking
        tempId,
        recipientId: selectedConversation.userId,
        conversationId: selectedConversation._id,
      });

      // Update conversations list
      setConversations(prev => {
        return prev.map(conv => {
          if (conv._id === selectedConversation._id) {
            return {
              ...conv,
              lastMessage: {
                text: messageText || "Image",
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("Error", "Please upload an image file", "error");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Error", "Image size should be less than 5MB", "error");
      return;
    }
    
    handleImageChange(e);
    onOpen();
  };

  return (
    <Box 
      p={3} 
      borderTopWidth="1px"
      bg={useColorModeValue("white", "gray.800")}
    >
      {/* Image Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={useColorModeValue("white", "gray.800")} mx={3}>
          <ModalHeader>Send Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {imgLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" />
              </Flex>
            ) : imgUrl ? (
              <Box
                borderRadius="md"
                overflow="hidden"
                boxShadow="md"
                mb={4}
              >
                <img 
                  src={imgUrl} 
                  alt="Preview" 
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </Box>
            ) : null}
            
            <Flex gap={2} mt={4}>
              <Input
                placeholder="Add a caption..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <IconButton
                colorScheme="blue"
                aria-label="Send message"
                icon={isSending ? <Spinner size="sm" /> : <IoSendSharp />}
                onClick={handleSendMessage}
                isLoading={isSending}
                disabled={!imgUrl && !messageText.trim()}
              />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{ width: '100%' }}>
        <Flex gap={2} align="center">
          <InputGroup size="md">
            <Input
              ref={inputRef}
              pr="4.5rem"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              disabled={isSending || !selectedConversation?._id}
              bg={useColorModeValue("white", "gray.700")}
              borderColor={useColorModeValue("gray.200", "gray.600")}
              _hover={{
                borderColor: useColorModeValue("blue.300", "blue.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("blue.500", "blue.300"),
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
              }}
              borderRadius="full"
              pl={5}
              py={6}
            />
            <InputRightElement width="4.5rem" h="full">
              <Flex gap={1} mr={2}>
                <Tooltip label="Send" placement="top" hasArrow>
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    colorScheme="blue"
                    aria-label="Send message"
                    icon={isSending ? <Spinner size="xs" /> : <IoSendSharp />}
                    type="submit"
                    isDisabled={!messageText.trim() && !imgUrl}
                    isRound
                  />
                </Tooltip>
              </Flex>
            </InputRightElement>
          </InputGroup>
          
          <Tooltip label="Attach image" placement="top" hasArrow>
            <IconButton
              aria-label="Attach image"
              icon={<BsFillImageFill />}
              onClick={() => imageRef.current?.click()}
              isDisabled={isSending || !selectedConversation?._id}
              colorScheme="gray"
              variant="ghost"
              borderRadius="full"
              size="lg"
            />
          </Tooltip>
          
          <Input
            type="file"
            ref={imageRef}
            onChange={handleImageUpload}
            accept="image/*"
            display="none"
          />
        </Flex>
      </form>
    </Box>
  );
};

export default MessageInput;
