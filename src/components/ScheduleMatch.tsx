import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { useAuthStore } from "@/store/auth.store";

interface Player {
    id: string;
    name: string;
    avatar: string;
}

const courtTypes = ["Hard", "Clay", "Grass", "Artificial Grass", "Carpet"];
const matchCategories = ["Friendly", "Tournament", "League", "Practice", "Exhibition"];
const setsOptions = [1, 2, 3, 5];
const tieBreakPoints = [7, 10];

export default function ScheduleMatch() {
    const { user } = useAuthStore();
    const [selectedPlayer, setSelectedPlayer] = useState<string>("");
    const [formData, setFormData] = useState({
        player1: { id: "", isMyPlayer: false },
        player2: { id: "", isMyPlayer: false },
        matchDate: "",
        matchTime: "",
        totalSets: 3,
        tieBreakPoints: 7,
        category: "Friendly",
        surface: "Hard",
        courtLocation: "",
        notes: ""
    });

    // TODO: Replace with actual API call to fetch players
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

    useEffect(() => {
        // Simulate API loading - replace with actual API call
        setTimeout(() => {
            setIsLoadingPlayers(false);
            // In the future, replace this with actual API call
            // fetchPlayers().then(setPlayers);
        }, 1000);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePlayerToggle = (player: "player1" | "player2") => {
        setFormData(prev => ({
            ...prev,
            [player]: {
                ...prev[player],
                isMyPlayer: !prev[player].isMyPlayer
            }
        }));
    };

    const handlePlayerSelect = (player: "player1" | "player2", id: string) => {
        setFormData(prev => ({
            ...prev,
            [player]: {
                ...prev[player],
                id
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log("Scheduling match:", formData);
    };

    return (
        <div className="relative min-h-screen bg-gray-50">
            {/* Background Image Header */}
            <div className="relative h-48 bg-blue-600 overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('/tennis-court-bg.jpg')] bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))" }}
                ></div>
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-4">
                    <h1 className="text-3xl font-bold">Schedule New Match</h1>
                    <p className="mt-2">Organize your next tennis match</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/matches" className="flex items-center text-blue-600 hover:text-blue-800">
                    <span dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                    <span className="ml-1">Back to Matches</span>
                </Link>
                <button className="flex items-center text-blue-600 hover:text-blue-800">
                    <span className="mr-1">View Calendar</span>
                    <span dangerouslySetInnerHTML={{ __html: icons.calendar }} />
                </button>
            </div>

            {/* Main Form */}
            <div className="container mx-auto px-4 pb-12">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
                    {/* Players Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Players</h2>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            {/* Player 1 */}
                            <div className={`flex-1 border-2 ${formData.player1.isMyPlayer ? "border-blue-500" : "border-gray-200"} rounded-lg p-4 transition-all`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-medium">Player 1</h3>
                                    {user?.role === "coach" && (
                                        <label className="flex items-center cursor-pointer">
                                            <span className="mr-2 text-sm">My Player</span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={formData.player1.isMyPlayer}
                                                    onChange={() => handlePlayerToggle("player1")}
                                                />
                                                <div className={`block w-10 h-6 rounded-full ${formData.player1.isMyPlayer ? "bg-blue-500" : "bg-gray-300"}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.player1.isMyPlayer ? "transform translate-x-4" : ""}`}></div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.player1.id}
                                    onChange={(e) => handlePlayerSelect("player1", e.target.value)}
                                >
                                    <option value="">Select Player 1</option>
                                    {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* VS Circle */}
                            <div className="flex-shrink-0 w-12 h-12 bg-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                VS
                            </div>

                            {/* Player 2 */}
                            <div className={`flex-1 border-2 ${formData.player2.isMyPlayer ? "border-blue-500" : "border-gray-200"} rounded-lg p-4 transition-all`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-medium">Player 2</h3>
                                    {user?.role === "coach" && (
                                        <label className="flex items-center cursor-pointer">
                                            <span className="mr-2 text-sm">My Player</span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={formData.player2.isMyPlayer}
                                                    onChange={() => handlePlayerToggle("player2")}
                                                />
                                                <div className={`block w-10 h-6 rounded-full ${formData.player2.isMyPlayer ? "bg-blue-500" : "bg-gray-300"}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.player2.isMyPlayer ? "transform translate-x-4" : ""}`}></div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.player2.id}
                                    onChange={(e) => handlePlayerSelect("player2", e.target.value)}
                                >
                                    <option value="">Select Player 2</option>
                                    {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Match Details - 3 Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Match Date</label>
                                <input
                                    type="date"
                                    name="matchDate"
                                    value={formData.matchDate}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Match Time</label>
                                <input
                                    type="time"
                                    name="matchTime"
                                    value={formData.matchTime}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Sets to Win</label>
                                <select
                                    name="totalSets"
                                    value={formData.totalSets}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {setsOptions.map(num => (
                                        <option key={num} value={num}>{num} {num === 1 ? "Set" : "Sets"}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points to Break Tie</label>
                                <select
                                    name="tieBreakPoints"
                                    value={formData.tieBreakPoints}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {tieBreakPoints.map(points => (
                                        <option key={points} value={points}>{points} Points</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Match Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {matchCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Field Surface</label>
                                <select
                                    name="surface"
                                    value={formData.surface}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {courtTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Full Width Fields */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Court Location</label>
                        <input
                            type="text"
                            name="courtLocation"
                            value={formData.courtLocation}
                            onChange={handleInputChange}
                            placeholder="Enter court name or address"
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Memo)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Any special instructions or notes about the match..."
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button type="action" className="px-6 py-3">
                            Schedule Match
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}