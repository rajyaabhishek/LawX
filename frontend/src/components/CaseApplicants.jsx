import {
  Box,
  Text,
  Avatar,
  VStack,
  HStack,
  Badge,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  ModalFooter,
  useToast,
  Tooltip
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { FiMail, FiUser, FiClock, FiMessageSquare } from "react-icons/fi";

const statusColors = {
  pending: "yellow",
  accepted: "green",
  rejected: "red"
};

const ApplicantCard = ({ applicant, onStatusChange }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
    >
      <HStack spacing={4} align="flex-start">
        <Avatar
          size="md"
          name={applicant.user.name || applicant.user.username}
          src={applicant.user.profilePicture}
        />
        <VStack align="flex-start" spacing={1} flex={1}>
          <HStack justify="space-between" w="full">
            <Text fontWeight="bold">{applicant.user.name || applicant.user.username}</Text>
            <Badge colorScheme={statusColors[applicant.status]}>
              {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
            </Badge>
          </HStack>
          
          <HStack color="gray.500" fontSize="sm">
            <FiClock size={14} />
            <Text>Applied {formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</Text>
          </HStack>
          
          {applicant.message && (
            <HStack color="gray.600" fontSize="sm" w="full">
              <FiMessageSquare size={14} />
              <Text noOfLines={2} flex={1}>
                {applicant.message}
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
      
      <HStack mt={3} justify="flex-end" spacing={3}>
        <Button
          size="sm"
          colorScheme="gray"
          variant="outline"
          leftIcon={<FiUser />}
          onClick={onOpen}
        >
          View Profile
        </Button>
        
        {applicant.status === 'pending' && (
          <>
            <Button
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={() => onStatusChange(applicant._id, 'accepted')}
            >
              Accept
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => onStatusChange(applicant._id, 'rejected')}
            >
              Reject
            </Button>
          </>
        )}
      </HStack>
      
      {/* Profile Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Applicant Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <Avatar
                  size="xl"
                  name={applicant.user.name || applicant.user.username}
                  src={applicant.user.profilePicture}
                />
                <VStack align="flex-start" spacing={1}>
                  <Text fontSize="xl" fontWeight="bold">
                    {applicant.user.name || applicant.user.username}
                  </Text>
                  {applicant.user.email && (
                    <HStack color="gray.500">
                      <FiMail />
                      <Text>{applicant.user.email}</Text>
                    </HStack>
                  )}
                  <Badge colorScheme={statusColors[applicant.status]}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </Badge>
                </VStack>
              </HStack>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Application Message</Text>
                <Box p={3} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="md">
                  {applicant.message || "No message provided."}
                </Box>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Application Details</Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text color="gray.500">Applied</Text>
                    <Text>{formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.500">Status</Text>
                    <Badge colorScheme={statusColors[applicant.status]}>
                      {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const CaseApplicants = ({ caseId, isOpen, onClose }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const toast = useToast();

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/api/v1/cases/${caseId}/applicants`);
      setApplicants(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setError(error.response?.data?.error || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, status) => {
    try {
      setUpdating(prev => ({ ...prev, [applicationId]: true }));
      
      // Here you would typically make an API call to update the application status
      // For now, we'll just update the local state
      setApplicants(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Application ${status} successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to update application status',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApplicants();
    }
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Case Applicants</ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH="70vh" overflowY="auto" pb={6}>
          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading applicants...</Text>
            </Box>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          ) : applicants.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">No applicants yet</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {applicants.map(applicant => (
                <Box key={applicant._id}>
                  <ApplicantCard 
                    applicant={applicant} 
                    onStatusChange={handleStatusChange}
                  />
                  <Divider my={4} />
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CaseApplicants;
