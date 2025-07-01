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
  Tooltip,
  Flex
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { FiMail, FiUser, FiClock } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const statusColors = {
  pending: "yellow",
  accepted: "green",
  rejected: "red"
};

const ApplicantCard = ({ applicant, onStatusChange }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.700");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const primaryTextColor = useColorModeValue("gray.800", "white");
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${applicant.user.username}`);
  };

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      _hover={{ 
        borderColor: "gray.300",
        shadow: "sm"
      }}
      transition="all 0.2s ease"
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <HStack spacing={4} flex={1}>
          <Avatar
            size="md"
            name={applicant.user.name || applicant.user.username}
            src={applicant.user.profilePicture}
          />
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <Text fontWeight="bold" fontSize="lg" color={primaryTextColor} noOfLines={1}>
              {applicant.user.name || applicant.user.username}
            </Text>
            <HStack color={mutedTextColor} fontSize="sm" spacing={4}>
              <HStack spacing={1}>
                <FiClock size={14} />
                <Text>Applied {formatDistanceToNow(new Date(applicant.appliedAt), { addSuffix: true })}</Text>
              </HStack>
            </HStack>
          </VStack>
        </HStack>
        
        <Badge 
          variant="outline"
          colorScheme={applicant.status === 'pending' ? undefined : statusColors[applicant.status]}
          fontSize="sm" 
          px={3} 
          py={1}
          borderRadius="md"
          borderColor={applicant.status === 'pending' ? "orange.400" : undefined}
          color={applicant.status === 'pending' ? "orange.600" : undefined}
          _dark={{
            borderColor: applicant.status === 'pending' ? "orange.300" : undefined,
            color: applicant.status === 'pending' ? "orange.300" : undefined
          }}
        >
          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
        </Badge>
      </Flex>
      
      <Divider mb={4} />
      
      <Flex gap={3} justify="flex-end">
        <Button
          size="sm"
          colorScheme="blue"
          variant="outline"
          leftIcon={<FiUser />}
          onClick={handleViewProfile}
        >
          View Profile
        </Button>
        
        {applicant.status === 'pending' && (
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              borderColor="green.400"
              color="green.600"
              _hover={{ bg: "green.50", borderColor: "green.500" }}
              _dark={{ 
                color: "green.300", 
                borderColor: "green.300",
                _hover: { bg: "green.900", borderColor: "green.200" }
              }}
              onClick={() => onStatusChange(applicant._id, 'accepted')}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderColor="red.400"
              color="red.600"
              _hover={{ bg: "red.50", borderColor: "red.500" }}
              _dark={{ 
                color: "red.300", 
                borderColor: "red.300",
                _hover: { bg: "red.900", borderColor: "red.200" }
              }}
              onClick={() => onStatusChange(applicant._id, 'rejected')}
            >
              Reject
            </Button>
          </HStack>
        )}
      </Flex>
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
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
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
