import { useState } from "react";

const AboutSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [about, setAbout] = useState(userData.about || "");

	const handleSave = () => {
		setIsEditing(false);
		onSave({ about });
	};
	return (
		<div className='bg-white shadow rounded-xl p-4'>
			<h2 className='text-lg font-semibold mb-2'>About</h2>
			
			{!userData.about && !isEditing && (
				<div className="text-center py-3">
					<p className='text-gray-500 mb-1 text-sm'>No information added yet.</p>
					{isOwnProfile && (
						<p className='text-gray-400 text-xs'>Share your professional journey, expertise, and what drives your passion for law.</p>
					)}
				</div>
			)}

			{userData.about && !isEditing && (
				<div className="mb-3">
					<div className='p-3 bg-gray-50 rounded-lg'>
						<p className='text-gray-700 leading-relaxed text-sm'>{userData.about}</p>
					</div>
				</div>
			)}

			{isEditing && (
				<div className='space-y-3'>
					<textarea
						value={about}
						onChange={(e) => setAbout(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 resize-none text-sm'
						rows='4'
						placeholder='Tell us about yourself, your experience, and what makes you unique in your professional field...'
					/>
					<div className="flex gap-2">
						<button
							onClick={handleSave}
							className='px-6 py-2 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg transition-all duration-200'
							style={{ color: '#1f2937' }}
						>
							Save Changes
						</button>
						<button
							onClick={() => setIsEditing(false)}
							className='px-6 py-2 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg transition-all duration-200'
							style={{ color: '#374151' }}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{isOwnProfile && !isEditing && (
				<button
					onClick={() => setIsEditing(true)}
					className='text-gray-600 hover:text-gray-800 font-medium transition-all duration-200'
				>
					{userData.about ? 'Edit About' : 'Add About Section'}
				</button>
			)}
		</div>
	);
};
export default AboutSection;
