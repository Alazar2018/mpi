import Button from "@/components/Button";
import Versus from "@/components/Versus";
import MatchResultCard from "@/components/MatchResultCard";
import icons from "@/utils/icons";
import { Link } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getAllMatchs } from "./api/matchs.api";
import type { Match } from "@/interface";
import { useEffect } from "react";
import VersusSkeleton from "@/components/skeletons/VersusSkeleton";
import MatchResultCardSkeleton from "@/components/skeletons/MatchResultCardSkeleton";

export default function Matchs() {
  const matchesReq = useApiRequest({
    cacheKey: "allmatches",
		freshDuration: 1000 * 60 * 5,
    staleWhileRevalidate: true,
  });

  useEffect(() => {
    matchesReq.send(
      () => getAllMatchs(),
      (res) => {
        if (res.success && res.data) {
          console.log(res.data);
        }
      }
    );
  }, []);

  const pendingMatches = (matchesReq.response?.matches || []).filter(
    (match: Match) => match.status === "pending"
  );
  const recentMatches = (matchesReq.response?.matches || []).filter(
    (match: Match) => match.status === "completed"
  );

  return (
    <div className="flex flex-col gap-4 bg-white rounded-3xl p-4 px-6">
      <div className="flex items-center justify-between">
        <span>Pending Match</span>
        <Button type="action" className="rounded-full ">
          Schedule Match
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 overflow-hidden">
        {matchesReq.pending
          ? Array(9)
              .fill(1)
              .map((el, idx) => {
                return <VersusSkeleton key={idx} />;
              })
          : (pendingMatches || []).map((match: Match, idx: number) => (
              <Link to={`detail/${match._id}`} key={idx}>
                <Versus match={match} />
              </Link>
            ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span>Recent Matchs</span>
        <Button className="rounded-full border-0 bg-gray-1">View All</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {matchesReq.pending
          ? Array(9)
              .fill(1)
              .map((el, idx) => {
                return <MatchResultCardSkeleton key={idx} />;
              })
          : (recentMatches ? ["", ...recentMatches] : [""]).map(
              (match, idx) => {
                if (idx == 0) {
                  return (
                    <Link
                      key={idx}
                      to="/admin/matchs/new"
                      className="h-[10.125rem] flex flex-col items-center justify-center gap-4 p-4 rounded-[1.5rem] border border-gray-1"
                    >
                      <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                      <span className="text-base">Schedule New Match</span>
                    </Link>
                  );
                }
                return <MatchResultCard match={match as Match} key={idx} />;
              }
            )}
      </div>
    </div>
  );
}
