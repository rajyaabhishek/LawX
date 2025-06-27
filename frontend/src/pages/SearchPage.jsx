import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Box, 
  Icon, 
  VStack,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  HStack,
  Flex,
  Badge,
  Button,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  FormControl,
  FormLabel,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Collapse
} from "@chakra-ui/react";
import { FiSearch, FiUser, FiBriefcase, FiFilter, FiX, FiMapPin, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import UserCard from "../components/UserCard";
import Case from "../components/Case";
import useShowToast from "../hooks/useShowToast";
import { useDisclosure } from "@chakra-ui/react";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 for people, 1 for cases
  const [peopleResults, setPeopleResults] = useState([]);
  const [casesResults, setCasesResults] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useShowToast();

  // Theme values
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  // Advanced filter state (cases only)
  const [filters, setFilters] = useState({
    caseType: "",
    location: "",
    minBudget: "",
    isRemote: "",
    sortBy: "newest",
  });

  const caseTypes = [
    "Civil Law",
    "Criminal Law",
    "Corporate Law",
    "Family Law",
    "Property Law",
    "Intellectual Property",
    "Labor Law",
    "Tax Law",
    "Immigration Law",
    "Personal Injury",
    "Contract Law",
    "Litigation",
    "Real Estate Law",
    "Employment Law",
    "Estate Planning",
    "Banking Law",
    "Environmental Law",
    "International Law",
    "Mergers & Acquisitions",
    "Constitutional Law",
    "Administrative Law",
    "Commercial Law",
    "Insurance Law",
    "Maritime Law",
    "Other",
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "deadline", label: "Deadline" },
    { value: "budget_high", label: "Budget: High to Low" },
    { value: "budget_low", label: "Budget: Low to High" },
  ];

  const hasActiveFilters = useMemo(() => {
    return (
      filters.caseType ||
      filters.location ||
      filters.minBudget ||
      filters.isRemote
    );
  }, [filters]);

  // Disclosure for showing/hiding filters
  const { isOpen: isFiltersOpen, onToggle: onFiltersToggle } = useDisclosure();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      caseType: "",
      location: "",
      minBudget: "",
      isRemote: "",
      sortBy: "newest",
    });
  };

  // Filter UI component (inline to avoid extra files)
  const FilterSection = ({ cardBg, borderColor }) => (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      mb={4}
    >
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
        <Button
          size="sm"
          variant="ghost"
          onClick={clearFilters}
          leftIcon={<Icon as={FiX} />}
        >
          Clear
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3}>
        {/* Case Type */}
        <FormControl maxW="200px">
          <FormLabel fontSize="sm" fontWeight="medium">
            Case Type
          </FormLabel>
          <Select
            placeholder="All types"
            value={filters.caseType}
            onChange={(e) => handleFilterChange("caseType", e.target.value)}
            size="sm"
          >
            {caseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Location */}
        <FormControl maxW="200px">
          <FormLabel fontSize="sm" fontWeight="medium">
            Location
          </FormLabel>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiMapPin} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Enter location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </InputGroup>
        </FormControl>

        {/* Min Budget */}
        <FormControl maxW="200px">
          <FormLabel fontSize="sm" fontWeight="medium">
            Min Budget (USD)
          </FormLabel>
          <NumberInput
            size="sm"
            value={filters.minBudget}
            onChange={(value) => handleFilterChange("minBudget", value)}
            min={0}
          >
            <NumberInputField placeholder="0" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        {/* Remote */}
        <FormControl maxW="200px">
          <FormLabel fontSize="sm" fontWeight="medium">
            Work Type
          </FormLabel>
          <Select
            placeholder="All"
            value={filters.isRemote}
            onChange={(e) => handleFilterChange("isRemote", e.target.value)}
            size="sm"
          >
            <option value="true">Remote</option>
            <option value="false">On-site</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      {/* Sort */}
      <Box mt={3} maxW="200px">
        <FormLabel fontSize="sm" fontWeight="medium">
          Sort By
        </FormLabel>
        <Select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          size="sm"
          maxW="250px"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Box>
    </Box>
  );

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    const tab = searchParams.get('tab');
    if (query) {
      setSearchQuery(query);
    }
    if (tab === 'cases') {
      setActiveTab(1);
    } else if (tab === 'people') {
      setActiveTab(0);
    } else if (query && !tab) {
      // If there's a search query but no specific tab, default to cases
      setActiveTab(1);
    }
  }, [searchParams]);

  // Update URL when search query or tab changes
  const updateUrlParams = useCallback((query, tab) => {
    const newParams = new URLSearchParams();
    if (query.trim()) {
      newParams.set('q', query.trim());
    }
    newParams.set('tab', tab === 0 ? 'people' : 'cases');
    setSearchParams(newParams);
  }, [setSearchParams]);

  // Search for people
  const searchPeople = useCallback(async (query) => {
    if (!query.trim()) {
      setPeopleResults([]);
      return;
    }

    try {
      setLoadingPeople(true);
      const { data } = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}`);
      setPeopleResults(data || []);
    } catch (error) {
      console.error('Error searching people:', error);
      showToast("Error", "Failed to search for people", "error");
      setPeopleResults([]);
    } finally {
      setLoadingPeople(false);
    }
  }, [showToast]);

  // Search for cases using simple and reliable approach like browse cases
  const searchCases = useCallback(async (query, activeFilters) => {
    if (!query.trim()) {
      setCasesResults([]);
      return;
    }

    try {
      setLoadingCases(true);
      
      const params = {
        search: query.trim(),
        limit: 20,
        page: 1,
        ...activeFilters,
      };
      
      // Remove empty/undefined filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null) {
          delete params[key];
        }
      });

      const response = await axiosInstance.get("/cases", { params });
      const casesData = response.data?.cases || response.data || [];
      setCasesResults(casesData);
    } catch (error) {
      console.error('Error searching cases:', error);
      showToast("Error", "Failed to search for cases", "error");
      setCasesResults([]);
    } finally {
      setLoadingCases(false);
    }
  }, [showToast]);

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index);
    updateUrlParams(searchQuery, index);
  };

  // Debounced search effect with improved logic
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery.length >= 2) { // Minimum 2 characters for search
        if (activeTab === 0) {
          searchPeople(trimmedQuery);
        } else {
          searchCases(trimmedQuery, filters);
        }
      } else {
        // Clear results if query is too short
        setPeopleResults([]);
        setCasesResults([]);
      }
    }, 300); // Reduced debounce time for faster response

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activeTab, searchPeople, searchCases, filters]);

  return (
    <Box
      maxW="7xl"
      mx="auto"
      p={{ base: 4, md: 6 }}
      minH="calc(100vh - 120px)"
      bg={bgColor}
    >
      <VStack spacing={6} align="stretch">
        {/* Compact Search Tabs - Top Left */}
        <Box display="flex" justifyContent="flex-start" mb={4}>
          <Box
            display="flex"
            bg={cardBg}
            borderRadius="full"
            p={0.5}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="sm"
            fontSize="sm"
          >
            <Box
              as="button"
              onClick={() => handleTabChange(0)}
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight="medium"
              transition="all 0.2s"
              bg={activeTab === 0 ? "blue.500" : "transparent"}
              color={activeTab === 0 ? "white" : textColor}
              _hover={activeTab !== 0 ? { bg: useColorModeValue("gray.100", "gray.700") } : {}}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={FiUser} size={12} />
              <Text fontSize="xs">People</Text>
            </Box>
            <Box
              as="button"
              onClick={() => handleTabChange(1)}
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight="medium"
              transition="all 0.2s"
              bg={activeTab === 1 ? "blue.500" : "transparent"}
              color={activeTab === 1 ? "white" : textColor}
              _hover={activeTab !== 1 ? { bg: useColorModeValue("gray.100", "gray.700") } : {}}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={FiBriefcase} size={12} />
              <Text fontSize="xs">Cases</Text>
            </Box>
          </Box>
        </Box>

        {/* Content Area */}
        {activeTab === 0 ? (
          // People Results
          <Box>
            {loadingPeople ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : peopleResults.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {peopleResults.map((person) => (
                  <UserCard
                    key={person._id}
                    user={person}
                    isConnection={false}
                  />
                ))}
              </VStack>
            ) : searchQuery.trim() ? (
              <Center py={12}>
                <VStack spacing={4}>
                  <Icon as={FiUser} boxSize={12} color="gray.400" />
                  <Text color={mutedText} fontSize="lg">
                    No people found
                  </Text>
                  <Text color={mutedText} textAlign="center">
                    Try adjusting your search terms or check the spelling
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Center py={12}>
                <VStack spacing={4}>
                  <Icon as={FiUser} boxSize={12} color="gray.400" />
                  <Text color={mutedText} fontSize="lg">
                    Start typing in the search bar above to find people
                  </Text>
                  <Text color={mutedText} textAlign="center">
                    Find lawyers, clients, and other legal professionals
                  </Text>
                </VStack>
              </Center>
            )}
          </Box>
        ) : (
          // Cases Results with Filters
          <Box>
            {/* Filter Toggle Button */}
            <HStack justify="center" spacing={4} mb={4}>
              <Button
                variant={hasActiveFilters ? "solid" : "outline"}
                colorScheme="blue"
                leftIcon={<Icon as={FiFilter} />}
                rightIcon={<Icon as={isFiltersOpen ? FiChevronUp : FiChevronDown} />}
                onClick={onFiltersToggle}
                size="md"
              >
                {hasActiveFilters ? "Filters Applied" : "Show Filters"}
              </Button>
            </HStack>

            {/* Filters Section */}
            <Collapse in={isFiltersOpen} animateOpacity>
              <FilterSection cardBg={cardBg} borderColor={borderColor} />
            </Collapse>

            {loadingCases ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : casesResults.length > 0 ? (
              <VStack spacing={6} align="stretch">
                {casesResults.map((caseItem) => (
                  <Case
                    key={caseItem._id}
                    caseData={caseItem}
                  />
                ))}
              </VStack>
            ) : searchQuery.trim() ? (
              <Center py={12}>
                <VStack spacing={4}>
                  <Icon as={FiBriefcase} boxSize={12} color="gray.400" />
                  <Text color={mutedText} fontSize="lg">
                    No cases found
                  </Text>
                  <Text color={mutedText} textAlign="center">
                    Try adjusting your search terms or check the spelling
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Center py={12}>
                <VStack spacing={4}>
                  <Icon as={FiBriefcase} boxSize={12} color="gray.400" />
                  <Text color={mutedText} fontSize="lg">
                    Start typing in the search bar above to find cases
                  </Text>
                  <Text color={mutedText} textAlign="center">
                    Find legal cases that match your expertise and interests
                  </Text>
                </VStack>
              </Center>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SearchPage; 