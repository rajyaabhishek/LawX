import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { 
	VStack,
	Spinner,
	Center,
	Text,
	useColorModeValue 
} from "@chakra-ui/react";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import { useAuthContext } from "../context/AuthContext";

const PostPage = () => {
	const { postId } = useParams();
	const { isSignedIn } = useAuthContext();
	
	const { data: authUser } = useQuery({ 
		queryKey: ["authUser"],
		enabled: isSignedIn 
	});

	const { data: post, isLoading } = useQuery({
		queryKey: ["post", postId],
		queryFn: () => axiosInstance.get(`/posts/${postId}`),
		enabled: !!postId, // Enable for all users but only when postId exists
	});

	const textColor = useColorModeValue("gray.800", "white");

	if (isLoading) {
		return (
			<Center py={12}>
				<Spinner size="lg" color="blue.500" />
			</Center>
		);
	}

	if (!post?.data) {
		return (
			<Center py={12}>
				<Text color={textColor} fontSize="lg">Post not found</Text>
			</Center>
		);
	}

	return (
		<VStack spacing={6} align="stretch">
			<Post post={post.data} />
		</VStack>
	);
};
export default PostPage;
