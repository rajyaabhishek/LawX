import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
	Box, 
	Flex, 
	Avatar, 
	Textarea, 
	Button, 
	Image, 
	HStack,
	useColorModeValue,
	Input,
	Text
} from "@chakra-ui/react";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image as ImageIcon, Loader, Lock } from "lucide-react";

const PostCreation = ({ user }) => {
	const { isSignedIn } = useUser();
	const [content, setContent] = useState("");
	const [image, setImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);

	const queryClient = useQueryClient();

	// Theme colors
	const cardBg = useColorModeValue("white", "gray.800");
	const inputBg = useColorModeValue("gray.100", "gray.600");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedText = useColorModeValue("gray.600", "gray.400");

	const { mutate: createPostMutation, isPending } = useMutation({
		mutationFn: async (postData) => {
			const res = await axiosInstance.post("/posts/create", postData, {
				headers: { "Content-Type": "application/json" },
			});
			return res.data;
		},
		onSuccess: () => {
			resetForm();
			toast.success("Post created successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err) => {
			toast.error(err.response.data.message || "Failed to create post");
		},
	});

	const handlePostCreation = async () => {
		try {
			const postData = { content };
			if (image) postData.image = await readFileAsDataURL(image);

			createPostMutation(postData);
		} catch (error) {
			console.error("Error in handlePostCreation:", error);
		}
	};

	const resetForm = () => {
		setContent("");
		setImage(null);
		setImagePreview(null);
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		setImage(file);
		if (file) {
			readFileAsDataURL(file).then(setImagePreview);
		} else {
			setImagePreview(null);
		}
	};

	const readFileAsDataURL = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	if (!isSignedIn) {
		return null;
	}

	return (
		<Box 
			bg={cardBg} 
			borderRadius="lg" 
			boxShadow="sm" 
			border="1px"
			borderColor={useColorModeValue("gray.200", "gray.700")}
			mb={1} 
			p={{ base: 3, md: 4 }}
			w="100%"
		>
			<Flex 
				gap={{ base: 2, md: 3 }} 
				mb={4}
				direction={{ base: "column", sm: "row" }}
			>
				<Avatar 
					src={user?.profilePicture || "/avatar.png"} 
					name={user?.name || "User"} 
					size={{ base: "sm", md: "md" }}
					flexShrink={0}
					alignSelf={{ base: "flex-start", sm: "flex-start" }}
				/>
				<Textarea
					placeholder="What's on your mind?"
					bg={inputBg}
					border="none"
					resize="none"
					minH={{ base: "80px", md: "100px" }}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					color={textColor}
					fontSize={{ base: "sm", md: "md" }}
					_placeholder={{ color: mutedText }}
					_hover={{
						bg: useColorModeValue("gray.200", "gray.500")
					}}
					_focus={{
						bg: useColorModeValue("gray.200", "gray.500"),
						outline: "none"
					}}
				/>
			</Flex>

			{imagePreview && (
				<Box mb={4}>
					<Image 
						src={imagePreview} 
						alt="Selected" 
						w="full" 
						borderRadius="lg"
						maxH={{ base: "200px", md: "300px" }}
						objectFit="cover"
					/>
				</Box>
			)}

			<Flex 
				justify="space-between" 
				align="center"
				direction={{ base: "column", sm: "row" }}
				gap={{ base: 3, sm: 0 }}
			>
				<HStack spacing={{ base: 2, md: 4 }} w={{ base: "100%", sm: "auto" }}>
					<Button
						as="label"
						variant="ghost"
						leftIcon={<ImageIcon size={16} />}
						color={mutedText}
						size={{ base: "sm", md: "md" }}
						fontSize={{ base: "sm", md: "md" }}
						_hover={{ color: textColor }}
						cursor="pointer"
					>
						Photo
						<Input 
							type="file" 
							accept="image/*" 
							display="none" 
							onChange={handleImageChange} 
						/>
					</Button>
				</HStack>

				<Button
					colorScheme="blue"
					onClick={handlePostCreation}
					isDisabled={isPending || !content.trim()}
					isLoading={isPending}
					loadingText="Sharing"
					size={{ base: "sm", md: "md" }}
					w={{ base: "100%", sm: "auto" }}
					fontSize={{ base: "sm", md: "md" }}
				>
					{isPending ? <Loader size={16} className="animate-spin" /> : "Share"}
				</Button>
			</Flex>
		</Box>
	);
};
export default PostCreation;
