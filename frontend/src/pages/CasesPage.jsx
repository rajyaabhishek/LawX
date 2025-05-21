import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Input, 
  InputGroup, 
  InputLeftElement, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs, 
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Spinner,
  Icon,
  Badge,
  useDisclosure,
  Tooltip
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiSearch, FiPlus, FiBriefcase, FiClock, FiUserCheck } from "react-icons/fi";
import { useRecoilState, useRecoilValue } from "recoil";
import { casesAtom } from "../atoms/casesAtom";
import userAtom from "../atoms/userAtom";
import Case from "../components/Case";
import CaseCreation from "../components/CaseCreation";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { useCallback } from "react";

const CasesPage = () => {
  const [cases, setCases] = useRecoilState(casesAtom);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingMyCases, setLoadingMyCases] = useState(false);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  
  const tabs = [
    { id: 'browse', label: 'Browse Cases', icon: <Icon as={FiBriefcase} mr={2} /> },
    { id: 'my-cases', label: 'My Cases', icon: <Icon as={FiClock} mr={2} /> },
    { id: 'applications', label: 'My Applications', icon: <Icon as={FiUserCheck} mr={2} /> },
  ];

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/api/v1/cases", {
        params: { search: searchQuery || undefined }
      });
      setCases(data);
    } catch (error) {
      console.error('Error fetching cases:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch cases", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, setCases, showToast]);

  useEffect(() => {
    if (tabIndex === 0) {
      const debounceTimer = setTimeout(() => {
        fetchCases();
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, tabIndex, fetchCases]);

  const fetchMyCases = useCallback(async () => {
    try {
      setLoadingMyCases(true);
      const { data } = await axiosInstance.get("/api/v1/cases/my/cases");
      setMyCases(data);
    } catch (error) {
      console.error('Error fetching my cases:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your cases", "error");
    } finally {
      setLoadingMyCases(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tabIndex === 1) {
      fetchMyCases();
    }
  }, [tabIndex, fetchMyCases]);

  const fetchMyApplications = useCallback(async () => {
    try {
      setLoadingApplications(true);
      const { data } = await axiosInstance.get("/api/v1/cases/my/applications");
      setMyApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your applications", "error");
    } finally {
      setLoadingApplications(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tabIndex === 2) {
      fetchMyApplications();
    }
  }, [tabIndex, fetchMyApplications]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredCases = cases.filter(caseItem => 
    caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    caseItem.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCaseStatus = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', label: 'Pending' },
      accepted: { color: 'green', label: 'Accepted' },
      rejected: { color: 'red', label: 'Rejected' },
      completed: { color: 'blue', label: 'Completed' },
      cancelled: { color: 'gray', label: 'Cancelled' }
    };

    const config = statusConfig[status?.toLowerCase()] || { color: 'gray', label: 'Unknown' };
    return (
      <Badge colorScheme={config.color} variant="subtle" px={2} py={0.5} borderRadius="full">
        {config.label}
      </Badge>
    );
  };

  return (
    <Box p={{ base: 3, md: 6 }} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Heading size="lg">Legal Cases</Heading>
        <Button 
          colorScheme="blue" 
          leftIcon={<Icon as={FiPlus} />}
          onClick={onOpen}
          size={{ base: 'sm', md: 'md' }}
        >
          Create Case
        </Button>
      </Flex>
      
      <CaseCreation isOpen={isOpen} onClose={onClose} onSuccess={fetchCases} />

      <Tabs 
        variant="enclosed" 
        isFitted 
        colorScheme="blue"
        index={tabIndex}
        onChange={(index) => setTabIndex(index)}
        mb={6}
      >
        <TabList mb={6} overflowX="auto" overflowY="hidden" pb={1}>
          {tabs.map((tab) => (
            <Tab 
              key={tab.id} 
              fontSize={{ base: 'sm', md: 'md' }}
              whiteSpace="nowrap"
              display="flex"
              alignItems="center"
              _selected={{ 
                color: 'blue.500', 
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold' 
              }}
            >
              {tab.icon}
              <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                {tab.label}
              </Box>
            </Tab>
          ))}
        </TabList>

        <Box mb={6} maxW="500px" w="100%">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={handleSearch}
              pl={10}
              bg={cardBg}
              borderColor={borderColor}
              _hover={{ borderColor: 'blue.300' }}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              }}
            />
          </InputGroup>
        </Box>

        <TabPanels>
          {/* Browse Cases Tab */}
          <TabPanel p={0}>
            {loading ? (
              <Flex justify="center" p={12}>
                <Spinner size="xl" />
              </Flex>
            ) : filteredCases.length === 0 ? (
              <Box 
                textAlign="center" 
                p={12} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
              >
                <Text fontSize="lg" color={mutedText} mb={4}>
                  {searchQuery 
                    ? 'No cases match your search.' 
                    : 'No cases available at the moment.'}
                </Text>
                {!searchQuery && (
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<Icon as={FiPlus} />}
                    onClick={onOpen}
                  >
                    Create the first case
                  </Button>
                )}
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {filteredCases.map((caseItem) => (
                  <Case key={caseItem._id} caseData={caseItem} />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* My Cases Tab */}
          <TabPanel p={0}>
            {loadingMyCases ? (
              <Flex justify="center" p={12}>
                <Spinner size="xl" />
              </Flex>
            ) : myCases.length === 0 ? (
              <Box 
                textAlign="center" 
                p={12} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
              >
                <Text fontSize="lg" color={mutedText} mb={4}>
                  You haven't created any cases yet.
                </Text>
                <Button 
                  colorScheme="blue" 
                  leftIcon={<Icon as={FiPlus} />}
                  onClick={onOpen}
                >
                  Create your first case
                </Button>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {myCases.map((caseItem) => (
                  <Case 
                    key={caseItem._id} 
                    caseData={caseItem} 
                    showApplicants={true}
                  />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* My Applications Tab */}
          <TabPanel p={0}>
            {loadingApplications ? (
              <Flex justify="center" p={12}>
                <Spinner size="xl" />
              </Flex>
            ) : myApplications.length === 0 ? (
              <Box 
                textAlign="center" 
                p={12} 
                bg={cardBg} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
              >
                <Text fontSize="lg" color={mutedText} mb={4}>
                  You haven't applied to any cases yet.
                </Text>
                <Button 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={() => setTabIndex(0)}
                >
                  Browse available cases
                </Button>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {myApplications.map((application) => (
                  <Box key={application._id} position="relative">
                    <Case 
                      caseData={application.case} 
                      showApplicants={false}
                    />
                    <Box position="absolute" top={4} right={4}>
                      <Tooltip label={`Application Status: ${application.status}`}>
                        {renderCaseStatus(application.status)}
                      </Tooltip>
                    </Box>
                    {application.message && (
                      <Box 
                        mt={2} 
                        p={3} 
                        bg={useColorModeValue('blue.50', 'blue.900')} 
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="blue.500"
                      >
                        <Text fontSize="sm" color={mutedText}>
                          <Text as="span" fontWeight="medium" color={mutedText}>
                            Your application: 
                          </Text>
                          {application.message}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default CasesPage; 