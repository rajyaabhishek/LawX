import { 
	Box, 
	VStack, 
	Heading, 
	Text, 
	Container,
	SimpleGrid,
	Icon,
	HStack,
	Divider,
	List,
	ListItem,
	ListIcon
} from "@chakra-ui/react";
import { Users, Scale, Shield, Target, CheckCircle, Award, Globe, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const AboutPage = () => {
	const coreValues = [
		{
			icon: Scale,
			title: "Legal Excellence",
			description: "We maintain the highest standards of legal professionalism and ethical practice, ensuring our platform serves the legal community with integrity and precision."
		},
		{
			icon: Shield,
			title: "Trust & Security",
			description: "We implement robust security measures and maintain strict confidentiality protocols to protect sensitive legal information and client data."
		},
		{
			icon: Users,
			title: "Professional Community",
			description: "We foster meaningful connections between verified legal professionals, facilitating knowledge sharing and collaborative legal practice."
		},
		{
			icon: Target,
			title: "Innovation in Law",
			description: "We leverage cutting-edge technology to modernize legal practice while respecting traditional legal principles and professional standards."
		}
	];

	const achievements = [
		{ icon: Award, metric: "500+", label: "Verified Legal Professionals" },
		{ icon: Globe, metric: "25+", label: "Indian States Represented" },
		{ icon: Scale, metric: "100+", label: "Legal Specializations" },
		{ icon: Clock, metric: "24/7", label: "Platform Availability" }
	];

	const features = [
		"Verified lawyer profiles with bar license validation",
		"Secure case management and collaboration tools",
		"Professional networking with industry peers",
		"Confidential client-lawyer communication channels",
		"Legal document sharing with encryption",
		"Professional development resources and continuing legal education",
		"Compliance with Indian Bar Council regulations",
		"Multi-language support for Indian legal system"
	];

	return (
		<Box bg="white" minH="100vh" py={12}>
			<Container maxW="5xl">
				<VStack spacing={8} align="stretch">
					{/* Header Section */}
					<Box textAlign="center">
						<Text fontSize="sm" mb={4} fontWeight="medium" color="black">
							Professional Legal Network
						</Text>
						<Heading size="2xl" mb={6} color="black">
							About LawX
						</Heading>
						<Text fontSize="lg" color="black" maxW="4xl" mx="auto" lineHeight="1.6">
							LawX is India's premier professional networking platform designed exclusively for 
							the legal community. We connect lawyers, legal professionals, and legal institutions 
							in a secure, compliant, and professional environment that upholds the highest 
							standards of legal practice.
						</Text>
					</Box>

									{/* Company Overview */}
				<Box p={6}>
					<Heading size="xl" mb={4} color="black">Company Overview</Heading>
						<VStack spacing={4} align="stretch">
							<Text color="black" fontSize="md" lineHeight="1.6">
								Founded with the vision of transforming legal practice in India, LawX serves as a 
								comprehensive digital ecosystem for legal professionals. Our platform facilitates 
								professional networking, case collaboration, knowledge sharing, and business development 
								while maintaining strict adherence to legal ethics and professional responsibility standards.
							</Text>
							<Text color="black" fontSize="md" lineHeight="1.6">
								We operate under the regulatory framework established by the Bar Council of India and 
								comply with all applicable laws including the Information Technology Act, 2000, 
								the Personal Data Protection Bill, and professional conduct rules governing legal practice in India.
							</Text>
						</VStack>
					</Box>

					{/* Mission & Vision */}
					<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
						<Box p={6}>
							<Heading size="lg" mb={4} color="black">Our Mission</Heading>
							<Text color="black" fontSize="md" lineHeight="1.6">
								To digitally transform the Indian legal ecosystem by providing a secure, professional, 
								and compliant platform that enables legal professionals to connect, collaborate, and 
								serve their clients more effectively while upholding the sanctity of legal practice 
								and maintaining the highest ethical standards.
							</Text>
						</Box>

						<Box p={6}>
							<Heading size="lg" mb={4} color="black">Our Vision</Heading>
							<Text color="black" fontSize="md" lineHeight="1.6">
								To become the definitive professional network for the Indian legal community, 
								fostering innovation in legal practice while preserving traditional values of 
								justice, integrity, and professional excellence. We envision a future where 
								technology enhances access to justice and strengthens the legal profession.
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

					{/* Key Metrics */}
					<Box>
						<Heading size="xl" mb={6} color="black" textAlign="center">Platform Impact</Heading>
						<SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
							{achievements.map((achievement, index) => (
								<Box 
									key={index}
									p={6}
									textAlign="center"
								>
									<Icon as={achievement.icon} boxSize={8} color="black" mb={4} mx="auto" />
									<Heading size="lg" color="black" mb={2}>
										{achievement.metric}
									</Heading>
									<Text color="black" fontSize="sm">
										{achievement.label}
									</Text>
								</Box>
							))}
						</SimpleGrid>
					</Box>

					{/* Compliance & Standards */}
					<Box p={6}>
						<Heading size="xl" mb={4} color="black">Compliance & Professional Standards</Heading>
						<VStack spacing={4} align="stretch">
							<Text color="black" fontSize="md" lineHeight="1.6">
								LawX operates in full compliance with the regulatory framework governing legal 
								practice in India. We adhere to the Bar Council of India Rules, maintain strict 
								data protection standards, and ensure all platform activities align with 
								professional conduct requirements for legal practitioners.
							</Text>
							
							<SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
								<VStack align="start" spacing={3}>
									<Heading size="md" color="black">Regulatory Compliance</Heading>
									<List spacing={2}>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Bar Council of India Rules
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Information Technology Act, 2000
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Professional Conduct Standards
										</ListItem>
										<ListItem>
											<ListIcon as={CheckCircle} color="black" />
											Data Protection Regulations
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
							Have questions about LawX or interested in joining our professional legal network? 
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