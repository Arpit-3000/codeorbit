import api from "./api-client";

// ==================== DASHBOARD ====================

export interface DashboardStats {
  currentStreak: number;
  activeDays: number;
  longestStreak: number;
  consistency: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/analytics/dashboard-stats");
  return res.data;
};

// ==================== ANALYTICS ====================

export interface ConsistencyData {
  consistencyScore: number;
}

export const getConsistencyScore = async (): Promise<ConsistencyData> => {
  const res = await api.get("/analytics/consistency");
  return res.data;
};

export interface WeeklyTrend {
  day: string;
  problems: number;
}

export interface WeeklyActivityData {
  weeklyTrend: WeeklyTrend[];
}

export const getWeeklyActivity = async (): Promise<WeeklyActivityData> => {
  const res = await api.get("/analytics/weekly-activity");
  return res.data;
};

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface HeatmapData {
  heatmap: HeatmapDay[];
}

export const getHeatmap = async (): Promise<HeatmapData> => {
  const res = await api.get("/analytics/heatmap");
  return res.data;
};

export interface PlatformComparisonItem {
  platform: string;
  solved: number;
  rating: number;
  activity: number;
}

export interface PlatformComparisonData {
  comparison: PlatformComparisonItem[];
}

export const getPlatformComparison = async (): Promise<PlatformComparisonData> => {
  const res = await api.get("/analytics/platform-comparison");
  return res.data;
};

// ==================== PROBLEM STATS ====================

export interface ProblemStatsData {
  platformBreakdown: Array<{
    platform: string;
    value: number;
    color: string;
  }>;
  totalSolved: number;
  difficultyData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const getProblemStats = async (): Promise<ProblemStatsData> => {
  const res = await api.get("/analytics/problem-stats");
  return res.data;
};

// ==================== CONTEST RATINGS ====================

export interface ContestRatingsData {
  currentRatings: {
    leetcode: number | null;
    codeforces: number | null;
    codechef: number | null;
  };
  hasData: boolean;
}

export const getContestRatings = async (): Promise<ContestRatingsData> => {
  const res = await api.get("/analytics/contest-ratings");
  return res.data;
};

// ==================== LEADERBOARD ====================

export interface LeaderboardUser {
  _id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  avatar: string | null;
  leetcodeSolved: number;
  cfRating: number;
  githubStars: number;
  score: number;
}

export interface LeaderboardData {
  page: number;
  users: LeaderboardUser[];
}

export const getLeaderboard = async (page: number = 1): Promise<LeaderboardData> => {
  const res = await api.get(`/leaderboard?page=${page}`);
  return res.data;
};

// ==================== CONTESTS ====================

export interface Contest {
  _id: string;
  platform: string;
  name: string;
  startTime: string;
  duration: number;
  url: string;
}

export interface ContestsData {
  contests: Contest[];
}

export const getContests = async (): Promise<ContestsData> => {
  const res = await api.get("/contests");
  return res.data;
};

// ==================== RESOURCES ====================

export interface Resource {
  _id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  problems: number;
}

export interface ResourcesData {
  resources: Resource[];
}

export const getResources = async (): Promise<ResourcesData> => {
  const res = await api.get("/resources");
  return res.data;
};

// ==================== PROFILE ====================

export interface PublicProfile {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  leetcode?: any;
  codeforces?: any;
  github?: any;
  activity: Array<{ date: string; count: number }>;
}

export const getPublicProfile = async (email: string): Promise<PublicProfile> => {
  const res = await api.get(`/profile/${email}`);
  return res.data;
};

// ==================== PLATFORM CONNECTIONS ====================

export interface ConnectLeetCodeResponse {
  message: string;
  verificationCode: string;
}

export const connectLeetCode = async (username: string): Promise<ConnectLeetCodeResponse> => {
  const res = await api.post("/leetcode/connect", { username });
  return res.data;
};

export interface VerifyLeetCodeResponse {
  message: string;
  verified: boolean;
}

export const verifyLeetCode = async (): Promise<VerifyLeetCodeResponse> => {
  const res = await api.post("/leetcode/verify");
  return res.data;
};

export interface ConnectCodeforcesResponse {
  message: string;
}

export const connectCodeforces = async (handle: string): Promise<ConnectCodeforcesResponse> => {
  const res = await api.post("/codeforces/connect", { handle });
  return res.data;
};

export interface ConnectGithubResponse {
  message: string;
}

export const connectGithub = async (username: string): Promise<ConnectGithubResponse> => {
  const res = await api.post("/github/connect", { username });
  return res.data;
};

// ==================== SYNC ====================

export interface SyncResponse {
  message: string;
  results: {
    leetcode: any;
    codeforces: any;
    github: any;
    activityDaysAdded: number;
  };
  totalActivityDays: number;
  lastSyncedAt: string;
}

export const syncAllPlatforms = async (): Promise<SyncResponse> => {
  const res = await api.post("/sync/all");
  return res.data;
};
