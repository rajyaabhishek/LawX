import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Textarea,
  useToast,
  IconButton,
  Tooltip,
  HStack,
  VStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useState, useMemo, useCallback } from "react";
import { useRecoilValue } from "recoil";
import { 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiUser, 
  FiCalendar, 
  FiBriefcase, 
  FiUsers,
  FiExternalLink
} from "react-icons/fi";
import userAtom from "../atoms/userAtom";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isApplicantsOpen, 
    onOpen: onApplicantsOpen, 
    onClose: onApplicantsClose 
  } = useDisclosure();
  
  const currentUser = useRecoilValue(userAtom);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const showToast = useShowToast();
  const toast = useToast();
  
  // Return null if caseData is not available
  if (!caseData) {
    return null;
  }
  
  // Safely destructure with defaults
  const {
    _id: caseId,
    title = "",
    description = "",
    expertise = "",
    location = "",
    deadline = null,
    compensation = "",
    isRemote = false,
    user = {},
    applications = [],
    createdAt = new Date().toISOString()
  } = caseData;
  
  const applicationsCount = applications?.length || 0;
  
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const isOwner = useMemo(() => {
    return currentUser?._id === user?._id;
  }, [currentUser, caseData.user]);

  const hasApplied = useMemo(() => {
    if (!applications || !currentUser?._id) return false;
    return applications.some(app => app.user?._id === currentUser._id);
  }, [applications, currentUser]);

  const handleApplyForCase = async () => {
    if (isApplying || !applicationMessage.trim() || !caseData?._id) return;
    
    setIsApplying(true);
    try {
      const { data } = await axiosInstance.post(`/api/v1/cases/${caseData._id}/apply`, {
        message: applicationMessage
      });
      
      showToast("Success", "Application submitted successfully", "success");
      
      // Update the case data with the new application
      if (onUpdate) {
        onUpdate({
          ...caseData,
          applications: [...applications, data]
        });
      }
      
      setApplicationMessage("");
      onClose();
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'PPp');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <Box 
        mb={4} 
        p={4} 
        borderRadius="md" 
        bg={cardBg}
        border="1px"
        borderColor={borderColor}
        _hover={{ 
          shadow: "md",
          transform: "translateY(-2px)",
          transition: "all 0.2s"
        }}
        cursor="pointer"
        onClick={onOpen}
        position="relative"
      >
        <HStack spacing={2} position="absolute" top={2} right={2}>
          {hasApplied && (
            <Badge colorScheme="green">
              Applied
            </Badge>
          )}
          {isOwner && applicationsCount > 0 && showApplicants && (
            <Tooltip label={`View ${applicationsCount} ${applicationsCount === 1 ? 'applicant' : 'applicants'}`}>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="blue"
                leftIcon={<FiUsers size={14} />}
                onClick={handleViewApplicants}
              >
                {applicationsCount}
              </Button>
            </Tooltip>
          )}
        </HStack>
        
        <Flex justify="space-between" mb={2} align="flex-start">
          <Heading size="md" mr={2} noOfLines={1} flex={1} title={title}>
            {title || "Untitled Case"}
          </Heading>
          <Badge 
            colorScheme={isRemote ? "green" : "blue"}
            variant="subtle"
            fontSize="0.7em"
            px={2}
            py={1}
            flexShrink={0}
          >
            {isRemote ? "🌍 Remote" : "🏢 On-site"}
          </Badge>
        </Flex>
        
        <Flex align="center" mb={3}>
          <Avatar 
            size="sm" 
            src={user?.profilePicture} 
            name={user?.name || user?.username || 'U'}
            mr={2} 
          />
          <Text fontWeight="medium" noOfLines={1} flex={1}>
            {user?.name || user?.username || 'Unknown User'}
          </Text>
          <Text fontSize="sm" color="gray.500" ml={2} whiteSpace="nowrap">
            • {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </Text>
        </Flex>
        
        <Text noOfLines={2} mb={3} color="gray.600" _dark={{ color: "gray.300" }}>
          {description || "No description provided."}
        </Text>
        
        {(expertise || location || deadline || compensation) && (
          <Wrap spacing={2} mb={2}>
            {expertise && (
              <WrapItem>
                <Tag colorScheme="purple" size="sm" borderRadius="full">
                  <TagLeftIcon as={FiBriefcase} />
                  <TagLabel ml={1} noOfLines={1} maxW="150px">
                    {expertise}
                  </TagLabel>
                </Tag>
              </WrapItem>
            )}
            
            {location && !isRemote && (
              <WrapItem>
                <Tag colorScheme="blue" size="sm" borderRadius="full">
                  <TagLeftIcon as={FiMapPin} />
                  <TagLabel ml={1} noOfLines={1} maxW="120px">
                    {location}
                  </TagLabel>
                </Tag>
              </WrapItem>
            )}
            
            {deadline && (
              <WrapItem>
                <Tag colorScheme="orange" size="sm" borderRadius="full">
                  <TagLeftIcon as={FiClock} />
                  <TagLabel ml={1} noOfLines={1} maxW="150px">
                    Due: {formatDate(deadline)}
                  </TagLabel>
                </Tag>
              </WrapItem>
            )}
            
            {compensation && (
              <WrapItem>
                <Tag colorScheme="green" size="sm" borderRadius="full">
                  <TagLeftIcon as={FiDollarSign} />
                  <TagLabel ml={1} noOfLines={1} maxW="120px">
                    {compensation}
                  </TagLabel>
                </Tag>
              </WrapItem>
            )}
          </Wrap>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size={['full', 'xl']} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={bgColor} maxH="90vh" overflowY="auto">
          <ModalHeader>
            <Flex align="center">
              <Text mr={2} noOfLines={1} flex={1} title={title}>
                {title || "Untitled Case"}
              </Text>
              <Badge 
                colorScheme={isRemote ? "green" : "blue"}
                variant="subtle"
                fontSize="0.8em"
                px={2}
                py={1}
                flexShrink={0}
              >
                {isRemote ? "🌍 Remote" : "🏢 On-site"}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Flex align="center" mb={4}>
              <Avatar 
                size="sm" 
                src={user?.profilePicture} 
                name={user?.name || user?.username || 'U'}
                mr={2} 
              />
              <Box>
                <Text fontWeight="medium">{user?.name || user?.username || 'Unknown User'}</Text>
                <Text fontSize="sm" color="gray.500">
                  Posted {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </Text>
              </Box>
            </Flex>
            
            <Box mb={6}>
              <Text fontWeight="bold" mb={2} fontSize="lg">Case Details</Text>
              <Text whiteSpace="pre-wrap" color="gray.700" _dark={{ color: "gray.300" }}>
                {description || "No description provided."}
              </Text>
            </Box>
            
            {(expertise || location || deadline || compensation) && (
              <Box mb={6}>
                <Text fontWeight="bold" mb={3} fontSize="lg">Additional Information</Text>
                <VStack align="stretch" spacing={3}>
                  {expertise && (
                    <Box>
                      <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.400" }}>
                        Required Expertise
                      </Text>
                      <Wrap spacing={2} mt={1}>
                        {expertise.split(',').map((skill, i) => (
                          <Badge key={i} colorScheme="purple" variant="subtle" px={2} py={1}>
                            {skill.trim()}
                          </Badge>
                        ))}
                      </Wrap>
                    </Box>
                  )}
                  
                  {location && !isRemote && (
                    <Box>
                      <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.400" }}>
                        Location
                      </Text>
                      <Text>{location}</Text>
                    </Box>
                  )}
                  
                  {deadline && (
                    <Box>
                      <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.400" }}>
                        Application Deadline
                      </Text>
                      <Text>{formatDate(deadline)}</Text>
                    </Box>
                  )}
                  
                  {compensation && (
                    <Box>
                      <Text fontWeight="semibold" color="gray.600" _dark={{ color: "gray.400" }}>
                        Compensation
                      </Text>
                      <Text>{compensation}</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}
            
            {!isOwner && (
              <Box mt={8}>
                <Divider mb={6} />
                <VStack spacing={4}>
                  <Text fontWeight="semibold">
                    {hasApplied 
                      ? "You've already applied to this case" 
                      : "Interested in this case?"}
                  </Text>
                  
                  {!hasApplied && (
                    <>
                      <Textarea
                        placeholder="Write a brief message explaining why you're a good fit for this case..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        minH="100px"
                      />
                      <Button 
                        colorScheme="blue" 
                        onClick={handleApplyForCase}
                        isLoading={isApplying}
                        isDisabled={!applicationMessage.trim()}
                        w="full"
                        size="lg"
                      >
                        {isApplying ? "Submitting..." : "Apply for this Case"}
                      </Button>
                    </>
                  )}
                  
                  {hasApplied && (
                    <Button 
                      colorScheme="green" 
                      variant="outline"
                      w="full"
                      isDisabled
                      leftIcon={<CheckIcon />}
                    >
                      Application Submitted
                    </Button>
                  )}
                </VStack>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Applicants Modal */}
      {showApplicants && caseId && (
        <CaseApplicants 
          caseId={caseId} 
          isOpen={isApplicantsOpen} 
          onClose={onApplicantsClose} 
        />
      )}
    </>
  );
};

export default Case; 