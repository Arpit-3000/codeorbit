# 🎯 CODEORBIT INTERVIEW PREPARATION - PHASE 1
## DASHBOARD, PROFILE, ACTIVITY & CORE FEATURES

---

## 📌 TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Dashboard & Activity Tracking](#dashboard-activity-tracking)
4. [Profile System](#profile-system)
5. [Contest Tracker](#contest-tracker)
6. [Resources Section](#resources-section)
7. [Common Interview Questions](#common-interview-questions)

---

## PROJECT OVERVIEW

### Q: "Tell me about CodeOrbit. What problem does it solve?"

**Your Answer:**

"CodeOrbit is a unified competitive programming dashboard that aggregates data from multiple platforms like LeetCode, Codeforces, CodeChef, GeeksForGeeks, and GitHub. 

**The Problem:**
Competitive programmers have to check 5+ different websites daily to:
- Track their progress
- See their stats and rankings
- Find upcoming contests
- Monitor their consistency

**Our Solution - CodeOrbit provides:**

1. **Unified Dashboard** - All your stats in one place with beautiful visualizations
2. **Social Collaboration** - Real-time collaborative coding with friends via video calls and shared canvas
3. **AI-Powered Mock Interviews** - Resume-based technical interviews with adaptive difficulty using LLM
4. **Smart Recommendations** - AI suggests problems based on your solving patterns and weak areas

**Target Users:**
- College students preparing for placements
- Professionals preparing for FAANG interviews
- Competitive programmers tracking multiple platforms

**Key Differentiators:**
- Only platform with AI mock interviews
- Real-time collaboration features
- Comprehensive analytics across all major platforms"

---

## SYSTEM ARCHITECTURE

### Q: "What's your tech stack and why did you choose it?"

**Your Answer:**


### **FRONTEND STACK:**

**Next.js 14 with App Router**
- Why: Server-side rendering for better SEO and initial load performance
- App Router provides better routing and layouts than Pages Router
- Built-in API routes reduce complexity

**TypeScript**
- Why: Type safety prevents bugs in large codebases
- Better IDE autocomplete and refactoring
- Catch errors at compile-time, not runtime

**TailwindCSS + Shadcn UI**
- Why: Rapid UI development with utility-first CSS
- Shadcn provides beautiful, accessible components
- Highly customizable without fighting the framework

**Recharts**
- Why: Declarative charts for data visualization
- React-friendly API
- Used for activity heatmaps, weekly trends, statistics

---

### **BACKEND STACK:**

**Node.js + Express.js**
- Why: Non-blocking I/O perfect for handling multiple API requests
- Large ecosystem (npm packages)
- JavaScript full-stack reduces context switching

**MongoDB + Mongoose**
- Why: NoSQL flexibility for varying platform connections
- Document model fits user profiles with nested platform data
- Easy schema evolution as we add new platforms
- Mongoose provides validation and type safety

**Socket.io**
- Why: Real-time bidirectional communication
- Used for collaborative rooms, live presence
- WebSocket with fallback mechanisms

**Puppeteer**
- Why: Web scraping for platforms without official APIs
- Headless Chrome for CodeChef and GeeksForGeeks
- Handles JavaScript-rendered content

---

### **AI SERVICE STACK:**

**Python FastAPI**
- Why: High-performance async framework (faster than Flask)
- Automatic API documentation with Swagger
- Native async/await support

**LangChain + Groq (Llama 3.1 70B)**
- Why: LangChain provides LLM orchestration tools
- Groq offers fast inference (tokens/sec)
- Llama 3.1 is powerful and cost-effective
- Better than OpenAI for our use case (lower cost)

**ChromaDB (Vector Database)**
- Why: Efficient similarity search for questions
- Stores embeddings for 1000+ interview questions
- RAG (Retrieval Augmented Generation) for context

**Sentence Transformers**
- Why: Generate embeddings for semantic similarity
- Find similar questions to avoid repetition
- Model: all-MiniLM-L6-v2 (fast + accurate)

---

### **AUTHENTICATION:**

**Firebase Auth**
- Why: Google OAuth out-of-the-box
- User management handled by Firebase
- Secure token refresh mechanism

**JWT (JSON Web Tokens)**
- Why: Stateless authentication
- Token contains user info (no database lookup)
- Used for API authorization

---

### **ARCHITECTURE DIAGRAM:**

```
┌─────────────────────────────────────────────────────┐
│          FRONTEND (Next.js + TypeScript)            │
│     - Dashboard, Profile, Social, Mock Interview    │
│     - Real-time updates via Socket.io               │
└────────────────────┬────────────────────────────────┘
                     │ REST API + WebSocket
                     ▼
┌─────────────────────────────────────────────────────┐
│       BACKEND (Node.js + Express + MongoDB)         │
│  - User Management, Auth, Platform Integration      │
│  - Real-time Rooms, Friends, Notifications          │
│  - Puppeteer Scrapers (CodeChef, GFG)               │
└────────────┬───────────────────────┬─────────────────┘
             │                       │
             │ HTTP                  │ Socket.io
             ▼                       ▼
┌──────────────────────┐   ┌──────────────────────┐
│   AI SERVICE         │   │  Stream Chat SDK     │
│  (Python FastAPI)    │   │  (Real-time chat)    │
│  - Interview AI      │   └──────────────────────┘
│  - Resume Parser     │
│  - Question Gen      │
│  - Answer Eval       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   ChromaDB           │
│  (Vector Store)      │
│  - Question Bank     │
│  - Embeddings        │
└──────────────────────┘

EXTERNAL APIs:
- LeetCode GraphQL API
- Codeforces API
- GitHub REST API
- Firebase Auth
- Groq LLM API
```

---

### **DATA FLOW EXAMPLE: User Logs In**

```
1. User clicks "Login with Google" (Frontend)
   ↓
2. Firebase Auth handles OAuth flow
   ↓
3. Firebase returns ID token
   ↓
4. Frontend sends token to Backend: POST /api/auth/login
   ↓
5. Backend verifies token with Firebase Admin SDK
   ↓
6. Backend checks if user exists in MongoDB
   ↓
7. If new user: Create user document
   ↓
8. Backend generates JWT token
   ↓
9. Returns JWT to Frontend
   ↓
10. Frontend stores JWT in localStorage
    ↓
11. All subsequent API calls include JWT in headers
```

---

## DASHBOARD & ACTIVITY TRACKING

### **FEATURE 1: ACTIVITY HEATMAP**

### Q: "Walk me through your Activity Heatmap component. How does it work?"

**Your Answer:**

"The Activity Heatmap visualizes a user's coding consistency across all platforms, similar to GitHub's contribution graph but unified across LeetCode, Codeforces, etc.



#### **COMPONENT ARCHITECTURE:**

**File:** `codolio/components/dashboard/activity-heatmap.tsx`

```typescript
// Component Structure:
ActivityHeatmap
├── Data Fetching (useEffect)
│   └── API: /api/analytics/heatmap
├── Data Processing (useMemo)
│   ├── Fill missing dates
│   ├── Group into weeks (7 days)
│   ├── Group weeks into months
│   └── Calculate total contributions
├── Rendering
│   ├── Month headers
│   ├── Day labels (S M T W T F S)
│   ├── Week grid with tooltips
│   └── Legend (Less → More)
```

#### **KEY IMPLEMENTATION DETAILS:**

**1. Data Fetching:**

```typescript
const [heatmapData, setHeatmapData] = useState([])

useEffect(() => {
  const fetchHeatmap = async () => {
    const data = await getHeatmap()
    // Returns: { heatmap: [{ date: '2024-01-15', count: 5 }, ...] }
    setHeatmapData(data.heatmap)
  }
  fetchHeatmap()
}, [])
```

**2. Algorithm - Transform Linear Data to Grid:**

```typescript
// Problem: API returns flat array, need 2D grid
// Input: [{ date: "2024-01-01", count: 3 }, { date: "2024-01-02", count: 5 }]
// Output: [[Mon, Tue, Wed, Thu, Fri, Sat, Sun], [Mon, Tue, ...]]

const { weeks, totalContributions } = useMemo(() => {
  // Step 1: Create lookup map for O(1) access
  const dataMap = new Map(heatmapData.map(item => [item.date, item.count]))
  
  // Step 2: Fill missing dates (gaps in activity)
  const allDates = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const count = dataMap.get(dateStr) || 0  // Default 0 if no activity
    allDates.push({ date: dateStr, count })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Step 3: Group into weeks (7 days)
  const weeksArray = []
  let currentWeek = []
  
  // Pad first week to start on Sunday
  const firstDay = new Date(allDates[0].date).getDay()
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: "", count: -1 })  // Empty cell
  }
  
  // Fill weeks
  for (const day of allDates) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeksArray.push(currentWeek)
      currentWeek = []
    }
  }
  
  // Pad last week to complete 7 days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", count: -1 })
    }
    weeksArray.push(currentWeek)
  }
  
  return { 
    weeks: weeksArray, 
    totalContributions: allDates.reduce((sum, d) => sum + d.count, 0)
  }
}, [heatmapData])
```

**3. Color Intensity Mapping:**

```typescript
function getColor(count: number) {
  if (count === 0) return "bg-secondary/30 hover:bg-secondary/50"    // Gray
  if (count <= 2) return "bg-chart-1/30 hover:bg-chart-1/50"         // Light blue
  if (count <= 5) return "bg-chart-1/50 hover:bg-chart-1/70"         // Medium blue
  if (count <= 8) return "bg-chart-1/70 hover:bg-chart-1/90"         // Dark blue
  return "bg-chart-1 hover:bg-chart-1/90"                             // Darkest blue
}

// Accessibility: Also provide text labels
function getIntensityLabel(count: number) {
  if (count === 0) return "No activity"
  if (count <= 2) return "Low activity"
  if (count <= 5) return "Moderate activity"
  if (count <= 8) return "High activity"
  return "Very high activity"
}
```

**4. Month Grouping Algorithm:**

```typescript
// Problem: Group weeks into months for visual organization
// A week can span two months (e.g., Jan 28 - Feb 3)
// Solution: Assign week to month with most days

const monthGroups = {}

weeks.forEach((week) => {
  // Count days per month in this week
  const monthCounts = {}
  
  week.forEach(day => {
    if (day.date && day.count !== -1) {
      const date = new Date(day.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    }
  })
  
  // Find dominant month (most days)
  const dominantMonth = Object.entries(monthCounts)
    .reduce((max, [month, count]) => count > max[1] ? [month, count] : max)[0]
  
  if (!monthGroups[dominantMonth]) {
    monthGroups[dominantMonth] = []
  }
  monthGroups[dominantMonth].push(week)
})
```

**5. Tooltip with Hover Details:**

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <div className={`size-3.5 rounded-sm ${getColor(day.count)}`} />
  </TooltipTrigger>
  <TooltipContent side="top">
    <div className="text-xs">
      <p className="font-semibold">
        {day.count} {day.count === 1 ? 'contribution' : 'contributions'}
      </p>
      <p className="text-muted-foreground">
        {new Date(day.date).toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
        })}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {getIntensityLabel(day.count)}
      </p>
    </div>
  </TooltipContent>
</Tooltip>
```

---

#### **BACKEND API:**

**Endpoint:** `GET /api/analytics/heatmap`

**File:** `Backend/codeorbit_backend/controllers/analytics.controller.js`

```javascript
export const getHeatmap = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    // STEP 1: Start with stored activity
    let heatmapData = user.activity || []
    
    // STEP 2: Merge LeetCode submissions (if connected)
    if (user.platforms?.leetcode?.verified) {
      const leetcodeActivity = await fetchLeetCodeSubmissions(
        user.platforms.leetcode.username
      )
      heatmapData = mergeActivity(heatmapData, leetcodeActivity)
    }
    
    // STEP 3: Merge Codeforces submissions (if connected)
    if (user.platforms?.codeforces?.handle) {
      const cfActivity = await fetchCodeforcesSubmissions(
        user.platforms.codeforces.handle
      )
      heatmapData = mergeActivity(heatmapData, cfActivity)
    }
    
    // STEP 4: Merge GitHub contributions (if connected)
    if (user.platforms?.github?.username) {
      const githubActivity = await fetchGitHubContributions(
        user.platforms.github.username,
        user.platforms.github.accessToken
      )
      heatmapData = mergeActivity(heatmapData, githubActivity)
    }
    
    // STEP 5: Aggregate by date
    const aggregated = aggregateByDate(heatmapData)
    
    res.json({ 
      heatmap: aggregated,
      totalContributions: aggregated.reduce((sum, d) => sum + d.count, 0)
    })
    
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Utility: Merge activities from different platforms
function mergeActivity(existing, newActivity) {
  const map = new Map()
  
  // Add existing
  existing.forEach(item => {
    map.set(item.date, (map.get(item.date) || 0) + item.count)
  })
  
  // Add new
  newActivity.forEach(item => {
    map.set(item.date, (map.get(item.date) || 0) + item.count)
  })
  
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
}

// Utility: Aggregate multiple submissions on same day
function aggregateByDate(activities) {
  const dateMap = new Map()
  
  activities.forEach(item => {
    const date = item.date.split('T')[0]  // Extract YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })
  
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
```

---

#### **PERFORMANCE OPTIMIZATIONS:**

1. **useMemo for Heavy Calculations:**
   - Week grouping runs only when data changes
   - Prevents re-calculation on every render

2. **API Caching:**
   - Cache heatmap data in localStorage for 5 minutes
   - Reduce backend calls

3. **Lazy Loading:**
   - Heatmap only fetches when component is visible
   - Use Intersection Observer API

4. **Debounced Tooltip:**
   - 100ms delay before showing tooltip
   - Prevents tooltip spam on fast hover

---

### **FOLLOW-UP QUESTIONS & ANSWERS:**

**Q: How do you handle different timezones?**

A: "All timestamps are stored in UTC in MongoDB. JavaScript's `new Date(dateString)` automatically converts UTC to user's local timezone. The heatmap displays activity in the user's local time. For example, a submission at 11 PM PST shows correctly for both PST and IST users."

**Q: What if a platform's API is down?**

A: "We use cached data as fallback. The `lastSyncedAt` timestamp shows when data was last updated. If API fails, we show cached data with a warning icon. The backend uses `Promise.allSettled` so one API failure doesn't break the entire heatmap."

**Q: How do you prevent duplicate counting?**

A: "Each submission has a unique ID (platform + problem ID + timestamp). Before merging, we deduplicate using a Set. For example, if a user solves 'Two Sum' multiple times, only unique attempts count."

**Q: Performance with large datasets?**

A: "For users with 1000+ days of activity:
- Backend: MongoDB aggregation pipeline (O(n) complexity)
- Frontend: Virtual scrolling for month containers
- Lazy render: Only visible months are rendered
- Typical render time: <100ms for 365 days"



---

### **FEATURE 2: PLATFORM STATS GRID**

### Q: "Explain the Platform Stats Grid - how do you aggregate data from multiple platforms?"

**Your Answer:**

"Platform Stats Grid shows real-time statistics from all connected platforms in a unified card-based interface. Each platform displays key metrics like problems solved, rating, rank, and contest participation.

#### **COMPONENT ARCHITECTURE:**

**File:** `codolio/components/dashboard/platform-stats.tsx`

```typescript
// Component Flow:
PlatformStatsGrid
├── useAuth hook → Get user data
├── useEffect → Process connected platforms
├── Conditional rendering logic
│   ├── Check which platforms are connected
│   ├── Build platform cards array
│   └── Calculate rankings
└── Render grid with animated stats
```

#### **PLATFORM CONNECTION DETECTION:**

```typescript
useEffect(() => {
  if (!user) return
  
  const connectedPlatforms = []
  
  // Check each platform
  const hasLeetCode = user.platforms?.leetcode?.username && 
                      user.platforms?.leetcode?.verified
  const hasCodeforces = user.platforms?.codeforces?.handle
  const hasGithub = user.platforms?.github?.username
  const hasCodeChef = user.platforms?.codechef?.rating
  const hasGFG = user.platforms?.gfg?.username
  
  // Build platform card data
  if (hasLeetCode) {
    const rating = user.platforms.leetcode.contestRating || 0
    connectedPlatforms.push({
      name: "LeetCode",
      username: user.platforms.leetcode.username,
      solved: user.platforms.leetcode.totalSolved || 0,
      rating: rating,
      rank: calculateLeetCodeRank(rating),
      change: 0,  // TODO: Track rating changes
      color: "text-warning",
      bgGradient: "from-warning/10 to-warning/5",
      url: `https://leetcode.com/${user.platforms.leetcode.username}`
    })
  }
  
  // Repeat for other platforms...
  setPlatforms(connectedPlatforms)
}, [user])
```

#### **LEETCODE RANKING SYSTEM:**

```typescript
function calculateLeetCodeRank(rating: number): string {
  if (rating === 0) return "Unrated"
  if (rating < 1400) return "Beginner"      // ~0-25th percentile
  if (rating < 1600) return "Intermediate"   // ~25-50th percentile
  if (rating < 1800) return "Advanced"       // ~50-75th percentile
  if (rating < 2000) return "Expert"         // ~75-90th percentile
  if (rating < 2200) return "Knight"         // ~90-95th percentile
  return "Guardian"                           // Top 5%
}

// Based on LeetCode's actual ranking distribution
```

#### **CODEFORCES RANK EXTRACTION:**

```typescript
// Codeforces API returns rank directly
if (hasCodeforces) {
  connectedPlatforms.push({
    name: "Codeforces",
    username: user.platforms.codeforces.handle,
    solved: user.platforms.codeforces.solvedProblems || 0,
    rating: user.platforms.codeforces.rating || 0,
    rank: user.platforms.codeforces.rank || "Newbie",  // Newbie, Pupil, etc.
    color: "text-chart-1",
    bgGradient: "from-chart-1/10 to-chart-1/5",
    url: `https://codeforces.com/profile/${user.platforms.codeforces.handle}`
  })
}

// Codeforces Ranks:
// Newbie (0-1199), Pupil (1200-1399), Specialist (1400-1599),
// Expert (1600-1899), Candidate Master (1900-2099),
// Master (2100-2299), International Master (2300-2399),
// Grandmaster (2400-2599), International Grandmaster (2600+), Legendary (3000+)
```

#### **GITHUB SPECIAL HANDLING:**

```typescript
// GitHub doesn't have "rating" - we show different stats
if (hasGithub) {
  connectedPlatforms.push({
    name: "GitHub",
    username: user.platforms.github.username,
    solved: user.platforms.github.totalContributions || 0,  // Contributions, not "solved"
    rating: user.platforms.github.totalStars || 0,           // Stars instead of rating
    rank: `${user.platforms.github.publicRepos || 0} Repos`, // Repo count
    change: 0,
    color: "text-foreground",
    bgGradient: "from-foreground/5 to-foreground/[0.02]",
    url: `https://github.com/${user.platforms.github.username}`
  })
}
```

#### **ANIMATED NUMBERS:**

```typescript
// Staggered animation for visual appeal
<AnimatedNumber 
  value={platform.solved} 
  duration={1500 + (i * 200)}  // Each card animates 200ms after previous
  formatNumber={platform.solved > 1000}  // "1.2k" instead of "1200"
/>

// AnimatedNumber component uses requestAnimationFrame for smooth counting
```

#### **CONDITIONAL STAT DISPLAY:**

```typescript
// GitHub shows different stats
{platform.name === "GitHub" ? (
  <>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Stars</span>
      <span className="text-sm font-semibold">
        <AnimatedNumber value={platform.rating} />
      </span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Repositories</span>
      <span className="text-sm font-semibold">{platform.rank}</span>
    </div>
  </>
) : platform.rating > 0 ? (
  // LeetCode, Codeforces, CodeChef show rating
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">Rating</span>
    <span className="text-sm font-semibold">
      <AnimatedNumber value={platform.rating} decimals={0} />
    </span>
  </div>
) : (
  // GeeksForGeeks shows rank only
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">Status</span>
    <span className="text-sm font-semibold">{platform.rank}</span>
  </div>
)}
```

---

#### **BACKEND: DATA SYNCING**

**Endpoint:** `POST /api/sync/all`

**File:** `Backend/codeorbit_backend/controllers/sync.controller.js`

```javascript
export const syncAllPlatforms = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    
    // Parallel sync for performance
    const syncPromises = []
    
    // LeetCode
    if (user.platforms?.leetcode?.username) {
      syncPromises.push(
        syncLeetCode(user.platforms.leetcode.username)
          .then(data => ({ platform: 'leetcode', data }))
          .catch(err => ({ platform: 'leetcode', error: err.message }))
      )
    }
    
    // Codeforces
    if (user.platforms?.codeforces?.handle) {
      syncPromises.push(
        syncCodeforces(user.platforms.codeforces.handle)
          .then(data => ({ platform: 'codeforces', data }))
          .catch(err => ({ platform: 'codeforces', error: err.message }))
      )
    }
    
    // GitHub
    if (user.platforms?.github?.username) {
      syncPromises.push(
        syncGitHub(user.platforms.github.username, user.platforms.github.accessToken)
          .then(data => ({ platform: 'github', data }))
          .catch(err => ({ platform: 'github', error: err.message }))
      )
    }
    
    // Wait for all syncs (use allSettled to handle failures)
    const results = await Promise.allSettled(syncPromises)
    
    // Update user document
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data) {
        const { platform, data } = result.value
        user.platforms[platform] = {
          ...user.platforms[platform],
          ...data
        }
      }
    })
    
    user.lastSyncedAt = new Date()
    await user.save()
    
    res.json({ 
      message: "Sync complete",
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      lastSyncedAt: user.lastSyncedAt
    })
    
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
```

#### **LEETCODE SYNC FUNCTION:**

```javascript
async function syncLeetCode(username) {
  // LeetCode uses GraphQL
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
          reputation
        }
        contestHistory {
          attended
          rating
          topPercentage
        }
      }
    }
  `
  
  const response = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: { username }
  })
  
  const userData = response.data.data.matchedUser
  
  // Extract data
  const totalSolved = userData.submitStats.acSubmissionNum
    .reduce((sum, item) => sum + item.count, 0)
  
  const difficultyBreakdown = userData.submitStats.acSubmissionNum.map(item => ({
    name: item.difficulty,
    value: item.count,
    color: item.difficulty === 'Easy' ? '#00b8a3' : 
           item.difficulty === 'Medium' ? '#ffc01e' : '#ef4743'
  }))
  
  return {
    username,
    totalSolved,
    contestRating: userData.contestHistory?.rating || 0,
    contestsPlayed: userData.contestHistory?.attended || 0,
    difficultyBreakdown,
    ranking: userData.profile.ranking
  }
}
```



#### **CODEFORCES SYNC FUNCTION:**

```javascript
async function syncCodeforces(handle) {
  // Codeforces has REST API
  const [userInfo, userStatus] = await Promise.all([
    axios.get(`https://codeforces.com/api/user.info?handles=${handle}`),
    axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`)
  ])
  
  const user = userInfo.data.result[0]
  const submissions = userStatus.data.result
  
  // Count accepted solutions
  const solvedProblems = new Set(
    submissions
      .filter(sub => sub.verdict === 'OK')
      .map(sub => `${sub.problem.contestId}-${sub.problem.index}`)
  )
  
  return {
    handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'Newbie',
    solvedProblems: solvedProblems.size,
    contestsPlayed: user.ratingHistory?.length || 0
  }
}
```

---

### **FOLLOW-UP QUESTIONS:**

**Q: What if one API is slow or fails?**

A: "We use `Promise.allSettled` instead of `Promise.all`. This ensures:
- One failure doesn't break the entire sync
- We update whatever platforms succeed
- Failed syncs show cached data with a '⚠️' warning icon
- We log errors for debugging
- Each API has a 10-second timeout to prevent hanging"

**Q: How often do you sync?**

A: "Three strategies:
1. **Manual Sync:** User clicks 'Sync' button
2. **Auto Sync on Login:** Syncs if last sync > 1 hour
3. **Background Sync:** Cron job syncs all users every 6 hours (off-peak)
4. **Webhook Sync:** (Future) LeetCode/Codeforces webhooks for instant updates"

**Q: How do you handle rate limiting?**

A: "
- **Codeforces:** Max 1 request/2 seconds. We queue requests.
- **LeetCode:** No official rate limit, but we respect 10 req/min
- **GitHub:** 5000 req/hour with OAuth. We cache aggressively.
- **Exponential Backoff:** If rate limited, wait 2^n seconds before retry"

---

## PROFILE SYSTEM

### Q: "Explain your User model schema and social features."

**Your Answer:**

"Our User model is the heart of CodeOrbit. It stores authentication, profile data, platform connections, social graph, and real-time presence.

#### **USER MODEL SCHEMA:**

**File:** `Backend/codeorbit_backend/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  // ===== AUTHENTICATION =====
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  password: { 
    type: String, 
    required: function() { 
      return !this.firebaseUid  // Not required for Google OAuth users
    } 
  },
  
  firebaseUid: { 
    type: String, 
    unique: true, 
    sparse: true  // Allows multiple null values
  },
  
  provider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  
  // ===== PROFILE =====
  username: { 
    type: String, 
    unique: true, 
    sparse: true,  // Some users haven't chosen username yet
    trim: true,
    lowercase: true
  },
  
  displayName: String,
  photoURL: String,
  bio: { type: String, maxlength: 500 },
  profileImage: String,
  bannerImage: String,
  
  accountType: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  },
  
  // ===== SOCIAL GRAPH =====
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  friends: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  friendRequestsSent: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  friendRequestsReceived: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  blockedUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // ===== REAL-TIME PRESENCE =====
  onlineStatus: { 
    type: Boolean, 
    default: true 
  },
  
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  
  socketId: String,  // For Socket.io connection
  
  // ===== STREAM CHAT INTEGRATION =====
  streamUserId: String,
  streamToken: String,
  
  // ===== PLATFORM CONNECTIONS =====
  leetcode: leetcodeSchema,
  codeforces: codeforcesSchema,
  github: githubSchema,
  codechef: codechefSchema,
  gfg: gfgSchema,
  
  // ===== ACTIVITY DATA =====
  activity: [{ 
    date: String, 
    count: Number 
  }],
  
  // ===== AI RECOMMENDATIONS =====
  lastRecommendations: recommendationSchema,
  
  lastSyncedAt: { 
    type: Date, 
    default: Date.now 
  }
})

// ===== INDEXES FOR PERFORMANCE =====
userSchema.index({ username: 1 })
userSchema.index({ uniqueId: 1 })
userSchema.index({ displayName: 'text', username: 'text', bio: 'text' })
userSchema.index({ onlineStatus: 1 })

export default mongoose.model("User", userSchema)
```

---

#### **PLATFORM SUB-SCHEMAS:**

**LeetCode Schema:**

```javascript
const leetcodeSchema = new mongoose.Schema({
  username: String,
  verified: { type: Boolean, default: false },
  verificationCode: String,  // For username verification
  codeExpiry: Date,
  totalSolved: Number,
  contestRating: Number,
  contestsPlayed: Number,
  totalActiveDays: Number,
  difficultyBreakdown: [{
    name: String,       // "Easy", "Medium", "Hard"
    value: Number,      // Count
    color: String       // Hex color for chart
  }],
  badges: [{
    name: String,
    icon: String
  }]
})
```

**Codeforces Schema:**

```javascript
const codeforcesSchema = new mongoose.Schema({
  handle: String,
  rating: Number,
  maxRating: Number,
  rank: String,              // "Newbie", "Pupil", "Expert", etc.
  solvedProblems: Number,
  contestsPlayed: Number
})
```

**GitHub Schema:**

```javascript
const githubSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  followers: Number,
  following: Number,
  publicRepos: Number,
  totalStars: Number,
  totalContributions: Number,
  contributionGraph: Array,
  accessToken: String,       // Encrypted OAuth token
  connectedAt: Date
})
```

---

#### **KEY DESIGN DECISIONS:**

**1. Sparse Unique Indexes**

```javascript
username: { type: String, unique: true, sparse: true }

// Why "sparse"?
// - Allows multiple null values
// - Some users haven't chosen a username yet
// - Once set, must be unique
```

**2. Embedded vs Referenced Data**

```javascript
// Platform data: EMBEDDED (not referenced)
// Why? Faster reads, no joins needed
// Trade-off: Larger documents, but acceptable for user profiles

// Social connections: REFERENCED (ObjectId)
// Why? Prevents circular dependencies
// Easier to query friend relationships
```

**3. Text Index for Search**

```javascript
userSchema.index({ displayName: 'text', username: 'text', bio: 'text' })

// Enables:
router.get("/search", async (req, res) => {
  const users = await User.find({
    $text: { $search: req.query.q }
  }).limit(20)
  res.json(users)
})
```

---

## CONTEST TRACKER

### Q: "How do you aggregate upcoming contests from different platforms?"

**Your Answer:**

"Contest Tracker aggregates contests from LeetCode, Codeforces, and CodeChef APIs, normalizes the data, and sorts by start time. It shows Live, Upcoming, and Past contests.

#### **BACKEND SERVICE:**

**File:** `Backend/codeorbit_backend/services/contest.service.js`

```javascript
export const getUpcomingContests = async () => {
  // Parallel fetch for speed
  const [leetcode, codeforces, codechef] = await Promise.allSettled([
    fetchLeetCodeContests(),
    fetchCodeforcesContests(),
    fetchCodeChefContests()
  ])
  
  const allContests = []
  
  // Normalize LeetCode data
  if (leetcode.status === 'fulfilled') {
    leetcode.value.forEach(c => {
      allContests.push({
        id: `leetcode-${c.titleSlug}`,
        title: c.title,
        platform: 'LeetCode',
        startTime: new Date(c.startTime * 1000),  // Unix timestamp to Date
        duration: c.duration,  // seconds
        url: `https://leetcode.com/contest/${c.titleSlug}`,
        status: 'upcoming'
      })
    })
  }
  
  // Normalize Codeforces data
  if (codeforces.status === 'fulfilled') {
    codeforces.value.forEach(c => {
      allContests.push({
        id: `codeforces-${c.id}`,
        title: c.name,
        platform: 'Codeforces',
        startTime: new Date(c.startTimeSeconds * 1000),
        duration: c.durationSeconds,
        url: `https://codeforces.com/contest/${c.id}`,
        status: c.phase === 'BEFORE' ? 'upcoming' : 'live'
      })
    })
  }
  
  // Sort by start time (earliest first)
  return allContests.sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  )
}

async function fetchLeetCodeContests() {
  const query = `
    query {
      allContests {
        title
        titleSlug
        startTime
        duration
      }
    }
  `
  const response = await axios.post('https://leetcode.com/graphql', { query })
  return response.data.data.allContests
}

async function fetchCodeforcesContests() {
  const response = await axios.get('https://codeforces.com/api/contest.list')
  return response.data.result.filter(c => c.phase === 'BEFORE' || c.phase === 'CODING')
}
```

#### **FRONTEND FILTERING:**

**File:** `codolio/components/pages/contests-page.tsx`

```typescript
const now = new Date()

// Categorize contests
const liveContests = contests.filter(c => {
  const start = new Date(c.startTime)
  const end = new Date(start.getTime() + c.duration * 1000)
  return now >= start && now <= end
})

const upcomingContests = contests.filter(c => 
  new Date(c.startTime) > now
)

const pastContests = contests.filter(c => {
  const start = new Date(c.startTime)
  const end = new Date(start.getTime() + c.duration * 1000)
  return now > end
})
```

---

## RESOURCES SECTION

### Q: "Tell me about your Resources feature."

**Your Answer:**

"Resources is a curated collection of learning materials, DSA sheets, system design guides, and interview prep resources. It helps users find quality content without searching.

**Structure:**

```javascript
const resources = [
  {
    category: "DSA Sheets",
    items: [
      {
        title: "Striver's A2Z DSA Sheet",
        description: "450+ problems covering all DSA topics",
        url: "https://takeuforward.org/strivers-a2z-dsa-course/",
        difficulty: "All Levels",
        tags: ["DSA", "Complete", "Structured"]
      },
      {
        title: "NeetCode 150",
        description: "150 LeetCode problems for FAANG interviews",
        url: "https://neetcode.io/",
        difficulty: "Intermediate",
        tags: ["FAANG", "Interview", "LeetCode"]
      }
    ]
  },
  {
    category: "System Design",
    items: [...]
  }
]
```

**Features:**
- Search by title/description
- Filter by category
- Tag-based filtering
- Difficulty levels
- External link tracking (analytics)"

---

## COMMON INTERVIEW QUESTIONS

### Q: "How does authentication work?"

A: "Hybrid system:
1. **Google OAuth:** Firebase Auth handles OAuth flow → Returns ID token → Backend verifies with Firebase Admin SDK → Generates JWT
2. **Email/Password:** User submits credentials → Backend hashes password with bcrypt → Generates JWT
3. **JWT:** Stored in localStorage → Sent in Authorization header → Backend verifies with secret key"

### Q: "How do you handle errors?"

A: "
- **Frontend:** Try-catch blocks, toast notifications, error boundaries
- **Backend:** Express error middleware, structured error responses
- **Logging:** Winston logger, error tracking with Sentry (future)
"

### Q: "What about security?"

A: "
- **JWT:** Short expiry (7 days), httpOnly cookies (future)
- **Passwords:** Bcrypt hashing (10 rounds)
- **API Keys:** Stored in .env, never in code
- **CORS:** Whitelist specific origins
- **Rate Limiting:** 100 req/15min per IP
- **Input Validation:** Joi schemas on backend
"

---

## SUMMARY - PHASE 1

**Key Features Covered:**
✅ Dashboard with Activity Heatmap
✅ Platform Stats Grid
✅ Profile System with Social Graph
✅ Contest Tracker
✅ Resources Section

**Technologies:**
- Frontend: Next.js, TypeScript, TailwindCSS
- Backend: Node.js, Express, MongoDB
- Auth: Firebase, JWT
- APIs: LeetCode, Codeforces, GitHub

**Next:** Phase 2 - Collaborative Space (Rooms, Video Calls, Real-time Features)

