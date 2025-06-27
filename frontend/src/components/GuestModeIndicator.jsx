import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Icon,
  Progress,
  Button,
  Collapse,
  VStack,
  useColorModeValue,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import { useAuthContext } from '../context/AuthContext';
import { FaEye, FaChevronUp, FaChevronDown, FaClock, FaArrowUp } from 'react-icons/fa';
import useShowToast from '../hooks/useShowToast';

const GuestModeIndicator = () => {
  const { isGuestMode, guestTimeLeft, isSignedIn } = useAuthContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const showToast = useShowToast();

  const bgColor = useColorModeValue('orange.500', 'orange.600');
  const textColor = 'white';
  const progressBg = useColorModeValue('orange.600', 'orange.700');

  // Blink animation when time is running low
  useEffect(() => {
    if (guestTimeLeft <= 60 && guestTimeLeft > 0) {
      const interval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsBlinking(false);
    }
  }, [guestTimeLeft]);

  // Show warning toasts at specific time intervals
  useEffect(() => {
    if (!isGuestMode) return;

    if (guestTimeLeft === 120) { // 2 minutes left
      showToast(
        "2 minutes remaining",
        "Sign up now to continue your LawX experience!",
        "warning"
      );
    } else if (guestTimeLeft === 30) { // 30 seconds left
      showToast(
        "30 seconds remaining",
        "Your guest session will expire soon!",
        "error"
      );
    }
  }, [guestTimeLeft, isGuestMode, showToast]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (guestTimeLeft <= 30) return 'red';
    if (guestTimeLeft <= 120) return 'yellow';
    return 'green';
  };

  const handleSignUpClick = () => {
    window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
  };

  // Don't render if user is signed in or not in guest mode
  if (isSignedIn || !isGuestMode) return null;

  return (
    <Box
      position="fixed"
      top={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex={1400}
      bg={bgColor}
      color={textColor}
      borderRadius="xl"
      shadow="xl"
      overflow="hidden"
      minW="300px"
      opacity={isBlinking ? 0.7 : 1}
      transition="all 0.3s ease"
      border="2px solid"
      borderColor="whiteAlpha.300"
    >
      {/* Collapsed View */}
      <Box p={3}>
        <HStack spacing={3} justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaEye} />
            <Text fontSize="sm" fontWeight="bold">
              Guest Mode
            </Text>
            <Badge colorScheme="orange" variant="solid" fontSize="xs">
              {formatTime(guestTimeLeft)}
            </Badge>
          </HStack>
          
          <HStack spacing={2}>
            <Tooltip label="Sign up for unlimited access" placement="bottom">
              <Button
                size="xs"
                colorScheme="whiteAlpha"
                variant="solid"
                onClick={handleSignUpClick}
                leftIcon={<FaArrowUp />}
              >
                Upgrade
              </Button>
            </Tooltip>
            
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              p={1}
            >
              <Icon as={isExpanded ? FaChevronUp : FaChevronDown} />
            </Button>
          </HStack>
        </HStack>

        {/* Progress Bar */}
        <Progress
          value={(guestTimeLeft / 300) * 100}
          size="sm"
          colorScheme={getProgressColor()}
          bg={progressBg}
          borderRadius="full"
          mt={2}
        />
      </Box>

      {/* Expanded View */}
      <Collapse in={isExpanded}>
        <Box px={3} pb={3} borderTop="1px solid" borderColor="whiteAlpha.300">
          <VStack spacing={3} align="start" pt={3}>
            <HStack spacing={2}>
              <Icon as={FaClock} fontSize="sm" />
              <Text fontSize="sm">
                Time remaining: {formatTime(guestTimeLeft)}
              </Text>
            </HStack>
            
            <Text fontSize="xs" opacity={0.9}>
              You're browsing as a guest. Sign up to unlock:
            </Text>
            
            <VStack spacing={1} align="start" fontSize="xs" opacity={0.9}>
              <Text>• Unlimited browsing time</Text>
              <Text>• Save and manage cases</Text>
              <Text>• Connect with lawyers</Text>
              <Text>• Apply to cases</Text>
              <Text>• Premium features</Text>
            </VStack>

            <HStack spacing={2} w="full" pt={2}>
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                variant="solid"
                onClick={handleSignUpClick}
                flex={1}
              >
                Sign Up Free
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signin' } }));
                }}
                flex={1}
              >
                Sign In
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default GuestModeIndicator; 