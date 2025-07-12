import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getMatchById } from "./api/matchs.api";
import GameTimer from "@/components/GameTimer";
import type { Match } from "@/interface";
import icons from "@/utils/icons";
import { useMatchTrackerStore } from "./store/match_tracker.store";
import FocusTrap from "@/components/FocusTrap";
import TimeCounter from "@/components/TimeCounter";

type ServeResult =
  | "Ace"
  | "Serve In - Return Out (forced)"
  | "Serve In - Return Play"
  | "First Serve Fault"
  | "Double Fault"
  | "Let"
  | "Foot Fault";
type GoodShotPlacement = "Down The Line" | "Cross Court" | "Drop Shot";
type BadShotPlacement = "Net" | "Wide" | "Long";
type ShotType =
  | "Forehand"
  | "Backhand"
  | "Forhand Volley"
  | "Backhand Volley"
  | "Forhand Swinging Volley"
  | "Backhand Swinging Volley"
  | "Forhand Slice"
  | "Backhand Slice"
  | "OverHead"
  | "Forhand Drop Shot"
  | "Backhand Drop Shot";

function ServeResult({
  onSelect,
}: {
  onSelect: (result: ServeResult | null) => void;
}) {
  return (
    <FocusTrap className="absolute inset-0">
      <div
        onClick={(ev: React.MouseEvent<HTMLDivElement>) => {
          const val = (ev.target as HTMLDivElement)?.dataset
            ?.value as ServeResult;
          if (val) {
            onSelect?.(val);
          }
        }}
        className="*:flex p-2 *:p-2 *:justify-center *:items-center gap-2 *:bg-white  grid grid-cols-2 grid-rows-4"
      >
        <div data-value="Ace" tabIndex={0}>
          Ace
        </div>
        <div data-value="Serve In - Return Out (forced)" tabIndex={0}>
          Serve In - Return Out (forced)
        </div>
        <div data-value="Serve In - Return Play" tabIndex={0}>
          Serve In - Return Play
        </div>
        <div data-value="First Serve Fault" tabIndex={0}>
          First Serve Fault
        </div>
        <div data-value="Double Fault" tabIndex={0}>
          Double Fault
        </div>
        <div data-value="Let" tabIndex={0}>
          Let
        </div>
        <div data-value="Foot Fault" tabIndex={0}>
          Foot Fault
        </div>
      </div>
    </FocusTrap>
  );
}

function ShotPlacement() {
  return (
    <div className="flex flex-col p-2 h-full overflow-y-auto gap-2 absolute inset-0 rounded-md !bg-white">
      <span>Shot Placement</span>
      <FocusTrap className="*:flex p-2 *:p-2 *:justify-center border border-gray-1 rounded-md *:items-center gap-2 *:bg-gray-1  grid grid-cols-2 grid-rows-4">
        <div tabIndex={0}>Down The Line</div>
        <div tabIndex={0}>Cross Court</div>
        <div tabIndex={0}>Drop Shot</div>
      </FocusTrap>
    </div>
  );
}

function ShotType() {
  return (
    <div className="flex flex-col p-2 gap-2 absolute inset-0 rounded-md !bg-white">
      <span>Shot Type</span>
      <FocusTrap className="max-h-max border border-gray-1 rounded-md *:flex p-2 *:h-10 *:bg-gray-1 *:justify-center *:items-center gap-2 grid grid-cols-2 grid-rows-6">
        <div tabIndex={0}>Forehand</div>
        <div tabIndex={0}>Backhand</div>
        <div tabIndex={0}>Forhand Volley</div>
        <div tabIndex={0}>Backhand Volley</div>
        <div tabIndex={0}>Forhand Swinging Volley</div>
        <div tabIndex={0}>Backhand Swinging Volley</div>
        <div tabIndex={0}>Forhand Slice</div>
        <div tabIndex={0}>Backhand Slice</div>
        <div tabIndex={0}>OverHead</div>
        <div tabIndex={0}>Forhand Drop Shot</div>
        <div tabIndex={0}>Backhand Drop Shot</div>
      </FocusTrap>
    </div>
  );
}

function Tracking() {
  const [result, setResult] = useState({
    serveOutCome: "",
    shotType: "",
    shotPlacement: "",
    player1Reaction: "",
    player2Reaction: "",
    rally: "",
  });
}

export default function MatchTracker() {
  const params = useParams<{ matchId: string }>();
  const matchTrackerStore = useMatchTrackerStore();
  const [rally, setRally] = useState(0);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);

  const matchesReq = useApiRequest<Match>({
    cacheKey: `match_${params?.matchId}`,
    freshDuration: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: true,
  });

  const handleTimerUpdate = useCallback((elapsedSeconds: number) => {
    console.log("Elapsed seconds:", elapsedSeconds);
  }, []);

  useEffect(() => {
    if (!params?.matchId) return;
    matchesReq.send(() => getMatchById(params.matchId as string));
  }, [params?.matchId]);

  return (
    <>
      <div className="h-[10.5rem] flex gap-4">
        <div className="flex flex-col items-center justify-center gap-4 h-full rounded-2xl w-[13.5rem] bg-gray-1">
          <GameTimer
            cacheKey={params?.matchId as string}
            autoStart={true}
            onTick={handleTimerUpdate}
          />
        </div>
        <div className="flex-1 bg-gray-1 rounded-2xl grid grid-cols-2 gap-4">
          <div className="flex text-xs font-bold flex-col">
            <div className="px-6 py-3.5 flex items-center">
              <span className="font-bold text-xs text-secondary">Players</span>
            </div>
            <div className="px-6 py-3.5 flex gap-4 items-center">
              <div className="size-[34px] rounded-md overflow-hidden bg-gray-2">
                {matchesReq.response?.p1?.avatar && (
                  <img
                    src={matchesReq.response?.p1?.avatar}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <div>
                <span>
                  {matchesReq.response?.p1?.firstName}{" "}
                  {matchesReq.response?.p1?.lastName}
                </span>
              </div>
              {matchTrackerStore.serving === matchesReq.response?.p1?._id && (
                <span className="font-normal ml-auto block py-2 text-[13px] text-secondary text-center px-3 rounded bg-blue-10">
                  Serving
                </span>
              )}
            </div>
            <div className="px-6 py-3.5 flex gap-4 items-center">
              <div className="size-[34px] rounded-md overflow-hidden bg-gray-2">
                {matchesReq.response?.p2?.avatar && (
                  <img
                    src={matchesReq.response?.p2?.avatar}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <div>
                <span>
                  {matchesReq.response?.p2?.firstName ??
                    matchesReq.response?.p2Name}{" "}
                  {matchesReq.response?.p2?.lastName}
                </span>
              </div>
              {matchTrackerStore.serving ===
                (matchesReq.response?.p2?._id ||
                  matchesReq.response?.p2Name) && (
                <span className="font-normal ml-auto block py-2 text-[13px] text-secondary text-center px-3 rounded bg-blue-10">
                  Serving
                </span>
              )}
            </div>
          </div>
          <div className="font-bold text-xs *:flex  *:items-center *:justify-center text-center text-secondary *:px-6 *:py-3.5 grid grid-cols-3 grid-rows-[43px_1fr_1fr]">
            <div className="bg-blue-20 border-b border-gray-1">Sets</div>
            <div className="bg-blue-10 border-b border-gray-1">Games</div>
            <div className="border-b border-gray-1">Points</div>
            <div className="bg-blue-20 border-b border-gray-1 text-blue-90 ">
              0
            </div>
            <div className="bg-blue-10 border-b border-gray-1 text-blue-90">
              0
            </div>
            <div className="text-blue-90 border-b border-gray-1">0</div>
            <div className="bg-blue-20 border-b border-gray-1 text-blue-90 ">
              15
            </div>
            <div className="bg-blue-10 border-b border-gray-1 text-blue-90">
              0
            </div>
            <div className="text-blue-90 border-b border-gray-1">0</div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 *:px-2 *:py-2 *:bg-blue-10 *:rounded-md *:font-bold *:text-sm *:text-secondary">
            <button className="">Undo</button>
            <button className="">Redo</button>
          </div>
          <div>
            {rally > 1 && <span>{rally}</span>}
            <TimeCounter
              isRunning={!!matchTrackerStore.serving}
              className="mr-4"
              showHours={false}
              initialTime={0}
              key={matchTrackerStore.serving}
            />
            <button className="bg-reminder px-3 py-2 rounded-sm text-white font-bold text-sm">
              Clear Scores
            </button>
          </div>
        </div>
        <div className="relative h-[360px] grid grid-cols-[50px_1fr_1fr_50px] gap-2">
          {!matchTrackerStore.serving && (
            <div className="absolute z-20 grid place-items-center inset-0">
              <div className="flex gap-[34px]">
                <div className="relative w-[222px] h-[197px] rounded-xl overflow-hidden">
                  <img
                    src={matchesReq.response?.p1?.avatar}
                    alt=""
                    className="object-cover w-full max-h-full"
                  />
                  <span
                    onClick={() =>
                      matchTrackerStore.setServing(
                        matchesReq.response?.p1?._id as string
                      )
                    }
                    className="absolute cursor-pointer bg-white text-text-clr flex items-center justify-center gap-2 bottom-2 left-2 right-2 text-center text-[13px] rounded-lg p-2"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.serve }} />{" "}
                    {matchesReq.response?.p1?.firstName}{" "}
                    {matchesReq.response?.p1?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <i
                    className="*:size-[90px]"
                    dangerouslySetInnerHTML={{ __html: icons.tennis }}
                  />
                </div>
                <div className="relative w-[222px] h-[197px] rounded-xl overflow-hidden">
                  {matchesReq.response?.p2?.avatar ? (
                    <img
                      src={matchesReq.response?.p2?.avatar}
                      alt=""
                      className="object-cover w-full max-h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-2"></div>
                  )}
                  <span
                    onClick={() =>
                      matchTrackerStore.setServing(
                        matchesReq.response?.p2Name ||
                          (matchesReq.response?.p2?._id as string)
                      )
                    }
                    className="absolute cursor-pointer bg-white text-text-clr flex items-center justify-center gap-2 bottom-2 left-2 right-2 text-center text-[13px] rounded-lg p-2"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.serve }} />{" "}
                    {matchesReq.response?.p2?.firstName ??
                      matchesReq.response?.p2Name}{" "}
                    {matchesReq.response?.p2?.lastName}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div
            style={{ writingMode: "vertical-lr" }}
            className="flex justify-center items-center bg-green-2 rounded-md mode-rtl"
          >
            {matchesReq.response?.p1?.firstName}{" "}
            {matchesReq.response?.p1?.lastName}
          </div>
          <div className="relative grid gap-2 *:bg-green-1 grid-cols-2 grid-rows-[50px_1fr_50px]">
            {matchTrackerStore.serving ===
              (matchesReq.response?.p2?._id || matchesReq.response?.p2Name) && (
              <ServeResult onSelect={(result) => console.log(result)} />
            )}
            <div className="col-span-2"></div>
            <div></div>
            <div></div>
            <div className="col-span-2"></div>
          </div>
          <div className="relative grid gap-2 *:bg-blue-10 grid-cols-2 grid-rows-[50px_1fr_50px]">
            {matchTrackerStore.serving === matchesReq.response?.p1?._id && (
              <ServeResult onSelect={(result) => console.log(result)} />
            )}
            <div className="col-span-2"></div>
            <div></div>
            <div className="relative">
              {matchTrackerStore.serving ===
                (matchesReq.response?.p2?._id ||
                  matchesReq.response?.p2Name) && (
                <i
                  className="absolute-center"
                  dangerouslySetInnerHTML={{ __html: icons.serving }}
                />
              )}
            </div>
            <div className="col-span-2"></div>
          </div>
          <div
            style={{ writingMode: "vertical-lr" }}
            className="bg-secondary text-white rounded-md flex justify-center items-center"
          >
            {matchesReq.response?.p2?.firstName ?? matchesReq.response?.p2Name}{" "}
            {matchesReq.response?.p2?.lastName}
          </div>
        </div>
      </div>
    </>
  );
}
