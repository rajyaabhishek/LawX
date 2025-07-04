import { 
	Box, 
	VStack, 
	Heading, 
	Text, 
	Container,
	SimpleGrid,
	Icon,
	HStack,
	List,
	ListItem,
	ListIcon
} from "@chakra-ui/react";
import { Users, Scale, Shield, Target, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AboutPage = () => {
	const coreValues = [
		{
			icon: Scale,
			title: "Legal Excellence",
			description: "We maintain the highest standards of legal professionalism and ethical practice, ensuring our platform serves the global legal community with integrity and precision."
		},
		{
			icon: Shield,
			title: "Trust & Security",
			description: "We implement robust security measures and maintain strict confidentiality protocols to protect sensitive legal information and client data worldwide."
		},
		{
			icon: Users,
			title: "Global Professional Community",
			description: "We foster meaningful connections between verified legal professionals worldwide, facilitating knowledge sharing and collaborative legal practice across jurisdictions."
		},
		{
			icon: Target,
			title: "Innovation in Law",
			description: "We leverage cutting-edge technology to modernize legal practice while respecting traditional legal principles and professional standards globally."
		}
	];

	const features = [
		"Verified lawyer profiles with international bar license validation",
		"Secure case management and collaboration tools",
		"Global professional networking with industry peers",
		"Confidential client-lawyer communication channels",
		"Legal document sharing with encryption",
		"Professional development resources and continuing legal education",
		"Compliance with international professional standards",
		"Multi-language support for global legal systems"
	];

	return (
		<Box bg="white" minH="100vh" py={12}>
			<Container maxW="5xl">
				<VStack spacing={8} align="stretch">
					{/* Header Section */}
					<Box textAlign="center">
						<Text fontSize="sm" mb={4} fontWeight="medium" color="black">
							Global Professional Legal Network
						</Text>
						<Heading size="2xl" mb={6} color="black">
							About LawX
						</Heading>
						<Text fontSize="lg" color="black" maxW="4xl" mx="auto" lineHeight="1.6">
							LawX is a global professional networking platform designed exclusively for 
							the legal community worldwide. We connect lawyers, legal professionals, and legal institutions 
							in a secure, compliant, and professional environment that upholds the highest 
							standards of legal practice across all jurisdictions.
						</Text>
					</Box>

					{/* Company Overview */}
					<Box p={6}>
						<Heading size="xl" mb={4} color="black">Company Overview</Heading>
						<VStack spacing={4} align="stretch">
							<Text color="black" fontSize="md" lineHeight="1.6">
								Founded with the vision of transforming legal practice globally, LawX serves as a 
								comprehensive digital ecosystem for legal professionals worldwide. Our platform facilitates 
								professional networking, case collaboration, knowledge sharing, and business development 
								while maintaining strict adherence to legal ethics and professional responsibility standards 
								across different legal systems and jurisdictions.
							</Text>
							<Text color="black" fontSize="md" lineHeight="1.6">
								We operate under various regulatory frameworks worldwide and comply with applicable laws 
								including international data protection regulations, privacy laws, and professional conduct 
								rules governing legal practice across different countries and legal systems.
							</Text>
						</VStack>
					</Box>

					{/* Mission & Vision */}
					<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
						<Box p={6}>
							<Heading size="lg" mb={4} color="black">Our Mission</Heading>
							<Text color="black" fontSize="md" lineHeight="1.6">
								To digitally transform the global legal ecosystem by providing a secure, professional, 
								and compliant platform that enables legal professionals worldwide to connect, collaborate, and 
								serve their clients more effectively while upholding the sanctity of legal practice 
								and maintaining the highest ethical standards across all jurisdictions.
							</Text>
						</Box>

						<Box p={6}>
							<Heading size="lg" mb={4} color="black">Our Vision</Heading>
							<Text color="black" fontSize="md" lineHeight="1.6">
								To become the definitive professional network for the global legal community, 
								fostering innovation in legal practice while preserving traditional values of 
								justice, integrity, and professional excellence. We envision a future where 
								technology enhances access to justice and strengthens the legal profession worldwide.
							</Text>
						</Box>
					</SimpleGrid>

					{/* Core Values */}
					<Box>
						<Heading size="xl" mb={6} color="black" textAlign="center">Core Values</Heading>
						<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
							{coreValues.map((value, index) => (
								<Box 
									key={index}
									p={6}
								>
									<VStack spacing={4} align="center" textAlign="center">
										<Icon as={value.icon} boxSize={8} color="black" />
										<Heading size="md" color="black">
											{value.title}
										</Heading>
										<Text color="black" fontSize="sm" lineHeight="1.6">
											{value.description}
										</Text>
									</VStack>
								</Box>
							))}
						</SimpleGrid>
					</Box>

					{/* Platform Features */}
					<Box p={6}>
						<Heading size="xl" mb={4} color="black">Platform Features & Capabilities</Heading>
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
							{features.map((feature, index) => (
								<HStack key={index} spacing={3} align="start">
									<Icon as={CheckCircle} color="black" mt={1} />
									<Text color="black" fontSize="md" lineHeight="1.6">
										{feature}
									</Text>
								</HStack>
							))}
						</SimpleGrid>
					</Box>

					{/* Compliance & Standards */}
					<Box p={6}>
						<Heading size="xl" mb={4} color="black">Compliance & Professional Standards</Heading>
						<VStack spacing={4} align="stretch">
							<Text color="black" fontSize="md" lineHeight="1.6">
								LawX operates in full compliance with regulatory frameworks governing legal 
								practice across multiple jurisdictions. We adhere to international professional standards, 
								maintain strict data protection standards, and ensure all platform activities align with 
								professional conduct requirements for legal practitioners worldwide.
							</Text>
							
							<SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
								<VStack align="start" spacing={3}>
									<Heading size="md" color="black">Global Compliance</Heading>
									<List spacing={2}>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											International Bar Standards
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Global Data Protection Laws
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Professional Conduct Standards
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											International Privacy Regulations
										</ListItem>
									</List>
								</VStack>
								
								<VStack align="start" spacing={3}>
									<Heading size="md" color="black">Security Standards</Heading>
									<List spacing={2}>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											End-to-end encryption
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Secure data transmission
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Regular security audits
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Professional verification systems
										</ListItem>
									</List>
								</VStack>
							</SimpleGrid>
						</VStack>
					</Box>

					{/* Contact CTA */}
					<Box p={6} textAlign="center">
						<Heading size="xl" mb={4} color="black">Connect With Our Team</Heading>
						<Text color="black" mb={6} fontSize="md" maxW="2xl" mx="auto">
							Have questions about LawX or interested in joining our global professional legal network? 
							Our team is here to assist you with platform inquiries, technical support, and 
							partnership opportunities.
						</Text>
						<HStack spacing={6} justify="center" wrap="wrap">
							<Link to="/contact">
								<Box
									as="button"
									bg="black"
									color="white"
									px={6}
									py={3}
									fontWeight="medium"
									fontSize="md"
									_hover={{ bg: "gray.800" }}
									transition="all 0.2s"
								>
									Contact Us
								</Box>
							</Link>
							<Text 
								as="a" 
								href="mailto:contact@lawx.space"
								color="black" 
								fontSize="md" 
								fontWeight="medium"
								textDecoration="underline"
							>
								contact@lawx.space
							</Text>
						</HStack>
					</Box>
				</VStack>
			</Container>
		</Box>
	);
};

export default AboutPage; 