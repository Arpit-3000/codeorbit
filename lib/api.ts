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
  github?: {
    username: string;
    avatar: string;
    followers: number;
    following: number;
    publicRepos: number;
    totalStars: number;
    totalContributions: number;
    contributionGraph?: any[];
  };
  activityDaysAdded?: number;
}

// Old method - DEPRECATED (kept for backward compatibility)
export const connectGithub = async (username: string): Promise<ConnectGithubResponse> => {
  const res = await api.post("/github/connect", { username });
  return res.data;
};

// ✅ NEW: GitHub OAuth Methods
export const connectGithubOAuth = async (code: string): Promise<ConnectGithubResponse> => {
  const res = await api.post("/github/oauth/callback", { code });
  return res.data;
};

export const disconnectGithub = async () => {
  const res = await api.post("/github/disconnect");
  return res.data;
};

export const refreshGithub = async (): Promise<ConnectGithubResponse> => {
  const res = await api.post("/github/refresh");
  return res.data;
};

// ✅ Check GitHub connection status
export const getGithubStatus = async () => {
  const res = await api.get("/github/status");
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

export interface PlatformSyncResponse {
  success: boolean;
  platform: string;
  [key: string]: any;
}

export const syncAllPlatforms = async (): Promise<SyncResponse> => {
  const res = await api.post("/sync/all");
  return res.data;
};

export const syncLeetCode = async (): Promise<PlatformSyncResponse> => {
  const res = await api.post("/sync/leetcode");
  return res.data;
};

export const syncCodeforces = async (): Promise<PlatformSyncResponse> => {
  const res = await api.post("/sync/codeforces");
  return res.data;
};

export const syncGithub = async (): Promise<PlatformSyncResponse> => {
  const res = await api.post("/sync/github");
  return res.data;
};

export const syncCodeChef = async (): Promise<PlatformSyncResponse> => {
  const res = await api.post("/sync/codechef");
  return res.data;
};

export const syncGFG = async (): Promise<PlatformSyncResponse> => {
  const res = await api.post("/sync/gfg");
  return res.data;
};


// ==================== SOCIAL FEATURES ====================

// Users
export interface SearchUser {
  _id: string;
  displayName: string;
  username: string;
  uniqueId?: string;
  email: string;
  photoURL?: string;
  profileImage?: string;
  bio?: string;
  onlineStatus: boolean;
}

export interface UserSearchData {
  users: SearchUser[];
}

export const searchUsers = async (query: string): Promise<UserSearchData> => {
  const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const getUserByUsername = async (username: string) => {
  const res = await api.get(`/users/${username}`);
  return res.data;
};

export const getUserSuggestions = async () => {
  const res = await api.get('/users/suggestions');
  return res.data;
};

export const getMutualFriends = async (userId: string) => {
  const res = await api.get(`/users/mutual/${userId}`);
  return res.data;
};

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  accountType?: 'public' | 'private';
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
  };
  profileImage?: string;
  bannerImage?: string;
}

export const updateUserProfile = async (data: UpdateProfileData) => {
  const res = await api.patch('/users/profile', data);
  return res.data;
};

// Friends
export const sendFriendRequest = async (userId: string) => {
  const res = await api.post(`/friends/request/${userId}`);
  return res.data;
};

export const cancelFriendRequest = async (userId: string) => {
  const res = await api.post(`/friends/cancel/${userId}`);
  return res.data;
};

export const acceptFriendRequest = async (userId: string) => {
  const res = await api.post(`/friends/accept/${userId}`);
  return res.data;
};

export const rejectFriendRequest = async (userId: string) => {
  const res = await api.post(`/friends/reject/${userId}`);
  return res.data;
};

export const removeFriend = async (userId: string) => {
  const res = await api.delete(`/friends/remove/${userId}`);
  return res.data;
};

export const getFriendsList = async () => {
  const res = await api.get('/friends/list');
  return res.data;
};

export const getFriendRequests = async () => {
  const res = await api.get('/friends/requests');
  return res.data;
};

export const getFollowers = async (userId: string) => {
  const res = await api.get(`/friends/followers/${userId}`);
  return res.data;
};

export const getFollowing = async (userId: string) => {
  const res = await api.get(`/friends/following/${userId}`);
  return res.data;
};

// Notifications
export interface Notification {
  _id: string;
  sender: {
    _id: string;
    displayName: string;
    username: string;
    photoURL?: string;
    profileImage?: string;
  };
  receiver: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

export const getNotifications = async (limit = 50, skip = 0): Promise<NotificationsData> => {
  const res = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
  return res.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.patch('/notifications/read-all');
  return res.data;
};

export const deleteNotification = async (notificationId: string) => {
  const res = await api.delete(`/notifications/${notificationId}`);
  return res.data;
};

export const getUnreadNotificationCount = async () => {
  const res = await api.get('/notifications/unread-count');
  return res.data;
};

// Ping
export interface PingRequest {
  _id: string;
  sender: {
    _id: string;
    displayName: string;
    username: string;
    photoURL?: string;
    profileImage?: string;
  };
  receiver: string;
  status: string;
  message?: string;
  roomId?: string;
  createdAt: string;
  expiresAt: string;
}

export const sendPingRequest = async (userId: string, message?: string) => {
  const res = await api.post(`/ping/send/${userId}`, { message });
  return res.data;
};

export const acceptPingRequest = async (pingId: string) => {
  const res = await api.post(`/ping/accept/${pingId}`);
  return res.data;
};

export const rejectPingRequest = async (pingId: string) => {
  const res = await api.post(`/ping/reject/${pingId}`);
  return res.data;
};

export const getPendingPings = async () => {
  const res = await api.get('/ping/pending');
  return res.data;
};

// Rooms
export interface Room {
  _id: string;
  roomId: string;
  participants: Array<{
    _id: string;
    displayName: string;
    username: string;
    photoURL?: string;
    profileImage?: string;
    onlineStatus: boolean;
  }>;
  createdBy: {
    _id: string;
    displayName: string;
    username: string;
  };
  active: boolean;
  streamChannelId?: string;
  createdAt: string;
  closedAt?: string;
}

export const getUserRooms = async () => {
  const res = await api.get('/rooms/user/me');
  return res.data;
};

export const getRoomById = async (roomId: string) => {
  const res = await api.get(`/rooms/${roomId}`);
  return res.data;
};

export const closeRoom = async (roomId: string) => {
  const res = await api.post(`/rooms/${roomId}/close`);
  return res.data;
};

export const saveCanvasData = async (roomId: string, strokes: any[]) => {
  const res = await api.post(`/rooms/${roomId}/canvas`, { strokes });
  return res.data;
};

export const getCanvasData = async (roomId: string) => {
  const res = await api.get(`/rooms/${roomId}/canvas`);
  return res.data;
};

// Stream
export const getStreamToken = async () => {
  const res = await api.get('/stream/token');
  return res.data;
};

export const initializeStreamUser = async () => {
  const res = await api.post('/stream/initialize');
  return res.data;
};
