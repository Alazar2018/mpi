import { useOutletContext } from 'react-router-dom';
import type { Player } from '@/service/players.server';

export default function PlayerProfile() {
	// Get the player data from the parent component context
	const player = useOutletContext<Player>();

	// Helper function to get initials from firstName and lastName
	const getInitials = (firstName: string, lastName: string) => {
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	};

	// Helper function to get avatar color based on name
	const getAvatarColor = (firstName: string, lastName: string) => {
		const colors = [
			'from-blue-400 to-purple-500',
			'from-green-400 to-blue-500',
			'from-orange-400 to-red-500',
			'from-purple-400 to-pink-500',
			'from-teal-400 to-green-500',
			'from-indigo-400 to-purple-500'
		];
		const index = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
		return colors[index];
	};

	// Helper function to format phone number
	const formatPhoneNumber = (phoneNumber: any) => {
		if (!phoneNumber) return 'No phone';
		return `${phoneNumber.countryCode} ${phoneNumber.number}`;
	};

	// Helper function to format last online time
	const formatLastOnline = (lastOnline: string) => {
		if (!lastOnline) return 'Unknown';
		const date = new Date(lastOnline);
		return date.toLocaleDateString();
	};

	if (!player) {
		return (
			<div className="p-6">
				<div className="text-center text-gray-500 dark:text-gray-400">Loading player profile...</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			{/* Parents Section */}
			<div className="grid grid-cols-2 gap-6 border-t pt-8 border-gray-200 dark:border-gray-700">
				<span className="col-span-2 text-lg font-semibold text-gray-800 dark:text-white">
					Parents ({player.parents?.length || 0})
				</span>
				{player.parents && player.parents.length > 0 ? (
					player.parents.map((parent, idx) => (
						<div key={parent._id} className="flex gap-4 rounded-[1.25rem] p-4 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-800">
							{parent.avatar ? (
								<img 
									src={parent.avatar} 
									alt={`${parent.firstName} ${parent.lastName}`}
									className="size-12 rounded-full object-cover"
								/>
							) : (
								<div className={`size-12 rounded-full bg-gradient-to-r ${getAvatarColor(parent.firstName, parent.lastName)} flex items-center justify-center text-white font-semibold`}>
									{getInitials(parent.firstName, parent.lastName)}
								</div>
							)}
							<div className="flex flex-col justify-center">
								<span className="text-base font-medium text-gray-800 dark:text-white">
									{parent.firstName} {parent.lastName}
								</span>
								<span className="text-gray-500 dark:text-gray-400 text-xs">
									{parent.emailAddress?.email || 'No email'}
								</span>
								<span className="text-gray-400 dark:text-gray-500 text-xs">
									{formatPhoneNumber(parent.phoneNumber)} • Last online: {formatLastOnline(parent.lastOnline)}
								</span>
							</div>
						</div>
					))
				) : (
					<div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
						No parents assigned
					</div>
				)}
			</div>
			
			{/* Coaches Section */}
			<div className="grid grid-cols-3 gap-6 border-t pt-8 border-gray-200 dark:border-gray-700 mt-6">
				<span className="col-span-3 text-lg font-semibold text-gray-800 dark:text-white">
					Coaches ({player.coaches?.length || 0})
				</span>
				{player.coaches && player.coaches.length > 0 ? (
					player.coaches.map((coach, idx) => (
						<div key={coach._id} className="flex gap-4 rounded-[1.25rem] p-4 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-800">
							{coach.avatar ? (
								<img 
									src={coach.avatar} 
									alt={`${coach.firstName} ${coach.lastName}`}
									className="size-12 rounded-full object-cover"
								/>
							) : (
								<div className={`size-12 rounded-full bg-gradient-to-r ${getAvatarColor(coach.firstName, coach.lastName)} flex items-center justify-center text-white font-semibold`}>
									{getInitials(coach.firstName, coach.lastName)}
								</div>
							)}
							<div className="flex flex-col justify-center">
								<span className="text-base font-medium text-gray-800 dark:text-white">
									{coach.firstName} {coach.lastName}
								</span>
								<span className="text-gray-500 dark:text-gray-400 text-xs">
									{coach.emailAddress?.email || 'No email'}
								</span>
								<span className="text-gray-400 dark:text-gray-500 text-xs">
									{formatPhoneNumber(coach.phoneNumber)} • Last online: {formatLastOnline(coach.lastOnline)}
								</span>
							</div>
						</div>
					))
				) : (
					<div className="col-span-3 text-center text-gray-500 py-4">
						No coaches assigned
					</div>
				)}
			</div>
		</div>
	);
}