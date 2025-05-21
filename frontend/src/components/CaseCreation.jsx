import { 
  Box, 
  Button, 
  Checkbox, 
  Flex, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Stack, 
  Textarea, 
  useColorModeValue, 
  useDisclosure 
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { casesAtom } from "../atoms/casesAtom";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";

const CaseCreation = () => {
  const [cases, setCases] = useRecoilState(casesAtom);
  const currentUser = useRecoilValue(userAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expertise, setExpertise] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [compensation, setCompensation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useShowToast();
  const bgColor = useColorModeValue("white", "gray.dark");

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      showToast("Error", "Title and description are required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/cases", {
        title,
        description,
        expertise,
        location,
        deadline,
        compensation,
        isRemote
      });

      setCases([data, ...cases]);
      
      // Reset form
      setTitle("");
      setDescription("");
      setExpertise("");
      setLocation("");
      setDeadline("");
      setCompensation("");
      setIsRemote(false);
      
      showToast("Success", "Case posted successfully", "success");
    } catch (error) {
      showToast("Error", error.response?.data?.error || "Failed to post case", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg={bgColor} p={4} borderRadius="md" shadow="md" mb={4}>
      <Heading size="md" mb={4}>Post a New Case</Heading>
      <form onSubmit={handleCaseSubmit}>
        <Stack spacing={3}>
          <FormControl isRequired>
            <FormLabel>Case Title</FormLabel>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Corporate Acquisition Legal Support"
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Case Description</FormLabel>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the case details, requirements, and expectations"
              minH="120px"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Required Expertise</FormLabel>
            <Input 
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="E.g., Corporate Law, Mergers & Acquisitions"
            />
          </FormControl>
          
          <Flex gap={4}>
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Deadline</FormLabel>
              <Input 
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </FormControl>
          </Flex>
          
          <FormControl>
            <FormLabel>Compensation</FormLabel>
            <Input 
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder="Hourly rate or fixed amount"
            />
          </FormControl>
          
          <Checkbox 
            isChecked={isRemote} 
            onChange={(e) => setIsRemote(e.target.checked)}
          >
            Remote work possible
          </Checkbox>
          
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Posting..."
          >
            Post Case
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default CaseCreation; 