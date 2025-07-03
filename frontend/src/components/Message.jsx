import { Box, Flex, Text, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { BsCheck2All } from "react-icons/bs";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useUser } from "@clerk/clerk-react";
import { formatMessageTimestamp } from "../utils/dateUtils";
import PremiumAvatar from "./PremiumAvatar";

const Message = ({ ownMessage, message, currentMongoUser }) => {
	const selectedConversation = useRecoilValue(selectedConversationAtom);
	const { user } = useUser();
	const isMobile = useBreakpointValue({ base: true, md: false });
	
	// Enhanced color mode values for better distinction
	const ownMessageBg = useColorModeValue("blue.500", "blue.400");
	const otherMessageBg = useColorModeValue("gray.100", "gray.700");
	const ownMessageColor = "white";
	const otherMessageColor = useColorModeValue("gray.800", "white");
	const timestampColor = useColorModeValue("gray.500", "gray.400");
	
	// Adjust max width based on screen size
	const messageMaxW = isMobile ? "85%" : "350px";
	const messagePadding = isMobile ? 2 : 3;

	return (
		<Flex 
			mb={3} 
			justify={ownMessage ? "flex-end" : "flex-start"}
			px={isMobile ? 3 : 2}
			w="100%"
		>
			{ownMessage ? (
				// Own message - Right side (blue)
				<Flex gap={2} alignSelf="flex-end" maxW={messageMaxW} w="100%">
					<Flex flexDirection="column" alignItems="flex-end" w="100%">
						<Box 
							bg={ownMessageBg}
							p={messagePadding}
							borderRadius="lg"
							borderBottomRightRadius={isMobile ? "lg" : "md"}
							boxShadow="sm"
							border="1px solid"
							borderColor={useColorModeValue("blue.600", "blue.300")}
							w="fit-content"
							maxW="100%"
							ml="auto"
						>
							<Text 
								color={ownMessageColor} 
								fontSize={isMobile ? "md" : "sm"} 
								wordBreak="break-word"
							>
								{message.text}
							</Text>
						</Box>
						<Flex alignItems="center" gap={1} mt={1} mr={1}>
							<Text fontSize="2xs" color={timestampColor}>
								{formatMessageTimestamp(message.createdAt)}
							</Text>
							<Box
								color={message.seen ? "blue.200" : `${timestampColor}99`}
								display="flex"
								alignItems="center"
							>
								<BsCheck2All size={isMobile ? 14 : 12} />
							</Box>
						</Flex>
					</Flex>
					{!isMobile && <PremiumAvatar src={user?.profilePic} user={user ?? undefined} w={8} h={8} />}
				</Flex>
			) : (
				// Other's message - Left side (gray)
				<Flex gap={2} alignSelf="flex-start" maxW={messageMaxW} w="100%">
					{!isMobile && <PremiumAvatar src={selectedConversation?.userProfilePic} user={selectedConversation ?? undefined} w={8} h={8} />}
					<Flex flexDirection="column" w="100%">
						<Box
							bg={otherMessageBg}
							p={messagePadding}
							borderRadius="lg"
							borderBottomLeftRadius={isMobile ? "lg" : "md"}
							boxShadow="sm"
							border="1px solid"
							borderColor={useColorModeValue("gray.200", "gray.600")}
							w="fit-content"
							maxW="100%"
						>
							<Text 
								color={otherMessageColor} 
								fontSize={isMobile ? "md" : "sm"}
								wordBreak="break-word"
							>
								{message.text}
							</Text>
						</Box>
						<Text 
							fontSize="2xs" 
							color={timestampColor} 
							mt={1} 
							ml={1}
							opacity={0.8}
						>
							{formatMessageTimestamp(message.createdAt)}
						</Text>
					</Flex>
				</Flex>
			)}
		</Flex>
	);
};

export default Message;
