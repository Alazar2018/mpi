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

type RallyResult =
  | "Winner"
  | "Return Play"
  | "Forced Error"
  | "Unforced Error"
  | "Double Bounce";
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
  type = "Serve",
  onSelect,
}: {
  type: "Serve" | "Rally";
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
        {type == "Serve" && (
          <>
            <div data-value="Ace" tabIndex={0}>
              Ace
            </div>
            <div data-value="Serve In - Return Play" tabIndex={0}>
              Serve In - Return Play
            </div>
            <div data-value="First Serve Fault" tabIndex={0}>
              First Serve Fault
            </div>
            <div data-value="Serve In - Return Out (forced)" tabIndex={0}>
              Serve In - Return Out (forced)
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
          </>
        )}
        {type == "Rally" && (
          <>
            <div data-value="Winner" tabIndex={0}>
              Winner
            </div>
            <div data-value="Return Play" tabIndex={0}>
              Return Play
            </div>
            <div data-value="Forced Error" tabIndex={0}>
              Forced Error
            </div>
            <div data-value="Unforced Error" tabIndex={0}>
              Unforced Error
            </div>
            <div data-value="Double Bounce" tabIndex={0}>
              Double Bounce
            </div>
          </>
        )}
      </div>
    </FocusTrap>
  );
}

function ShotPlacement({
  type,
  onSelect,
}: {
  type: "Bad" | "Good";
  onSelect: (result: GoodShotPlacement | BadShotPlacement | null) => void;
}) {
  return (
    <div
      onClick={(ev: React.MouseEvent<HTMLDivElement>) => {
        const val = (ev.target as HTMLDivElement)?.dataset?.value as
          | GoodShotPlacement
          | BadShotPlacement;
        if (val) {
          onSelect?.(val);
        }
      }}
      className="flex flex-col p-2 h-full overflow-y-auto gap-2 absolute inset-0 rounded-md !bg-white"
    >
      <span>Shot Placement</span>
      <FocusTrap className="*:flex p-2 *:p-2 *:justify-center border border-gray-1 rounded-md *:items-center gap-2 *:bg-gray-1  grid grid-cols-2 grid-rows-4">
        {type == "Good" && (
          <>
            <div data-value="Down The Line" tabIndex={0}>
              Down The Line
            </div>
            <div data-value="Cross Court" tabIndex={0}>
              Cross Court
            </div>
            <div data-value="Drop Shot" tabIndex={0}>
              Drop Shot
            </div>
          </>
        )}
        {type == "Bad" && (
          <>
            <div data-value="Net" tabIndex={0}>
              Net
            </div>
            <div data-value="Wide" tabIndex={0}>
              Wide
            </div>
            <div data-value="Long" tabIndex={0}>
              Long
            </div>
          </>
        )}
      </FocusTrap>
    </div>
  );
}

function ShotType({
  onSelect,
}: {
  onSelect: (result: ShotType | null) => void;
}) {
  return (
    <div
      onClick={(ev: React.MouseEvent<HTMLDivElement>) => {
        const val = (ev.target as HTMLDivElement)?.dataset?.value as ShotType;
        if (val) {
          onSelect?.(val);
        }
      }}
      className="flex flex-col p-2 gap-2 absolute inset-0 rounded-md !bg-white"
    >
      <span>Shot Type</span>
      <FocusTrap className="max-h-max border border-gray-1 rounded-md *:flex p-2 *:h-10 *:bg-gray-1 *:justify-center *:items-center gap-2 grid grid-cols-2 grid-rows-6">
        <div data-value="Forehand" tabIndex={0}>
          Forehand
        </div>
        <div data-value="Backhand" tabIndex={0}>
          Backhand
        </div>
        <div data-value="Forhand Volley" tabIndex={0}>
          Forhand Volley
        </div>
        <div data-value="Backhand Volley" tabIndex={0}>
          Backhand Volley
        </div>
        <div data-value="Forhand Swinging Volley" tabIndex={0}>
          Forhand Swinging Volley
        </div>
        <div data-value="Backhand Swinging Volley" tabIndex={0}>
          Backhand Swinging Volley
        </div>
        <div data-value="Forhand Slice" tabIndex={0}>
          Forhand Slice
        </div>
        <div data-value="Backhand Slice" tabIndex={0}>
          Backhand Slice
        </div>
        <div data-value="OverHead" tabIndex={0}>
          OverHead
        </div>
        <div data-value="Forhand Drop Shot" tabIndex={0}>
          Forhand Drop Shot
        </div>
        <div data-value="Backhand Drop Shot" tabIndex={0}>
          Backhand Drop Shot
        </div>
      </FocusTrap>
    </div>
  );
}

type Rally = {
  shotType: string;
  shotPlacement: string;
  rally: number;
  returnOutcome: RallyResult | null;
};

type Result = {
  serveOutCome: string;
  player1Reaction: string;
  player2Reaction: string;
  rallys: Rally[];
  setRally: (key: keyof Rally, value: string) => void;
  setResult: (key: keyof Result, value: string) => void;
};

function Tracking({
  tracker,
}: {
  tracker: (result: Result & { rally: Rally }) => React.ReactNode;
}) {
  const [result, setResult] = useState<Result>({
    serveOutCome: "",
    player1Reaction: "",
    player2Reaction: "",
    rallys: [
      {
        shotType: "",
        shotPlacement: "",
        rally: 0,
        returnOutcome: null,
      },
    ],
    setResult: (key: keyof Result, value: string) => {
      console.log(key, value);
      setResult({
        ...result,
        [key]: value,
      });
    },
    setRally(key: keyof Rally, value: string) {
      setResult({
        ...result,
        rallys: [
          ...result.rallys,
          {
            ...result.rallys[result.rallys.length - 1],
            [key]: value,
          },
        ],
      });
    },
  });

  const thisRally = result.rallys[result.rallys.length - 1];

  return tracker({ ...result, rally: thisRally });
}

type Point = {
  serveOutCome: ServeResult | null;
  winner: string;
  firstServeFault: boolean;
  doubleFault: boolean;
  let: boolean;
  footFault: boolean;
  rallys: Rally[];
};

function Progress({ setPoint, players }: { players: {player1: string, player2: string}, setPoint: (point: Point) => void }) {
  const [active, setActive] = useState<
    "serveOutCome" | "shotType" | "shotPlacement"
  >("serveOutCome");
  const [result, setResult] = useState<Point>({
    serveOutCome: null,
    winner: "",
    firstServeFault: false,
    doubleFault: false,
    let: false,
    footFault: false,
    rallys: [],
  });

  useEffect(() => {
    setResult({
      serveOutCome: null,
      winner: "",
      firstServeFault: false,
      doubleFault: false,
      let: false,
      footFault: false,
      rallys: [],
    })
  }, [players])

  function selectServeResult(res: ServeResult | RallyResult | null) {
    if (!result.serveOutCome) {
      setResult({
        ...result,
        serveOutCome: res as ServeResult,
      });
    } else {
      setResult({
        ...result,
        rallys: [
          ...result.rallys,
          {
            returnOutcome: res as RallyResult,
            shotType: "",
            shotPlacement: "",
            rally: 0,
          },
        ],
      });
    }

    if (
      ["First Serve Fault", "Double Fault", "Let", "Foot Fault"].includes(
        res as string
      )
    ) {
      setResult({
        ...result,
        firstServeFault: res == "First Serve Fault",
        doubleFault: res == "Double Fault",
        let: res == "Let",
        footFault: res == "Foot Fault",
      });
    } else if (
      result.rallys?.[result.rallys.length - 1]?.returnOutcome &&
      result.rallys[result.rallys.length - 1].returnOutcome != "Return Play"
    ) {
      setResult({
        ...result,
        winner: result.rallys.length % 2 == 0 ? players.player1 : players.player2
      });
      setPoint({
        ...result,
        winner: result.rallys.length % 2 == 0 ? players.player1 : players.player2
      });
    }

    if (res == "Serve In - Return Play" || res == "Return Play") {
      setActive("shotType");
    } else if ("Ace" == (res as string)) {
      setPoint({
        ...result,
        winner: players.player1
      });
    } else if (res == "Double Bounce") {
      setPoint({
        ...result,
        winner: result.rallys.length % 2 == 0 ? players.player1 : players.player2
      });
    }
  }

  function setShotType(res: ShotType | null) {
    console.log(res);
    if (result.rallys.length > 0) {
      result.rallys.splice(result.rallys.length - 1, 1, {
        ...result.rallys[result.rallys.length - 1],
        shotType: res as string,
      });

      setResult(result);
    } else {
      setResult({
        ...result,
        rallys: [
          ...result.rallys,
          {
            shotType: res as string,
            shotPlacement: "",
            rally: 0,
            returnOutcome: null,
          },
        ],
      });
    }
    setActive("shotPlacement");
  }

  function setShotPlacement(res: GoodShotPlacement | BadShotPlacement | null) {
    if (result.rallys.length > 0) {
      result.rallys.splice(result.rallys.length - 1, 1, {
        ...result.rallys[result.rallys.length - 1],
        shotPlacement: res as string,
      });
      setResult(result);
    } else {
      setResult({
        ...result,
        rallys: [
          ...result.rallys,
          {
            shotPlacement: res as string,
            shotType: "",
            rally: 0,
            returnOutcome: null,
          },
        ],
      });
    }
    setActive("serveOutCome");
  }

  return (
    <>
      {active == "serveOutCome" && (
        <ServeResult
          type={!result.serveOutCome ? "Serve" : "Rally"}
          onSelect={selectServeResult}
        />
      )}
      {active == "shotType" && <ShotType onSelect={setShotType} />}
      {active == "shotPlacement" && (
        <ShotPlacement
          onSelect={setShotPlacement}
          type={
            [
              result.serveOutCome ||
                result.rallys[result.rallys.length - 1].returnOutcome,
            ].includes("Serve In - Return Play")
              ? "Good"
              : "Bad"
          }
        />
      )}
    </>
  );
}

export default function MatchTracker() {
  const params = useParams<{ matchId: string }>();
  const matchTrackerStore = useMatchTrackerStore();
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
              <Tracking
                tracker={(result) => {
                  return (
                    <>
                      <Progress
                        players={{
                          player1: (matchTrackerStore.serving == (matchesReq.response?.p2?._id || matchesReq.response?.p2Name) ? (matchesReq.response?.p2?._id || matchesReq.response?.p2Name) : matchesReq.response?.p1?._id) as string,
                          player2: (matchTrackerStore.serving != (matchesReq.response?.p2?._id || matchesReq.response?.p2Name) ? (matchesReq.response?.p2?._id || matchesReq.response?.p2Name) : matchesReq.response?.p1?._id) as string,
                        }}
                        setPoint={(point) => {
                          console.log(point);
                        }}
                      />
                    </>
                  );
                }}
              />
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
