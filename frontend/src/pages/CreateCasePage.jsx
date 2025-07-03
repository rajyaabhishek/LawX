import { 
  Box, 
  Heading, 
  useColorModeValue,
  VStack,
  Text,
  Icon,
  HStack,
  Button
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { Crown } from "lucide-react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import CaseCreation from "../components/CaseCreation";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const CreateCasePage = () => {
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();
  const { isSignedIn } = useAuthContext();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  if (!isSignedIn) {
    return (
      <Box
        maxW="7xl"
        mx="auto"
        p={{ base: 2, md: 3 }}
        minH="calc(100vh - 120px)"
        bg={bgColor}
      >
        <Box 
          textAlign="center" 
          p={12} 
          bg={cardBg} 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          shadow="sm"
        >
          <Icon as={FiPlus} fontSize="4xl" color="blue.500" mb={4} />
          <Heading size="lg" color={textColor} mb={4}>
            Sign In Required
          </Heading>
          <Text fontSize="md" color={mutedText} mb={6}>
            Please sign in to create and manage legal cases.
          </Text>
          <Button 
            colorScheme="blue" 
            size="lg"
            onClick={() => {
              // This will trigger the auth system
              navigate('/');
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box 
        bg={cardBg}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
        p={6}
        shadow="sm"
      >
        <CaseCreation 
          isOpen={true} 
          onClose={() => navigate('/my-cases')} 
          onSuccess={() => {
            navigate('/my-cases');
          }} 
          isModal={false}
        />
      </Box>
    </VStack>
  );
};

export default CreateCasePage; 