import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import { useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import useShowToast from "./useShowToast";

const useLogout = () => {
	const setUser = useSetRecoilState(userAtom);
	const queryClient = useQueryClient();
	const showToast = useShowToast();

	const logout = async () => {
		try {
			// Call the correct logout endpoint
			await axiosInstance.post("/auth/logout");
			
			// Clear localStorage
			localStorage.removeItem("user-threads");
			
			// Clear Recoil state
			setUser(null);
			
			// Clear React Query cache
			queryClient.setQueryData(["authUser"], null);
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			
			showToast("Success", "Logged out successfully", "success");
		} catch (error) {
			console.error("Logout error:", error);
			// Even if logout API fails, clear local state
			localStorage.removeItem("user-threads");
			setUser(null);
			queryClient.setQueryData(["authUser"], null);
			
			showToast("Error", "Error during logout, but you've been logged out locally", "warning");
		}
	};

	return logout;
};

export default useLogout;
