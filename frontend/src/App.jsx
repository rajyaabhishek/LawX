import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

import { useUser } from "@clerk/clerk-react";
import ClerkAxiosProvider from "./components/ClerkAxiosProvider";
import { AuthProvider } from "./context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import NetworkPage from "./pages/NetworkPage";
import NotificationsPage from "./pages/NotificationsPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import CasesPage from "./pages/CasesPage";
import CreateCasePage from "./pages/CreateCasePage"; 
import CasesListPage from "./pages/CasesListPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import MyCasesPage from "./pages/MyCasesPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import BrowseCasesPage from "./pages/BrowseCasesPage";
import SearchPage from "./pages/SearchPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import Premium from "./pages/Premium";
import AuthOverlay from "./components/AuthOverlay";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestModeIndicator from "./components/GuestModeIndicator";

// Profile redirect component for Clerk UserButton
const ProfileRedirect = () => {
	const { user, isSignedIn, isLoaded } = useUser();
	
	console.log("=== ProfileRedirect Debug ===");
	console.log("isLoaded:", isLoaded);
	console.log("isSignedIn:", isSignedIn);
	console.log("user:", user);
	
	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}
	
	if (!isSignedIn || !user) {
		console.log("User not signed in, redirecting to home");
		return <Navigate to="/" replace />;
	}
	
	// Redirect to the user's profile using their username or Clerk ID
	const profilePath = user.username || user.id;
	console.log("Redirecting to profile path:", profilePath);
	return <Navigate to={`/profile/${profilePath}`} replace />;
};

function App() {
	const { isLoaded } = useUser();

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<ClerkAxiosProvider>
			<AuthProvider>
				<Layout>
					<Routes>
						{/* Public routes - available to all users (signed in, guest, or anonymous) */}
						<Route path='/' element={<HomePage />} />
						<Route path='/home' element={<HomePage />} />
						<Route path='/cases' element={<CasesPage />} />
						<Route path='/browse-cases' element={<BrowseCasesPage />} />
						<Route path='/search' element={<SearchPage />} />
						<Route path='/case/:caseId' element={<CaseDetailPage />} />
						<Route path='/profile' element={<ProfileRedirect />} />
						<Route path='/profile/:username' element={<ProfilePage />} />
						<Route path='/post/:postId' element={<PostPage />} />
						<Route path='/premium' element={<Premium />} />
						<Route path='/premium/success' element={<PaymentSuccessPage />} />
						<Route path='/payment/return' element={<PaymentSuccessPage />} />
						
						{/* Protected routes - require authentication */}
						<Route path='/notifications' element={
							<ProtectedRoute>
								<NotificationsPage />
							</ProtectedRoute>
						} />
						<Route path='/network' element={
							<ProtectedRoute>
								<NetworkPage />
							</ProtectedRoute>
						} />
						<Route path='/chat' element={
							<ProtectedRoute>
								<ChatPage />
							</ProtectedRoute>
						} />
						<Route path='/my-cases' element={
							<ProtectedRoute requirePermission="VIEW_MY_CASES">
								<MyCasesPage />
							</ProtectedRoute>
						} />
						<Route path='/my-applications' element={
							<ProtectedRoute requirePermission="APPLY_TO_CASE">
								<MyApplicationsPage />
							</ProtectedRoute>
						} />
						<Route path='/create-case' element={
							<ProtectedRoute requirePermission="CREATE_CASE">
								<CreateCasePage />
							</ProtectedRoute>
						} />
						<Route path='/cases-list' element={
							<ProtectedRoute>
								<CasesListPage />
							</ProtectedRoute>
						} />
					</Routes>
					<Toaster position="top-right" />
					
					{/* Auth Overlay - shows authentication prompts */}
					<AuthOverlay />
					
					{/* Guest Mode Indicator */}
					<GuestModeIndicator />
				</Layout>
			</AuthProvider>
		</ClerkAxiosProvider>
	);
}

export default App;
