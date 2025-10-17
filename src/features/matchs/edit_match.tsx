import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import Form from "@/components/form/Form";
import Select from "@/components/form/Select";
import Textarea from "@/components/form/Textarea";
import SearchableSelect from "@/components/form/SearchableSelect";
import icons from "@/utils/icons";
import { required } from "@/utils/utils";
import { updateMatch, getMatchById, getMatchFormats, getScoringVariations } from "./api/matchs.api";
import { isFormatCompatibleWithVariation } from "@/utils/matchFormatUtils";
import { friendsService } from "@/service/friends.server";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "react-hot-toast";
import type { MatchFormat, ScoringVariation, TrackingLevel, CreateMatchRequest, Match } from "@/service/matchs.server";
import LoadingSpinner from "@/components/LoadingSpinner";

// Tournament levels constant
const TOURNAMENT_LEVELS = {
  'ITF': [
    'Junior Grand Slams', 'J500', 'J300', 'J200', 'J100', 'J60', 'J30',
    '15k', '25K', '40K', '60K', '100K', '125K'
  ],
  'ATP/WTA': [
    'Grand Slam', 'Masters 1000', '500', '200', 'Challenge', 'ATP Cup', 'ATP Finals'
  ],
  'USTA': [
    'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 
    'Junior Circuit', 'Unsanctioned'
  ]
}

// Enhanced Match Format Options based on tennis rules
const MATCH_FORMAT_OPTIONS = [
  { value: 'oneSet', label: 'One Set', description: 'One set with 7-point tiebreak at 6-6' },
  { value: 'bestOfThree', label: '2/3 Sets', description: '2 out of 3 sets with 7-point tiebreak at 6-6, final set 10-point tiebreak' },
  { value: 'bestOfFive', label: '3/5 Sets', description: '3 out of 5 sets with 7-point tiebreak at 6-6, final set 10-point tiebreak' },
  { value: 'shortSets', label: 'Short Sets (4/7)', description: '4 out of 7 sets (no-ad scoring and 7-point tiebreak at 3-3)' },
  { value: 'proSet8', label: '8-Game Pro Set', description: '8-game pro set with 7-point tiebreak at 8-8' },
  { value: 'tiebreak7', label: '7-Point Tiebreak Only', description: 'Single 7-point tiebreaker' },
  { value: 'tiebreak10', label: '10-Point Tiebreak Only', description: 'Single 10-point tiebreaker' },
  { value: 'tiebreak21', label: '21-Point Tiebreak Only', description: 'Single 21-point tiebreaker' }
];

// Scoring Variation Options
const SCORING_VARIATION_OPTIONS = [
  { value: 'standard', label: 'Standard Scoring', description: 'Traditional tennis scoring rules' },
  { value: 'finalSetTiebreak10', label: 'Final Set 10-Point Tiebreak', description: 'Final set uses 10-point tiebreak' },
  { value: 'oneSetTiebreak10', label: 'Single Set 10-Point Tiebreak', description: 'One set with 10-point tiebreak at 6-6' }
];

// Tracking Level Options
const TRACKING_LEVEL_OPTIONS = [
  { value: 'level1', label: 'Basic Tracking', description: 'Serving player and point winners only' },
  { value: 'level2', label: 'Intermediate Tracking', description: 'Basic + shot types, placements, reactions' },
  { value: 'level3', label: 'Advanced Tracking', description: 'Full statistical analysis and reports' }
];

// Types for the form
interface MatchFormData {
    p1: string;
    p2: string;
    p1IsObject: boolean;
    p2IsObject: boolean;
    p1Name: string;
    p2Name: string;
    courtSurface: "clay" | "hard" | "grass" | "carpet" | "other";
    indoor: boolean;
    note: string;
    date: string;
    matchType?: "one" | "three" | "five";
    matchFormat: MatchFormat;
    scoringVariation: ScoringVariation;
    customTiebreakRules?: Record<string, number>;
    noAdScoring: boolean;
    trackingLevel: TrackingLevel;
    matchCategory: "practice" | "tournament";
    tournamentType?: string;
    tournamentLevel?: string;
    tieBreakRule: number;
}

interface PlayerOption {
    value: string;
    label: string;
    avatar?: string;
    isRegistered: boolean;
}

export default function EditMatch() {
    const navigate = useNavigate();
    const { matchId } = useParams();
    const { user } = useAuthStore();
    const [players, setPlayers] = useState<PlayerOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMatch, setLoadingMatch] = useState(true);
    const [matchData, setMatchData] = useState<Match | null>(null);
    const [formReady, setFormReady] = useState(false);
    const [p1IsObject, setP1IsObject] = useState(true);
    const [p2IsObject, setP2IsObject] = useState(true); 
    const [matchCategory, setMatchCategory] = useState<"practice" | "tournament">("practice");
    const [selectedP1, setSelectedP1] = useState<string>("");
    const [selectedP2, setSelectedP2] = useState<string>("");
    const [availableFormats, setAvailableFormats] = useState(MATCH_FORMAT_OPTIONS);
    const [availableVariations, setAvailableVariations] = useState(SCORING_VARIATION_OPTIONS);
    const [availableTrackingLevels, setAvailableTrackingLevels] = useState(TRACKING_LEVEL_OPTIONS);
    const [initialFormValues, setInitialFormValues] = useState<Partial<MatchFormData>>({});

    // Load match data and players
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load match data
                if (matchId) {
                    const matchResponse = await getMatchById(matchId);
                    if (matchResponse.success && matchResponse.data) {
                        const match = matchResponse.data;
                        setMatchData(match);
                        setP1IsObject(match.p1IsObject);
                        setP2IsObject(match.p2IsObject);
                        setMatchCategory(match.matchCategory);
                        
                        // Set selected players
                        const p1Id = match.p1IsObject && typeof match.p1 === 'object' ? match.p1._id : '';
                        const p2Id = match.p2IsObject && typeof match.p2 === 'object' ? match.p2._id : '';
                        
                        if (p1Id) setSelectedP1(p1Id);
                        if (p2Id) setSelectedP2(p2Id);
                        
                        // Set initial form values
                        const formValues: Partial<MatchFormData> = {
                            p1: p1Id,
                            p2: p2Id,
                            p1Name: match.p1Name || '',
                            p2Name: match.p2Name || '',
                            courtSurface: match.courtSurface,
                            indoor: match.indoor || false,
                            note: match.note || '',
                            date: match.date ? new Date(match.date).toISOString().slice(0, 16) : '',
                            matchFormat: match.matchFormat,
                            scoringVariation: match.scoringVariation,
                            noAdScoring: match.noAdScoring || false,
                            trackingLevel: match.trackingLevel,
                            matchCategory: match.matchCategory,
                            tournamentType: match.tournamentType || '',
                            tournamentLevel: match.tournamentLevel || '',
                            tieBreakRule: match.tieBreakRule
                        };
                        
                        console.log('Initial form values:', formValues);
                        setInitialFormValues(formValues);
                        
                        // Small delay to ensure form is properly initialized
                        setTimeout(() => {
                            setFormReady(true);
                        }, 100);
                    } else {
                        toast.error('Failed to load match data');
                        navigate('/admin/matchs');
                    }
                }

                // Load players based on user role
                const playersList: PlayerOption[] = [];
                
                // Handle different user roles
                if (user?.role === 'player') {
                    // PLAYER: Can select themselves and their player friends
                    const friendsResponse = await friendsService.getFriendsList();
                    
                    // Add current user (player)
                    playersList.push({
                        value: user._id,
                        label: `${user.firstName} ${user.lastName}`,
                        avatar: user.avatar,
                        isRegistered: true
                    });

                    // Add friends who are players only
                    if (friendsResponse.friendship?.friends) {
                        friendsResponse.friendship.friends.forEach(friendship => {
                            const otherUser = friendsService.getOtherUser(friendship, user?._id || '');
                            if (otherUser) {
                                const userRole = (otherUser as any).__t || (otherUser as any).role;
                                
                                // Only add if they're a player
                                if (userRole === 'Player' || userRole === 'player') {
                                    playersList.push({
                                        value: otherUser._id,
                                        label: `${otherUser.firstName} ${otherUser.lastName}`,
                                        avatar: otherUser.avatar,
                                        isRegistered: true
                                    });
                                }
                            }
                        });
                    }
                } else if (user?.role === 'coach') {
                    // COACH: Can select their players (students)
                    const { playersService } = await import('@/service/players.server');
                    const response = await playersService.getPlayers(1, 100); // Get up to 100 players
                    
                    if (response.players) {
                        response.players.forEach(player => {
                            playersList.push({
                                value: player._id,
                                label: `${player.firstName} ${player.lastName}`,
                                avatar: player.avatar,
                                isRegistered: true
                            });
                        });
                    }
                } else if (user?.role === 'parent') {
                    // PARENT: Can select their children
                    const { childrenService } = await import('@/service/children.server');
                    const response = await childrenService.getChildren({ page: 1, limit: 100 });
                    
                    if (response.children) {
                        response.children.forEach(child => {
                            playersList.push({
                                value: child._id,
                                label: `${child.firstName} ${child.lastName}`,
                                avatar: child.avatar,
                                isRegistered: true
                            });
                        });
                    }
                }

                setPlayers(playersList);

                // Load match formats from API
                const formatsResponse = await getMatchFormats();
                if (formatsResponse.success && formatsResponse.data?.formats) {
                    const formatOptions = formatsResponse.data.formats.map(format => ({
                        value: format.format,
                        label: `${format.description} (${format.setsToWin}/${format.maxSets} sets)`,
                        description: format.description
                    }));
                    setAvailableFormats(formatOptions);
                }

                // Load scoring variations from API
                const variationsResponse = await getScoringVariations();
                if (variationsResponse.success && variationsResponse.data?.variations) {
                    const variationOptions = variationsResponse.data.variations.map(variation => ({
                        value: variation.variation,
                        label: variation.description,
                        description: variation.description
                    }));
                    setAvailableVariations(variationOptions);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load match data');
                navigate('/admin/matchs');
            } finally {
                setLoadingMatch(false);
            }
        };

        loadData();
    }, [matchId, user, navigate]);

    // Filter players for each position to prevent duplicate selection
    const getFilteredPlayersForP1 = () => {
        return players.filter(player => player.value !== selectedP2);
    };

    const getFilteredPlayersForP2 = () => {
        return players.filter(player => player.value !== selectedP1);
    };

    const handleSubmit = async (formData: MatchFormData) => {
        if (!matchId) return;
        
        setLoading(true);
        try {
            // Validate required fields based on player type
            if (p1IsObject && !formData.p1) {
                toast.error('Please select Player 1');
                return;
            }
            if (!p1IsObject && !formData.p1Name) {
                toast.error('Please enter Player 1 name');
                return;
            }
            if (p2IsObject && !formData.p2) {
                toast.error('Please select Player 2');
                return;
            }
            if (!p2IsObject && !formData.p2Name) {
                toast.error('Please enter Player 2 name');
                return;
            }

            // Validate that the same player is not selected for both positions
            if (p1IsObject && p2IsObject && formData.p1 === formData.p2) {
                toast.error('Player 1 and Player 2 cannot be the same person');
                return;
            }

            // Prepare the match data with enhanced API format
            const updateData: Partial<CreateMatchRequest> = {
                p1: p1IsObject ? formData.p1 : undefined,
                p2: p2IsObject ? formData.p2 : undefined,
                p1IsObject: p1IsObject,
                p2IsObject: p2IsObject,
                p1Name: !p1IsObject ? formData.p1Name : undefined,
                p2Name: !p2IsObject ? formData.p2Name : undefined,
                courtSurface: formData.courtSurface,
                indoor: formData.indoor,
                note: formData.note,
                date: formData.date,
                matchFormat: formData.matchFormat,
                scoringVariation: formData.scoringVariation,
                customTiebreakRules: formData.customTiebreakRules,
                noAdScoring: formData.noAdScoring,
                trackingLevel: formData.trackingLevel,
                matchCategory: formData.matchCategory,
                tournamentType: formData.matchCategory === 'tournament' ? formData.tournamentType : undefined,
                tournamentLevel: formData.matchCategory === 'tournament' ? formData.tournamentLevel : undefined,
                tieBreakRule: formData.tieBreakRule,
            };

            const response = await updateMatch(matchId, updateData);
            
            if (response.success) {
                toast.success('Match updated successfully!');
                setTimeout(() => {
                    navigate(`/admin/matchs/detail/${matchId}`);
                }, 1000);
            } else {
                toast.error(response.error || 'Failed to update match. Please try again.');
            }
        } catch (error) {
            console.error('Error updating match:', error);
            toast.error('Failed to update match. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const courtSurfaceOptions = [
        { value: 'clay', label: 'Clay' },
        { value: 'hard', label: 'Hard Court' },
        { value: 'grass', label: 'Grass' },
        { value: 'carpet', label: 'Carpet' },
        { value: 'other', label: 'Other' }
    ];

    const matchFormatOptions = availableFormats.map(format => ({
        value: format.value,
        label: format.label
    }));

    const trackingLevelOptions = availableTrackingLevels.map(level => ({
        value: level.value,
        label: level.label
    }));

    const matchCategoryOptions = [
        { value: 'practice', label: 'Practice Match' },
        { value: 'tournament', label: 'Tournament Match' }
    ];

    const tieBreakOptions = [
        { value: 7, label: '7 points' },
        { value: 10, label: '10 points' }
    ];

    // Get initial form values from match data
    const getInitialValues = () => {
        if (!matchData) {
            console.log('getInitialValues: no matchData');
            return {};
        }
        
        const p1Id = typeof matchData.p1 === 'object' ? matchData.p1._id : '';
        const p2Id = typeof matchData.p2 === 'object' ? matchData.p2._id : '';
        
        const initialValues = {
            p1: p1Id,
            p2: p2Id,
            p1Name: matchData.p1Name || '',
            p2Name: matchData.p2Name || '',
            courtSurface: matchData.courtSurface,
            indoor: matchData.indoor || false,
            note: matchData.note || '',
            date: matchData.date ? new Date(matchData.date).toISOString().slice(0, 16) : '',
            matchFormat: matchData.matchFormat,
            scoringVariation: matchData.scoringVariation,
            noAdScoring: matchData.noAdScoring || false,
            trackingLevel: matchData.trackingLevel,
            matchCategory: matchData.matchCategory,
            tournamentType: matchData.tournamentType || '',
            tournamentLevel: matchData.tournamentLevel || '',
            tieBreakRule: matchData.tieBreakRule
        };
        
        console.log('getInitialValues:', initialValues);
        console.log('matchData:', matchData);
        
        return initialValues;
    };

    if (loadingMatch || !formReady) {
        return (
            <DefaultPage title="Edit Match">
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </DefaultPage>
        );
    }

    if (!matchData) {
        return (
            <DefaultPage title="Edit Match">
                <div className="text-center text-red-600 py-8">
                    Match not found
                </div>
            </DefaultPage>
        );
    }

    return (
        <DefaultPage
            title="Edit Match"
            rightAction={
                <Button
                    onClick={() => navigate(`/admin/matchs/detail/${matchId}`)}
                    type="neutral"
                    className="text-sm"
                >
                    Back to Match Details{" "}
                    <i dangerouslySetInnerHTML={{ __html: icons.chevronRight }} />
                </Button>
            }
        >
            <div className="w-full mx-auto px-4">
                <Form<MatchFormData>
                    key={matchId}
                    defaultValues={initialFormValues as MatchFormData}
                    form={({ onSubmit, watch, setValue, errors }) => {
                        const currentMatchCategory = watch('matchCategory') as "practice" | "tournament";
                        const currentTournamentType = watch('tournamentType') as keyof typeof TOURNAMENT_LEVELS;
                        const currentMatchFormat = watch('matchFormat') as MatchFormat;
                        
                        // Set all form values on mount
                        useEffect(() => {
                            console.log('Setting all form values with initialFormValues:', initialFormValues);
                            Object.entries(initialFormValues).forEach(([key, value]) => {
                                if (value !== undefined) {
                                    setValue(key as any, value);
                                }
                            });
                        }, []);
                        
                        useEffect(() => {
                            if (currentMatchCategory) {
                                setMatchCategory(currentMatchCategory);
                            }
                        }, [currentMatchCategory]);

                        useEffect(() => {
                            if (currentMatchFormat) {
                                const currentScoringVariation = watch('scoringVariation') as ScoringVariation;
                                if (currentScoringVariation && !isFormatCompatibleWithVariation(currentMatchFormat, currentScoringVariation)) {
                                    setValue('scoringVariation', 'standard');
                                }
                                
                                // Automatically enable No-Ad Scoring for tiebreak formats
                                if (currentMatchFormat.startsWith('tiebreak')) {
                                    setValue('noAdScoring', true);
                                    setValue('scoringVariation', 'standard');
                                }
                            }
                        }, [currentMatchFormat, watch, setValue]);

                        const scoringVariationOptions = availableVariations
                            .filter(variation => 
                                !currentMatchFormat || 
                                isFormatCompatibleWithVariation(currentMatchFormat, variation.value as ScoringVariation)
                            )
                            .map(variation => ({
                                value: variation.value,
                                label: variation.label
                            }));

                        const getTieBreakOptions = () => {
                            if (!currentMatchFormat) return tieBreakOptions;
                            
                            if (currentMatchFormat === 'oneSet') {
                                return [
                                    { value: 7, label: '7 points' },
                                    { value: 10, label: '10 points' }
                                ];
                            } else if (currentMatchFormat === 'bestOfThree' || currentMatchFormat === 'bestOfFive') {
                                return [{ value: 7, label: '7 points' }];
                            } else if (currentMatchFormat === 'shortSets' || currentMatchFormat === 'proSet8') {
                                return [{ value: 7, label: '7 points' }];
                            } else if (currentMatchFormat.startsWith('tiebreak')) {
                                return [];
                            }
                            
                            return tieBreakOptions;
                        };

                        const currentTieBreakOptions = getTieBreakOptions();

                        return (
                            <div className="w-full">
                                {/* Player Selection Section */}
                                <div className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-3xl p-10 shadow-xl border border-blue-100">
                                    <div className="absolute inset-0">
                                        <img
                                            src="/stuff.jpg"
                                            className="w-full h-full object-cover opacity-80"
                                            alt="Tennis court background"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-50/50 to-indigo-100/70"></div>
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <div className="text-center mb-10">
                                            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Player Selection</h2>
                                            <p className="text-xl text-[var(--text-secondary)]">Update player information</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-center max-w-6xl mx-auto">
                                            {/* Player 1 */}
                                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)]">
                                                <div className="text-center mb-6">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <span className="text-3xl font-bold text-white">1</span>
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">Player One</h3>
                                                </div>
                                                
                                                <div className="space-y-5">
                                                    <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-4 rounded-xl">
                                                        <input
                                                            type="checkbox"
                                                            checked={p1IsObject}
                                                            onChange={(e) => {
                                                                setP1IsObject(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    setSelectedP1("");
                                                                }
                                                            }}
                                                            className="w-6 h-6 text-blue-600 bg-[var(--bg-card)] border-2 border-blue-300 rounded"
                                                        />
                                                        <span className="text-base font-medium text-blue-600">Registered Player</span>
                                                    </label>
                                                    
                                                    {p1IsObject ? (
                                                        <SearchableSelect
                                                            name="p1"
                                                            label=""
                                                            placeholder="Search for a Player"
                                                            options={getFilteredPlayersForP1()}
                                                            validation={{ required: required }}
                                                            value={watch('p1') || selectedP1}
                                                            onUpdate={(value) => {
                                                                setSelectedP1(value);
                                                                setValue('p1', value);
                                                            }}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Enter player 1 name"
                                                            value={watch('p1Name') || ''}
                                                            className="w-full h-14 bg-[var(--bg-card)] rounded-xl px-5 text-base border-2 border-[var(--border-primary)]"
                                                            onChange={(e) => setValue("p1Name", e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* VS Badge */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-3xl font-bold text-white">VS</span>
                                                </div>
                                            </div>
                                            
                                            {/* Player 2 */}
                                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)]">
                                                <div className="text-center mb-6">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <span className="text-3xl font-bold text-white">2</span>
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">Player Two</h3>
                                                </div>
                                                
                                                <div className="space-y-5">
                                                    <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-4 rounded-xl">
                                                        <input
                                                            type="checkbox"
                                                            checked={p2IsObject}
                                                            onChange={(e) => {
                                                                setP2IsObject(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    setSelectedP2("");
                                                                }
                                                            }}
                                                            className="w-6 h-6 text-purple-600 bg-[var(--bg-card)] border-2 border-purple-300 rounded"
                                                        />
                                                        <span className="text-base font-medium text-purple-600">Registered Player</span>
                                                    </label>
                                                    
                                                    {p2IsObject ? (
                                                        <SearchableSelect
                                                            name="p2"
                                                            label=""
                                                            placeholder="Search for a Player"
                                                            options={getFilteredPlayersForP2()}
                                                            validation={{ required: required }}
                                                            value={watch('p2') || selectedP2}
                                                            onUpdate={(value) => {
                                                                setSelectedP2(value);
                                                                setValue('p2', value);
                                                            }}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Enter player 2 name"
                                                            value={watch('p2Name') || ''}
                                                            className="w-full h-14 bg-[var(--bg-card)] rounded-xl px-5 text-base border-2 border-[var(--border-primary)]"
                                                            onChange={(e) => setValue("p2Name", e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Details Section */}
                                <div className="bg-[var(--bg-card)] rounded-3xl p-10 shadow-[var(--shadow-primary)] border border-[var(--border-primary)] mt-8">
                                    <div className="text-center mb-10">
                                        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Match Details</h2>
                                        <p className="text-xl text-[var(--text-secondary)]">Update match settings and preferences</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
                                        <div className="space-y-3">
                                            <label className="text-base font-medium text-[var(--text-primary)]">
                                                Match Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={watch("date") || ""}
                                                onChange={(e) => setValue("date", e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Select
                                                options={matchFormatOptions}
                                                label="Match Format"
                                                validation={{ required: required }}
                                                name="matchFormat"
                                                value={watch('matchFormat')}
                                            />
                                        </div>
                                        
                                        {!currentMatchFormat?.startsWith('tiebreak') && currentTieBreakOptions.length > 0 && (
                                            <div className="space-y-3">
                                                <Select
                                                    options={currentTieBreakOptions}
                                                    label="Tie Break"
                                                    validation={{ required: required }}
                                                    name="tieBreakRule"
                                                    value={watch('tieBreakRule')}
                                                />
                                            </div>
                                        )}
                                        
                                        {!currentMatchFormat?.startsWith('tiebreak') && (
                                            <div className="space-y-3">
                                                <Select
                                                    options={scoringVariationOptions}
                                                    label="Scoring Variation"
                                                    validation={{ required: required }}
                                                    name="scoringVariation"
                                                    value={watch('scoringVariation')}
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                            <Select
                                                options={trackingLevelOptions}
                                                label="Tracking Level"
                                                validation={{ required: required }}
                                                name="trackingLevel"
                                                value={watch('trackingLevel')}
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Select
                                                options={matchCategoryOptions}
                                                label="Match Category"
                                                validation={{ required: required }}
                                                name="matchCategory"
                                                value={watch('matchCategory')}
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Select
                                                options={courtSurfaceOptions}
                                                label="Court Surface"
                                                validation={{ required: required }}
                                                name="courtSurface"
                                                value={watch('courtSurface')}
                                            />
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-5 rounded-xl w-full justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={watch('indoor') || false}
                                                    onChange={(e) => setValue('indoor', e.target.checked)}
                                                    className="w-6 h-6 text-blue-600 bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded"
                                                />
                                                <span className="text-base font-medium text-[var(--text-primary)]">Indoor Court</span>
                                            </label>
                                        </div>
                                        
                                        {/* Hide No-Ad Scoring for tiebreak formats - it's automatically enabled */}
                                        {!currentMatchFormat?.startsWith('tiebreak') && (
                                            <div className="flex items-center justify-center">
                                                <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-5 rounded-xl w-full justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={watch('noAdScoring') || false}
                                                        onChange={(e) => setValue('noAdScoring', e.target.checked)}
                                                        className="w-6 h-6 text-green-600 bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded"
                                                    />
                                                    <span className="text-base font-medium text-[var(--text-primary)]">No-Ad Scoring</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tournament fields */}
                                    {matchCategory === 'tournament' && (
                                        <div className="mt-10 p-8 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-primary)] max-w-5xl mx-auto">
                                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-6 text-center">
                                                🏆 Tournament Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Select
                                                        options={Object.keys(TOURNAMENT_LEVELS).map(type => ({ 
                                                            value: type, 
                                                            label: `${type} (${TOURNAMENT_LEVELS[type as keyof typeof TOURNAMENT_LEVELS].length} levels)` 
                                                        }))}
                                                        label="Tournament Type"
                                                        validation={{ required: required }}
                                                        name="tournamentType"
                                                        value={watch('tournamentType')}
                                                        onUpdate={() => setValue("tournamentLevel", "")}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <Select
                                                        options={currentTournamentType && TOURNAMENT_LEVELS[currentTournamentType] 
                                                            ? TOURNAMENT_LEVELS[currentTournamentType].map(level => ({ value: level, label: level }))
                                                            : []}
                                                        label="Tournament Level"
                                                        validation={{ required: required }}
                                                        name="tournamentLevel"
                                                        value={watch('tournamentLevel')}
                                                        placeholder={currentTournamentType ? "Select tournament level" : "Select tournament type first"}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes Section */}
                                    <div className="mt-12 pt-8 border-t border-[var(--border-secondary)]">
                                        <div className="text-center mb-8">
                                            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-3">📝 Match Notes</h3>
                                        </div>
                                        <div className="w-full max-w-4xl mx-auto">
                                            <Textarea
                                                label=""
                                                name="note"
                                                placeholder="Enter any special instructions or notes..."
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-center gap-4 mt-16 mb-8">
                                        <Button
                                            type="secondary"
                                            size="lg"
                                            className="rounded-3xl text-xl px-12 py-6"
                                            onClick={() => navigate(`/admin/matchs/detail/${matchId}`)}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="action"
                                            size="lg"
                                            className="rounded-3xl text-xl px-12 py-6"
                                            onClick={onSubmit(handleSubmit)}
                                            disabled={loading}
                                        >
                                            {loading ? 'Updating...' : 'Update Match'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </DefaultPage>
    );
}

