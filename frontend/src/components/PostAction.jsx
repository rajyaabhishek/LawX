import { Button, useColorModeValue } from "@chakra-ui/react";

export default function PostAction({ icon, text, onClick, isActive = false }) {
	const activeColor = useColorModeValue("blue.500", "blue.300");
	const textColor = useColorModeValue("gray.600", "gray.400");
	const hoverColor = useColorModeValue("gray.800", "white");

	return (
		<Button
			variant="ghost"
			size="sm"
			leftIcon={icon}
			onClick={onClick}
			color={isActive ? activeColor : textColor}
			_hover={{ color: hoverColor }}
			fontWeight="normal"
		>
			<span style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}>
				{text}
			</span>
		</Button>
	);
}
