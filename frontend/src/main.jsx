import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from 'recoil';
import App from "./App.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import "./index.css";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RecoilRoot>
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
			<SocketContextProvider>
				<App />
				</SocketContextProvider>  
			</QueryClientProvider>
		</BrowserRouter>
		</RecoilRoot>
	</StrictMode>
);
