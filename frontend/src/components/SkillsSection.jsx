import { X } from "lucide-react";
import { useState } from "react";

const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [skills, setSkills] = useState(userData.skills || []);
	const [newSkill, setNewSkill] = useState("");

	const handleAddSkill = () => {
		if (newSkill && !skills.includes(newSkill)) {
			setSkills([...skills, newSkill]);
			setNewSkill("");
		}
	};

	const handleDeleteSkill = (skill) => {
		setSkills(skills.filter((s) => s !== skill));
	};

	const handleSave = () => {
		onSave({ skills });
		setIsEditing(false);
	};

	return (
		<div className='bg-white shadow rounded-xl p-4'>
			<h2 className='text-lg font-semibold mb-2'>Skills & Expertise</h2>
			
			{skills.length === 0 && !isEditing && (
				<div className="text-center py-3">
					<p className='text-gray-500 mb-1 text-sm'>No skills added yet.</p>
					{isOwnProfile && (
						<p className='text-gray-400 text-xs'>Add your professional skills and expertise to showcase your capabilities.</p>
					)}
				</div>
			)}
			
			<div className='flex flex-wrap gap-2 mb-3'>
				{skills.map((skill, index) => (
					<span
						key={index}
						className='bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-gray-200'
					>
						{skill}
						{isEditing && (
							<button 
								onClick={() => handleDeleteSkill(skill)} 
								className='ml-1 text-gray-500 hover:text-red-600 rounded-full p-1 transition-all duration-200'
								title="Remove skill"
							>
								<X size={12} />
							</button>
						)}
					</span>
				))}
			</div>

			{isEditing && (
				<div className='space-y-3'>
					<div className='flex gap-2'>
						<input
							type='text'
							placeholder='Add a skill (e.g., Legal Research, Contract Law, Litigation)'
							value={newSkill}
							onChange={(e) => setNewSkill(e.target.value)}
							className='flex-1 p-2 border border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none transition-all duration-200 text-sm'
							onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
						/>
						<button
							onClick={handleAddSkill}
							className='px-4 py-2 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg transition-all duration-200 text-sm'
							style={{ color: '#1f2937' }}
						>
							Add Skill
						</button>
					</div>
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
					{skills.length > 0 ? 'Edit Skills' : 'Add Skills'}
				</button>
			)}
		</div>
	);
};
export default SkillsSection;
