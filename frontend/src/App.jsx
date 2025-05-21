import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

import { useQuery } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { axiosInstance } from "./lib/axios";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
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

function App() {
	const { data: authUser, isLoading } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get("/auth/me");
				return res.data;
			} catch (err) {
				if (err.response && err.response.status === 401) {
					return null;
				}
				toast.error(err.response.data.message || "Something went wrong");
			}
		},
	});

	if (isLoading) return null;

	return (
		<Layout>
			<Routes>
				<Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />} />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
				<Route path='/notifications' element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />} />
				<Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />} />
				<Route path='/post/:postId' element={authUser ? <PostPage /> : <Navigate to={"/login"} />} />
				<Route path='/chat' element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
				<Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />} />
				<Route path='/cases' element={authUser ? <CasesPage /> : <Navigate to={"/login"} />} />
				<Route path='/create-case' element={authUser ? <CreateCasePage /> : <Navigate to={"/login"} />} />
				<Route path='/cases-list' element={authUser ? <CasesListPage /> : <Navigate to={"/login"} />} />
				<Route path='/case/:caseId' element={authUser ? <CaseDetailPage /> : <Navigate to={"/login"} />} />
			</Routes>
			<Toaster />
		</Layout>
	);
}

export default App;
