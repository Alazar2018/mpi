import Button from "@/components/Button";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMatchById } from "./api/matchs.api";
import icons from "@/utils/icons";
import { formatDateToYYMMDD } from "@/utils/utils";

function DisplayDate({ date, time }: { date: string; time?: string }) {
  return (
    <div className="font-gor	font-bold text-secondary flex items-center gap-1">
      <span className="text-[13px] py-1 px-2  bg-green-2 rounded-sm">
        {date}
      </span>
      <span className="text-[13px] py-1 px-2 bg-green-2 rounded-sm">
        {time}
      </span>
    </div>
  );
}

export default function Match() {
  const navigation = useNavigate();
  const params = useParams();
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

  const match = [
    {
      icon: icons.calender,
      title: "Match Date & Time",
      type: "date",
      data: {
        date: formatDateToYYMMDD(matchesReq.response?.date),
        time: formatDateToYYMMDD(matchesReq.response?.date, true)?.split(
          "T"
        )?.[1],
      },
    },
    {
      icon: icons.court,
      title: "Court Type",
      type: "text",
      data: matchesReq.response?.indoor ? "Indoor" : "Outdoor",
    },
    {
      icon: icons.clock,
      title: "Match Length",
      type: "text",
      data: matchesReq.response?.length ?? 0,
    },
    {
      icon: icons.courtType,
      title: "Court Surface Type",
      type: "text",
      data: matchesReq.response?.courtSurface ?? "",
    },
    {
      icon: icons.tennisBall,
      title: "Game Best Out Of",
      type: "text",
      data: "2 out of 3",
    },
    {
      icon: icons.creator,
      title: "Match Creator",
      type: "text",
      data: `${matchesReq.response?.matchCreator?.firstName} ${matchesReq.response?.matchCreator?.lastName}`,
    },
    {
      icon: icons.matchs,
      title: "Tie-Breaker Rule",
      type: "text",
      data: matchesReq.response?.tieBreakRule ?? "",
    },
  ];
	
  return (
    <>
      <div className="text-secondary font-gor grid grid-cols-2 gap-[10px]">
        {match.length
          ? match.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-4 gap-4 bg-blue-50 rounded-lg"
              >
                <div className="size-[54px] bg-white grid place-items-center rounded">
                  <i dangerouslySetInnerHTML={{ __html: item.icon }} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{item.title}</span>
                  {item.type === "date" ? (
                    <DisplayDate date={item.data.date} time={item.data.time} />
                  ) : (
                    <span className="text-base font-bold text-text-clr">
                      {item.data}
                    </span>
                  )}
                </div>
              </div>
            ))
          : null}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => navigation(`/admin/matchs/detail/${params.matchId}/tracking`)}
          type="action"
        >
          Start Match
        </Button>
      </div>
    </>
  );
}
