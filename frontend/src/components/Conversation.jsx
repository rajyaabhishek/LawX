import { Avatar, AvatarBadge, Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { formatDistanceToNow } from 'date-fns';

const Conversation = ({ 
  conversation, 
  isOnline = false, 
  isSelected = false, 
  onClick = () => {}
}) => {
  const currentUser = useRecoilValue(userAtom);
  const { lastMessage, userProfilePic, username, userId, _id } = conversation;
  
  // Get the last message text or show a default
  const getMessagePreview = () => {
    if (!lastMessage) return 'Start a conversation';
    if (lastMessage.text) {
      return lastMessage.text.length > 30 
        ? lastMessage.text.substring(0, 30) + '...' 
        : lastMessage.text;
    }
    if (lastMessage.img) return 'Image';
    return 'New conversation';
  };

  // Format the timestamp
  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const isOwnMessage = lastMessage?.sender === currentUser?._id;
  const isSeen = lastMessage?.seen;

  return (
    <Flex
      p={3}
      align="center"
      gap={3}
      borderRadius="md"
      cursor="pointer"
      bg={isSelected ? useColorModeValue('blue.50', 'gray.700') : 'transparent'}
      _hover={{
        bg: isSelected 
          ? useColorModeValue('blue.50', 'gray.700')
          : useColorModeValue('gray.50', 'gray.800'),
      }}
      transition="background-color 0.2s"
      onClick={onClick}
      position="relative"
    >
      {/* User Avatar */}
      <Box position="relative">
        <Avatar 
          src={userProfilePic} 
          name={username}
          size="md"
          bg={useColorModeValue('gray.200', 'gray.600')}
        />
        {isOnline && (
          <Box
            position="absolute"
            bottom="0"
            right="0"
            w="12px"
            h="12px"
            bg="green.500"
            borderRadius="full"
            borderWidth="2px"
            borderColor={useColorModeValue('white', 'gray.800')}
          />
        )}
      </Box>

      {/* Message Preview */}
      <Flex flex={1} direction="column" overflow="hidden">
        <Flex justify="space-between" align="center" w="full">
          <Text 
            fontWeight="600" 
            fontSize="sm"
            isTruncated
            color={useColorModeValue('gray.800', 'white')}
          >
            {username}
          </Text>
          {lastMessage?.createdAt && (
            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
              {formatTimestamp(lastMessage.createdAt)}
            </Text>
          )}
        </Flex>
        
        <Flex align="center" gap={1} mt={1}>
          {isOwnMessage && (
            <Box color={isSeen ? 'blue.400' : useColorModeValue('gray.500', 'gray.400')}>
              <BsCheck2All size={14} />
            </Box>
          )}
          <Text 
            fontSize="sm" 
            color={useColorModeValue('gray.600', 'gray.300')}
            isTruncated
            flex={1}
          >
            {getMessagePreview()}
          </Text>
          {!lastMessage?.text && lastMessage?.img && (
            <BsFillImageFill size={12} color={useColorModeValue('gray.500', 'gray.400')} />
          )}
        </Flex>
      </Flex>

      {/* Unread indicator */}
      {!isSelected && lastMessage && !isSeen && !isOwnMessage && (
        <Box
          position="absolute"
          top="50%"
          right="12px"
          transform="translateY(-50%)"
          w="8px"
          h="8px"
          bg="blue.500"
          borderRadius="full"
        />
      )}
    </Flex>
  );
};

export default Conversation;
