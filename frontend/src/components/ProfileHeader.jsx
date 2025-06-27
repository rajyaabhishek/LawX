import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";

import { Camera, Clock, MapPin, UserCheck, UserPlus, X, Crown, Shield, Pencil } from "lucide-react";

const ProfileHeader = ({ userData, onSave, isOwnProfile }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedData, setEditedData] = useState({});
	const queryClient = useQueryClient();
	const { user: clerkUser } = useUser();

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
		queryKey: ["connectionStatus", userData._id],
		queryFn: () => axiosInstance.get(`/connections/status/${userData._id}`),
		enabled: !isOwnProfile,
	});

	const isConnected = userData.connections && authUser?._id 
		? userData.connections.some((connection) => connection === authUser._id)
		: false;

	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent");

			// Optimistically set connection status to pending so UI updates immediately
			queryClient.setQueryData([
				"connectionStatus",
				userData._id,
			], { data: { status: "pending" } });

			queryClient.invalidateQueries(["connectionRequests"]);
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			const errorMessage = error.response?.data?.message || "An error occurred";
			toast.error(errorMessage);
			
			// If connection request already exists, update UI to show pending state
			if (errorMessage === "Connection request already sent") {
				queryClient.setQueryData([
					"connectionStatus",
					userData._id,
				], { data: { status: "pending" } });
			}
		},
	});

	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	const { mutate: removeConnection } = useMutation({
		mutationFn: (userId) => axiosInstance.delete(`/connections/${userId}`),
		onSuccess: () => {
			toast.success("Connection removed");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "An error occurred");
		},
	});

	// Determine current connection status
	const connectionStatusValue = useMemo(() => {
		// User already listed in each other's connections
		if (isConnected) return "connected";

		// Fallback to API-provided status (pending | received | not_connected)
		return connectionStatus?.data?.status || "not_connected";
	}, [isConnected, connectionStatus]);

	const renderConnectionButton = () => {
		const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center";
		switch (connectionStatusValue) {
			case "connected":
				return (
					<div className='flex gap-2 justify-center'>
						<div className={`${baseClass} bg-gray-100 text-gray-700 border border-gray-300`}>
							<UserCheck size={20} className='mr-2' />
							Connected
						</div>
						<button
							className={`${baseClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-sm`}
							onClick={() => removeConnection(userData._id)}
						>
							<X size={20} className='mr-2' />
							Remove Connection
						</button>
					</div>
				);

			case "pending":
				return (
					<button className={`${baseClass} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400`}>
						<Clock size={20} className='mr-2' />
						Pending
					</button>
				);

			case "received":
				return (
					<div className='flex gap-2 justify-center'>
						<button
							onClick={() => acceptRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-gray-800 text-white border border-gray-800 hover:bg-gray-700 hover:border-gray-700`}
						>
							Accept
						</button>
						<button
							onClick={() => rejectRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400`}
						>
							Reject
						</button>
					</div>
				);
			default:
				return (
					<button
						onClick={() => sendConnectionRequest(userData._id)}
						className='px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
					>
						<UserPlus size={20} />
						Connect
					</button>
				);
		}
	};

	const handleImageChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setEditedData((prev) => ({ ...prev, [event.target.name]: reader.result }));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSave = () => {
		console.log("Attempting to save profile changes:", editedData);
		if (Object.keys(editedData).length === 0) {
			toast.error("No changes to save");
			return;
		}

		// Validate username if it's being changed
		if (editedData.username) {
			const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
			if (!usernameRegex.test(editedData.username)) {
				toast.error("Username must be 3-20 characters long and contain only letters, numbers, and underscores");
				return;
			}
		}

		// Validate name if it's being changed
		if (editedData.name && editedData.name.trim().length < 2) {
			toast.error("Name must be at least 2 characters long");
			return;
		}

		onSave(editedData);
		setEditedData({}); // Clear edited data after save
		setIsEditing(false);
	};

	// Get status badges to display
	const isPremium = userData.isPremium || clerkUser?.publicMetadata?.isPremium;
	const isVerified = userData.isVerified || clerkUser?.publicMetadata?.isVerified || isPremium;

	return (
		<div className='bg-white shadow rounded-xl overflow-hidden'>
			{/* Banner Section */}
			<div
				className='relative h-40 bg-cover bg-center'
				style={{
					backgroundImage: `url('${editedData.bannerImg || userData.bannerImg || "/banner.png"}')`,
				}}
			>
				{/* Gradient overlay for better text readability */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
				
				{isEditing && (
					<label className='absolute top-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full shadow cursor-pointer transition-all duration-200 backdrop-blur-sm'>
						<Camera size={20} className="text-gray-700" />
						<input
							type='file'
							className='hidden'
							name='bannerImg'
							onChange={handleImageChange}
							accept='image/*'
						/>
					</label>
				)}
			</div>

			{/* Profile Content */}
			<div className='p-4'>
				{/* Profile Picture */}
				<div className='relative -mt-20 mb-4 flex justify-center'>
					<div className="relative">
						<img
							className='w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg'
							src={editedData.profilePicture || userData.profilePicture || "/avatar.png"}
							alt={userData.name}
						/>

						{isEditing && (
							<label className='absolute bottom-2 right-2 bg-white hover:bg-gray-50 p-3 rounded-full shadow cursor-pointer transition-all duration-200 border border-gray-200'>
								<Camera size={18} className="text-gray-700" />
								<input
									type='file'
									className='hidden'
									name='profilePicture'
									onChange={handleImageChange}
									accept='image/*'
								/>
							</label>
						)}
					</div>
				</div>

				{/* User Information */}
				<div className='text-center space-y-2'>
					{/* Name and Status Badges */}
					<div className='space-y-2'>
						<div className='flex justify-center items-center gap-2 flex-wrap'>
							{isEditing ? (
								<input
									type='text'
									value={editedData.name ?? userData.name}
									onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
									className='text-3xl font-bold text-center border-0 border-b-2 border-gray-300 focus:border-gray-500 outline-none bg-transparent px-4 py-2 min-w-0'
									placeholder='Your name'
								/>
							) : (
								<>
									<h1 className='text-3xl font-bold text-gray-800'>{userData.name}</h1>
									{isOwnProfile && (
										<button
											onClick={() => setIsEditing(true)}
											className='p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200'
											aria-label='Edit Profile'
										>
											<Pencil size={18} />
										</button>
									)}
								</>
							)}
						</div>
						
						{/* Status badges */}
						<div className='flex justify-center gap-2 flex-wrap'>
							{isPremium && (
								<div className='bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-gray-200'>
									<Crown size={16} />
									Premium Member
								</div>
							)}
							{isVerified && (
								<div className='bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-gray-200'>
									<Shield size={16} />
									Verified
								</div>
							)}
						</div>
					</div>

					{/* Username */}
					{(isEditing || userData.username) && (
						<div className='space-y-0.5'>
							{isEditing ? (
								<input
									type='text'
									value={editedData.username ?? userData.username}
									onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
									className='text-lg text-gray-600 text-center w-full max-w-sm mx-auto border-0 border-b border-gray-300 focus:border-gray-500 outline-none bg-transparent px-3 py-2'
									placeholder='Username (e.g., john_lawyer)'
								/>
							) : (
								<p className='text-lg text-gray-600 font-medium'>@{userData.username}</p>
							)}
						</div>
					)}

					{/* Professional Headline */}
					<div className='space-y-0.5'>
						{isEditing ? (
							<input
								type='text'
								value={editedData.headline ?? userData.headline}
								onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
								className='text-lg text-gray-700 text-center w-full max-w-lg mx-auto border-0 border-b border-gray-300 focus:border-gray-500 outline-none bg-transparent px-3 py-2'
								placeholder='Professional headline (e.g., Corporate Lawyer at ABC Firm)'
							/>
						) : (
							<p className='text-lg text-gray-700 font-medium max-w-2xl mx-auto'>{userData.headline}</p>
						)}
					</div>

					{/* Location */}
					<div className='flex justify-center items-center gap-1 text-gray-600'>
						<MapPin size={18} className='text-gray-500 flex-shrink-0' />
						{isEditing ? (
							<input
								type='text'
								value={editedData.location ?? userData.location}
								onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
								className='text-base text-center border-0 border-b border-gray-300 focus:border-gray-500 outline-none bg-transparent px-3 py-1 min-w-0'
								placeholder='City, State/Country'
							/>
						) : (
							<span className='text-base'>{userData.location}</span>
						)}
					</div>

					{/* Connection Count */}
					{isOwnProfile ? (
						<Link 
							to="/network" 
							className='flex justify-center items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer'
						>
							<UserCheck size={18} className='text-gray-500 flex-shrink-0' />
							<span className='text-base font-medium'>
								{userData.connections?.length || 0} Connections
							</span>
						</Link>
					) : (
						<div className='flex justify-center items-center gap-2 text-gray-600'>
							<UserCheck size={18} className='text-gray-500 flex-shrink-0' />
							<span className='text-base font-medium'>
								{userData.connections?.length || 0} Connections
							</span>
						</div>
					)}
				</div>

				{/* Action Buttons (Save/Cancel or Connection) */}
				<div className='mt-4 flex justify-center'>
					{isOwnProfile ? (
						isEditing ? (
							<div className="flex gap-3">
								<button
									className='px-8 py-3 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg transition-all duration-200'
									onClick={handleSave}
									style={{ color: '#1f2937' }}
								>
									Save Changes
								</button>
								<button
									className='px-6 py-3 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg transition-all duration-200'
									onClick={() => {
										setIsEditing(false);
										setEditedData({});
									}}
									style={{ color: '#374151' }}
								>
									Cancel
								</button>
							</div>
						) : null
					) : (
						<div className='flex justify-center'>{renderConnectionButton()}</div>
					)}
				</div>
			</div>
		</div>
	);
};
export default ProfileHeader;
