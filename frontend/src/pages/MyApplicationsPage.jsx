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
import { FiUserCheck } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useCallback } from "react";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";
import Application from "../components/Application";

const MyApplicationsPage = () => {
  const currentUser = useRecoilValue(userAtom);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  const fetchMyApplications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/cases/my/applications");
      const applicationsData = data?.applications || [];
      setMyApplications(Array.isArray(applicationsData) ? applicationsData : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your applications", "error");
      setMyApplications([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  return (
    <VStack spacing={6} align="stretch">
      <Box bg={cardBg} borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor={borderColor}>
        <Box textAlign="center" mb={6}>
          <HStack justify="center" mb={4}>
            <Icon as={FiUserCheck} boxSize={6} color="blue.500" />
            <Heading size="lg" color={textColor}>
              My Applications
            </Heading>
          </HStack>
          <Text color={mutedText}>
            Track the status of your case applications
          </Text>
        </Box>

        {loading ? (
          <Flex justify="center" p={12}>
            <Spinner size="xl" />
          </Flex>
        ) : myApplications.length === 0 ? (
          <Box 
            textAlign="center" 
            p={12}
          >
            <Text fontSize="4xl" mb={4}>💼</Text>
            <Heading size="md" color={textColor} mb={2}>
              No applications submitted yet
            </Heading>
            <Text fontSize="md" color={mutedText} mb={6}>
              Browse available cases and apply to ones that match your expertise
            </Text>
            <Button 
              as={Link}
              to="/browse-cases"
              colorScheme="blue" 
              variant="outline"
              size="lg"
            >
              Browse available cases
            </Button>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" mb={4}>
              <Text color={mutedText}>
                {myApplications.length} application{myApplications.length !== 1 ? 's' : ''} found
              </Text>
              <Button 
                as={Link}
                to="/browse-cases"
                colorScheme="blue" 
                variant="outline"
                size="sm"
              >
                Browse More Cases
              </Button>
            </HStack>
            
            {myApplications.map((application) => (
              <Application 
                key={application._id} 
                applicationData={application} 
                onUpdate={(updatedApplication) => {
                  try {
                    if (updatedApplication === null) {
                      // Application was deleted, remove it from the list
                      setMyApplications(prev => 
                        prev.filter(app => app._id !== application._id)
                      );
                    } else {
                      // Application was updated, update it in the list
                      setMyApplications(prev => 
                        prev.map(app => app._id === updatedApplication._id ? updatedApplication : app)
                      );
                      fetchMyApplications();
                    }
                  } catch (error) {
                    console.error('Error updating application list:', error);
                    // Fallback: refetch all applications
                    fetchMyApplications();
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

export default MyApplicationsPage; 