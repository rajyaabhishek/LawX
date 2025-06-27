import { Briefcase, X } from "lucide-react";
import { useState } from "react";
import { formatDate } from "../utils/dateUtils";

const ExperienceSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [experiences, setExperiences] = useState(userData.experience || []);
	const [newExperience, setNewExperience] = useState({
		title: "",
		company: "",
		startDate: "",
		endDate: "",
		description: "",
		currentlyWorking: false,
	});

	const handleAddExperience = () => {
		if (newExperience.title && newExperience.company && newExperience.startDate) {
			setExperiences([...experiences, newExperience]);

			setNewExperience({
				title: "",
				company: "",
				startDate: "",
				endDate: "",
				description: "",
				currentlyWorking: false,
			});
		}
	};

	const handleDeleteExperience = (id) => {
		setExperiences(experiences.filter((exp) => exp._id !== id));
	};

	const handleSave = () => {
		onSave({ experience: experiences });
		setIsEditing(false);
	};

	const handleCurrentlyWorkingChange = (e) => {
		setNewExperience({
			...newExperience,
			currentlyWorking: e.target.checked,
			endDate: e.target.checked ? "" : newExperience.endDate,
		});
	};

	return (
		<div className='bg-white shadow rounded-xl p-4'>
			<h2 className='text-lg font-semibold mb-2'>Experience</h2>
			{experiences.length === 0 && !isEditing && (
				<div className="text-center py-3">
					<p className='text-gray-500 mb-1 text-sm'>No work experience added yet.</p>
					{isOwnProfile && (
						<p className='text-gray-400 text-xs'>Add your professional experience to showcase your career journey.</p>
					)}
				</div>
			)}
			<div className="space-y-3 mb-3">
				{experiences.map((exp) => (
					<div key={exp._id} className='flex justify-between items-start p-3 bg-gray-50 rounded-lg'>
						<div className='flex items-start'>
							<Briefcase size={16} className='mr-2 mt-1 text-gray-500' />
							<div>
								<h3 className='font-medium text-sm'>{exp.title}</h3>
								<p className='text-gray-600 text-sm'>{exp.company}</p>
								<p className='text-gray-500 text-xs'>
									{formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : "Present"}
								</p>
								{exp.description && <p className='text-gray-700 text-xs mt-1'>{exp.description}</p>}
							</div>
						</div>
						{isEditing && (
							<button onClick={() => handleDeleteExperience(exp._id)} className='text-gray-500 hover:text-red-600 p-1'>
								<X size={14} />
							</button>
						)}
					</div>
				))}
			</div>

			{isEditing && (
				<div className='space-y-3'>
					<input
						type='text'
						placeholder='Job Title'
						value={newExperience.title}
						onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
					/>
					<input
						type='text'
						placeholder='Company Name'
						value={newExperience.company}
						onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
					/>
					<input
						type='date'
						placeholder='Start Date'
						value={newExperience.startDate}
						onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
					/>
					<div className='flex items-center'>
						<input
							type='checkbox'
							id='currentlyWorking'
							checked={newExperience.currentlyWorking}
							onChange={handleCurrentlyWorkingChange}
							className='mr-2'
						/>
						<label htmlFor='currentlyWorking' className="text-sm text-gray-700">I currently work here</label>
					</div>
					{!newExperience.currentlyWorking && (
						<input
							type='date'
							placeholder='End Date'
							value={newExperience.endDate}
							onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
							className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
						/>
					)}
					<textarea
						placeholder='Job description and key achievements...'
						value={newExperience.description}
						onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm resize-none'
						rows='3'
					/>
					<button
						onClick={handleAddExperience}
						className='px-4 py-2 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg transition-all duration-200 text-sm'
						style={{ color: '#1f2937' }}
					>
						Add Experience
					</button>
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
					{experiences.length > 0 ? 'Edit Experience' : 'Add Experience'}
				</button>
			)}
		</div>
	);
};
export default ExperienceSection;
