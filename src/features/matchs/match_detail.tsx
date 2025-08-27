import DefaultPage from "@components/DefaultPage.tsx";

import icons from "@/utils/icons";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect, useState } from "react";
import { getMatchById } from "./api/matchs.api";
import MatchSkeleton from "@/components/skeletons/MatchSkeleton";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/Button";
import { matchesService } from "@/service/matchs.server";
import type { Match, MatchPlayer } from "@/service/matchs.server";
import { toast } from "react-hot-toast";
import { SetsTab, MomentumTab, ReportTab } from "./components";

export default function MatchDetail() {
	const params = useParams();

	const navigate = useNavigate();
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState("match-detail");
	const [showLevelSelection, setShowLevelSelection] = useState(false);
	const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
	const [showLevelChangeConfirmation, setShowLevelChangeConfirmation] = useState(false);
	const [levelToChange, setLevelToChange] = useState<number | null>(null);
	
	const matchesReq = useApiRequest({
		cacheKey: "match_" + params?.matchId,
		freshDuration: 1000 * 60 * 5,
		staleWhileRevalidate: true,
	});
	
	useEffect(() => {
		if(!params?.matchId) return
		matchesReq.send(
			() => getMatchById(params.matchId as string),
			(res) => {
				if (res.success && res.data) {
					// Match data received successfully
				}
			}
		);
	}, [params]);

	const matchData = matchesReq.response as Match;
	
	// Transform Match data to the format expected by SetsTab
	const transformMatchDataForSetsTab = (match: Match) => {
		if (!match) return null;
		
		return {
			_id: match._id,
			p1: match.p1,
			p2: match.p2,
			p1IsObject: match.p1IsObject,
			p2IsObject: match.p2IsObject,
			p1Name: match.p1Name,
			p2Name: match.p2Name,
			sets: match.sets || [],
			status: match.status,
			winner: match.winner,
			report: match.report,
			totalGameTime: match.totalGameTime,
			courtSurface: match.courtSurface,
			matchType: match.matchType,
			matchCategory: match.matchCategory
		};
	};
	
	const transformedMatchData = transformMatchDataForSetsTab(matchData);
	


	// Get player data only when matchData is available
	const getPlayerData = () => {
		if (!matchData) return null;

		// Create player data structure
		const playerData = {
			player1: matchData.p1IsObject && matchData.p1 && typeof matchData.p1 === 'object' ? {
				_id: matchData.p1._id,
				firstName: matchData.p1.firstName,
				lastName: matchData.p1.lastName,
				avatar: matchData.p1.avatar || "https://randomuser.me/api/portraits/men/32.jpg",
				emailAddress: { email: "" },
				phoneNumber: { countryCode: "", number: "" },
				lastOnline: ""
			} : {
				_id: "custom_player_1",
				firstName: matchData.p1Name || "Player",
				lastName: "One",
				avatar: "https://randomuser.me/api/portraits/men/32.jpg",
				emailAddress: { email: "" },
				phoneNumber: { countryCode: "", number: "" },
				lastOnline: ""
			},
			player2: matchData.p2IsObject && matchData.p2 && typeof matchData.p2 === 'object' ? {
				_id: matchData.p2._id,
				firstName: matchData.p2.firstName,
				lastName: matchData.p2.lastName,
				avatar: matchData.p2.avatar || "https://randomuser.me/api/portraits/women/44.jpg",
				emailAddress: { email: "" },
				phoneNumber: { countryCode: "", number: "" },
				lastOnline: ""
			} : {
				_id: "custom_player_2",
				firstName: matchData.p2Name || "Player",
				lastName: "Two",
				avatar: "https://randomuser.me/api/portraits/women/44.jpg",
				emailAddress: { email: "" },
				phoneNumber: { countryCode: "", number: "" },
				lastOnline: ""
			}
		};

		return playerData;
	};

	const playerData = getPlayerData();

	// Get match details for display
	const getMatchDetails = () => {
		if (!matchData) return null;

		try {
			return {
				date: new Date(matchData.date).toLocaleDateString(),
				time: new Date(matchData.date).toLocaleTimeString(),
				matchType: matchData.matchType,
				tieBreakRule: matchData.tieBreakRule,
				indoor: matchData.indoor ? 'Indoor' : 'Outdoor',
				courtSurface: matchData.courtSurface,
				creator: matchData.matchCreator,
				totalGameTime: matchData.totalGameTime || 0
			};
		} catch (error) {
			return null;
		}
	};

	const matchDetails = getMatchDetails();

	// Helper function to safely format status strings
	const formatStatus = (status?: string) => {
		if (!status) return 'Pending';
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	// Listen for start match event from the Match component
	useEffect(() => {
		const handleStartMatch = () => {
			setShowLevelSelection(true);
		};

		window.addEventListener('startMatch', handleStartMatch);
		return () => {
			window.removeEventListener('startMatch', handleStartMatch);
		};
	}, []);

	const tabs = [
		{ name: "Match Detail", id: "match-detail" },
		{ name: "Sets", id: "sets" },
		{ name: "Momentum", id: "momentum" },
		{ name: "Report", id: "report" }
	];

	// Handle tab switching
	const handleTabSwitch = (tabId: string) => {
		setActiveTab(tabId);
	};

	const handleStartMatch = () => {
		setShowLevelSelection(true);
	};

	const handleLevelSelect = (level: number) => {
		// If a level is already selected, show confirmation dialog
		if (selectedLevel && selectedLevel !== level) {
			setLevelToChange(level);
			setShowLevelChangeConfirmation(true);
		} else {
			setSelectedLevel(level);
		}
	};

	const handleConfirmLevelChange = () => {
		if (levelToChange) {
			setSelectedLevel(levelToChange);
			setShowLevelChangeConfirmation(false);
			setLevelToChange(null);
		}
	};

	const handleCancelLevelChange = () => {
		setShowLevelChangeConfirmation(false);
		setLevelToChange(null);
	};

	const handleStartTracking = () => {
		if (selectedLevel) {
			// Navigate directly to tracking with the selected level
			navigate(`/admin/matchs/tracking/${params.matchId}?level=${selectedLevel}`);
		}
	};

	const handleCloseLevelSelection = () => {
		setShowLevelSelection(false);
		setSelectedLevel(null);
	};

	// Check if current user is one of the players in the match
	const isCurrentUserPlayer = () => {
		if (!user || !matchData) return false;
		
		const isPlayer1 = matchData.p1?._id === user._id;
		const isPlayer2 = matchData.p2?._id === user._id;
		
		return isPlayer1 || isPlayer2;
	};

	// Check if current user can accept/reject the match
	const canAcceptReject = () => {
		return isCurrentUserPlayer() && matchData?.status === 'pending';
	};

	// Handle match acceptance/rejection
	const handleMatchResponse = async (response: 'accepted' | 'rejected') => {
		if (!matchData?._id) return;

		try {
			await matchesService.updateMatchStatus(matchData._id, {
				playerStatus: response
			});
			
			// Refresh match data
			matchesReq.send(
				() => getMatchById(params.matchId as string),
				(res) => {
					if (res.success && res.data) {
						toast.success(`Match ${response} successfully!`);
					}
				}
			);
		} catch (error) {
			console.error('Error updating match status:', error);
			toast.error('Failed to update match status');
		}
	};

	// Check if current user can respond to the match
	const canRespondToMatch = () => {
		if (!isCurrentUserPlayer()) return false;
		
		const isPlayer1 = matchData?.p1?._id === user?._id;
		const isPlayer2 = matchData?.p2?._id === user?._id;
		
		if (isPlayer1 && matchData?.p1Status === 'pending') return true;
		if (isPlayer2 && matchData?.p2Status === 'pending') return true;
		
		return false;
	};

	// Get the appropriate button text and action
	const getActionButton = () => {
		const matchStatus = (matchData as any)?.status;
		
		if (matchStatus === 'saved') {
			return (
				<Button 
					onClick={() => navigate(`/admin/matchs/tracking/${params.matchId}`)}
					type="action" 
					className="text-sm"
				>
					Resume Match
				</Button>
			);
		}
		
		if (matchStatus === 'pending') {
			return (
				<Button 
					onClick={() => setShowLevelSelection(true)}
					type="action" 
					className="text-sm"
				>
					Start Match
				</Button>
			);
		}
		
		return null;
	};

	// Helper function to render tab content
	const renderTabContent = () => {
		if (!matchData) return null;

		switch (activeTab) {
			case 'sets':
				return transformedMatchData ? <SetsTab matchData={transformedMatchData} /> : <div>Loading...</div>;

			case 'momentum':
				return transformedMatchData ? <MomentumTab matchData={transformedMatchData} /> : <div>Loading...</div>;

			case 'report':
				return transformedMatchData ? <ReportTab matchData={transformedMatchData} /> : <div>Loading...</div>;

			default: // Match Detail tab
				return (
					<div className="py-6">
						<h3 className="text-2xl font-bold text-gray-800 mb-6">Match Overview</h3>
						
						{/* Match Details Summary */}
						{/* <div className="bg-gray-50 rounded-xl p-6 mb-6"> */}
							
							{/* Player Response Buttons */}
							{/* {canAcceptReject() && (
								<div className="mt-6 pt-4 border-t border-gray-200">
									<div className="flex items-center justify-between">
										<div className="text-sm text-gray-600">
											{isCurrentUserPlayer() ? 'You are a player in this match. ' : ''}
											Please respond to this match invitation:
										</div>
										<div className="flex gap-3">
											<Button
												onClick={() => handleMatchResponse('accepted')}
												type="action"
												className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
											>
												Accept Match
											</Button>
											<Button
												onClick={() => handleMatchResponse('rejected')}
												type="neutral"
												className="bg-red-100 text-red-600 hover:bg-red-200 px-6 py-2"
											>
												Reject Match
											</Button>
										</div>
									</div>
								</div>
							)} */}
							{/* </div> */}

						{/* Match Details Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Match Date & Time */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">📅</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Match Date & Time</span>
									<div className="font-bold text-gray-800 flex items-center gap-1">
										<span className="text-sm py-1 px-2 bg-green-100 rounded-sm">
											{matchDetails?.date || 'Loading...'}
										</span>
									</div>
								</div>
							</div>

							{/* Match Length */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">⏰</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Match Length</span>
									<span className="text-base font-bold text-gray-800">
										{matchDetails?.totalGameTime ? `${Math.round(matchDetails.totalGameTime / 60)} Min` : 'Not set'}
									</span>
								</div>
							</div>

							{/* Game Best Out of */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">🎾</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Game Best Out of</span>
									<span className="text-base font-bold text-gray-800">
										{matchDetails?.matchType || 'Loading...'}
									</span>
								</div>
							</div>

							{/* Tie-Breaker Rule */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">🎯</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Tie-Breaker Rule</span>
									<span className="text-base font-bold text-gray-800">
										{matchDetails?.tieBreakRule || 'Loading...'}
									</span>
								</div>
							</div>

							{/* Court Type */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">🏟️</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Court Type</span>
									<span className="text-base font-bold text-gray-800">
										{matchDetails?.indoor || 'Loading...'}
									</span>
								</div>
							</div>

							{/* Court Surface Type */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">🌊</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Court Surface Type</span>
									<span className="text-base font-bold text-gray-800">
										{matchDetails?.courtSurface || 'Loading...'}
									</span>
								</div>
							</div>

							{/* Match Creator */}
							<div className="flex items-center p-4 gap-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="w-12 h-12 bg-gray-50 grid place-items-center rounded-lg">
									<i className="text-gray-600">👤</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-gray-600 mb-1">Match Creator</span>
									<span className="text-base font-bold text-gray-800">
										{matchData?.matchCreator ? `${matchData.matchCreator.firstName} ${matchData.matchCreator.lastName}` : 'Loading...'}
									</span>
								</div>
							</div>
						</div>
					</div>
				);
		}
	};

	return (
		<DefaultPage className="!p-6">
			{matchesReq.pending && !matchData ? (
				<MatchSkeleton />
			) : (
				<div className="space-y-6">
					{/* Player Banners Header */}
					{matchData && (
					<div className="grid grid-cols-2 h-24 rounded-2xl overflow-hidden shadow-lg">
						{/* Player 1 Banner - Lime Green */}
						<div className="bg-lime-400 relative flex items-center justify-between px-8">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-full bg-white shadow-lg overflow-hidden">
									<img
											src={playerData?.player1?.avatar || matchData.p1?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
											alt={`${playerData?.player1?.firstName || matchData.p1?.firstName || matchData.p1Name || 'Player'} ${playerData?.player1?.lastName || matchData.p1?.lastName || ''}`}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="text-white">
									<h2 className="text-xl font-bold">
											{playerData?.player1?.firstName || matchData.p1?.firstName || matchData.p1Name || 'Player'} {playerData?.player1?.lastName || matchData.p1?.lastName || ''}
									</h2>
										<p className="text-sm opacity-90">
											{matchData.p1IsObject ? 'Registered Player' : 'Custom Player'}
										</p>
								</div>
							</div>
							<div className="absolute left-4 top-1/2 transform -translate-y-1/2">
								<i 
									className="w-8 h-8 text-white opacity-80" 
									dangerouslySetInnerHTML={{ __html: icons.tennisBall }} 
								/>
							</div>
						</div>

						{/* Player 2 Banner - Deep Blue */}
						<div className="bg-blue-600 relative flex items-center justify-between px-8">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-full bg-white shadow-lg overflow-hidden">
									<img
											src={playerData?.player2?.avatar || matchData.p2?.avatar || "https://randomuser.me/api/portraits/women/44.jpg"}
											alt={`${playerData?.player2?.firstName || matchData.p2?.firstName || matchData.p2Name || 'Player'} ${(matchData.p2 as MatchPlayer)?.lastName || ''}`}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="text-white">
									<h2 className="text-xl font-bold">
											{playerData?.player2?.firstName || matchData.p2?.firstName || matchData.p2Name || 'Player'} {(matchData.p2 as MatchPlayer)?.lastName || 'Two'}
									</h2>
										<p className="text-sm opacity-90">
											{matchData.p2IsObject ? 'Registered Player' : 'Custom Player'}
										</p>
								</div>
							</div>
							<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
								<i 
									className="w-8 h-8 text-white opacity-80" 
									dangerouslySetInnerHTML={{ __html: icons.tennisBall }} 
								/>
							</div>
						</div>
					</div>
					)}

					{/* Match Status Banner */}
					{/* {matchData && (
						<div className="mb-6 bg-white rounded-xl p-4 shadow-sm border">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className={`px-3 py-1 rounded-full text-sm font-medium ${
										(matchData as any).status === 'saved' ? 'text-blue-600 bg-blue-100' :
										(matchData as any).status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
										(matchData as any).status === 'confirmed' ? 'text-green-600 bg-green-100' :
										(matchData as any).status === 'inProgress' ? 'text-blue-600 bg-blue-100' :
										(matchData as any).status === 'completed' ? 'text-gray-600 bg-gray-100' :
										(matchData as any).status === 'cancelled' ? 'text-red-600 bg-red-100' :
										(matchData as any).status === 'postponed' ? 'text-orange-600 bg-orange-100' :
										(matchData as any).status === 'forfeited' ? 'text-red-600 bg-red-100' :
										'text-gray-600 bg-gray-100'
									}`}>
										{(matchData as any).status === 'saved' ? 'Saved Match' :
										 (matchData as any).status === 'pending' ? 'Pending' :
										 (matchData as any).status === 'confirmed' ? 'Confirmed' :
										 (matchData as any).status === 'inProgress' ? 'In Progress' :
										 (matchData as any).status === 'completed' ? 'Completed' :
										 (matchData as any).status === 'cancelled' ? 'Cancelled' :
										 (matchData as any).status === 'postponed' ? 'Postponed' :
										 (matchData as any).status === 'forfeited' ? 'Forfeited' :
										 (matchData as any).status}
									</div>
									{matchData.p1Status && (
										<div className="text-sm text-gray-600">
											Player 1: <span className={`font-medium ${matchData.p1Status === 'accepted' ? 'text-green-600' : matchData.p1Status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
												{matchData.p1Status === 'pending' ? 'Pending' : matchData.p1Status === 'accepted' ? 'Accepted' : 'Rejected'}
											</span>
										</div>
									)}
									{matchData.p2Status && (
										<div className="text-sm text-gray-600">
											Player 2: <span className={`font-medium ${matchData.p2Status === 'accepted' ? 'text-red-600' : matchData.p2Status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
												{matchData.p2Status === 'pending' ? 'Pending' : matchData.p2Status === 'accepted' ? 'Accepted' : 'Rejected'}
											</span>
										</div>
									)}
								</div>
								{canAcceptReject() && (
									<div className="text-sm text-blue-600 font-medium">
										Action Required: Please accept or reject this match
									</div>
								)}
							</div>
						</div>
					)} */}

					{/* Navigation Tabs */}
					<div className="flex items-center justify-between">
						{/* Debug Status Display */}
						{matchData && (
							<div className="text-sm text-gray-600 mb-2">
								Current Status: <span className="font-medium">{(matchData as any).status}</span>
							</div>
						)}
						<div className="flex gap-2">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => handleTabSwitch(tab.id)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
										activeTab === tab.id
											? "bg-blue-600 text-white shadow-md transform scale-105"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
									}`}
								>
									{tab.name}
								</button>
							))}
						</div>
						<div className="flex gap-2">
							{/* Show action button based on match status */}
							{getActionButton()}
						</div>
						{/* <Button 
								onClick={clearTestingState}
								type="neutral" 
								className="text-sm bg-red-100 text-red-600 hover:bg-red-200"
							>
								Clear State
							</Button>
							<Button type="neutral" className="text-sm">
								History
							</Button> */}
					</div>

					{/* Main Content Area */}
					<div className="bg-white rounded-2xl p-6 shadow-sm">
						{/* Breadcrumbs */}
						<div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
							<button 
								onClick={() => navigate('/admin/matchs')}
								className="hover:text-blue-600 transition-colors"
							>
								Matches
							</button>
							<span>/</span>
							<span className="text-gray-800 font-medium">
								{activeTab === 'match-detail' ? 'Match Overview' : 
								 activeTab === 'sets' ? 'Match Sets' :
								 activeTab === 'momentum' ? 'Match Momentum' :
								 activeTab === 'report' ? 'Match Report' : 'Match Details'}
							</span>
						</div>

						{/* Tab Content with Transition */}
						<div className="transition-all duration-300 ease-in-out">
							{renderTabContent()}
						</div>
					</div>
				</div>
			)}

			{/* Level Selection Modal */}
			{showLevelSelection && (
				<div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-[#F5F7FF] rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-200">
						{/* Header */}
						<div className="bg-blue-600 text-white py-4 px-6 rounded-t-2xl">
							<h2 className="text-xl font-bold text-center">
								Please select score tractor type
							</h2>
						</div>

						<div className="p-8">
							{/* Level Selection Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4">
								{/* Level 1 */}
								<div 
									onClick={() => handleLevelSelect(1)}
									className={`relative p-6 rounded-xl cursor-pointer transition-all duration-200 border-0 ${
										selectedLevel === 1 
											? 'bg-[#5368FF]  shadow-lg scale-105' 
											: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
									}`}
								>
								<div className={`p-5 ${selectedLevel===1?'bg-[#CFF97D]':'bg-gray'}`}>
								{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 1 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 1 ? 'bg-gray-300' : 'bg-gray-200'
											}`}></div>
											<div className={`w-8 h-12 rounded-sm ${
												selectedLevel === 1 ? 'bg-gray-300' : 'bg-gray-200'
											}`}></div>
											</div>
									</div>
									<h3 className=" text-center text-xl font-bold mb-3">Level 1</h3>
									</div>
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 1 ? 'text-white' : 'text-gray-800'}`}>
										<p className="text-sm leading-relaxed opacity-90">
											To capture only essential match details: point-by-point scoring and basic events. 
											Suitable for casual practice or audience/guest viewing.
										</p>
									</div>
								</div>

								{/* Level 2 */}
								<div 
									onClick={() => handleLevelSelect(2)}
									className={`relative p-6 rounded-xl cursor-pointer transition-all duration-200 border-0 ${
										selectedLevel === 2 
											? 'bg-[#5368FF]  shadow-lg scale-105' 
											: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
									}`}
								>
								<div className={`p-5 ${selectedLevel===2?'bg-[#CFF97D]':'bg-gray'}`}>

									{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 2 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 2 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
											<div className={`w-8 h-14 rounded-sm ${
												selectedLevel === 2 ? 'bg-white' : 'bg-gray-200'
											}`}></div>
										</div>
									</div>
									<h3 className=" text-center text-xl font-bold mb-3">Level 2</h3>
									</div>
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 2 ? 'text-white' : 'text-gray-800'}`}>
										<p className="text-sm leading-relaxed opacity-90">
											To track match by games and sets, not just points. Adds basic player 
											statistics like double faults, winners, errors.
										</p>
									</div>
								</div>

								{/* Level 3 */}
								<div 
									onClick={() => handleLevelSelect(3)}
									className={`relative p-6 rounded-xl cursor-pointer transition-all duration-200 border-0 ${
										selectedLevel === 3 
											? 'bg-[#5368FF]  shadow-lg scale-105' 
											: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
									}`}
								>
								<div className={`p-5 ${selectedLevel===3?'bg-[#CFF97D]':'bg-gray'}`}>

									{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 3 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 3 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
											<div className={`w-8 h-16 rounded-sm ${
												selectedLevel === 3 ? 'bg-blue-600' : 'bg-gray-400'
											}`}></div>
										</div>
									</div>
									<h3 className="text-xl font-bold mb-3">Level 3</h3>
									</div>
									
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 3 ? 'text-white' : 'text-gray-800'}`}>
										<p className="text-sm leading-relaxed opacity-90">
											Advanced charting for coaches or organizations, providing shot-by-shot 
											analysis, positioning, and rally patterns.
										</p>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex justify-center gap-4 w-full">
								<button
									onClick={handleCloseLevelSelection}
									className="px-8 py-4 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium flex-1 max-w-[200px]"
								>
									Cancel
								</button>
								<button
									onClick={handleStartTracking}
									disabled={!selectedLevel}
									className={`px-8 py-4 rounded-lg font-medium transition-colors flex-1 ${
										selectedLevel 
											? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' 
											: 'bg-gray-300 text-gray-500 cursor-not-allowed'
									}`}
								>
									{selectedLevel ? `Start Level ${selectedLevel} Match` : 'Select a Level'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Level Change Confirmation Dialog */}
			{showLevelChangeConfirmation && (
				<div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
						{/* Header */}
						<div className="bg-yellow-500 text-white py-4 px-6 rounded-t-2xl">
							<h2 className="text-xl font-bold text-center">
								Change Tracking Level?
							</h2>
						</div>

						<div className="p-6">
							{/* Confirmation Message */}
							<div className="text-center mb-6">
								<div className="text-4xl mb-4">⚠️</div>
								<h3 className="text-lg font-semibold text-gray-800 mb-2">
									Are you sure you want to change the level?
								</h3>
								<p className="text-gray-600">
									You're about to change from <strong>Level {selectedLevel}</strong> to <strong>Level {levelToChange}</strong>.
								</p>
								<p className="text-sm text-gray-500 mt-2">
									This will affect the type of data collected during the match.
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={handleCancelLevelChange}
									className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
								>
									Keep Current Level
								</button>
								<button
									onClick={handleConfirmLevelChange}
									className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
								>
									Change to Level {levelToChange}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</DefaultPage>
	);
}