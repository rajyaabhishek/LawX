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
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp, FiMapPin, FiDollarSign, FiBriefcase } from "react-icons/fi";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import Case from "../components/Case";
import useShowToast from "../hooks/useShowToast";
import { axiosInstance } from "../lib/axios";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// FilterSection component moved outside to prevent re-creation
const FilterSection = ({ 
  filters, 
  handleFilterChange, 
  clearFilters, 
  hasActiveFilters,
  caseTypes,
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

    <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={3}>
      {/* Case Type Filter */}
      <FormControl maxW="200px">
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
      <FormControl maxW="200px">
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
      <FormControl maxW="200px">
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

      {/* Remote Work Filter */}
      <FormControl maxW="200px">
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



    {/* Sort Options */}
    <Box mt={3} maxW="200px">
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

const BrowseCasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Advanced filters
  const [filters, setFilters] = useState({
    caseType: '',
    location: '',
    minBudget: '',
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
  const textColor = useColorModeValue("gray.800", "white");
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Available filter options
  const caseTypes = [
    'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law', 'Property Law', 
    'Intellectual Property', 'Labor Law', 'Tax Law', 'Immigration Law', 
    'Personal Injury', 'Contract Law', 'Litigation', 'Real Estate Law',
    'Employment Law', 'Estate Planning', 'Banking Law', 'Environmental Law',
    'International Law', 'Mergers & Acquisitions', 'Constitutional Law',
    'Administrative Law', 'Commercial Law', 'Insurance Law', 'Maritime Law',
    'Other'
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'budget_high', label: 'Budget: High to Low' },
    { value: 'budget_low', label: 'Budget: Low to High' }
  ];

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.caseType || 
           filters.location ||
           filters.minBudget ||
           filters.isRemote ||
           searchQuery.trim();
  }, [filters, searchQuery]);

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

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
  }, [searchQuery, filters, showToast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCases(1); // Reset to first page when filters change
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, fetchCases]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };



  const clearFilters = () => {
    setFilters({
      caseType: '',
      location: '',
      minBudget: '',
      isRemote: '',
      sortBy: 'newest'
    });
    setSearchQuery('');
    setSearchParams({});
  };

  const loadMoreCases = () => {
    fetchCases(pagination.page + 1);
  };



  return (
    <Box
      maxW="7xl"
      mx="auto"
      p={{ base: 2, md: 3 }}
      minH="calc(100vh - 120px)"
      bg={bgColor}
    >
      <VStack spacing={3} align="stretch">
   

        {/* Search Bar */}
        <Box maxW="600px" mx="auto" w="100%">
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search cases by title, description, expertise, location..."
              value={searchQuery}
              onChange={handleSearch}
              pl={12}
              bg={cardBg}
              borderColor={borderColor}
              borderRadius="xl"
              _hover={{ borderColor: 'blue.300' }}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
              }}
            />
          </InputGroup>
        </Box>

        {/* Filter Toggle Button */}
        <HStack justify="center" spacing={4}>
          <Button
            variant={hasActiveFilters ? "solid" : "outline"}
            colorScheme="blue"
            leftIcon={<Icon as={FiFilter} />}
            rightIcon={<Icon as={isFiltersOpen ? FiChevronUp : FiChevronDown} />}
            onClick={onFiltersToggle}
            size="md"
          >
            {hasActiveFilters ? 'Filters Applied' : 'Show Filters'}
          </Button>
          
          {hasActiveFilters && (
            <Text fontSize="sm" color={mutedText}>
              {pagination.total} case{pagination.total !== 1 ? 's' : ''} found
            </Text>
          )}
        </HStack>

        {/* Filters Section */}
        <Box w="100%">
          <Collapse in={isFiltersOpen} animateOpacity>
            <FilterSection 
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              caseTypes={caseTypes}
              sortOptions={sortOptions}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          </Collapse>
        </Box>

        {/* Cases Results */}
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
            <Heading size="md" color={textColor} mb={2}>
              {hasActiveFilters 
                ? 'No cases match your criteria' 
                : 'No cases available yet'}
            </Heading>
            <Text fontSize="md" color={mutedText} mb={6}>
              {hasActiveFilters 
                ? 'Try adjusting your search terms or filters' 
                : 'Check back later for new cases!'}
            </Text>
            {hasActiveFilters && (
              <Button 
                colorScheme="blue" 
                variant="outline"
                onClick={clearFilters}
                size="lg"
              >
                Clear filters
              </Button>
            )}
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {/* Results summary */}
            <HStack justify="space-between" mb={2}>
              <Text color={mutedText}>
                Showing {cases.length} of {pagination.total} case{pagination.total !== 1 ? 's' : ''}
              </Text>
              <Text color={mutedText} fontSize="sm">
                Page {pagination.page} of {pagination.pages}
              </Text>
            </HStack>

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
      </VStack>
    </Box>
  );
};

export default BrowseCasesPage; 