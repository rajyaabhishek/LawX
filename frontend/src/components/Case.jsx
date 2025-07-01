import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  useDisclosure,
  Divider,
  Tooltip,
  HStack,
  VStack,
  Tag,
  TagLabel,
  Alert,
  AlertIcon,
  Stack
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useState, useMemo, useCallback } from "react";
import { useRecoilValue } from "recoil";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiUser, 
  FiCalendar, 
  FiUsers,
  FiExternalLink,
  FiCheck,
  FiSend,
  FiBriefcase
} from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import { useAuthContext } from "../context/AuthContext";
import { axiosInstance } from "../lib/axios";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { formatTimeAgo } from "../utils/dateUtils";
import CaseApplicants from "./CaseApplicants";

// Format date to a readable format (e.g., "Jan 1, 2023")
const formatDate = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date not available';
  }
};

const Case = ({ caseData, onUpdate, showApplicants = true, hideLikeButton = false }) => {
  const { 
    isOpen: isApplicantsOpen, 
    onOpen: onApplicantsOpen, 
    onClose: onApplicantsClose 
  } = useDisclosure();
  
  const recoilUser = useRecoilValue(userAtom);
  const { currentUser: authUser, isSignedIn } = useAuthContext();
  
  // Use AuthContext user if available, fallback to Recoil user
  const currentUser = authUser || recoilUser;
  const [isApplying, setIsApplying] = useState(false);
  const showToast = useShowToast();
  const queryClient = useQueryClient();
  
  // Return null if caseData is not available
  if (!caseData) {
    return null;
  }
  
  // Safely destructure with defaults
  const {
    _id: caseId,
    title = "",
    description = "",
    expertise = [],
    location = "",
    deadline = null,
    budget = null,
    compensation = "",
    isRemote = false,
    user = {},
    applications = [],
    createdAt = new Date().toISOString(),
    caseType = ""
  } = caseData;
  
  // Format budget/compensation for display
  const budgetDisplay = budget 
    ? `${budget.currency || 'USD'} ${budget.amount?.toLocaleString() || 0} (${budget.type || 'Fixed'})`
    : compensation;
  
  const applicationsCount = applications?.length || 0;
  
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const primaryTextColor = useColorModeValue("gray.800", "white");
  const tooltipBg = useColorModeValue("white", "gray.700");
  const tooltipColor = useColorModeValue("gray.800", "white");

  const isOwner = useMemo(() => {
    return currentUser?._id === user?._id;
  }, [currentUser, caseData.user]);

  const hasAppliedInitial = useMemo(() => {
    if (!applications || !currentUser?._id) return false;
    return applications.some(app => app.user?._id === currentUser._id);
  }, [applications, currentUser]);
  const [hasAppliedLocal, setHasAppliedLocal] = useState(hasAppliedInitial);

  const handleViewApplicants = useCallback((e) => {
    e.stopPropagation(); // Prevent the card click from opening the main modal
    onApplicantsOpen();
  }, [onApplicantsOpen]);

  const handleApplyForCase = async () => {
    if (isApplying || !caseData?._id) return;
    
    setIsApplying(true);
    try {
      const { data } = await axiosInstance.post(`/cases/${caseData._id}/apply`, {
        message: "I'm interested in working on your case."
      });
      
      showToast("Success", "Application submitted successfully", "success");
      setHasAppliedLocal(true); // instant UI update
      
      // Update the case data with the new application
      if (onUpdate && data.application) {
        onUpdate({
          ...caseData,
          applications: [...applications, data.application]
        });
      }
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseData._id] });
      queryClient.invalidateQueries({ queryKey: ['publicCases'] });
      
    } catch (error) {
      console.error("Error applying for case:", error);
      showToast(
        "Error", 
        error.response?.data?.error || "Failed to submit application. Please try again.", 
        "error"
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Box 
        mb={3} 
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
        position="relative"
      >
        {/* Header section with minimal status indicators */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <HStack spacing={3}>
            {hasAppliedLocal && (
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2} 
                bg="gray.100" 
                _dark={{ bg: "gray.700" }}
                px={3} 
                py={1} 
                borderRadius="md"
                fontSize="sm"
              >
                <FiCheck size={14} color="green" />
                <Text color={mutedTextColor} fontSize="sm">Applied</Text>
              </Box>
            )}
            {caseType && (
              <Text 
                fontSize="sm" 
                color={mutedTextColor}
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
                px={2}
                py={1}
                borderRadius="md"
              >
                {caseType}
              </Text>
            )}
          </HStack>
          
          <HStack spacing={3}>
            {showApplicants && (
              <Tooltip 
                label={`${applicationsCount} ${applicationsCount === 1 ? 'applicant' : 'applicants'}`}
                hasArrow
                bg={tooltipBg}
                color={tooltipColor}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  bg="gray.100"
                  _dark={{ bg: "gray.700" }}
                  px={3}
                  py={1}
                  borderRadius="md"
                  cursor={isOwner ? "pointer" : "default"}
                  onClick={isOwner ? handleViewApplicants : undefined}
                  _hover={isOwner ? { bg: "gray.200", _dark: { bg: "gray.600" } } : {}}
                  fontSize="sm"
                >
                  <FiUsers size={14} />
                  <Text>{applicationsCount}</Text>
                </Box>
              </Tooltip>
            )}
          <Text 
            fontSize="sm" 
            color={mutedTextColor}
            bg="gray.50"
            _dark={{ bg: "gray.800" }}
            px={2}
            py={1}
            borderRadius="md"
          >
            {isRemote ? "Remote" : "On-site"}
          </Text>
        </HStack>
      </Flex>
      
      {/* Title section */}
      <Heading size="md" mb={3} noOfLines={2} title={title} color={primaryTextColor}>
        {title || "Untitled Case"}
      </Heading>
      
      {/* Author */}
      <Flex align="center" mb={3}>
        <Avatar 
          size="sm" 
          src={user?.profilePicture} 
          name={user?.name || user?.username || 'U'}
          mr={3} 
        />
        <Box flex={1}>
          <Text fontWeight="medium" fontSize="sm" color={primaryTextColor} noOfLines={1}>
            {user?.name || user?.username || 'Unknown User'}
          </Text>
        </Box>
      </Flex>
      
      {/* Description */}
      <Text noOfLines={2} mb={4} color={mutedTextColor} fontSize="sm" lineHeight="1.5">
        {description || "No description provided."}
      </Text>
      
      {/* Info tags - minimal styling */}
      {(location || deadline || budgetDisplay) && (
        <Stack direction="row" spacing={4} flexWrap="wrap">
          {location && !isRemote && (
            <HStack spacing={1}>
              <FiMapPin size={14} color="gray" />
              <Text fontSize="sm" color={mutedTextColor} noOfLines={1}>
                {location}
              </Text>
            </HStack>
          )}
          
          {deadline && (
            <HStack spacing={1}>
              <FiClock size={14} color="gray" />
              <Text fontSize="sm" color={mutedTextColor}>
                Due {formatDate(deadline)}
              </Text>
            </HStack>
          )}
          
          {budgetDisplay && (
            <HStack spacing={1}>
              <FiDollarSign size={14} color="gray" />
              <Text fontSize="sm" color={mutedTextColor} noOfLines={1}>
                {budgetDisplay}
              </Text>
            </HStack>
          )}
        </Stack>
      )}

      {/* Time ago display - Bottom left */}
      <Box mt={4} mb={2}>
        <Text fontSize="xs" color={mutedTextColor}>
          Posted {formatTimeAgo(createdAt)}
        </Text>
      </Box>

      {/* Apply Button - Bottom Right Corner */}
      <Flex position="absolute" bottom={4} right={4} gap={2} alignItems="center">
        {isOwner ? (
          <Button 
            size="sm"
            bg="gray.100"
            color="gray.600"
            _dark={{ bg: "gray.700", color: "gray.400" }}
            isDisabled
            leftIcon={<FiBriefcase />}
          >
            My Case
          </Button>
        ) : !isSignedIn && !currentUser ? (
          <Button 
            size="sm"
            variant="outline"
            colorScheme="blue"
            isDisabled
            leftIcon={<FiSend />}
          >
            Login to Apply
          </Button>
        ) : hasAppliedLocal ? (
          <Button 
            size="sm"
            bg="green.100"
            color="green.800"
            _dark={{ bg: "green.800", color: "green.100" }}
            isDisabled
            leftIcon={<FiCheck />}
          >
            Applied
          </Button>
        ) : (
          <Button 
            size="sm"
            colorScheme="blue"
            leftIcon={<FiSend />}
            onClick={handleApplyForCase}
            isLoading={isApplying}
            disabled={isApplying}
          >
            Apply
          </Button>
        )}
      </Flex>

    </Box>

    {/* Applicants Modal */}
    {showApplicants && caseId && (
      <CaseApplicants 
        caseId={caseId} 
        isOpen={isApplicantsOpen} 
        onClose={onApplicantsClose}
        onStatusUpdate={() => {
          // Trigger a refresh of the case data when application status changes
          if (onUpdate) {
            // We could fetch the updated case data here, but for now just trigger a general refresh
            console.log('Application status updated, should refresh case data');
          }
        }}
      />
    )}
    </>
  );
};

export default Case; 