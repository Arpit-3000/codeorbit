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

// ==================== BADGES ====================

export interface Badge {
  name: string;
  icon: string;
  platform: string;
}

export interface BadgesData {
  badges: Badge[];
  hasBadges: boolean;
}

export const getBadges = async (): Promise<BadgesData> => {
  const res = await api.get("/analytics/badges");
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

// ==================== PROBLEMS ====================

export interface Problem {
  id: string
  title: string
  titleSlug?: string
  timestamp: string
  status?: string
  language: string
  runtime?: string
  memory?: string
  link: string
  platform: string
  contestId?: number
  index?: string
  rating?: number
  tags?: string[]
}

export interface AllProblemsData {
  problems: Problem[]
  totalProblems: number
  platformStats: {
    leetcode: {
      total: number
      connected: boolean
    }
    codeforces: {
      total: number
      connected: boolean
    }
  }
  message: string
}

export interface PlatformProblemsData {
  problems: Problem[]
  total: number
  platform: string
}

export const getAllProblems = async (): Promise<AllProblemsData> => {
  const res = await api.get("/problems/all")
  return res.data
}

export const getLeetCodeProblems = async (): Promise<PlatformProblemsData> => {
  const res = await api.get("/problems/leetcode")
  return res.data
}

export const getCodeforcesProblems = async (): Promise<PlatformProblemsData> => {
  const res = await api.get("/problems/codeforces")
  return res.data
}

// ==================== CONTESTS ====================

export interface Contest {
  _id?: string;
  platform: string;
  name: string;
  startTime: string;
  duration: number;
  link: string;
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

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  lastSyncedAt: string;
  platforms: {
    leetcode: {
      username: string;
      verified: boolean;
      totalSolved: number;
      contestRating: number;
      contestsPlayed: number;
    } | null;
    codeforces: {
      handle: string;
      rating: number;
      maxRating: number;
      rank: string;
      solvedProblems: number;
      contestsPlayed: number;
    } | null;
    github: {
      username: string;
      avatar: string;
      followers: number;
      publicRepos: number;
      totalStars: number;
      totalContributions: number;
    } | null;
    codechef: {
      username: string;
      rating: number;
      highestRating: number;
      stars: string;
      globalRank: number;
      countryRank: number;
    } | null;
    gfg: {
      username: string;
      score: number;
      problemsSolved: number;
      codingScore: number;
    } | null;
  };
  stats: {
    activeDays: number;
    consistencyScore: number;
  };
}

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const res = await api.get("/profile/me");
  return res.data;
};

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

export interface ConnectCodeChefResponse {
  message: string;
}

export const connectCodeChef = async (username: string): Promise<ConnectCodeChefResponse> => {
  const res = await api.post("/codechef/connect", { username });
  return res.data;
};

export interface ConnectGFGResponse {
  message: string;
}

export const connectGFG = async (username: string): Promise<ConnectGFGResponse> => {
  const res = await api.post("/gfg/connect", { username });
  return res.data;
};

// ==================== AI RECOMMENDATIONS ====================

export interface AIAnalysis {
  dominantTopics: string[]
  currentDifficultyLevel: string
  solvingPattern: string
  identifiedGaps: string[]
}

export interface AIRecommendation {
  title: string
  platform: string
  difficulty: string
  topics: string[]
  reasoning: string
  priority: string
  estimatedTime: string
  learningObjective: string
  link?: string // Optional direct link to the problem
}

export interface LearningPath {
  currentFocus: string
  nextMilestone: string
  suggestedStudyOrder: string[]
}

export interface AIRecommendationsData {
  success: boolean
  analysis: AIAnalysis
  recommendations: AIRecommendation[]
  learningPath: LearningPath
  basedOnProblems: number
  generatedAt: string
  message: string
}

export interface DifficultyProgressionData {
  success: boolean
  platform: string
  currentLevel: string
  nextLevel: string
  suggestions: string[]
  message: string
}

// ==================== LEARNING PATH SUGGESTIONS ====================

export interface LearningPhase {
  phase: string
  duration: string
  focus: string
  topics: string[]
  goals: string[]
  milestones: string[]
}

export interface DetailedLearningPath {
  currentLevel: string
  totalPhases: number
  estimatedDuration: string
  phases: LearningPhase[]
  nextSteps: string[]
  recommendedResources: string[]
}

export interface LearningPathUserProfile {
  totalSolved: number
  leetcodeRating: number
  codeforcesRating: number | null
  platforms: string[]
  dominantTopics: string[]
}

export interface LearningPathAnalysis {
  dominantTopics: string[]
  currentDifficultyLevel: string
  totalProblemsAnalyzed: number
  platformDistribution: string[]
  topicDistribution: Array<{
    topic: string
    count: number
  }>
}

export interface LearningPathSuggestionsData {
  success: boolean
  learningPath: DetailedLearningPath
  userProfile: LearningPathUserProfile
  analysis: LearningPathAnalysis
  generatedAt: string
  dataSource: string
  message: string
}

export const getAIRecommendations = async (): Promise<AIRecommendationsData> => {
  const res = await api.get("/recommendations/ai")
  return res.data
}

export const getDifficultyProgression = async (platform?: string): Promise<DifficultyProgressionData> => {
  const url = platform ? `/recommendations/difficulty-progression?platform=${platform}` : "/recommendations/difficulty-progression"
  const res = await api.get(url)
  return res.data
}

export const getLearningPathSuggestions = async (): Promise<LearningPathSuggestionsData> => {
  const res = await api.get("/recommendations/learning-path")
  return res.data
}

// ==================== SYNC ====================

export interface SyncResponse {
  message: string;
  results: {
    leetcode: any;
    codeforces: any;
    github: any;
    codechef: any;
    gfg: any;
    activityDaysAdded: number;
  };
  totalActivityDays: number;
  lastSyncedAt: string;
}

export const syncAllPlatforms = async (): Promise<SyncResponse> => {
  const res = await api.post("/sync/all");
  return res.data;
};
