import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import Form from "@/components/form/Form";
import Select from "@/components/form/Select";
import Textarea from "@/components/form/Textarea";
import SearchableSelect from "@/components/form/SearchableSelect";
import icons from "@/utils/icons";
import { required } from "@/utils/utils";
import { createMatch, getMatchFormats, getScoringVariations } from "./api/matchs.api";
import { isFormatCompatibleWithVariation } from "@/utils/matchFormatUtils";
import { friendsService } from "@/service/friends.server";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "react-hot-toast";
import type { MatchFormat, ScoringVariation, TrackingLevel, CreateMatchRequest } from "@/service/matchs.server";

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
  { value: 'shortSets', label: 'Short Set To 4', description: '4 out of 7 sets (no-ad scoring and 7-point tiebreak at 3-3)' },
  { value: 'proSet8', label: 'Pro Set To 8', description: '8-game pro set with 7-point tiebreak at 8-8' },
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
    // Legacy field - deprecated but still supported
    matchType?: "one" | "three" | "five";
    // New enhanced fields
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

export default function ScheduleMatch() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [players, setPlayers] = useState<PlayerOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [p1IsObject, setP1IsObject] = useState(true);
    const [p2IsObject, setP2IsObject] = useState(true); 
    const [matchCategory, setMatchCategory] = useState<"practice" | "tournament">("practice");
    const [selectedP1, setSelectedP1] = useState<string>("");
    const [selectedP2, setSelectedP2] = useState<string>("");
    const [availableFormats, setAvailableFormats] = useState(MATCH_FORMAT_OPTIONS);
    const [availableVariations, setAvailableVariations] = useState(SCORING_VARIATION_OPTIONS);
    const [availableTrackingLevels, setAvailableTrackingLevels] = useState(TRACKING_LEVEL_OPTIONS);

    // Load available players from friends and match formats
    useEffect(() => {
        const loadData = async () => {
            try {
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
                toast.error('Failed to load match configuration data');
            }
        };

        loadData();
    }, [user]);

    // Filter players for each position to prevent duplicate selection
    const getFilteredPlayersForP1 = () => {
        return players.filter(player => player.value !== selectedP2);
    };

    const getFilteredPlayersForP2 = () => {
        return players.filter(player => player.value !== selectedP1);
    };

    const handleSubmit = async (formData: MatchFormData) => {
        setLoading(true);
        try {
            // Debug: Log form data to see what's being received
            console.log('Form data received:', formData);
            
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

            // Validate date field
            if (!formData.date) {
                toast.error('Please select a match date');
                return;
            }

            // Validate other required fields
            if (!formData.courtSurface) {
                toast.error('Please select a court surface');
                return;
            }
            if (!formData.matchFormat) {
                toast.error('Please select match format');
                return;
            }
            if (!formData.scoringVariation) {
                toast.error('Please select scoring variation');
                return;
            }
            if (!formData.trackingLevel) {
                toast.error('Please select tracking level');
                return;
            }
            if (!formData.matchCategory) {
                toast.error('Please select match category');
                return;
            }
            if (!formData.tieBreakRule) {
                toast.error('Please select tie break rule');
                return;
            }

            // Validate tournament fields if category is tournament
            if (formData.matchCategory === 'tournament') {
                if (!formData.tournamentType) {
                    toast.error('Tournament type is required for tournament matches');
                    return;
                }
                if (!formData.tournamentLevel) {
                    toast.error('Tournament level is required for tournament matches');
                    return;
                }
                            // Additional validation to ensure the selected level exists for the selected type
            const selectedType = formData.tournamentType as keyof typeof TOURNAMENT_LEVELS;
            const selectedLevel = formData.tournamentLevel;
            if (!TOURNAMENT_LEVELS[selectedType]?.includes(selectedLevel)) {
                toast.error(`Invalid tournament level "${selectedLevel}" for the selected tournament type "${selectedType}"`);
                return;
            }
            
            // Log successful validation
            console.log(`Tournament validation passed: ${selectedType} - ${selectedLevel}`);
            }

            // Prepare the match data with enhanced API format
            const matchData: CreateMatchRequest = {
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
                // Legacy field - deprecated but still supported
                matchType: formData.matchType,
                // New enhanced fields
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

            console.log('Match data prepared:', matchData);

            const response = await createMatch(matchData);
            
            if (response.success) {
                toast.success('Match scheduled successfully!');
                // Reset selected players
                setSelectedP1("");
                setSelectedP2("");
                
                // Add a small delay to ensure toast is visible before navigation
                setTimeout(() => {
                    navigate('/admin/matchs');
                }, 1000);
            } else {
                toast.error(response.error || 'Failed to schedule match. Please try again.');
            }
        } catch (error) {
            console.error('Error creating match:', error);
            toast.error('Failed to schedule match. Please try again.');
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

    // Legacy match type options (deprecated)
    const matchTypeOptions = [
        { value: 'one', label: 'Best of 1' },
        { value: 'three', label: 'Best of 3' },
        { value: 'five', label: 'Best of 5' }
    ];

    // Enhanced match format options
    const matchFormatOptions = availableFormats.map(format => ({
        value: format.value,
        label: format.label
    }));

    // Scoring variation options will be calculated inside the form component

    // Tracking level options
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

    // TODO: Uncomment when API supports tracking level
    // const trackingLevelOptions = [
    //     { value: 'basic', label: 'Basic' },
    //     { value: 'detailed', label: 'Detailed' },
    //     { value: 'comprehensive', label: 'Comprehensive' }
    // ];

    return (
        <DefaultPage
            title="Schedule New Match"
            rightAction={
                <Button
                    onClick={() => navigate('/admin/matchs')}
                    type="neutral"
                    className="text-sm"
                >
                    Back to Matches{" "}
                    <i dangerouslySetInnerHTML={{ __html: icons.chevronRight }} />
                </Button>
            }
        >
            <div className="w-full mx-auto px-4">
                <Form<MatchFormData>
                    form={({ onSubmit, watch, setValue, errors }) => {
                        // Watch for match category and format changes
                        const currentMatchCategory = watch('matchCategory') as "practice" | "tournament";
                        const currentTournamentType = watch('tournamentType') as keyof typeof TOURNAMENT_LEVELS;
                        const currentMatchFormat = watch('matchFormat') as MatchFormat;
                        
                        // Update local state when form value changes
                        useEffect(() => {
                            if (currentMatchCategory) {
                                setMatchCategory(currentMatchCategory);
                            }
                        }, [currentMatchCategory]);

                        // Clear scoring variation if it's not compatible with the selected match format
                        useEffect(() => {
                            if (currentMatchFormat) {
                                const currentScoringVariation = watch('scoringVariation') as ScoringVariation;
                                if (currentScoringVariation && !isFormatCompatibleWithVariation(currentMatchFormat, currentScoringVariation)) {
                                    setValue('scoringVariation', 'standard');
                                }
                                
                                // Set default values based on match format
                                if (currentMatchFormat === 'oneSet') {
                                    setValue('tieBreakRule', 7);
                                    setValue('scoringVariation', 'standard');
                                } else if (currentMatchFormat === 'bestOfThree' || currentMatchFormat === 'bestOfFive') {
                                    setValue('tieBreakRule', 7);
                                    setValue('scoringVariation', 'standard');
                                } else if (currentMatchFormat === 'shortSets') {
                                    setValue('tieBreakRule', 7);
                                    setValue('scoringVariation', 'standard');
                                    setValue('noAdScoring', true);
                                } else if (currentMatchFormat === 'proSet8') {
                                    setValue('tieBreakRule', 7);
                                    setValue('scoringVariation', 'standard');
                                } else if (currentMatchFormat.startsWith('tiebreak')) {
                                    setValue('scoringVariation', 'standard');
                                    setValue('noAdScoring', true);
                                    if (currentMatchFormat === 'tiebreak7') {
                                        setValue('tieBreakRule', 7);
                                    } else if (currentMatchFormat === 'tiebreak10') {
                                        setValue('tieBreakRule', 10);
                                    } else if (currentMatchFormat === 'tiebreak21') {
                                        setValue('tieBreakRule', 21);
                                    }
                                }
                            }
                        }, [currentMatchFormat, watch, setValue]);

                        // Set default scoring variation to 'standard' when format changes and scoring variation is available
                        useEffect(() => {
                            if (currentMatchFormat && !currentMatchFormat.startsWith('tiebreak')) {
                                const hasScoringVariation = isFormatCompatibleWithVariation(currentMatchFormat, 'standard');
                                if (hasScoringVariation) {
                                    // Always set to standard when format changes
                                    setValue('scoringVariation', 'standard');
                                }
                            }
                        }, [currentMatchFormat, setValue]);

                        // Calculate scoring variation options based on selected match format
                        const scoringVariationOptions = availableVariations
                            .filter(variation => 
                                !currentMatchFormat || 
                                isFormatCompatibleWithVariation(currentMatchFormat, variation.value as ScoringVariation)
                            )
                            .map(variation => ({
                                value: variation.value,
                                label: variation.label
                            }));

                        // Calculate tie break options based on selected match format
                        const getTieBreakOptions = () => {
                            if (!currentMatchFormat) return tieBreakOptions;
                            
                            if (currentMatchFormat === 'oneSet') {
                                return [
                                    { value: 7, label: '7 points' },
                                    { value: 10, label: '10 points' }
                                ];
                            } else if (currentMatchFormat === 'bestOfThree' || currentMatchFormat === 'bestOfFive') {
                                return [
                                    { value: 7, label: '7 points' }
                                ];
                            } else if (currentMatchFormat === 'shortSets' || currentMatchFormat === 'proSet8') {
                                return [
                                    { value: 7, label: '7 points' }
                                ];
                            } else if (currentMatchFormat.startsWith('tiebreak')) {
                                // For tiebreak-only formats, tie break rule is determined by the format
                                return [];
                            }
                            
                            return tieBreakOptions;
                        };

                        const currentTieBreakOptions = getTieBreakOptions();

                    return (
                            <div className=" w-full">
                                {/* Hero Section with Background */}
                             

                                {/* Player Selection Section */}
                                <div className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-3xl p-10 shadow-xl border border-blue-100 ">
                                    {/* Tennis Court Background Image */}
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
                                <p className="text-xl text-[var(--text-secondary)]">Choose your players or add custom names</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-center max-w-6xl mx-auto">
                                            {/* Player 1 */}
                                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
                                                <div className="text-center mb-6">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <span className="text-3xl font-bold text-white">1</span>
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">Player One</h3>
                                                </div>
                                                
                                                <div className="space-y-5">
                                                    <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-4 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={p1IsObject}
                                                            onChange={(e) => {
                                                                setP1IsObject(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    setSelectedP1("");
                                                                }
                                                            }}
                                                            className="w-6 h-6 text-blue-600 bg-[var(--bg-card)] border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
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
                                                            onUpdate={(value) => setSelectedP1(value)}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Enter player 1 name"
                                                            className="w-full h-14 bg-[var(--bg-card)] rounded-xl px-5 text-base border-2 border-[var(--border-primary)] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-[var(--text-primary)]"
                                                            onChange={(e) => {
                                                                setValue("p1Name", e.target.value);
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* VS Badge */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-3xl font-bold text-white">VS</span>
                                                </div>
                                                <div className="mt-6 text-center">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-3"></div>
                                                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-3"></div>
                                                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                                                </div>
                                            </div>
                                            
                                            {/* Player 2 */}
                                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300">
                                                <div className="text-center mb-6">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <span className="text-3xl font-bold text-white">2</span>
                                                    </div>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">Player Two</h3>
                                                </div>
                                                
                                                <div className="space-y-5">
                                                    <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-4 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={p2IsObject}
                                                            onChange={(e) => {
                                                                setP2IsObject(e.target.checked);
                                                                if (!e.target.checked) {
                                                                    setSelectedP2("");
                                                                }
                                                            }}
                                                            className="w-6 h-6 text-purple-600 bg-[var(--bg-card)] border-2 border-purple-300 rounded focus:ring-blue-500 focus:ring-2"
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
                                                            onUpdate={(value) => setSelectedP2(value)}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Enter player 2 name"
                                                            className="w-full h-14 bg-[var(--bg-card)] rounded-xl px-5 text-base border-2 border-[var(--border-primary)] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-[var(--text-primary)]"
                                                            onChange={(e) => {
                                                                setValue("p2Name", e.target.value);
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Details Section */}
                                <div className="bg-[var(--bg-card)] rounded-3xl p-10 shadow-[var(--shadow-primary)] border border-[var(--border-primary)] transition-colors duration-300">
                                    <div className="text-center mb-10">
                                        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Match Details</h2>
                                        <p className="text-xl text-[var(--text-secondary)]">Configure your match settings and preferences</p>
                            </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
                                        <div className="space-y-3">
                                            <label className="text-base font-medium text-[var(--text-primary)]">
                                                Match Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={watch("date") || ""}
                                                onChange={(e) => {
                                                    setValue("date", e.target.value);
                                                    console.log('Date input changed to:', e.target.value);
                                                }}
                                                min={new Date().toISOString().slice(0, 16)}
                                                max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                                className="w-full px-4 py-3 border-2 border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-primary)]"
                                                required
                                            />
                                            {errors.date && (
                                                <span className="text-red-500 text-xs">
                                                    {String(errors.date.message)}
                                                </span>
                                            )}
                                        
                                        </div>
                                        
                                        <div className="space-y-3">
                                <Select
                                                options={matchFormatOptions}
                                                label="Match Format"
                                                validation={{ required: required }}
                                                name="matchFormat"
                                            />
                                        </div>
                                        
                                        {/* Tie Break - Hidden for tiebreak-only formats */}
                                        {!currentMatchFormat?.startsWith('tiebreak') && currentTieBreakOptions.length > 0 && (
                                            <div className="space-y-3">
                                                <Select
                                                    options={currentTieBreakOptions}
                                                    label="Tie Break"
                                                    validation={{ required: required }}
                                                    name="tieBreakRule"
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Scoring Variation - Hidden for tiebreak-only formats */}
                                        {!currentMatchFormat?.startsWith('tiebreak') && (
                                            <div className="space-y-3">
                                                <Select
                                                    options={scoringVariationOptions}
                                                    label="Scoring Variation"
                                                    validation={{ required: required }}
                                                    name="scoringVariation"
                                                    value={watch('scoringVariation') || 'standard'}
                                                />
                                                {/* Help text for scoring variations */}
                                                {currentMatchFormat && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {currentMatchFormat === 'bestOfThree' || currentMatchFormat === 'bestOfFive' ? (
                                                            <span>✅ Final set can use 10-point tiebreak</span>
                                                        ) : currentMatchFormat === 'oneSet' ? (
                                                            <span>✅ Can use 10-point tiebreak</span>
                                                        ) : currentMatchFormat === 'shortSets' || currentMatchFormat === 'proSet8' ? (
                                                            <span>✅ Final set 10-point tiebreak available</span>
                                                        ) : (
                                                            <span>ℹ️ Only standard scoring available for this format</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="space-y-3">
                                <Select
                                                options={trackingLevelOptions}
                                                label="Tracking Level"
                                                validation={{ required: required }}
                                                name="trackingLevel"
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                <Select
                                                options={matchCategoryOptions}
                                                label="Match Category"
                                                validation={{ required: required }}
                                                name="matchCategory"
                                            />
                                        </div>
                                        
                                        <div className="space-y-3">
                                <Select
                                                options={courtSurfaceOptions}
                                                label="Court Surface"
                                                validation={{ required: required }}
                                                name="courtSurface"
                                />
                            </div>

                                        <div className="flex items-center justify-center">
                                            <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors w-full justify-center">
                                                <input
                                                    type="checkbox"
                                                    name="indoor"
                                                    className="w-6 h-6 text-blue-600 bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="text-base font-medium text-[var(--text-primary)]">Indoor Court</span>
                                            </label>
                                        </div>
                                        
                                        {/* Hide No-Ad Scoring for tiebreak formats - it's automatically enabled */}
                                        {!currentMatchFormat?.startsWith('tiebreak') && (
                                            <div className="flex items-center justify-center">
                                                <label className="flex items-center gap-3 cursor-pointer bg-[var(--bg-secondary)] p-5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors w-full justify-center">
                                                    <input
                                                        type="checkbox"
                                                        name="noAdScoring"
                                                        className="w-6 h-6 text-green-600 bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded focus:ring-green-500 focus:ring-2"
                                                    />
                                                    <span className="text-base font-medium text-[var(--text-primary)]">No-Ad Scoring</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                                                        {/* Tournament fields - shown conditionally */}
                                    {matchCategory === 'tournament' && (
                                        <div className="mt-10 p-8 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-primary)] max-w-5xl mx-auto transition-colors duration-300">
                                            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-3 text-center justify-center">
                                                🏆 Tournament Information
                                            </h3>
                                            <p className="text-center text-[var(--text-secondary)] mb-8 text-lg">
                                                Select the tournament type and level to categorize your match properly. 
                                                The tournament level options will update based on your selection.
                                            </p>
                                            <div className="mb-6 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-secondary)]">
                                                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                                    <span className="text-xl">ℹ️</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium">Tournament Match Requirements:</p>
                                                        <p className="text-sm">Both tournament type and level must be selected to proceed with scheduling.</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Progress:</span>
                                                        <div className="flex gap-1">
                                                            <div className={`w-3 h-3 rounded-full ${currentTournamentType ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`}></div>
                                                            <div className={`w-3 h-3 rounded-full ${currentTournamentType && watch('tournamentLevel') ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`}></div>
                                                        </div>
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            {currentTournamentType && watch('tournamentLevel') ? '2/2' : currentTournamentType ? '1/2' : '0/2'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-2xl">🏆</span>
                                                        <span className="text-lg font-medium text-[var(--text-primary)]">Tournament Type</span>
                                                    </div>
                                                    <Select
                                                        options={Object.keys(TOURNAMENT_LEVELS).map(type => ({ 
                                                            value: type, 
                                                            label: `${type} (${TOURNAMENT_LEVELS[type as keyof typeof TOURNAMENT_LEVELS].length} levels)` 
                                                        }))}
                                                        label=""
                                                        validation={{ required: required }}
                                                        name="tournamentType"
                                                        onUpdate={() => {
                                                            setValue("tournamentLevel", ""); // Clear level when type changes
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-2xl">📊</span>
                                                        <span className="text-lg font-medium text-[var(--text-primary)]">Tournament Level</span>
                                                    </div>
                                                    <Select
                                                        options={currentTournamentType && TOURNAMENT_LEVELS[currentTournamentType] 
                                                            ? TOURNAMENT_LEVELS[currentTournamentType].map(level => ({ value: level, label: level }))
                                                            : []}
                                                        label=""
                                                        validation={{ required: required }}
                                                        name="tournamentLevel"
                                                        placeholder={currentTournamentType ? "Select tournament level" : "Select tournament type first"}
                                                    />
                                                    {!currentTournamentType && (
                                                        <p className="text-sm text-[var(--text-secondary)] mt-2 flex items-center gap-2">
                                                            <span>⚠️</span>
                                                            <span>Please select a tournament type first to see available levels</span>
                                                        </p>
                                                    )}
                                                    {currentTournamentType && TOURNAMENT_LEVELS[currentTournamentType] && (
                                                        <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                                                            <p className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                                                                <span>📋</span>
                                                                <span>Available levels for <strong>{currentTournamentType}</strong>: {TOURNAMENT_LEVELS[currentTournamentType].length} options</span>
                                                            </p>
                                                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                                {TOURNAMENT_LEVELS[currentTournamentType].slice(0, 5).join(', ')}
                                                                {TOURNAMENT_LEVELS[currentTournamentType].length > 5 && '...'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    

                                    {/* Notes Section */}
                                    <div className="mt-12 pt-8 border-t border-[var(--border-secondary)]">
                                        <div className="text-center mb-8">
                                            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-3">📝 Match Notes</h3>
                                            <p className="text-xl text-[var(--text-secondary)]">Add any additional information about your match</p>
                                        </div>
                                        <div className="w-full max-w-4xl mx-auto">
                                            <Textarea
                                                label=""
                                                name="note"
                                                placeholder="Enter any special instructions, court preferences, or additional notes for your match..."
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-center mt-16 mb-8">
                                <Button
                                    type="action"
                                            size="lg"
                                            className="rounded-3xl text-center text-2xl px-24 py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 min-w-80"
                                            onClick={onSubmit(handleSubmit)}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-6">
                                                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-2xl">Scheduling Match...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-6">
                                                    <span className="text-3xl">🎾</span>
                                                    <span className="text-2xl font-semibold">Schedule Match</span>
                                                    <span className="text-3xl">🎾</span>
                                                </div>
                                            )}
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