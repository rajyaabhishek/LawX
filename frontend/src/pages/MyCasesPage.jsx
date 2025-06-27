import { 
  Box, 
  Heading, 
  useColorModeValue,
  VStack,
  Text,
  Icon,
  HStack,
  Spinner,
  Flex,
  Button
} from "@chakra-ui/react";
import { FiFileText, FiPlus } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useCallback } from "react";
import userAtom from "../atoms/userAtom";
import Case from "../components/Case";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";

const MyCasesPage = () => {
  const currentUser = useRecoilValue(userAtom);
  const [myCases, setMyCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  const fetchMyCases = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/cases/my/cases");
      const casesData = data?.cases || [];
      setMyCases(Array.isArray(casesData) ? casesData : []);
    } catch (error) {
      console.error('Error fetching my cases:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your cases", "error");
      setMyCases([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMyCases();
  }, [fetchMyCases]);

  return (
    <VStack spacing={6} align="stretch">
      <Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
        <Box textAlign="center" mb={6}>
          <HStack justify="center" mb={4}>
            <Icon as={FiFileText} boxSize={6} color="blue.500" />
            <Heading size="lg" color={textColor}>
              My Cases
            </Heading>
          </HStack>
          <Text color={mutedText}>
            Manage and track all your posted legal cases
          </Text>
        </Box>

        {loading ? (
          <Flex justify="center" p={12}>
            <Spinner size="xl" />
          </Flex>
        ) : myCases.length === 0 ? (
          <Box 
            textAlign="center" 
            p={12} 
          >
            <Text fontSize="4xl" mb={4}>📋</Text>
            <Heading size="md" color={textColor} mb={2}>
              No cases created yet
            </Heading>
            <Text fontSize="md" color={mutedText} mb={6}>
              Start by creating your first legal case to find qualified lawyers
            </Text>
            <Button 
              as={Link}
              to="/create-case"
              colorScheme="blue" 
              leftIcon={<Icon as={FiPlus} />}
              size="lg"
            >
              Create your first case
            </Button>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" mb={4}>
              <Text color={mutedText}>
                {myCases.length} case{myCases.length !== 1 ? 's' : ''} found
              </Text>
              <Button 
                as={Link}
                to="/create-case"
                colorScheme="blue" 
                leftIcon={<Icon as={FiPlus} />}
                size="sm"
              >
                Create New Case
              </Button>
            </HStack>
            
            {myCases.map((caseItem) => (
              <Case 
                key={caseItem._id} 
                caseData={caseItem} 
                showApplicants={true}
                onUpdate={(updatedCase) => {
                  try {
                    if (updatedCase === null) {
                      // Case was deleted, remove it from the list
                      setMyCases(prev => {
                        const filteredCases = prev.filter(c => c._id !== caseItem._id);
                        console.log('Removed case from MyCasesPage, remaining cases:', filteredCases.length);
                        return filteredCases;
                      });
                    } else {
                      // Case was updated, update it in the list
                      setMyCases(prev => 
                        prev.map(c => c._id === updatedCase._id ? updatedCase : c)
                      );
                      fetchMyCases();
                    }
                  } catch (error) {
                    console.error('Error updating case list in MyCasesPage:', error);
                    // Fallback: refetch all cases
                    fetchMyCases();
                  }
                }}
              />
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default MyCasesPage; 