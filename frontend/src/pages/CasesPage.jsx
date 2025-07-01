import { 
  Avatar,
  Badge,
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
  Tooltip,
  useColorModeValue,
  VStack,
  HStack,
  Spinner,
  Icon,
  Wrap,
  Select,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Tag,
  TagLabel,
  TagCloseButton,
  Collapse,
  useDisclosure,
  FormControl,
  FormLabel,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Stack,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue
} from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
import { FiSearch, FiPlus, FiBriefcase, FiClock, FiUserCheck, FiFilter, FiX, FiChevronDown, FiChevronUp, FiMapPin, FiDollarSign } from "react-icons/fi";
import { useRecoilState, useRecoilValue } from "recoil";
import { casesAtom } from "../atoms/casesAtom";
import userAtom from "../atoms/userAtom";
import Case from "../components/Case";
import CaseCreation from "../components/CaseCreation";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { useCallback } from "react";

// FilterSection component moved outside to prevent re-creation
const FilterSection = ({ 
  filters, 
  handleFilterChange, 
  handleExpertiseToggle, 
  clearFilters, 
  hasActiveFilters,
  caseTypes,
  expertiseOptions,
  sortOptions,
  cardBg,
  borderColor
}) => (
  <Box bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderColor} shadow="sm">
    <Flex align="center" justify="space-between" mb={3}>
      <HStack>
        <Icon as={FiFilter} />
        <Text fontWeight="semibold">Filters</Text>
        {hasActiveFilters && (
          <Badge colorScheme="blue" variant="subtle">
            Active
          </Badge>
        )}
      </HStack>
      <Button size="sm" variant="ghost" onClick={clearFilters} leftIcon={<Icon as={FiX} />}>
        Clear All
      </Button>
    </Flex>

    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
      {/* Case Type Filter */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">Case Type</FormLabel>
        <Select 
          placeholder="All case types"
          value={filters.caseType}
          onChange={(e) => handleFilterChange('caseType', e.target.value)}
          size="sm"
        >
          {caseTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
      </FormControl>

      {/* Location Filter */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">Location</FormLabel>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiMapPin} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Enter location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </InputGroup>
      </FormControl>

      {/* Budget Range */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">Min Budget (USD)</FormLabel>
        <NumberInput 
          size="sm"
          value={filters.minBudget}
          onChange={(value) => handleFilterChange('minBudget', value)}
          min={0}
        >
          <NumberInputField placeholder="0" />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">Max Budget (USD)</FormLabel>
        <NumberInput 
          size="sm"
          value={filters.maxBudget}
          onChange={(value) => handleFilterChange('maxBudget', value)}
          min={0}
        >
          <NumberInputField placeholder="0" />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      {/* Remote Work Filter */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">Work Type</FormLabel>
        <Select 
          placeholder="All work types"
          value={filters.isRemote}
          onChange={(e) => handleFilterChange('isRemote', e.target.value)}
          size="sm"
        >
          <option value="true">Remote Only</option>
          <option value="false">On-site Only</option>
        </Select>
      </FormControl>
    </SimpleGrid>

    {/* Expertise Filter */}
    <Box mt={3}>
      <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Expertise Areas</FormLabel>
      <Wrap spacing={2}>
        {expertiseOptions.map(expertise => (
          <Tag
            key={expertise}
            size="sm"
            variant={filters.expertise.includes(expertise) ? "solid" : "outline"}
            colorScheme={filters.expertise.includes(expertise) ? "blue" : "gray"}
            cursor="pointer"
            onClick={() => handleExpertiseToggle(expertise)}
          >
            <TagLabel>{expertise}</TagLabel>
            {filters.expertise.includes(expertise) && (
              <TagCloseButton onClick={(e) => {
                e.stopPropagation();
                handleExpertiseToggle(expertise);
              }} />
            )}
          </Tag>
        ))}
      </Wrap>
    </Box>

    {/* Sort Options */}
    <Box mt={3}>
      <FormLabel fontSize="sm" fontWeight="medium">Sort By</FormLabel>
      <Select 
        value={filters.sortBy}
        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        size="sm"
        maxW="250px"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Select>
    </Box>
  </Box>
);

const CasesPage = () => {
  const [cases, setCases] = useRecoilState(casesAtom);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingMyCases, setLoadingMyCases] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  
  // Advanced filters
  const [filters, setFilters] = useState({
    caseType: '',
    expertise: [],
    location: '',
    minBudget: '',
    maxBudget: '',
    isRemote: '',
    sortBy: 'newest'
  });
  
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { isOpen: isFiltersOpen, onToggle: onFiltersToggle } = useDisclosure();
  const { isOpen: isFilterDrawerOpen, onOpen: onFilterDrawerOpen, onClose: onFilterDrawerClose } = useDisclosure();
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Available filter options
  const caseTypes = ['Civil', 'Criminal', 'Corporate', 'Family', 'Property', 'Intellectual Property', 'Labor', 'Tax', 'Other'];
  const expertiseOptions = [
    'Contract Law', 'Litigation', 'Corporate Law', 'Real Estate', 'Family Law',
    'Criminal Defense', 'Intellectual Property', 'Employment Law', 'Tax Law',
    'Immigration Law', 'Personal Injury', 'Estate Planning', 'Banking Law',
    'Environmental Law', 'International Law', 'Mergers & Acquisitions'
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'budget_high', label: 'Budget: High to Low' },
    { value: 'budget_low', label: 'Budget: Low to High' }
  ];

  const fetchCases = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...filters
      };
      
      // Add search query if exists
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Clean up empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || 
            (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });
      
      const response = await axiosInstance.get("/cases", { params });
      console.log('API Response:', response);
      
      const responseData = response.data || {};
      const casesData = Array.isArray(responseData.cases) ? responseData.cases : [];
      console.log('Setting cases:', casesData);
      
      setCases(casesData);
      setPagination(responseData.pagination || { total: 0, page: 1, pages: 0 });
    } catch (error) {
      console.error('Error fetching cases:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch cases", "error");
      setCases([]);
      setPagination({ total: 0, page: 1, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, setCases, showToast]);

  useEffect(() => {
    if (tabIndex === 0) {
      const debounceTimer = setTimeout(() => {
        fetchCases(1); // Reset to first page when filters change
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, filters, tabIndex, fetchCases]);

  const fetchMyCases = useCallback(async () => {
    try {
      setLoadingMyCases(true);
      const { data } = await axiosInstance.get("/cases/my/cases");
      const casesData = data?.cases || [];
      setMyCases(Array.isArray(casesData) ? casesData : []);
    } catch (error) {
      console.error('Error fetching my cases:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your cases", "error");
      setMyCases([]);
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
      const { data } = await axiosInstance.get("/cases/my/applications");
      const applicationsData = data?.applications || [];
      setMyApplications(Array.isArray(applicationsData) ? applicationsData : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast("Error", error.response?.data?.error || "Failed to fetch your applications", "error");
      setMyApplications([]);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExpertiseToggle = (expertise) => {
    setFilters(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise]
    }));
  };

  const clearFilters = () => {
    setFilters({
      caseType: '',
      expertise: [],
      location: '',
      minBudget: '',
      maxBudget: '',
      isRemote: '',
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = useMemo(() => {
    return searchQuery || 
           filters.caseType || 
           filters.expertise.length > 0 || 
           filters.location || 
           filters.minBudget || 
           filters.maxBudget || 
           filters.isRemote ||
           filters.sortBy !== 'newest';
  }, [searchQuery, filters]);

  const loadMoreCases = () => {
    fetchCases(pagination.page + 1);
  };

  // Memoized callbacks to prevent re-renders
  const handleCaseCreationClose = useCallback(() => {
    setTabIndex(0);
  }, []);

  const handleCaseCreationSuccess = useCallback(() => {
    fetchCases();
    fetchMyCases();
    setTabIndex(1);
  }, [fetchCases, fetchMyCases]);



  const statusConfig = {
    pending: { color: 'yellow', label: 'Pending' },
    accepted: { color: 'green', label: 'Accepted' },
    rejected: { color: 'red', label: 'Rejected' },
    completed: { color: 'blue', label: 'Completed' },
    cancelled: { color: 'gray', label: 'Cancelled' }
  };

  const isPremiumUser = currentUser?.isPremium && currentUser?.isVerified;

  const tabs = [
    { id: 'browse', label: 'Browse Cases', icon: <Icon as={FiBriefcase} mr={2} /> },
    { id: 'my-cases', label: 'My Cases', icon: <Icon as={FiClock} mr={2} /> },
    { id: 'applications', label: 'My Applications', icon: <Icon as={FiUserCheck} mr={2} /> },
    ...(isPremiumUser ? [{ id: 'create', label: 'Create Case', icon: <Icon as={FiPlus} mr={2} /> }] : []),
  ];

  return (
    <Box
      maxW="7xl"
      mx="auto"
      p={{ base: 2, md: 3 }}
      minH="calc(100vh - 120px)"
      bg={bgColor}
    >
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={tabIndex} 
        onChange={setTabIndex}
        size={{ base: "md", md: "lg" }}
      >
        <TabList 
          mb={3} 
          justifyContent={{ base: "start", md: "center" }} 
          flexWrap="wrap"
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.id} 
              _selected={{ color: "blue.600", borderColor: "blue.600" }}
              flexShrink={0}
              fontSize={{ base: "sm", md: "md" }}
              px={{ base: 2, md: 4 }}
            >
              <Flex align="center" direction={{ base: "column", sm: "row" }}>
                {tab.icon}
                <Text display={{ base: "none", sm: "block" }}>{tab.label}</Text>
                <Text display={{ base: "block", sm: "none" }} fontSize="xs">
                  {tab.label.split(' ')[0]}
                </Text>
              </Flex>
            </Tab>
          ))}
        </TabList>

        {/* Search Bar - Only show on Browse Cases tab */}
        {tabIndex === 0 && (
          <VStack spacing={{ base: 3, md: 2 }} mb={3}>
            <Box maxW="600px" w="100%">
              <InputGroup size={{ base: "md", md: "lg" }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={handleSearch}
                  pl={{ base: 10, md: 12 }}
                  bg={cardBg}
                  borderColor={borderColor}
                  borderRadius="xl"
                  fontSize={{ base: "sm", md: "md" }}
                  _hover={{ borderColor: 'blue.300' }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                  }}
                />
              </InputGroup>
            </Box>

            {/* Filter Toggle Button */}
            <Stack 
              direction={{ base: "column", sm: "row" }} 
              spacing={4} 
              align="center"
              w="100%"
              justify="center"
            >
              <Button
                variant={hasActiveFilters ? "solid" : "outline"}
                colorScheme="blue"
                leftIcon={<Icon as={FiFilter} />}
                rightIcon={<Icon as={isFiltersOpen ? FiChevronUp : FiChevronDown} />}
                onClick={onFiltersToggle}
                size={{ base: "sm", md: "md" }}
                fontSize={{ base: "sm", md: "md" }}
              >
                {hasActiveFilters ? 'Filters Applied' : 'Show Filters'}
              </Button>
              
              {hasActiveFilters && (
                <Text 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color={mutedText}
                  textAlign="center"
                >
                  {pagination.total} case{pagination.total !== 1 ? 's' : ''} found
                </Text>
              )}
            </Stack>

            {/* Filters Section */}
            <Box w="100%">
              <Collapse in={isFiltersOpen} animateOpacity>
                <FilterSection 
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  handleExpertiseToggle={handleExpertiseToggle}
                  clearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  caseTypes={caseTypes}
                  expertiseOptions={expertiseOptions}
                  sortOptions={sortOptions}
                  cardBg={cardBg}
                  borderColor={borderColor}
                />
              </Collapse>
            </Box>
          </VStack>
        )}

        <TabPanels>
          {/* Browse Cases Tab */}
          <TabPanel p={0}>
            {loading ? (
              <Flex justify="center" p={12}>
                <Spinner size="xl" />
              </Flex>
            ) : cases.length === 0 ? (
              <Box 
                textAlign="center" 
                p={12} 
                bg={cardBg} 
                borderRadius="xl" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="sm"
              >
                <Text fontSize="4xl" mb={4}>⚖️</Text>
                <Text fontSize="xl" fontWeight="semibold" color={mutedText} mb={2}>
                  {hasActiveFilters 
                    ? 'No cases match your criteria' 
                    : 'No cases available yet'}
                </Text>
                <Text fontSize="md" color={mutedText} mb={6}>
                  {hasActiveFilters 
                    ? 'Try adjusting your search terms or filters' 
                    : 'Be the first to post a legal case!'}
                </Text>
                {hasActiveFilters ? (
                  <Button 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={clearFilters}
                    size="lg"
                  >
                    Clear filters
                  </Button>
                ) : isPremiumUser && (
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<Icon as={FiPlus} />}
                    onClick={() => setTabIndex(3)}
                    size="lg"
                  >
                    Create the first case
                  </Button>
                )}
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {cases.map((caseItem) => (
                  <Case key={caseItem._id} caseData={caseItem} />
                ))}
                
                {/* Load More Button */}
                {pagination.page < pagination.pages && (
                  <Flex justify="center" mt={3}>
                    <Button
                      onClick={loadMoreCases}
                      variant="outline"
                      size="lg"
                      isLoading={loading}
                      loadingText="Loading more..."
                    >
                      Load More Cases ({pagination.page}/{pagination.pages})
                    </Button>
                  </Flex>
                )}
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
                borderRadius="xl" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="sm"
              >
                <Text fontSize="4xl" mb={4}>📋</Text>
                <Text fontSize="xl" fontWeight="semibold" color={mutedText} mb={2}>
                  No cases created yet
                </Text>
                <Text fontSize="md" color={mutedText} mb={6}>
                  Start by creating your first legal case to find qualified lawyers
                </Text>
                <Button 
                  colorScheme="blue" 
                  leftIcon={<Icon as={FiPlus} />}
                  onClick={() => setTabIndex(3)}
                  size="lg"
                >
                  Create your first case
                </Button>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {myCases.map((caseItem) => (
                  <Case 
                    key={caseItem._id} 
                    caseData={caseItem} 
                    showApplicants={true}
                    hideLikeButton={true}
                    onUpdate={(updatedCase) => {
                      try {
                        if (updatedCase === null) {
                          // Case was deleted, remove it from the list
                          setMyCases(prev => {
                            const filteredCases = prev.filter(c => c._id !== caseItem._id);
                            console.log('Removed case, remaining cases:', filteredCases.length);
                            return filteredCases;
                          });
                        } else {
                          // Case was updated, update it in the list
                          setMyCases(prev => 
                            prev.map(c => c._id === updatedCase._id ? updatedCase : c)
                          );
                          fetchMyCases();
                        }
                      } catch (error) {
                        console.error('Error updating case list:', error);
                        // Fallback: refetch all cases
                        fetchMyCases();
                      }
                    }}
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
                borderRadius="xl" 
                borderWidth="1px" 
                borderColor={borderColor}
                shadow="sm"
              >
                <Text fontSize="4xl" mb={4}>💼</Text>
                <Text fontSize="xl" fontWeight="semibold" color={mutedText} mb={2}>
                  No applications submitted yet
                </Text>
                <Text fontSize="md" color={mutedText} mb={6}>
                  Browse available cases and apply to ones that match your expertise
                </Text>
                <Button 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={() => setTabIndex(0)}
                  size="lg"
                >
                  Browse available cases
                </Button>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {myApplications.map((application) => (
                  <Box
                    key={application._id}
                    p={6}
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    shadow="sm"
                  >
                    <HStack justify="space-between" mb={3}>
                      <Heading size="md" color="blue.600">
                        {application.case.title}
                      </Heading>
                      <Badge 
                        colorScheme={statusConfig[application.status?.toLowerCase()]?.color || 'gray'}
                        variant="subtle" 
                        px={3} 
                        py={1} 
                        borderRadius="full"
                      >
                        {statusConfig[application.status?.toLowerCase()]?.label || application.status}
                      </Badge>
                    </HStack>
                    
                    <Text color={mutedText} mb={3}>
                      {application.case.description}
                    </Text>
                    
                    <HStack spacing={4} fontSize="sm" color={mutedText}>
                      <Text>Applied: {formatDistanceToNow(new Date(application.appliedAt))} ago</Text>
                      <Text>•</Text>
                      <Text>Budget: {application.case.budget?.currency} {application.case.budget?.amount?.toLocaleString()}</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* Create Case Tab */}
          {isPremiumUser && (
            <TabPanel p={0}>
                              <Box 
                bg={cardBg}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
                p={4}
              >
                <CaseCreation 
                  isOpen={true} 
                  onClose={handleCaseCreationClose} 
                  onSuccess={handleCaseCreationSuccess} 
                  isModal={false}
                />
              </Box>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default CasesPage; 