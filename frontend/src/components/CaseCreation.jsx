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
  useDisclosure,
  HStack,
  VStack,
  Text,
  Icon,
  Select,
  Badge,
  FormHelperText,
  InputGroup,
  InputLeftElement,
  Divider,
  Grid,
  GridItem
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { casesAtom } from "../atoms/casesAtom";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { 
  FiFileText, 
  FiTag, 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiAlertTriangle,
  FiPlus,
  FiX,
  FiCalendar,
  FiBriefcase
} from "react-icons/fi";

const CaseCreation = ({ onSuccess, onClose, isModal = true }) => {
  const [cases, setCases] = useRecoilState(casesAtom);
  const currentUser = useRecoilValue(userAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState("");
  const [expertise, setExpertise] = useState([]);
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState({
    amount: "",
    currency: "USD",
    type: "Fixed"
  });
  const [urgency, setUrgency] = useState("Medium");
  const [isRemote, setIsRemote] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useShowToast();
  const bgColor = useColorModeValue("white", "gray.dark");

  const handleAddExpertise = (e) => {
    e.preventDefault();
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (item) => {
    setExpertise(expertise.filter(e => e !== item));
  };

  const handleCaseSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !caseType || expertise.length === 0 || !location) {
      showToast("Error", "Please fill in all required fields", "error");
      return;
    }

    if (!budget.amount) {
      showToast("Error", "Please enter a budget amount", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        caseType,
        expertise,
        location,
        budget: {
          amount: parseFloat(budget.amount),
          currency: budget.currency,
          type: budget.type
        },
        urgency,
        isRemote
      };

      // Add deadline if provided
      if (deadline) {
        payload.deadline = new Date(deadline).toISOString();
      }

      const { data } = await axiosInstance.post("/cases", payload);

      setCases([data, ...cases]);
      
      // Reset form
      setTitle("");
      setDescription("");
      setCaseType("");
      setExpertise([]);
      setLocation("");
      setDeadline("");
      setBudget({
        amount: "",
        currency: "USD",
        type: "Fixed"
      });
      setUrgency("Medium");
      setIsRemote(false);
      
      showToast("Success", "Case posted successfully", "success");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      showToast("Error", error.response?.data?.error || "Failed to post case", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      bg={isModal ? bgColor : "transparent"} 
      p={isModal ? 4 : 0} 
      borderRadius={isModal ? "xl" : "none"} 
      shadow={isModal ? "xl" : "none"} 
      mb={isModal ? 2 : 0}
      maxW="4xl"
      mx="auto"
    >
      <VStack spacing={4} align="stretch">
        <Box textAlign="center" mb={3}>
          <Heading size="lg" color="blue.600" mb={2} display="flex" alignItems="center" justifyContent="center" gap={3}>
            <Icon as={FiBriefcase} />
            Post a New Legal Case
          </Heading>
          <Text color="gray.600" fontSize="md">
            Connect with qualified legal professionals for your case
          </Text>
        </Box>
        
        <form onSubmit={handleCaseSubmit}>
          <VStack spacing={5} align="stretch">
            {/* Basic Information Section */}
            <Box>
          
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={FiFileText} size={16} />
                    Case Title
                  </FormLabel>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Corporate Merger Legal Advisory"
                    size="lg"
                    borderRadius="lg"
                    _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                  />
                  {/* <FormHelperText>Provide a clear, descriptive title for your legal case</FormHelperText> */}
                </FormControl>
                
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel display="flex" alignItems="center" gap={2}>
                        <Icon as={FiTag} size={16} />
                        Case Type
                      </FormLabel>
                      <Select 
                        value={caseType}
                        onChange={(e) => setCaseType(e.target.value)}
                        placeholder="Select case type"
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                      >
                        <option value="Civil">Civil Law</option>
                        <option value="Criminal">Criminal Law</option>
                        <option value="Corporate">Corporate Law</option>
                        <option value="Family">Family Law</option>
                        <option value="Property">Property Law</option>
                        <option value="Intellectual Property">Intellectual Property</option>
                        <option value="Labor">Labor & Employment</option>
                        <option value="Tax">Tax Law</option>
                        <option value="Other">Other</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                  
                  <GridItem>
                    <FormControl>
                      <FormLabel display="flex" alignItems="center" gap={2}>
                        <Icon as={FiAlertTriangle} size={16} />
                        Urgency Level
                      </FormLabel>
                      <Select 
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        size="lg"
                        borderRadius="lg"
                        _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                      >
                        <option value="Low">Low - Can wait weeks</option>
                        <option value="Medium">Medium - Within weeks</option>
                        <option value="High">High - Within days</option>
                        <option value="Critical">Critical - Immediate</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl isRequired>
                  <FormLabel display="flex" alignItems="center" gap={2}>
                    <Icon as={FiFileText} size={16} />
                    Case Description
                  </FormLabel>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your case, including background, objectives, specific requirements, and any relevant deadlines or constraints..."
                    minH="140px"
                    size="lg"
                    borderRadius="lg"
                    _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                  />
                
                </FormControl>
              </VStack>
            </Box>



            
            

            {/* Budget Section */}
            <Box>
           
              <FormControl isRequired>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FiDollarSign} size={16} />
                  Budget
                </FormLabel>
                <HStack spacing={3}>
                  <InputGroup size="lg" flex={2}>
                    <InputLeftElement>
                      <Icon as={FiDollarSign} color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      type="number"
                      value={budget.amount}
                      onChange={(e) => setBudget({...budget, amount: e.target.value})}
                      placeholder="10000"
                      borderRadius="lg"
                      _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                    />
                  </InputGroup>
                  
                  <Select 
                    value={budget.currency}
                    onChange={(e) => setBudget({...budget, currency: e.target.value})}
                    size="lg"
                    borderRadius="lg"
                    flex={1}
                    _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </Select>
                  
                  <Select 
                    value={budget.type}
                    onChange={(e) => setBudget({...budget, type: e.target.value})}
                    size="lg"
                    borderRadius="lg"
                    flex={1}
                    _focus={{ borderColor: "blue.400", shadow: "0 0 0 1px blue.400" }}
                  >
                    <option value="Fixed">Fixed Price</option>
                    <option value="Hourly">Per Hour</option>
                    <option value="Negotiable">Negotiable</option>
                  </Select>
                </HStack>
               
              </FormControl>
            </Box>

            <Divider />

            {/* Additional Options */}
            <Box>

              <Checkbox 
                isChecked={isRemote} 
                onChange={(e) => setIsRemote(e.target.checked)}
                size="lg"
                colorScheme="blue"
              >
                <Text fontSize="md">Remote work </Text>
              </Checkbox>
            </Box>

            {/* Submit Section */}
            <Box pt={4}>
              <HStack spacing={4}>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText="Posting Case..."
                  flex={1}
                  size="lg"
                  borderRadius="lg"
                  leftIcon={<Icon as={FiBriefcase} />}
                  _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                  transition="all 0.2s"
                >
                  Post Case
                </Button>
                {!isModal && onClose && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                    flex={1}
                    size="lg"
                    borderRadius="lg"
                  >
                    Cancel
                  </Button>
                )}
              </HStack>
            </Box>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default CaseCreation; 