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
import usePremium from "../hooks/usePremium";

const CreateCasePage = () => {
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();
  const { isPremium, isLoading } = usePremium();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  // Show loading state while checking premium status
  if (isLoading) {
    return (
      <Box
        maxW="7xl"
        mx="auto"
        p={{ base: 2, md: 3 }}
        minH="calc(100vh - 120px)"
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text>Loading...</Text>
      </Box>
    );
  }

  const isPremiumUser = isPremium;

  if (!isPremiumUser) {
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
          <Icon as={Crown} fontSize="4xl" color="gold" mb={4} />
          <Heading size="lg" color={textColor} mb={4}>
            Premium Feature Required
          </Heading>
          <Text fontSize="md" color={mutedText} mb={6}>
            Creating cases is available only for premium users. Upgrade to unlock this feature and many more!
          </Text>
          <Button 
            as={Link} 
            to="/premium" 
            colorScheme="yellow" 
            size="lg"
            leftIcon={<Icon as={Crown} />}
          >
            Upgrade to Premium
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