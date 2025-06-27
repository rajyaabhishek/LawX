import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Checkbox,
  CheckboxGroup,
  Stack,
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";

const BecomeLawyerModal = ({ isOpen, onClose, onSuccess }) => {
  const [specialization, setSpecialization] = useState([]);
  const [barLicenseNumber, setBarLicenseNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useShowToast();

  const specializationOptions = [
    "Corporate Law",
    "Criminal Law",
    "Civil Law",
    "Family Law",
    "Property Law",
    "Intellectual Property",
    "Labor Law",
    "Tax Law",
    "Constitutional Law",
    "Environmental Law",
    "Immigration Law",
    "Personal Injury"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (specialization.length === 0) {
      showToast("Error", "Please select at least one specialization", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/users/become-lawyer", {
        specialization,
        barLicenseNumber: barLicenseNumber.trim() || undefined
      });

      showToast("Success!", "Your account has been upgraded to lawyer status", "success");

      onClose();
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch (error) {
      console.error("Error becoming lawyer:", error);
      showToast("Error", error.response?.data?.error || "Failed to upgrade account", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSpecialization([]);
    setBarLicenseNumber("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Become a Lawyer on LawX</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                Upgrade your account to apply for legal cases and offer professional services.
              </Alert>

              <FormControl isRequired>
                <FormLabel>Specialization Areas</FormLabel>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Select your areas of legal expertise:
                </Text>
                <CheckboxGroup 
                  value={specialization} 
                  onChange={setSpecialization}
                >
                  <Stack direction={["column", "row"]} wrap="wrap" spacing={2}>
                    {specializationOptions.map((option) => (
                      <Checkbox key={option} value={option} size="sm">
                        {option}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Bar License Number (Optional)</FormLabel>
                <Input
                  value={barLicenseNumber}
                  onChange={(e) => setBarLicenseNumber(e.target.value)}
                  placeholder="Enter your bar license number"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  This helps build trust with potential clients
                </Text>
              </FormControl>

              <Alert status="warning" size="sm">
                <AlertIcon />
                For demo purposes, accounts are auto-verified. In production, this would require manual review.
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              colorScheme="blue" 
              isLoading={isLoading}
              loadingText="Upgrading..."
            >
              Become a Lawyer
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default BecomeLawyerModal; 