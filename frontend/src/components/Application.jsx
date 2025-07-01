import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useColorModeValue,
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
import { useState, useMemo } from "react";
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
  FiBriefcase,
  FiFileText,
  FiClock as FiClockIcon
} from "react-icons/fi";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

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

const Application = ({ applicationData, onUpdate }) => {
  // Return null if applicationData is not available
  if (!applicationData) {
    return null;
  }
  
  // Safely destructure with defaults
  const {
    _id: applicationId,
    status = "pending",
    appliedAt = new Date().toISOString(),
    message = "",
    case: caseData = {},
    user = {}
  } = applicationData;

  // Extract case information
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
    user: caseOwner = {},
    caseType = "",
    createdAt = new Date().toISOString()
  } = caseData;
  
  // Format budget/compensation for display
  const budgetDisplay = budget 
    ? `${budget.currency || 'USD'} ${budget.amount?.toLocaleString() || 0} (${budget.type || 'Fixed'})`
    : compensation;
  
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const primaryTextColor = useColorModeValue("gray.800", "white");

  const statusConfig = {
    pending: { color: 'yellow', label: 'Pending', bgColor: 'yellow.50', textColor: 'yellow.700' },
    accepted: { color: 'green', label: 'Accepted', bgColor: 'green.50', textColor: 'green.700' },
    rejected: { color: 'red', label: 'Rejected', bgColor: 'red.50', textColor: 'red.700' },
    completed: { color: 'blue', label: 'Completed', bgColor: 'blue.50', textColor: 'blue.700' },
    cancelled: { color: 'gray', label: 'Cancelled', bgColor: 'gray.50', textColor: 'gray.700' }
  };

  const currentStatus = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  const getStatusMessage = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return "Waiting for response...";
      case 'accepted':
        return "Application accepted.";
      case 'rejected':
        return "Unfortunately, your application was not selected.";
      case 'completed':
        return "✅ Case completed successfully.";
      case 'cancelled':
        return "This case has been cancelled.";
      default:
        return "";
    }
  };

  return (
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
      {/* Header section with status and case type */}
      <Flex justify="space-between" align="flex-start" mb={4}>
        <HStack spacing={3} flex={1}>
          <Badge 
            variant="outline"
            colorScheme={status === 'pending' ? undefined : currentStatus.color}
            fontSize="xs" 
            px={1.5} 
            py={0.5}
            borderRadius="md"
            borderColor={status === 'pending' ? "orange.400" : undefined}
            color={status === 'pending' ? "orange.600" : undefined}
            _dark={{
              borderColor: status === 'pending' ? "orange.300" : undefined,
              color: status === 'pending' ? "orange.300" : undefined
            }}
            
          >
            {currentStatus.label}
          </Badge>
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
        
        <Text fontSize="sm" color={mutedTextColor}>
          Applied {formatDistanceToNow(new Date(appliedAt))} ago
        </Text>
      </Flex>

      {/* Case Title and Description */}
      <Box mb={4}>
        <Heading 
          size="md" 
          color={primaryTextColor} 
          mb={2}
        >
          {title}
        </Heading>
        <Text 
          color={mutedTextColor} 
          fontSize="sm" 
          noOfLines={3} 
          lineHeight="1.5"
        >
          {description}
        </Text>
      </Box>

      {/* Case Details Grid */}
      <VStack spacing={3} align="stretch" mb={4}>
        <Stack 
          direction={{ base: "column", md: "row" }} 
          spacing={4} 
          fontSize="sm"
        >
          {budgetDisplay && (
            <HStack color={mutedTextColor}>
              <FiDollarSign size={16} />
              <Text>{budgetDisplay}</Text>
            </HStack>
          )}
          
          <HStack color={mutedTextColor}>
            <FiMapPin size={16} />
            <Text>{location || "Location not specified"}</Text>
            {isRemote && <Text>• Remote work available</Text>}
          </HStack>
          
          {deadline && (
            <HStack color={mutedTextColor}>
              <FiCalendar size={16} />
              <Text>Due: {formatDate(deadline)}</Text>
            </HStack>
          )}
        </Stack>
      </VStack>

      {/* Case Owner Info */}
      {caseOwner && caseOwner.name && (
        <Box mb={4}>
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              src={caseOwner.profilePicture || caseOwner.avatar} 
              name={caseOwner.name || caseOwner.username}
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium" color={primaryTextColor}>
                {caseOwner.name || caseOwner.username}
              </Text>
              <Text fontSize="xs" color={mutedTextColor}>
                Case Owner
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Status Message */}
      {getStatusMessage() && (
        <Box 
          bg={useColorModeValue(currentStatus.bgColor, "gray.700")}
          p={3}
          borderRadius="md"
          mb={4}
        >
          <Text 
            fontSize="sm" 
            color={useColorModeValue(currentStatus.textColor, "white")}
            fontStyle={status?.toLowerCase() === 'pending' ? 'italic' : 'normal'}
            fontWeight={status?.toLowerCase() === 'accepted' ? 'semibold' : 'normal'}
          >
            {getStatusMessage()}
          </Text>
        </Box>
      )}

      {/* Footer with timestamp */}
      <Flex justify="space-between" align="center" mt={4} pt={3} borderTop="1px" borderColor={borderColor}>
        <Text fontSize="xs" color={mutedTextColor}>
          Case posted {formatDistanceToNow(new Date(createdAt))} ago
        </Text>
      </Flex>
    </Box>
  );
};

export default Application;
