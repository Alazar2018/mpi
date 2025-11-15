import DefaultPage from "@components/DefaultPage.tsx";

import icons from "@/utils/icons";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect, useState } from "react";
import { getMatchById, deleteMatch } from "./api/matchs.api";
import MatchSkeleton from "@/components/skeletons/MatchSkeleton";
import { useAuthStore } from "@/store/auth.store";
import Button from "@/components/Button";
import { matchesService } from "@/service/matchs.server";
import type { Match, MatchPlayer } from "@/service/matchs.server";
import { toast } from "react-hot-toast";
import { SetsTab, MomentumTab, ReportTab } from "./components";
import { getMatchFormatDisplayName, getScoringVariationDisplayName, getTrackingLevelDisplayName } from "@/utils/matchFormatUtils";
import { useDialog } from "@/components/Dialog";

export default function MatchDetail() {
	const params = useParams();

	const navigate = useNavigate();
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState("match-detail");
	const [showLevelSelection, setShowLevelSelection] = useState(false);
	const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
	const [showLevelChangeConfirmation, setShowLevelChangeConfirmation] = useState(false);
	const [levelToChange, setLevelToChange] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const { showDialog, Dialog: ConfirmDialog } = useDialog();
	
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
	
	// Set default selected level from match data
	useEffect(() => {
		if (matchData?.trackingLevel && !selectedLevel) {
			// Convert tracking level to number (level1 -> 1, level2 -> 2, level3 -> 3)
			const levelNumber = parseInt(matchData.trackingLevel.replace('level', ''));
			setSelectedLevel(levelNumber);
		}
	}, [matchData, selectedLevel]);
	
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
			p1MatchReport: match.p1MatchReport,
			p2MatchReport: match.p2MatchReport,
			totalGameTime: match.totalGameTime,
			courtSurface: match.courtSurface,
			matchType: match.matchType,
			matchCategory: match.matchCategory,
			matchFormat: match.matchFormat
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
				firstName: matchData.p1Name ? matchData.p1Name.split(' ')[0] : "Player 1",
				lastName: matchData.p1Name ? matchData.p1Name.split(' ').slice(1).join(' ') : "",
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
				firstName: matchData.p2Name ? matchData.p2Name.split(' ')[0] : "Player 2",
				lastName: matchData.p2Name ? matchData.p2Name.split(' ').slice(1).join(' ') : "",
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
				// Legacy field
				matchType: matchData.matchType,
				// Enhanced format fields
				matchFormat: matchData.matchFormat,
				matchFormatDisplay: matchData.matchFormat ? getMatchFormatDisplayName(matchData.matchFormat) : (matchData.matchType ? `Best of ${matchData.matchType === 'one' ? '1' : matchData.matchType === 'three' ? '3' : '5'} sets` : 'Unknown'),
				scoringVariation: matchData.scoringVariation,
				scoringVariationDisplay: matchData.scoringVariation ? getScoringVariationDisplayName(matchData.scoringVariation) : 'Standard Scoring',
				trackingLevel: matchData.trackingLevel,
				trackingLevelDisplay: matchData.trackingLevel ? getTrackingLevelDisplayName(matchData.trackingLevel) : 'Basic Tracking',
				customTiebreakRules: matchData.customTiebreakRules,
				noAdScoring: matchData.noAdScoring,
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

	const matchDetails = matchData ? getMatchDetails() : null;

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
		// Use selected level or fall back to match's tracking level
		const levelToUse = selectedLevel || (matchData?.trackingLevel ? parseInt(matchData.trackingLevel.replace('level', '')) : 1);
		
		// Navigate directly to tracking with the determined level
		navigate(`/admin/matchs/tracking/${params.matchId}?level=${levelToUse}`);
	};

	const handleCloseLevelSelection = () => {
		setShowLevelSelection(false);
		setSelectedLevel(null);
	};

	// Handle match deletion
	const handleDeleteMatch = async () => {
		if (!matchData?._id) return;

		showDialog({
			title: "Delete Match",
			message: "This action will permanently remove the match and all associated data. This cannot be undone. Are you sure you want to continue?",
			buttons: [
				{
					text: "Cancel",
					variant: "outlined",
					onClick: () => {
						// Dialog will close automatically
					}
				},
				{
					text: "Delete Match",
					variant: "contained",
					onClick: async () => {
						await performDelete();
					}
				}
			]
		});
	};

	// Perform the actual delete operation
	const performDelete = async () => {
		if (!matchData?._id) return;

		setIsDeleting(true);
		
		try {
			const response = await deleteMatch(matchData._id);
			if (response.success) {
				toast.success('Match deleted successfully!');
				// Navigate back to matches list
				navigate('/admin/matchs');
			} else {
				toast.error(`Failed to delete match: ${response.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting match:', error);
			toast.error('Failed to delete match. Please try again.');
		} finally {
			setIsDeleting(false);
		}
	};

	// Handle match edit
	const handleEditMatch = () => {
		if (!matchData?._id) return;
		// Navigate to edit page (you may need to create this route)
		navigate(`/admin/matchs/edit/${matchData._id}`);
	};

	// Check if current user is the match creator
	const isCurrentUserCreator = () => {
		if (!user || !matchData) return false;
		return matchData.matchCreator?._id === user._id;
	};

	// Check if current user is one of the players in the match
	const isCurrentUserPlayer = () => {
		if (!user || !matchData) return false;
		
		const isPlayer1 = typeof matchData.p1 === 'object' && matchData.p1?._id === user._id;
		const isPlayer2 = typeof matchData.p2 === 'object' && matchData.p2?._id === user._id;
		
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
		
		const isPlayer1 = typeof matchData?.p1 === 'object' && matchData?.p1?._id === user?._id;
		const isPlayer2 = typeof matchData?.p2 === 'object' && matchData?.p2?._id === user?._id;
		
		if (isPlayer1 && matchData?.p1Status === 'pending') return true;
		if (isPlayer2 && matchData?.p2Status === 'pending') return true;
		
		return false;
	};

	// Get the appropriate button text and action
	const getActionButton = () => {
		const matchStatus = (matchData as any)?.status;
		
		if (matchStatus === 'saved') {
			// Only creator can resume saved matches
			if (!isCurrentUserCreator()) return null;
			
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
			// Only creator can start pending matches
			if (!isCurrentUserCreator()) return null;
			
			const defaultLevel = matchData?.trackingLevel ? parseInt(matchData.trackingLevel.replace('level', '')) : 1;
			const defaultLevelDisplay = matchData?.trackingLevel ? `Level ${defaultLevel}` : 'Level 1';
			
			return (
				<div className="flex gap-2">
					<Button 
						onClick={handleStartTracking}
						type="action" 
						className="text-sm"
					>
						Start ({defaultLevelDisplay})
					</Button>
					<Button 
						onClick={() => setShowLevelSelection(true)}
						type="secondary" 
						className="text-sm"
					>
						<span dangerouslySetInnerHTML={{ __html: icons.settings || '⚙️' }} />
						Change tracking level
					</Button>
					{/* Only show edit button if current user is the match creator */}
					{isCurrentUserCreator() && (
						<Button 
							onClick={handleEditMatch}
							type="secondary" 
							className="text-sm"
						>
							<span dangerouslySetInnerHTML={{ __html: icons.edit || '✏️' }} />
						</Button>
					)}
					{/* Only show delete button if current user is the match creator */}
					{isCurrentUserCreator() && (
						<Button 
							onClick={handleDeleteMatch}
							type="secondary" 
							className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
							disabled={isDeleting}
						>
							<span dangerouslySetInnerHTML={{ __html: icons.trash || '🗑️' }} />
						</Button>
					)}
				</div>
			);
		}
		
		return null;
	};

	// Helper function to render tab content
	const renderTabContent = () => {
		if (!matchData) return null;

		switch (activeTab) {
			case 'sets':
				return transformedMatchData ? <SetsTab matchData={transformedMatchData as any} /> : <div>Loading...</div>;

			case 'momentum':
				return transformedMatchData ? <MomentumTab matchData={transformedMatchData as any} /> : <div>Loading...</div>;

			case 'report':
				return transformedMatchData ? <ReportTab matchData={transformedMatchData as any} /> : <div>Loading...</div>;

			default: // Match Detail tab
				return (
					<div className="py-6">
						<h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 transition-colors duration-300">Match Overview</h3>
						
						{/* Match Details Summary */}
						{/* <div className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6"> */}
							
							{/* Player Response Buttons */}
							{/* {canAcceptReject() && (
								<div className="mt-6 pt-4 border-t border-[var(--border-primary)]">
									<div className="flex items-center justify-between">
										<div className="text-sm text-[var(--text-secondary)]">
											{isCurrentUserPlayer() ? 'You are a player in this match. ' : ''}
											Please respond to this match invitation:
										</div>
										<div className="flex gap-3">
											<Button
												onClick={() => handleMatchResponse('accepted')}
												type="action"
												className="bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-2"
											>
												Accept Match
											</Button>
											<Button
												onClick={() => handleMatchResponse('rejected')}
												type="neutral"
												className="bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] px-6 py-2"
											>
												Reject Match
											</Button>
										</div>
									</div>
								</div>
							)} */}
							{/* </div> */}

						{/* Match Details Grid */}
						{matchDetails ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Match Date & Time */}
							{matchDetails?.date && matchDetails.date !== 'Invalid Date' && (
							<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">📅</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Match Date & Time</span>
									<div className="font-bold text-[var(--text-primary)] flex items-center gap-1 transition-colors duration-300">
										<span className="text-sm py-1 px-2 bg-[var(--bg-secondary)] rounded-sm transition-colors duration-300">
											{matchDetails.date}
										</span>
									</div>
								</div>
							</div>
							)}

							{/* Match Length */}
							{matchDetails?.totalGameTime != null && matchDetails.totalGameTime > 0 && (
							<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">⏰</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Match Length</span>
									<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
										{Math.round(matchDetails.totalGameTime / 60)} Min
									</span>
								</div>
							</div>
							)}

							{/* Game Best Out of */}
							{/* <div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">🎾</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Game Best Out of</span>
									<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
										{matchDetails?.matchFormatDisplay || matchDetails?.matchType || 'Loading...'}
									</span>
								</div>
							</div> */}

								{/* Match Format */}
								{matchDetails?.matchFormatDisplay && matchDetails.matchFormatDisplay !== 'Unknown' && (
								<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
									<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
										<i className="text-[var(--text-tertiary)]">🎾</i>
									</div>
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Match Format</span>
										<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
											{matchDetails.matchFormatDisplay}
										</span>
									</div>
								</div>
								)}

								{/* Scoring Variation */}
								{matchDetails?.scoringVariationDisplay && (
								<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
									<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
										<i className="text-[var(--text-tertiary)]">📊</i>
									</div>
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Scoring Variation</span>
										<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
											{matchDetails.scoringVariationDisplay}
										</span>
									</div>
								</div>
								)}

								{/* Tracking Level */}
								{matchDetails?.trackingLevelDisplay && (
								<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
									<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
										<i className="text-[var(--text-tertiary)]">📈</i>
									</div>
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Tracking Level</span>
										<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
											{matchDetails.trackingLevelDisplay}
										</span>
									</div>
								</div>
								)}

								{/* No-Ad Scoring */}
								{matchDetails?.noAdScoring && (
									<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
										<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
											<i className="text-[var(--text-tertiary)]">⚡</i>
										</div>
										<div className="flex flex-col flex-1">
											<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Scoring Type</span>
											<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
												No-Ad Scoring
											</span>
										</div>
									</div>
								)}

								{/* Custom Tiebreak Rules */}
								{matchDetails?.customTiebreakRules && Object.keys(matchDetails.customTiebreakRules).length > 0 && (
									<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
										<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
											<i className="text-[var(--text-tertiary)]">🎯</i>
										</div>
										<div className="flex flex-col flex-1">
											<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Custom Tiebreak Rules</span>
											<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
												{Object.entries(matchDetails.customTiebreakRules).map(([set, points]) => `Set ${set}: ${points} points`).join(', ')}
											</span>
										</div>
									</div>
								)}

								{/* Tie-Breaker Rule */}
								{matchDetails?.tieBreakRule != null && matchDetails.tieBreakRule > 0 && (
								<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
									<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
										<i className="text-[var(--text-tertiary)]">🎯</i>
									</div>
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Default Tie-Breaker Rule</span>
										<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
											{matchDetails.tieBreakRule} points
										</span>
									</div>
								</div>
								)}

							{/* Court Type */}
							{matchDetails?.indoor && (
							<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">🏟️</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Court Type</span>
									<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
										{matchDetails.indoor}
									</span>
								</div>
							</div>
							)}

							{/* Court Surface Type */}
							{matchDetails?.courtSurface && (
							<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">🌊</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Court Surface Type</span>
									<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
										{matchDetails.courtSurface}
									</span>
								</div>
							</div>
							)}

							{/* Match Creator */}
							{matchData?.matchCreator && matchData.matchCreator.firstName && (
							<div className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
								<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg transition-colors duration-300">
									<i className="text-[var(--text-tertiary)]">👤</i>
								</div>
								<div className="flex flex-col flex-1">
									<span className="text-sm font-medium text-[var(--text-secondary)] mb-1 transition-colors duration-300">Match Creator</span>
									<span className="text-base font-bold text-[var(--text-primary)] transition-colors duration-300">
										{matchData.matchCreator.firstName} {matchData.matchCreator.lastName}
									</span>
								</div>
							</div>
							)}
						</div>
						) : (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg mx-auto mb-4">
										<i className="text-[var(--text-tertiary)]">🎾</i>
									</div>
									<p className="text-[var(--text-secondary)]">Loading match details...</p>
								</div>
							</div>
						)}
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
					<div className="grid grid-cols-2 h-24 rounded-2xl overflow-hidden shadow-[var(--shadow-secondary)] transition-all duration-300">
						{/* Player 1 Banner - Updated for dark mode */}
						<div className="bg-[var(--bg-secondary)] relative flex items-center justify-between px-8 border-r border-[var(--border-primary)] transition-all duration-300">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-full bg-[var(--bg-card)] shadow-[var(--shadow-secondary)] overflow-hidden transition-all duration-300">
									<img
										src={playerData?.player1?.avatar || (typeof matchData.p1 === 'object' ? matchData.p1?.avatar : undefined) || "https://randomuser.me/api/portraits/men/32.jpg"}
										alt={`${playerData?.player1?.firstName || (typeof matchData.p1 === 'object' ? matchData.p1?.firstName : undefined) || matchData.p1Name || 'Player'} ${playerData?.player1?.lastName || (typeof matchData.p1 === 'object' ? matchData.p1?.lastName : undefined) || ''}`}
										className="w-full h-full object-cover"
									/>
								</div>
							<div className="text-[var(--text-primary)] transition-colors duration-300">
								<h2 className="text-xl font-bold">
									{playerData?.player1?.firstName || (typeof matchData.p1 === 'object' ? matchData.p1?.firstName : undefined) || matchData.p1Name || 'Player 1'} {playerData?.player1?.lastName || (typeof matchData.p1 === 'object' ? matchData.p1?.lastName : undefined) || ''}
								</h2>
									<p className="text-sm text-[var(--text-secondary)] transition-colors duration-300">
										{matchData.p1IsObject ? 'Registered Player' : 'Custom Player'}
									</p>
							</div>
							</div>
							<div className="absolute left-4 top-1/2 transform -translate-y-1/2">
								<i 
									className="w-8 h-8 text-[var(--text-primary)] opacity-80 transition-colors duration-300" 
									dangerouslySetInnerHTML={{ __html: icons.tennisBall }} 
								/>
							</div>
						</div>

						{/* Player 2 Banner - Updated for dark mode */}
						<div className="bg-[var(--bg-tertiary)] relative flex items-center justify-between px-8 transition-all duration-300">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-full bg-[var(--bg-card)] shadow-[var(--shadow-secondary)] overflow-hidden transition-all duration-300">
									<img
										src={playerData?.player2?.avatar || (typeof matchData.p2 === 'object' ? matchData.p2?.avatar : undefined) || "https://randomuser.me/api/portraits/women/44.jpg"}
										alt={`${playerData?.player2?.firstName || (typeof matchData.p2 === 'object' ? matchData.p2?.firstName : undefined) || matchData.p2Name || 'Player'} ${(typeof matchData.p2 === 'object' ? matchData.p2?.lastName : undefined) || ''}`}
										className="w-full h-full object-cover"
									/>
								</div>
							<div className="text-[var(--text-primary)] transition-colors duration-300">
								<h2 className="text-xl font-bold">
									{playerData?.player2?.firstName || (typeof matchData.p2 === 'object' ? matchData.p2?.firstName : undefined) || matchData.p2Name || 'Player 2'} {playerData?.player2?.lastName || (typeof matchData.p2 === 'object' ? matchData.p2?.lastName : undefined) || ''}
								</h2>
									<p className="text-sm text-[var(--text-secondary)] transition-colors duration-300">
										{matchData.p2IsObject ? 'Registered Player' : 'Custom Player'}
									</p>
							</div>
							</div>
							<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
								<i 
									className="w-8 h-8 text-[var(--text-primary)] opacity-80 transition-colors duration-300" 
									dangerouslySetInnerHTML={{ __html: icons.tennisBall }} 
								/>
							</div>
						</div>
					</div>
					)}

												{/* Match Status Banner */}
							{/* {matchData && (
								<div className="mb-6 bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)]">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className={`px-3 py-1 rounded-full text-sm font-medium ${
												(matchData as any).status === 'saved' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'pending' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'confirmed' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'inProgress' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'completed' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'cancelled' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'postponed' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												(matchData as any).status === 'forfeited' ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)]' :
												'text-[var(--text-primary)] bg-[var(--bg-secondary)]'
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
												<div className="text-sm text-[var(--text-secondary)]">
													Player 1: <span className={`font-medium ${matchData.p1Status === 'accepted' ? 'text-[var(--text-primary)]' : matchData.p1Status === 'rejected' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
														{matchData.p1Status === 'pending' ? 'Pending' : matchData.p1Status === 'accepted' ? 'Accepted' : 'Rejected'}
													</span>
												</div>
											)}
											{matchData.p2Status && (
												<div className="text-sm text-[var(--text-secondary)]">
													Player 2: <span className={`font-medium ${matchData.p2Status === 'accepted' ? 'text-[var(--text-primary)]' : matchData.p2Status === 'rejected' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
														{matchData.p2Status === 'pending' ? 'Pending' : matchData.p2Status === 'accepted' ? 'Accepted' : 'Rejected'}
													</span>
												</div>
											)}
										</div>
										{canAcceptReject() && (
											<div className="text-sm text-[var(--text-primary)] font-medium">
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
							<div className="text-sm text-[var(--text-secondary)] mb-2 transition-colors duration-300">
								Current Status: <span className="font-medium text-[var(--text-primary)]">{(matchData as any).status}</span>
							</div>
						)}
						<div className="flex gap-2">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => handleTabSwitch(tab.id)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
										activeTab === tab.id
											? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[var(--shadow-secondary)] transform scale-105"
											: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:scale-105 hover:text-[var(--text-primary)]"
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
								className="text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
							>
								Clear State
							</Button>
							<Button type="neutral" className="text-sm">
								History
							</Button> */}
					</div>

					{/* Main Content Area */}
					<div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-all duration-300">
						{/* Breadcrumbs */}
						<div className="mb-6 flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors duration-300">
							<button 
								onClick={() => navigate('/admin/matchs')}
								className="hover:text-[var(--text-primary)] transition-colors duration-300"
							>
								Matches
							</button>
							<span className="text-[var(--text-tertiary)]">/</span>
							<span className="text-[var(--text-primary)] font-medium transition-colors duration-300">
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
					<div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-secondary)] w-full max-w-5xl border border-[var(--border-primary)] transition-all duration-300">
						{/* Header */}
						<div className="bg-[var(--bg-primary)] text-[var(--text-primary)] py-4 px-6 rounded-t-2xl border-b border-[var(--border-primary)] transition-all duration-300">
							<h2 className="text-xl font-bold text-center">
								Select Tracking Level
							</h2>
							{matchData?.trackingLevel && (
								<p className="text-sm text-center mt-2 opacity-90">
									Default: Level {parseInt(matchData.trackingLevel.replace('level', ''))} (from match settings)
								</p>
							)}
						</div>

						<div className="p-8 bg-[var(--bg-card)] transition-all duration-300">
							{/* Level Selection Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4">
								{/* Level 1 */}
								<div 
									onClick={() => handleLevelSelect(1)}
									className={`relative p-6 rounded-xl cursor-pointer transition-all duration-200 border-0 ${
										selectedLevel === 1 
											? 'bg-[var(--bg-primary)] shadow-[var(--shadow-secondary)] scale-105' 
											: 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-secondary)]'
									}`}
								>
									{/* Default Badge */}
									{matchData?.trackingLevel === 'level1' && (
										<div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
											Default
										</div>
									)}
								<div className={`p-5 ${selectedLevel===1?'bg-[var(--bg-secondary)]':'bg-[var(--bg-tertiary)]'} transition-all duration-300`}>
								{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 1 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 1 ? 'bg-gray-300' : 'bg-gray-200'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-12 rounded-sm ${
												selectedLevel === 1 ? 'bg-gray-300' : 'bg-gray-200'
											} transition-all duration-300`}></div>
											</div>
									</div>
									<h3 className=" text-center text-xl font-bold mb-3 text-[var(--text-primary)] transition-colors duration-300">Level 1</h3>
									</div>
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'} transition-colors duration-300`}>
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
											? 'bg-[var(--bg-primary)] shadow-[var(--shadow-secondary)] scale-105' 
											: 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-secondary)]'
									}`}
								>
									{/* Default Badge */}
									{matchData?.trackingLevel === 'level2' && (
										<div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
											Default
										</div>
									)}
								<div className={`p-5 ${selectedLevel===2?'bg-[var(--bg-secondary)]':'bg-[var(--bg-tertiary)]'} transition-all duration-300`}>

									{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 2 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 2 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-14 rounded-sm ${
												selectedLevel === 2 ? 'bg-gray-300' : 'bg-gray-200'
											} transition-all duration-300`}></div>
										</div>
									</div>
									<h3 className=" text-center text-xl font-bold mb-3 text-[var(--text-primary)] transition-colors duration-300">Level 2</h3>
									</div>
									
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 2 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'} transition-colors duration-300`}>
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
											? 'bg-[var(--bg-primary)] shadow-[var(--shadow-secondary)] scale-105' 
											: 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-secondary)]'
									}`}
								>
									{/* Default Badge */}
									{matchData?.trackingLevel === 'level3' && (
										<div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
											Default
										</div>
									)}
								<div className={`p-5 ${selectedLevel===3?'bg-[var(--bg-secondary)]':'bg-[var(--bg-tertiary)]'} transition-all duration-300`}>

									{/* Icon */}
									<div className="flex justify-center mb-4">
										<div className="flex items-end gap-1 h-16">
											<div className={`w-8 h-6 rounded-sm ${
												selectedLevel === 3 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-10 rounded-sm ${
												selectedLevel === 3 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
											<div className={`w-8 h-16 rounded-sm ${
												selectedLevel === 3 ? 'bg-green-500' : 'bg-gray-400'
											} transition-all duration-300`}></div>
										</div>
									</div>
									<h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] transition-colors duration-300">Level 3</h3>
									</div>
									
									{/* Content */}
									<div className={`mt-3 text-center ${selectedLevel === 3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'} transition-colors duration-300`}>
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
									className="px-8 py-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)] transition-all duration-300 font-medium flex-1 max-w-[200px]"
								>
									Cancel
								</button>
								<button
									onClick={handleStartTracking}
									disabled={!selectedLevel}
									className={`px-8 py-4 rounded-lg font-medium transition-all duration-300 flex-1 ${
										selectedLevel 
											? 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] shadow-[var(--shadow-secondary)]' 
											: 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
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
					<div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-secondary)] w-full max-w-md border border-[var(--border-primary)] transition-all duration-300">
						{/* Header */}
						<div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] py-4 px-6 rounded-t-2xl border-b border-[var(--border-primary)] transition-all duration-300">
							<h2 className="text-xl font-bold text-center">
								Change Tracking Level?
							</h2>
						</div>

						<div className="p-6 bg-[var(--bg-card)] transition-all duration-300">
							{/* Confirmation Message */}
							<div className="text-center mb-6">
								<div className="text-4xl mb-4">⚠️</div>
								<h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 transition-colors duration-300">
									Are you sure you want to change the level?
								</h3>
								<p className="text-[var(--text-secondary)] transition-colors duration-300">
									You're about to change from <strong>Level {selectedLevel}</strong> to <strong>Level {levelToChange}</strong>.
								</p>
								<p className="text-sm text-[var(--text-tertiary)] mt-2 transition-colors duration-300">
									This will affect the type of data collected during the match.
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={handleCancelLevelChange}
									className="flex-1 px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-300 font-medium"
								>
									Keep Current Level
								</button>
								<button
									onClick={handleConfirmLevelChange}
									className="flex-1 px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-all duration-300 font-medium"
								>
									Change to Level {levelToChange}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Dialog */}
			<ConfirmDialog />
		</DefaultPage>
	);
}