import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, extendTheme, ColorModeScript } from "@chakra-ui/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from 'recoil';
import { ClerkProvider } from '@clerk/clerk-react';
import App from "./App.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import "./index.css";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key - Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file")
}

const queryClient = new QueryClient();

// Custom Chakra UI theme to ensure proper colors
const theme = extendTheme({
	config: {
		initialColorMode: 'light',
		useSystemColorMode: false,
	},
	colors: {
		brand: {
			50: '#E3F2FD',
			100: '#BBDEFB',
			200: '#90CAF9',
			300: '#64B5F6',
			400: '#42A5F5',
			500: '#2196F3',
			600: '#1E88E5',
			700: '#1976D2',
			800: '#1565C0',
			900: '#0D47A1',
		},
	},
	styles: {
		global: (props) => ({
			body: {
				bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
				color: props.colorMode === 'dark' ? 'white' : 'gray.800',
			},
		}),
	},
	components: {
		Text: {
			baseStyle: (props) => ({
				color: props.colorMode === 'dark' ? 'white' : 'gray.800',
			}),
		},
		Heading: {
			baseStyle: (props) => ({
				color: props.colorMode === 'dark' ? 'white' : 'gray.800',
			}),
		},
	},
});

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ColorModeScript initialColorMode={theme.config.initialColorMode} />
		<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
			<RecoilRoot>
				<BrowserRouter>
					<QueryClientProvider client={queryClient}>
						<ChakraProvider theme={theme}>
							<SocketContextProvider>
								<App />
							</SocketContextProvider>  
						</ChakraProvider>
					</QueryClientProvider>
				</BrowserRouter>
			</RecoilRoot>
		</ClerkProvider>
	</StrictMode>
);
