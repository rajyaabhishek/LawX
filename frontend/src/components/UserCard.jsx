import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Briefcase, UserCheck, Crown, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Clock, Check, X, UserPlus } from "lucide-react";

function UserCard({ user, isConnection, compact = false }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const getCaseTagColor = (type, status) => {
		if (type === 'case_applicant') {
			switch (status) {
				case 'accepted': return 'bg-green-100 text-green-800';
				case 'rejected': return 'bg-red-100 text-red-800';
				default: return 'bg-blue-100 text-blue-800';
			}
		} else if (type === 'case_poster') {
			switch (status) {
				case 'accepted': return 'bg-green-100 text-green-800';
				case 'rejected': return 'bg-red-100 text-red-800';
				default: return 'bg-yellow-100 text-yellow-800';
			}
		}
		return 'bg-gray-100 text-gray-800';
	};

	const getCaseTagText = (type, status) => {
		if (type === 'case_applicant') {
			return `Applicant (${status})`;
		} else if (type === 'case_poster') {
			return `Case Poster (${status})`;
		}
		return '';
	};

	// Fetch connection status for all users (not just non-case-tag users)
	const { data: connectionStatus } = useQuery({
		queryKey: ["connectionStatus", user._id],
		queryFn: () => axiosInstance.get(`/connections/status/${user._id}`),
		enabled: !isConnection, // Only fetch if not already connected
	});

	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: () => axiosInstance.post(`/connections/request/${user._id}`),
		onSuccess: () => {
			toast.success("Connection request sent");
			queryClient.setQueryData(["connectionStatus", user._id], { data: { status: "pending" } });
			queryClient.invalidateQueries(["recommendedUsers"]);
		},
		onError: (err) => {
			const errorMessage = err.response?.data?.message || "An error occurred";
			toast.error(errorMessage);
			
			// If connection request already exists, update UI to show pending state
			if (errorMessage === "Connection request already sent") {
				queryClient.setQueryData(["connectionStatus", user._id], { data: { status: "pending" } });
			}
		},
	});

	const renderActionButton = () => {
		// If already a connection, show connected state
		if (isConnection) {
			return (
				<button className='bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs cursor-not-allowed flex items-center gap-1 border border-gray-300'>
					<UserCheck size={12} />
					Connected
				</button>
			);
		}

		// Show status-based button for all other users
		const status = connectionStatus?.data?.status;
		switch (status) {
			case "pending":
				return (
					<button className='bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs cursor-not-allowed flex items-center gap-1'>
						<Clock size={12} /> Pending
					</button>
				);
			case "connected":
				return (
					<button className='bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs cursor-not-allowed flex items-center gap-1 border border-gray-300'>
						<UserCheck size={12} /> Connected
					</button>
				);
			default:
				return (
					<button onClick={()=>sendConnectionRequest()} className='bg-blue-400 text-white px-2 py-1 rounded hover:bg-blue-500 transition-colors text-xs flex items-center gap-1'>
						<UserPlus size={12} /> Connect
					</button>
				);
		}
	};

	return (
		<div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-3' : 'p-4'} flex items-center gap-3 transition-all hover:shadow-md hover:border-blue-300 w-full`}>
			{/* Profile Picture Section */}
			<Link to={`/profile/${user.username}`} className='flex-shrink-0'>
				<div className='relative'>
					<img
						src={user.profilePicture || user.profilePic || "/avatar.png"}
						alt={user.name}
						className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover`}
					/>
					{user.isPremium && (
						<div className='absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1'>
							<Crown size={8} />
						</div>
					)}
					{user.isVerified && (
						<div className='absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1'>
							<Shield size={8} />
						</div>
					)}
				</div>
			</Link>
			
			{/* Main Content Section */}
			<div className='flex-grow min-w-0'>
				<Link to={`/profile/${user.username}`} className='block'>
					<div className='flex items-center gap-2 mb-1'>
						<h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900 truncate hover:text-blue-600 transition-colors`}>
							{user.name}
						</h3>
						{user.caseTag && (
							<div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getCaseTagColor(user.caseTag.type, user.caseTag.applicationStatus)}`}>
								<Briefcase size={8} />
								{getCaseTagText(user.caseTag.type, user.caseTag.applicationStatus)}
							</div>
						)}
					</div>
				</Link>
				
				<p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'} capitalize ${compact ? 'mb-1' : 'mb-2'}`}>
					{user.role || 'User'}
				</p>
				
				{user.specialization && user.specialization.length > 0 && (
					<div className={`flex flex-wrap gap-1 ${compact ? 'mb-1' : 'mb-2'}`}>
						{user.specialization.slice(0, compact ? 2 : 3).map((spec, index) => (
							<span key={index} className={`bg-blue-100 text-blue-800 ${compact ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-full`}>
								{spec}
							</span>
						))}
						{user.specialization.length > (compact ? 2 : 3) && (
							<span className={`${compact ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'} text-gray-500`}>
								+{user.specialization.length - (compact ? 2 : 3)} more
							</span>
						)}
					</div>
				)}
				
				{!compact && user.bio && (
					<p className='text-sm text-gray-500 mb-2 line-clamp-2'>
						{user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
					</p>
				)}
				
				{user.caseTag && (
					<p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 ${compact ? 'mb-1' : 'mb-2'}`}>
						Re: {user.caseTag.caseTitle}
					</p>
				)}
				
				<p className='text-xs text-gray-400'>
					{user.connections?.length || 0} connections
				</p>
			</div>
			
			{/* Action Button Section */}
			<div className='flex-shrink-0'>
				{renderActionButton()}
			</div>
		</div>
	);
}

export default UserCard;
