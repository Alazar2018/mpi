import type { Player } from '@/service/players.server';

interface PlayersCardProps {
  player?: Player;
}

export default function PlayersCard({ player }: PlayersCardProps) {
  // Default player data if none provided
  interface DefaultPlayer {
    id: number;
    name: string;
    initials: string;
    email: string;
    usdta: number;
    rating: number;
    status: 'active' | 'inactive' | 'away';
    lastSeen: string;
    avatarColor: string;
  }

  const defaultPlayers: DefaultPlayer[] = [
    {
      id: 1,
      name: "Birhane Araya",
      initials: "BA",
      email: "birhane@example.com",
      usdta: 19,
      rating: 4.8,
      status: 'active',
      lastSeen: "2h ago",
      avatarColor: "from-blue-400 to-purple-500"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      initials: "SJ",
      email: "sarah@example.com",
      usdta: 24,
      rating: 4.6,
      status: 'active',
      lastSeen: "1h ago",
      avatarColor: "from-green-400 to-blue-500"
    },
    {
      id: 3,
      name: "Michael Chen",
      initials: "MC",
      email: "michael@example.com",
      usdta: 16,
      rating: 4.9,
      status: 'away',
      lastSeen: "5h ago",
      avatarColor: "from-orange-400 to-red-500"
    }
  ];

  const currentPlayer = player || defaultPlayers[Math.floor(Math.random() * defaultPlayers.length)];
  
  // Type guard to check if it's a real player
  const isRealPlayer = (p: Player | DefaultPlayer): p is Player => {
    return 'firstName' in p && 'lastName' in p;
  };
  
  // Helper functions for new Player interface
  const getPlayerInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return 'U';
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (firstName: string, lastName: string) => {
    const name = firstName || lastName || '';
    if (!name) return 'from-gray-400 to-gray-500';
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-pink-500',
      'from-teal-400 to-green-500',
      'from-indigo-400 to-purple-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getPlayerFullName = (firstName: string, lastName: string) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown Name';
  };

  const getOnlineStatus = (lastOnline: string) => {
    if (!lastOnline) return { text: 'Unknown', color: 'bg-gray-500' };
    
    const now = new Date();
    const lastOnlineDate = new Date(lastOnline);
    const diffInMinutes = Math.floor((now.getTime() - lastOnlineDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return { text: 'Online', color: 'bg-green-500' };
    if (diffInMinutes < 60) return { text: `${diffInMinutes}m ago`, color: 'bg-yellow-500' };
    if (diffInMinutes < 1440) return { text: `${Math.floor(diffInMinutes / 60)}h ago`, color: 'bg-orange-500' };
    return { text: `${Math.floor(diffInMinutes / 1440)}d ago`, color: 'bg-gray-500' };
  };

	return (
		<div className="p-4 flex gap-4 card-shadow rounded-xl bg-[var(--bg-secondary)] hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-[var(--border-primary)] group cursor-pointer">
			<div className="relative">
				{player ? (
					// Real player data
					<>
						{player.avatar ? (
							<img src={player.avatar} alt={getPlayerFullName(player.firstName, player.lastName)} className="size-12 rounded-full object-cover" />
						) : (
							<div className={`size-12 rounded-full bg-gradient-to-r ${getAvatarColor(player.firstName, player.lastName)} flex items-center justify-center text-white font-semibold text-lg`}>
								{getPlayerInitials(player.firstName, player.lastName)}
							</div>
						)}
						<div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getOnlineStatus(player.lastOnline).color} rounded-full border-2 border-[var(--bg-card)]`}></div>
					</>
				) : (
					// Default player data
					<>
						<div className={`size-12 rounded-full bg-gradient-to-r ${currentPlayer.avatarColor} flex items-center justify-center text-white font-semibold text-lg`}>
							{currentPlayer.initials}
						</div>
						<div className={`absolute -bottom-1 -right-1 w-4 h-4 ${currentPlayer.status === 'active' ? 'bg-green-500' : currentPlayer.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'} rounded-full border-2 border-[var(--bg-card)]`}></div>
					</>
				)}
			</div>
			<div className="flex flex-col flex-1">
				<div className="flex items-center justify-between mb-1">
					<span className="font-bold text-[var(--text-primary)] group-hover:text-primary transition-colors">
						{player ? getPlayerFullName(player.firstName, player.lastName) : currentPlayer.name}
					</span>
					<div className="flex items-center gap-1">
						<i dangerouslySetInnerHTML={{ __html: '★' }} className="text-yellow-400 text-xs" />
						<span className="text-xs text-[var(--text-secondary)]">
							{player ? (player.goals?.length || 0) : currentPlayer.rating}
						</span>
					</div>
				</div>
				<span className="text-xs text-[var(--text-secondary)] mb-2">
					{player ? `Goals: ${player.goals?.length || 0}` : `USDTA: ${currentPlayer.usdta}`}
				</span>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{player ? (
							<>
								<span className="text-xs text-[var(--text-secondary)]">{getOnlineStatus(player.lastOnline).text}</span>
								<span className="text-xs text-[var(--text-secondary)]">{player.emailAddress?.email || 'No email'}</span>
							</>
						) : (
							<>
								<span className={`px-2 py-1 ${currentPlayer.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : currentPlayer.status === 'away' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'} rounded-full text-xs font-medium`}>
									{currentPlayer.status === 'active' ? 'Active' : currentPlayer.status === 'away' ? 'Away' : 'Inactive'}
								</span>
								<span className="text-xs text-[var(--text-secondary)]">Last seen {currentPlayer.lastSeen}</span>
							</>
						)}
					</div>
					<div className="flex items-center gap-1 text-[var(--text-tertiary)] group-hover:text-primary transition-colors">
						<i dangerouslySetInnerHTML={{ __html: '→' }} className="text-xs" />
					</div>
				</div>
			</div>
		</div>
	)
}