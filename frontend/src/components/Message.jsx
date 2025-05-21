import { Avatar, Box, Flex, Image, Skeleton, Text, useColorModeValue } from "@chakra-ui/react";
import { useState } from "react";
import { BsCheck2All } from "react-icons/bs";
import { formatMessageTimestamp } from "../utils/dateUtils";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";

const Message = ({ ownMessage, message }) => {
	const selectedConversation = useRecoilValue(selectedConversationAtom);
	const user = useRecoilValue(userAtom);
	const [imgLoaded, setImgLoaded] = useState(false);
	return (
		<>
			{ownMessage ? (
				<Flex gap={2} alignSelf={"flex-end"}>
					{message.text && (
						<Flex
							bg={"green.500"}
							maxW={"350px"}
							p={3}
							borderRadius={"xl"}
							position="relative"
							_after={{
								content: '""',
								position: "absolute",
								bottom: "5px",
								right: "-5px",
								width: 0,
								height: 0,
								borderTop: "8px solid transparent",
								borderBottom: "8px solid transparent",
								borderLeft: "8px solid",
								borderLeftColor: "green.500",
							}}
						>
							<Flex direction="column">
								<Text color={"white"}>{message.text}</Text>
								<Text fontSize="xs" color="gray.200" mt={1} alignSelf="flex-end">
									{formatMessageTimestamp(message.createdAt)}
								</Text>
							</Flex>
							<Box
								alignSelf={"flex-end"}
								ml={1}
								color={message.seen ? "blue.400" : ""}
								fontWeight={"bold"}
							>
								<BsCheck2All size={16} />
							</Box>
						</Flex>
					)}
					{message.img && !imgLoaded && (
						<Flex mt={5} w={"200px"} direction="column" alignItems="flex-end">
							<Image
								src={message.img}
								hidden
								onLoad={() => setImgLoaded(true)}
								alt='Message image'
								borderRadius={"xl"}
							/>
							<Skeleton w={"200px"} h={"200px"} borderRadius={"xl"} />
						</Flex>
					)}

					{message.img && imgLoaded && (
						<Flex mt={5} w={"200px"} direction="column" alignItems="flex-end">
							<Image src={message.img} alt='Message image' borderRadius={"xl"} />
							<Box
								alignSelf={"flex-end"}
								ml={1}
								color={message.seen ? "blue.400" : ""}
								fontWeight={"bold"}
							>
								<BsCheck2All size={16} />
							</Box>
							<Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} mt={1} alignSelf="flex-end">
								{formatMessageTimestamp(message.createdAt)}
							</Text>
						</Flex>
					)}

					<Avatar src={user.profilePic} w='7' h={7} />
				</Flex>
			) : (
				<Flex gap={2}>
					<Avatar src={selectedConversation.userProfilePic} w='7' h={7} />

					{message.text && (
						<Flex
							direction="column"
							maxW={"350px"}
							bg={useColorModeValue("gray.200", "gray.600")}
							p={3}
							borderRadius={"xl"}
							position="relative"
							_after={{
								content: '""',
								position: "absolute",
								bottom: "5px",
								left: "-5px",
								width: 0,
								height: 0,
								borderTop: "8px solid transparent",
								borderBottom: "8px solid transparent",
								borderRight: "8px solid",
								borderRightColor: useColorModeValue("gray.200", "gray.600"),
							}}
						>
							<Text color={useColorModeValue("black", "white")}>{message.text}</Text>
							<Text fontSize="xs" color={useColorModeValue("gray.600", "gray.300")} mt={1} alignSelf="flex-start">
								{formatMessageTimestamp(message.createdAt)}
							</Text>
						</Flex>
					)}
					{message.img && !imgLoaded && (
						<Flex mt={5} w={"200px"} direction="column" alignItems="flex-start">
							<Image
								src={message.img}
								hidden
								onLoad={() => setImgLoaded(true)}
								alt='Message image'
								borderRadius={"xl"}
							/>
							<Skeleton w={"200px"} h={"200px"} borderRadius={"xl"} />
						</Flex>
					)}

					{message.img && imgLoaded && (
						<Flex mt={5} w={"200px"} direction="column" alignItems="flex-start">
							<Image src={message.img} alt='Message image' borderRadius={"xl"} />
							<Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} mt={1} alignSelf="flex-start">
								{formatMessageTimestamp(message.createdAt)}
							</Text>
						</Flex>
					)}
				</Flex>
			)}
		</>
	);
};

export default Message;
