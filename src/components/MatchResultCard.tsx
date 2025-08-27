import type { Match } from "@/interface";
import Button from "./Button";
import { formatTime, getAceCounts, secondDateFormat } from "@/utils/utils";

interface MatchResultCardProps {
    match: Match;
    currentUserId?: string;
    className?: string;
}

export default function MatchResultCard({ match, currentUserId, className = "" }: MatchResultCardProps) {
    const aces = getAceCounts(match);

    // Determine player names
    const player1Name = match.p1 ? `${match.p1.firstName} ${match.p1.lastName}` : "Player 1";
    const player2Name = match.p2 ? `${match.p2.firstName} ${match.p2.lastName}` : match.p2Name || "Player 2";

    // Determine if the current user is player1 or player2
    const isPlayer1 = currentUserId && match.p1?._id === currentUserId;
    const isPlayer2 = currentUserId && match.p2?._id === currentUserId;

    // Format score if available
    const score = match.score || "No score recorded";

    return (
        <div className={`flex flex-col gap-4 p-4 rounded-[1.5rem] border border-gray-200 ${className}`}>
            <div className="flex flex-col">
                <span className="text-base font-bold">
                    {player1Name} VS {player2Name}
                </span>
                <span className="text-xs text-gray-500">
                    {secondDateFormat(match.date)} {formatTime(match.date)}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Aces</span>
                    <span className="text-xs font-medium text-gray-700">
                        {aces.p1Aces}-{aces.p2Aces}
                    </span>
                </div>
                {match.duration && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Duration</span>
                        <span className="text-xs font-medium text-gray-700">
                            {match.duration}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-center items-center bg-gray-100 text-xs rounded-lg px-2 py-1 truncate">
                    {score}
                </div>
                <Button
                    className="!h-[30px] justify-center !rounded-lg font-bold !text-[13px]"
                    type="action"
                >
                    {match.result ? (
                        isPlayer1 ? (match.result === "won" ? "You Won" : "You Lost") :
                            isPlayer2 ? (match.result === "won" ? "You Lost" : "You Won") :
                                match.result === "won" ? `${player1Name} Won` : `${player2Name} Won`
                    ) : "View Details"}
                </Button>
            </div>
        </div>
    );
}