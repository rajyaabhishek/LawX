import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { VStack } from "@chakra-ui/react";
import { axiosInstance } from "../lib/axios";
import { useAuthContext } from "../context/AuthContext";

import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import toast from "react-hot-toast";

const ProfilePage = () => {
	const { username } = useParams();
	const queryClient = useQueryClient();
	const { user: clerkUser, isSignedIn } = useUser();
	const { currentUser } = useAuthContext();

	// Determine if this is the current user's profile
	const isOwnProfile = isSignedIn && currentUser && (
		currentUser.username === username || 
		currentUser.clerkId === username ||
		clerkUser?.username === username ||
		clerkUser?.id === username
	);

	// Query for user profile data
	const { data: user, isLoading, error, refetch } = useQuery({
		queryKey: ['userProfile', username],
		queryFn: async () => {
			try {
				console.log("=== Profile Fetch Debug ===");
				console.log("Username parameter:", username);
				console.log("Is own profile:", isOwnProfile);
				console.log("Clerk user:", clerkUser);
				console.log("Current user:", currentUser);

				// If viewing own profile and user is authenticated with Clerk but not in MongoDB yet
				if (isOwnProfile && clerkUser?.id && (username === clerkUser.id || username === clerkUser.username)) {
					console.log("Ensuring user exists in MongoDB for Clerk user:", clerkUser.id);
					try {
						const ensureResponse = await axiosInstance.post(`/users/ensure/${clerkUser.id}`);
						console.log("User ensure response:", ensureResponse.data);
					} catch (ensureError) {
						console.log("User might already exist or error ensuring user:", ensureError.response?.data || ensureError.message);
					}
				}

				// Try fetching by username first
				console.log("Fetching user profile for:", username);
				try {
					const response = await axiosInstance.get(`/users/${username}`);
					console.log("Successfully fetched user by username:", response.data);
					return response.data;
				} catch (usernameError) {
					console.log("Failed to fetch by username:", usernameError.response?.status, usernameError.response?.data || usernameError.message);
					
					// If it looks like a Clerk ID, try fetching by Clerk ID
					if (username.startsWith('user_') && username.length > 20) {
						try {
							console.log("Attempting to fetch by Clerk ID:", username);
							const response = await axiosInstance.get(`/users/clerk/${username}`);
							console.log("Successfully fetched user by Clerk ID:", response.data);
							return response.data;
						} catch (clerkError) {
							console.log("Failed to fetch user by Clerk ID:", clerkError.response?.status, clerkError.response?.data || clerkError.message);
							throw clerkError;
						}
					} else {
						throw usernameError;
					}
				}
			} catch (error) {
				console.error("=== Profile Fetch Error ===");
				console.error("Error details:", error.response?.data || error.message);
				throw error;
			}
		},
		retry: false,
		enabled: !!username
	});

	// Mutation for updating profile
	const { mutate: updateProfile } = useMutation({
		mutationFn: async (updatedData) => {
			console.log("Updating profile with data:", updatedData);
			const response = await axiosInstance.put("/users/profile", updatedData);
			console.log("Profile update response:", response.data);
			return response.data;
		},
		onSuccess: (data) => {
			console.log("Profile updated successfully:", data);
			toast.success("Profile updated successfully");
			queryClient.invalidateQueries(["userProfile", username]);
			// Also invalidate the auth user query if it's own profile
			if (isOwnProfile) {
				queryClient.invalidateQueries(["authUser"]);
				queryClient.invalidateQueries(["currentUser"]);
				
				// If name or username was updated, we need to refresh Clerk data
				// This ensures the UserButton and other Clerk components show updated info
				if (clerkUser) {
					console.log("Triggering Clerk user refresh after profile update");
					
					// Show additional success message for name/username changes
					const hasNameChange = data.name !== clerkUser.fullName;
					const hasUsernameChange = data.username !== clerkUser.username;
					
					if (hasNameChange || hasUsernameChange) {
						toast.success("Name and username synced to your account successfully!");
						
						// Reload the page after a delay to refresh Clerk data
						setTimeout(() => {
							console.log("Reloading page to refresh Clerk data...");
							window.location.reload();
						}, 2000);
					}
				}
			}
		},
		onError: (error) => {
			console.error("Profile update error:", error);
			const errorMessage = error.response?.data?.message || error.message || "Failed to update profile";
			toast.error(errorMessage);
		},
	});

	const handleSave = (updatedData) => {
		updateProfile(updatedData);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!user) {
		// If the profile isn\'t found but it\'s the current user\'s own profile, render editable sections with blank data
		if (isOwnProfile) {
			// Prepare a blank user object with sensible defaults so child components don\'t crash
			const blankUser = {
				_id: undefined,
				clerkId: clerkUser?.id || username,
				name: "",
				username: clerkUser?.username || "",
				email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
				profilePicture: clerkUser?.imageUrl || "",
				bannerImg: "",
				headline: "",
				about: "",
				skills: [],
				experience: [],
				education: [],
				location: "",
				connections: [],
				isPremium: false,
				isVerified: false,
			};

			return (
				<VStack spacing={1} align="stretch">
					<ProfileHeader userData={blankUser} isOwnProfile={true} onSave={handleSave} />
					<AboutSection userData={blankUser} isOwnProfile={true} onSave={handleSave} />
					<ExperienceSection userData={blankUser} isOwnProfile={true} onSave={handleSave} />
					<EducationSection userData={blankUser} isOwnProfile={true} onSave={handleSave} />
					<SkillsSection userData={blankUser} isOwnProfile={true} onSave={handleSave} />
				</VStack>
			);
		}

		// For other users, show the existing "Profile Not Found" message
		return (
			<div className="max-w-4xl mx-auto p-4">
				<div className="text-center py-8">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
					<p className="text-gray-600 mb-6">The user profile you\'re looking for doesn\'t exist.</p>
					{/* Debug information */}
					{isOwnProfile && clerkUser && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
							<h3 className="font-bold text-blue-800 mb-2">Debug Information:</h3>
							<div className="text-sm text-blue-700 space-y-1">
								<p><strong>Username parameter:</strong> {username}</p>
								<p><strong>Clerk User ID:</strong> {clerkUser.id}</p>
								<p><strong>Clerk Username:</strong> {clerkUser.username || 'Not set'}</p>
								<p><strong>Clerk Email:</strong> {clerkUser.emailAddresses?.[0]?.emailAddress || 'Not set'}</p>
								<p><strong>Is Own Profile:</strong> {isOwnProfile ? 'Yes' : 'No'}</p>
							</div>

							<button
								onClick={async () => {
									try {
										console.log("Manually creating user for:", clerkUser.id);
										const response = await axiosInstance.post(`/users/ensure/${clerkUser.id}`);
										console.log("User creation response:", response.data);
										toast.success("User created! Refreshing profile...");
										setTimeout(() => {
											refetch();
										}, 1000);
									} catch (error) {
										console.error("Error creating user:", error);
										toast.error("Failed to create user: " + (error.response?.data?.message || error.message));
									}
								}}
								className="mt-3 btn btn-primary btn-sm"
							>
								Create Profile in Database
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Use the fetched profile data, but merge with current user data if it's own profile
	let userData = user;
	
	// If it's the current user's profile, merge with the most up-to-date data
	if (isOwnProfile && currentUser) {
		userData = {
			...userData,
			...currentUser,
			// Ensure Clerk data takes precedence for certain fields
			profilePicture: clerkUser?.imageUrl || userData.profilePicture || currentUser.profilePicture,
			name: clerkUser?.fullName || clerkUser?.firstName || userData.name || currentUser.name,
			email: clerkUser?.emailAddresses?.[0]?.emailAddress || userData.email || currentUser.email,
			isPremium: clerkUser?.publicMetadata?.isPremium || userData.isPremium || currentUser.isPremium,
			isVerified: clerkUser?.publicMetadata?.isVerified || userData.isVerified || currentUser.isVerified,
		};
	}

	return (
		<VStack spacing={1} align="stretch">
			<ProfileHeader userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<AboutSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<ExperienceSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<EducationSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
			<SkillsSection userData={userData} isOwnProfile={isOwnProfile} onSave={handleSave} />
		</VStack>
	);
};

export default ProfilePage;
