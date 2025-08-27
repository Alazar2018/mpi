import Button from "@/components/Button";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMatchById } from "./api/matchs.api";
import icons from "@/utils/icons";
import { formatDateToYYMMDD } from "@/utils/utils";
import { useAuthStore } from "@/store/auth.store";

function DisplayDate({ date, time }: { date: string; time?: string }) {
  return (
    <div className="font-bold text-[var(--text-primary)] dark:text-white flex items-center gap-1">
      <span className="text-sm py-1 px-2 bg-green-100 rounded-sm">
        {date}
      </span>
      {time && (
        <span className="text-sm py-1 px-2 bg-green-100 rounded-sm">
          {time}
        </span>
      )}
    </div>
  );
}

export default function Match() {
  const navigation = useNavigate();
  const params = useParams();

  const [hasSelectedLevel, setHasSelectedLevel] = useState(false);
  const matchesReq = useApiRequest({
    cacheKey: "match_" + params?.matchId,
    freshDuration: 1000 * 60 * 5,
    staleWhileRevalidate: true,
  });

  useEffect(() => {
    if (!params?.matchId) return;
    matchesReq.send(
      () => getMatchById(params.matchId as string),
      (res) => {
        if (res.success && res.data) {
          console.log(res.data);
        }
      }
    );
  }, [params]);

  // Check if level has been selected on component mount and updates
  useEffect(() => {
    const checkSelectedLevel = () => {
      const selectedLevel = sessionStorage.getItem('selectedTrackingLevel');
      setHasSelectedLevel(!!selectedLevel);
    };
    
    checkSelectedLevel();
    
    // Listen for storage changes (when level is selected)
    const handleStorageChange = () => {
      checkSelectedLevel();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event when level is selected in same tab
    window.addEventListener('levelSelected', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('levelSelected', handleStorageChange);
    };
  }, []);

  // Get match data based on role
  const getMatchData = () => {
    const matchData = matchesReq.response?.data;
    
    if (!matchData) {
      return {
        date: "Loading...",
        time: "Loading...",
        length: "Loading...",
        courtType: "Loading...",
        courtSurface: "Loading...",
        creator: "Loading...",
        tieBreakRule: "Loading...",
        gameBestOutOf: "Loading..."
      };
    }

    // Use actual match data for all users
    return {
      date: formatDateToYYMMDD(matchData.date) || "Not set",
      time: formatDateToYYMMDD(matchData.date, true)?.split("T")?.[1] || "Not set",
      length: matchData.totalGameTime ? `${Math.round(matchData.totalGameTime / 60)} Min` : "Not set",
      courtType: matchData.indoor ? "Indoor" : "Outdoor",
      courtSurface: matchData.courtSurface || "Not set",
      creator: matchData.matchCreator ? `${matchData.matchCreator.firstName} ${matchData.matchCreator.lastName}` : "Not set",
      tieBreakRule: matchData.tieBreakRule || "7",
      gameBestOutOf: matchData.matchType === 'one' ? '1' : matchData.matchType === 'three' ? '2 out of 3' : '3 out of 5'
    };
  };

  const matchData = getMatchData();

  const matchDetails = [
    {
      icon: icons.calender,
      title: "Match Date & Time",
      type: "date",
      data: {
        date: matchData.date,
        time: matchData.time,
      },
    },
    {
      icon: icons.clock,
      title: "Match Length",
      type: "text",
      data: matchData.length,
    },
    {
      icon: icons.tennisBall,
      title: "Game Best Out of",
      type: "text",
      data: matchData.gameBestOutOf,
    },
    {
      icon: icons.matchs,
      title: "Tie-Breaker Rule",
      type: "text",
      data: matchData.tieBreakRule,
    },
    {
      icon: icons.court,
      title: "Court Type",
      type: "text",
      data: matchData.courtType,
    },
    {
      icon: icons.courtType,
      title: "Court Surface Type",
      type: "text",
      data: matchData.courtSurface,
    },
    {
      icon: icons.creator,
      title: "Match Creator",
      type: "text",
      data: matchData.creator,
    },
  ];
	
  return (
    <div className="space-y-6 bg-[var(--bg-primary)] min-h-screen p-6">
      {/* Match Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchDetails.map((item, index) => (
          <div
            key={index}
            className="flex items-center p-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-[var(--bg-secondary)] grid place-items-center rounded-lg">
              <i 
                className="text-[var(--text-secondary)] dark:text-gray-400" 
                dangerouslySetInnerHTML={{ __html: item.icon }} 
              />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-400 mb-1">{item.title}</span>
              {item.type === "date" ? (
                <DisplayDate date={item.data.date} time={item.data.time} />
              ) : (
                <span className="text-base font-bold text-[var(--text-primary)] dark:text-white">
                  {item.data}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Start Match Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={() => {
            // Check if a level has already been selected
            const selectedLevel = sessionStorage.getItem('selectedTrackingLevel');
            if (selectedLevel) {
              // Navigate directly to tracking if level is already selected
              navigation(`/admin/matchs/tracking/${params.matchId}`);
            } else {
              // Trigger the parent component's level selection modal
              const event = new CustomEvent('startMatch');
              window.dispatchEvent(event);
            }
          }}
          type="action"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          {hasSelectedLevel ? 'Begin Tracking' : 'Start the Match'}
        </Button>
      </div>
    </div>
  );
}
