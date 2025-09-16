import type { User } from "./store/auth.store";

interface Action {
  description: string;
  date: string;
  isDone: boolean;
  _id: string;
}

interface Obstacle {
  description: string;
  isOvercome: boolean;
  _id: string;
}

export type GoalType =
  | "physical"
  | "mental"
  | "technical"
  | "tactical"
  | "nutrition";

export type FieldType =
  | "physical"
  | "technical"
  | "psychological"
  | "tactical"
  | "nutrition"
  | "recovery";

export type GoalTerm = "short" | "long" | "medium";
export interface Goal {
  goal: GoalType;
  term: GoalTerm;
  description: string;
  measurement: string;
  achievementDate: string;
  actions: Action[];
  obstacles: Obstacle[];
  addOns?: string;
  _id: string;
  progress?: any[];
}

export interface AsyncResponse<T = any> {
  status?: number;
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PersonalAchievement {
  _id: string;
  title: string;
  description: string;
  achievedOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAchievementRequest {
  title: string;
  description: string;
  achievedOn: string;
}

export interface UpdateAchievementRequest {
  title?: string;
  description?: string;
  achievedOn?: string;
}

export type Player = {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  avatar: string;
};

export interface Match {
  _id: string;
  p1: Player;
  p2: Player;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p2Name: string;
  matchCreator: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role: string;
  };
  matchType: string;
  matchCategory: string;
  status: "pending" | "completed" | "in_progress" | string;
  totalGameTime: number;
  tieBreakRule: number;
  indoor: boolean;
  courtSurface: string;
  note: string;
  date: string;
  startTime?: string; // ISO date string when the match was started
  p1Status: string;
  p2Status: string;
  winner: string | null;
  sets: MatchSet[];
  createdAt: string;
  updatedAt: string;
}
export type PlayerType = "playerOne" | "playerTwo";

export type Reaction =
  | "noResponse"
  | "negativeSelfTalk"
  | "positiveSelfTalk"
  | "positiveResponse"
  | "negativeResponse";

export type ServePlacement = "wide" | "body" | "t" | "net";
export type ShotPlacement = "downTheLine" | "crossCourt" | null;
export type MissedShotType = "net" | "long" | "wide" | "let";
export type MissedShotWay =
  | "forehand"
  | "backhand"
  | "forehandSlice"
  | "backhandSlice"
  | "forehandDropShot"
  | "backhandDropShot"
  | "overhead"
  | "volley";

export type PointType =
  | "ace"
  | "doubleFault"
  | "returnError"
  | "returnWinner"
  | "p1UnforcedError"
  | "p2UnforcedError"
  | "p1ForcedError"
  | "p2ForcedError"
  | "forcedReturnError";

export type RalliesRange =
  | "oneToFour"
  | "fiveToEight"
  | "nineToTwelve"
  | "thirteenToTwenty"
  | "twentyOnePlus";

export interface ScorePoint {
  p1Score: string;
  p2Score: string;
  isSecondService: boolean;
  p1Reaction: Reaction;
  p2Reaction: Reaction;
  type: PointType;
  missedShot: MissedShotType;
  placement: ShotPlacement;
  missedShotWay: MissedShotWay;
  servePlacement: ServePlacement;
  betweenPointDuration: number;
  rallies: RalliesRange;
}

export interface Game {
  gameNumber: number;
  scores: ScorePoint[];
  winner: PlayerType;
  changeoverDuration: number;
  server: PlayerType;
  _id: string;
}

export interface ServiceStats {
  totalServices: number;
  firstServicePercentage: number;
  secondServicePercentage: number;
  aces: number;
  doubleFaults: number;
  firstServices: number;
  secondServices: number;
}

export interface PointsStats {
  totalPointsWon: number;
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
}

export interface RalliesStats {
  oneToFour: number;
  fiveToEight: number;
  nineToTwelve: number;
  thirteenToTwenty: number;
  twentyOnePlus: number;
}

export interface ConversionStats {
  firstServicePointsWon: number;
  secondServicePointsWon: number;
  receivingPointsWon: number;
  breakPoints: number;
  gamePoints: number;
}

export interface ResponseStats {
  negativeResponses: number;
  positiveResponses: number;
  negativeSelfTalks: number;
  positiveSelfTalks: number;
  noResponses: number;
}

export interface SetReport {
  service: ServiceStats;
  points: PointsStats;
  rallies: RalliesStats;
  conversion: ConversionStats;
  response: ResponseStats;
  _id: string;
}

export interface MatchSet {
  p1TotalScore: number;
  p2TotalScore: number;
  winner: PlayerType;
  p1TotalReturns: number;
  p2TotalReturns: number;
  games: Game[];
  p1SetReport: SetReport;
  p2SetReport: SetReport;
  _id: string;
}
export const Status = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
} as const;

export const PaymentStatus = {
  REQUESTED: "Requested",
  PROCESSED: "Processed",
  CHECKED: "Checked",
  APPROVED: "Approved",
  AUTHORIZED: "Authorized",
} as const;

export type Query = Record<string, any>;



export interface LoginPayload {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: string;
    userAgent: string;
    ipAddress?: string;
  };
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: User;
    tokens: { accessToken: string; refreshToken: string };
    session: {
      sessionId: string; // API returns sessionId, not _id
      deviceInfo: {
        deviceId: string;
        platform: string;
        userAgent: string;
      };
      expiresAt: string;
    };
    nextStep: string;
  };
}

export interface Session {
  _id: string;
  deviceInfo: {
    deviceId: string;
    platform: string;
    userAgent: string;
  };
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  createdBy: string;
}

export interface SessionsResponse {
  status: string;
  message: string;
  data: {
    sessions: Session[];
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  phoneNumberCountryCode: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  country: string;
  zipCode: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: string;
  };
}
