import { School, X } from "lucide-react";
import { useState } from "react";

const EducationSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [educations, setEducations] = useState(userData.education || []);
	const [newEducation, setNewEducation] = useState({
		school: "",
		fieldOfStudy: "",
		startYear: "",
		endYear: "",
	});

	const handleAddEducation = () => {
		if (newEducation.school && newEducation.fieldOfStudy && newEducation.startYear) {
			setEducations([...educations, newEducation]);
			setNewEducation({
				school: "",
				fieldOfStudy: "",
				startYear: "",
				endYear: "",
			});
		}
	};

	const handleDeleteEducation = (id) => {
		setEducations(educations.filter((edu) => edu._id !== id));
	};

	const handleSave = () => {
		onSave({ education: educations });
		setIsEditing(false);
	};

	return (
		<div className='bg-white shadow rounded-xl p-4'>
			<h2 className='text-lg font-semibold mb-2'>Education</h2>
			{educations.length === 0 && !isEditing && (
				<div className="text-center py-3">
					<p className='text-gray-500 mb-1 text-sm'>No education information added yet.</p>
					{isOwnProfile && (
						<p className='text-gray-400 text-xs'>Add your educational background to showcase your qualifications.</p>
					)}
				</div>
			)}
			<div className="space-y-3 mb-3">
				{educations.map((edu) => (
					<div key={edu._id} className='flex justify-between items-start p-3 bg-gray-50 rounded-lg'>
						<div className='flex items-start'>
							<School size={16} className='mr-2 mt-1 text-gray-500' />
							<div>
								<h3 className='font-medium text-sm'>{edu.fieldOfStudy}</h3>
								<p className='text-gray-600 text-sm'>{edu.school}</p>
								<p className='text-gray-500 text-xs'>
									{edu.startYear} - {edu.endYear || "Present"}
								</p>
							</div>
						</div>
						{isEditing && (
							<button onClick={() => handleDeleteEducation(edu._id)} className='text-gray-500 hover:text-red-600 p-1'>
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
						placeholder='School/University Name'
						value={newEducation.school}
						onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
					/>
					<input
						type='text'
						placeholder='Field of Study/Degree'
						value={newEducation.fieldOfStudy}
						onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
						className='w-full p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
					/>
					<div className='grid grid-cols-2 gap-2'>
						<input
							type='number'
							placeholder='Start Year'
							value={newEducation.startYear}
							onChange={(e) => setNewEducation({ ...newEducation, startYear: e.target.value })}
							className='p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
						/>
						<input
							type='number'
							placeholder='End Year'
							value={newEducation.endYear}
							onChange={(e) => setNewEducation({ ...newEducation, endYear: e.target.value })}
							className='p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
						/>
					</div>
					<button
						onClick={handleAddEducation}
						className='px-4 py-2 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg transition-all duration-200 text-sm'
						style={{ color: '#1f2937' }}
					>
						Add Education
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
					{educations.length > 0 ? 'Edit Education' : 'Add Education'}
				</button>
			)}
		</div>
	);
};
export default EducationSection;
