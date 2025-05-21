import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import useShowToast from "../hooks/useShowToast";

const CaseApplyForm = ({ caseId, onSuccess }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useShowToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/cases/${caseId}/apply`, {
        message: applicationMessage,
      });

      showToast("Success", "Application submitted successfully", "success");
      setApplicationMessage("");
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast("Error", error.response?.data?.error || "Failed to submit application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button colorScheme="blue" onClick={onOpen}>
        Apply for this Case
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Apply for Case</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired>
                <FormLabel>Cover Message</FormLabel>
                <Textarea
                  placeholder="Introduce yourself and explain why you're a good fit for this case"
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={6}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                colorScheme="blue" 
                isLoading={isSubmitting}
                loadingText="Submitting"
              >
                Submit Application
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CaseApplyForm; 