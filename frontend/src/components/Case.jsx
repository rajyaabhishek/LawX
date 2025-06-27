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
  Textarea,
  IconButton,
  Tooltip,
  HStack,
  VStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Alert,
  AlertIcon,
  Stack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  FormControl,
  FormLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useState, useMemo, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiUser, 
  FiCalendar, 
  FiUsers,
  FiExternalLink,
  FiCheck,
  FiMoreVertical,
  FiTrash2,
  FiEdit,
  FiSend,
  FiBriefcase
} from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import { useAuthContext } from "../context/AuthContext";
import { axiosInstance } from "../lib/axios";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow, format, parseISO } from "date-fns";
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

const Case = ({ caseData, onUpdate, showApplicants = true }) => {
  const { 
    isOpen: isApplicantsOpen, 
    onOpen: onApplicantsOpen, 
    onClose: onApplicantsClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const { 
    isOpen: isApplyOpen, 
    onOpen: onApplyOpen, 
    onClose: onApplyClose 
  } = useDisclosure();
  
  const recoilUser = useRecoilValue(userAtom);
  const { currentUser: authUser, isSignedIn } = useAuthContext();
  
  // Use AuthContext user if available, fallback to Recoil user
  const currentUser = authUser || recoilUser;
  const [isApplying, setIsApplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const showToast = useShowToast();
  const cancelRef = useRef();
  
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

  const isOwner = useMemo(() => {
    return currentUser?._id === user?._id;
  }, [currentUser, caseData.user]);

  const hasApplied = useMemo(() => {
    if (!applications || !currentUser?._id) return false;
    return applications.some(app => app.user?._id === currentUser._id);
  }, [applications, currentUser]);

  const handleViewApplicants = useCallback((e) => {
    e.stopPropagation(); // Prevent the card click from opening the main modal
    onApplicantsOpen();
  }, [onApplicantsOpen]);

  const handleDeleteCase = async () => {
    if (isDeleting || !caseData?._id) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/cases/${caseData._id}`);
      
      showToast("Success", "Case deleted successfully", "success");
      
      // Close all modals first
      onDeleteClose();
      onApplicantsClose(); // Close applicants modal if open
      
      // Update the parent component by removing this case after a small delay
      // to ensure modals have properly closed
      setTimeout(() => {
        if (onUpdate) {
          onUpdate(null); // Signal to remove this case
        }
      }, 100);
      
    } catch (error) {
      console.error("Error deleting case:", error);
      showToast(
        "Error", 
        error.response?.data?.error || "Failed to delete case. Please try again.", 
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = useMemo(() => {
    if (!isOwner) return false;
    // Check if case has accepted applications
    const hasAcceptedApplications = applications?.some(app => app.status === 'accepted');
    return !hasAcceptedApplications;
  }, [isOwner, applications]);

  const handleApplyForCase = async () => {
    if (isApplying || !applicationMessage.trim() || !caseData?._id) return;
    
    setIsApplying(true);
    try {
      const { data } = await axiosInstance.post(`/cases/${caseData._id}/apply`, {
        message: applicationMessage
      });
      
      showToast("Success", "Application submitted successfully", "success");
      setApplicationMessage("");
      onApplyClose();
      
      // Update the case data with the new application
      if (onUpdate) {
        onUpdate({
          ...caseData,
          applications: [...applications, data]
        });
      }
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
            {hasApplied && (
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
              <Tooltip label={`${applicationsCount} ${applicationsCount === 1 ? 'applicant' : 'applicants'}`}>
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
            
            {isOwner && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Case options"
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                />
                <MenuList>
                  {canDelete && (
                    <MenuItem 
                      icon={<FiTrash2 />} 
                      color="red.500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOpen();
                      }}
                    >
                      Delete Case
                    </MenuItem>
                  )}
                  {!canDelete && applications?.some(app => app.status === 'accepted') && (
                    <MenuItem isDisabled>
                      Cannot delete (has accepted applications)
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            )}
          </HStack>
        </Flex>
        
        {/* Title section */}
        <Heading size="md" mb={3} noOfLines={2} title={title} color={primaryTextColor}>
          {title || "Untitled Case"}
        </Heading>
        
        {/* Author and time */}
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
            <Text fontSize="xs" color={mutedTextColor}>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
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

        {/* Apply Button - Bottom Right Corner */}
        <Box position="absolute" bottom={4} right={4}>
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
          ) : hasApplied ? (
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
            <Popover isOpen={isApplyOpen} onClose={onApplyClose} placement="top-end">
              <PopoverTrigger>
                <Button 
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FiSend />}
                  onClick={onApplyOpen}
                >
                  Apply
                </Button>
              </PopoverTrigger>
              <PopoverContent w="400px">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="semibold">Apply for this Case</PopoverHeader>
                <PopoverBody>
                  <FormControl>
                    <FormLabel fontSize="sm">Why are you a good fit for this case?</FormLabel>
                    <Textarea
                      placeholder="Write a brief message explaining your experience and why you're interested..."
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      minH="100px"
                      size="sm"
                    />
                  </FormControl>
                  <Button 
                    mt={3}
                    w="full"
                    colorScheme="blue"
                    onClick={handleApplyForCase}
                    isLoading={isApplying}
                    isDisabled={!applicationMessage.trim()}
                    size="sm"
                  >
                    {isApplying ? "Submitting..." : "Submit Application"}
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
        </Box>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Case
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this case? This action cannot be undone.
              {applications?.length > 0 && (
                <Text mt={2} color="orange.500" fontSize="sm">
                  Note: This case has {applications.length} application{applications.length !== 1 ? 's' : ''}.
                </Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteCase} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default Case; 