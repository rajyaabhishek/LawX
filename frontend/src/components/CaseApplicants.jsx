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
  Tooltip
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { FiMail, FiUser, FiClock, FiMessageSquare } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const statusColors = {
  pending: "yellow",
  accepted: "green",
  rejected: "red"
};

const ApplicantCard = ({ applicant, onStatusChange }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${applicant.user.username}`);
  };

  return (
    <Box
      p={5}
      borderWidth="1px"
      borderRadius="lg"
      bg={bgColor}
      borderColor={borderColor}
      shadow="sm"
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={4}>
        <HStack spacing={4} align="flex-start">
          <Avatar
            size="lg"
            name={applicant.user.name || applicant.user.username}
            src={applicant.user.profilePicture}
          />
          <VStack align="flex-start" spacing={2} flex={1} minW={0}>
            <HStack justify="space-between" w="full" align="center">
              <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                {applicant.user.name || applicant.user.username}
              </Text>
              <Badge colorScheme={statusColors[applicant.status]} fontSize="sm" px={3} py={1}>
                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
              </Badge>
            </HStack>
            
            <HStack color="gray.500" fontSize="sm">
              <FiClock size={14} />
              <Text>Applied {formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</Text>
            </HStack>
          </VStack>
        </HStack>
        
        {applicant.message && (
          <Box p={3} bg={useColorModeValue("gray.50", "gray.600")} borderRadius="md">
            <HStack color="gray.600" fontSize="sm" mb={1}>
              <FiMessageSquare size={14} />
              <Text fontWeight="semibold">Application Message:</Text>
            </HStack>
            <Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }}>
              {applicant.message}
            </Text>
          </Box>
        )}
        
        <HStack justify="space-between" spacing={3} pt={2}>
          <Button
            size="md"
            colorScheme="blue"
            variant="outline"
            leftIcon={<FiUser />}
            onClick={handleViewProfile}
            flex={1}
          >
            View Profile
          </Button>
          
          {applicant.status === 'pending' && (
            <HStack spacing={2} flex={1}>
              <Button
                size="md"
                colorScheme="green"
                variant="solid"
                onClick={() => onStatusChange(applicant._id, 'accepted')}
                flex={1}
              >
                Accept
              </Button>
              <Button
                size="md"
                colorScheme="red"
                variant="solid"
                onClick={() => onStatusChange(applicant._id, 'rejected')}
                flex={1}
              >
                Reject
              </Button>
            </HStack>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

const CaseApplicants = ({ caseId, isOpen, onClose, onStatusUpdate }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const showToast = useShowToast();

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/cases/${caseId}/applicants`);
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
      
      // Make API call to update the application status
      await axiosInstance.patch(`/cases/${caseId}/applications/${applicationId}/status`, {
        status
      });
      
      // Update the local state
      setApplicants(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      
      showToast("Status Updated", `Application ${status} successfully`, "success");

      // Notify parent component of the status update
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      showToast("Error", error.response?.data?.error || 'Failed to update application status', "error");
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
            <VStack spacing={6} align="stretch">
              {applicants.map(applicant => (
                <ApplicantCard 
                  key={applicant._id}
                  applicant={applicant} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CaseApplicants;
