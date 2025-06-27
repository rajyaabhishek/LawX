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
  Button,
  Badge
} from "@chakra-ui/react";
import { FiUserCheck } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import { useState, useEffect, useCallback } from "react";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

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

  const statusConfig = {
    pending: { color: 'yellow', label: 'Pending' },
    accepted: { color: 'green', label: 'Accepted' },
    rejected: { color: 'red', label: 'Rejected' },
    completed: { color: 'blue', label: 'Completed' },
    cancelled: { color: 'gray', label: 'Cancelled' }
  };

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
              to="/cases"
              colorScheme="blue" 
              variant="outline"
              size="lg"
            >
              Browse available cases
            </Button>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            <Text color={mutedText} mb={4}>
              {myApplications.length} application{myApplications.length !== 1 ? 's' : ''} found
            </Text>
            
            {myApplications.map((application) => (
              <Box
                key={application._id}
                p={4}
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                shadow="sm"
                _hover={{ shadow: "md" }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" mb={2}>
                  <Heading size="md" color="blue.600">
                    {application.case.title}
                  </Heading>
                  <Badge 
                    colorScheme={statusConfig[application.status?.toLowerCase()]?.color || 'gray'}
                    variant="subtle" 
                    px={3} 
                    py={1} 
                    borderRadius="full"
                    fontSize="sm"
                  >
                    {statusConfig[application.status?.toLowerCase()]?.label || application.status}
                  </Badge>
                </HStack>
                
                <Text color={mutedText} mb={3} noOfLines={3}>
                  {application.case.description}
                </Text>
                
                <VStack align="start" spacing={2}>
                  <HStack spacing={4} fontSize="sm" color={mutedText}>
                    <Text>Applied: {formatDistanceToNow(new Date(application.appliedAt))} ago</Text>
                    <Text>•</Text>
                    <Text>Budget: {application.case.budget?.currency} {application.case.budget?.amount?.toLocaleString()}</Text>
                  </HStack>
                  
                  {application.case.caseType && (
                    <HStack spacing={4} fontSize="sm" color={mutedText}>
                      <Text>Case Type: {application.case.caseType}</Text>
                      {application.case.location && (
                        <>
                          <Text>•</Text>
                          <Text>Location: {application.case.location}</Text>
                        </>
                      )}
                    </HStack>
                  )}
                </VStack>

                {application.status?.toLowerCase() === 'pending' && (
                  <Text fontSize="sm" color="yellow.600" mt={3} fontStyle="italic">
                    Waiting for client response...
                  </Text>
                )}
                
                {application.status?.toLowerCase() === 'accepted' && (
                  <Text fontSize="sm" color="green.600" mt={3} fontWeight="semibold">
                    🎉 Congratulations! Your application was accepted.
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default MyApplicationsPage; 