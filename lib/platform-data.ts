import type { User } from "@/lib/auth"

export interface PlatformRow {
  key: "leetcode" | "codeforces" | "codechef" | "gfg" | "github"
  label: string
  username: string
  /** Problems solved (contributions for GitHub) */
  solved: number
  solvedLabel: string
  /** Contest rating (GFG: coding score; GitHub: stars) */
  rating: number
  ratingLabel: string
  /** Tier / status text */
  rank: string
  url: string
}

export function leetcodeTier(rating: number) {
  if (!rating) return "Unrated"
  // LeetCode's only official contest tiers (below Knight there is no named tier)
  if (rating >= 2150) return "Guardian"
  if (rating >= 1850) return "Knight"
  return ""
}

/** Which platforms count as "connected" (same rules the dashboard has always used). */
export function connectionState(user: User | null | undefined) {
  const p = user?.platforms
  return {
    leetcode: !!(p?.leetcode?.username && p.leetcode.verified),
    codeforces: !!p?.codeforces?.handle,
    github: !!p?.github?.username,
    codechef: !!(p?.codechef && (p.codechef.username || p.codechef.rating)),
    gfg: !!p?.gfg?.username,
  }
}

export function connectedPlatforms(user: User | null | undefined): PlatformRow[] {
  const p = user?.platforms
  const c = connectionState(user)
  const rows: PlatformRow[] = []

  if (c.leetcode) {
    const rating = p!.leetcode.contestRating || 0
    rows.push({
      key: "leetcode",
      label: "LeetCode",
      username: p!.leetcode.username,
      solved: p!.leetcode.totalSolved || 0,
      solvedLabel: "solved",
      rating,
      ratingLabel: "contest rating",
      rank: leetcodeTier(rating),
      url: `https://leetcode.com/${p!.leetcode.username}`,
    })
  }
  if (c.codeforces) {
    rows.push({
      key: "codeforces",
      label: "Codeforces",
      username: p!.codeforces.handle,
      solved: p!.codeforces.solvedProblems || 0,
      solvedLabel: "solved",
      rating: p!.codeforces.rating || 0,
      ratingLabel: "rating",
      rank: p!.codeforces.rank || "Newbie",
      url: `https://codeforces.com/profile/${p!.codeforces.handle}`,
    })
  }
  if (c.codechef) {
    rows.push({
      key: "codechef",
      label: "CodeChef",
      username: p!.codechef.username || "Unknown",
      solved: p!.codechef.problemsSolved || 0,
      solvedLabel: "solved",
      rating: p!.codechef.rating || 0,
      ratingLabel: "rating",
      rank: p!.codechef.stars || "Unrated",
      url: `https://www.codechef.com/users/${p!.codechef.username || ""}`,
    })
  }
  if (c.gfg) {
    rows.push({
      key: "gfg",
      label: "GeeksforGeeks",
      username: p!.gfg.username,
      solved: p!.gfg.problemsSolved || 0,
      solvedLabel: "solved",
      rating: p!.gfg.codingScore || p!.gfg.score || 0,
      ratingLabel: "coding score",
      rank: "",
      url: `https://auth.geeksforgeeks.org/user/${p!.gfg.username}`,
    })
  }
  if (c.github) {
    rows.push({
      key: "github",
      label: "GitHub",
      username: p!.github.username,
      solved: p!.github.totalContributions || 0,
      solvedLabel: "contributions",
      rating: p!.github.totalStars || 0,
      ratingLabel: "stars",
      rank: `${p!.github.publicRepos || 0} repos`,
      url: `https://github.com/${p!.github.username}`,
    })
  }
  return rows
}

/** DSA platforms only (GitHub contributions are not problems solved). */
export function dsaPlatforms(user: User | null | undefined) {
  return connectedPlatforms(user).filter((r) => r.key !== "github")
}

/** Each platform has its own rating vocabulary; use the real one, not a generic ladder. */
export function ratingTier(key: PlatformRow["key"] | string, rating: number): string {
  if (!rating) return "Unrated"
  switch (key) {
    case "leetcode":
      return leetcodeTier(rating)
    case "codeforces":
      if (rating < 1200) return "Newbie"
      if (rating < 1400) return "Pupil"
      if (rating < 1600) return "Specialist"
      if (rating < 1900) return "Expert"
      if (rating < 2100) return "Candidate Master"
      if (rating < 2300) return "Master"
      if (rating < 2400) return "International Master"
      if (rating < 3000) return "Grandmaster"
      return "Legendary Grandmaster"
    case "codechef": {
      const stars = rating >= 2500 ? 7 : rating >= 2200 ? 6 : rating >= 2000 ? 5 : rating >= 1800 ? 4 : rating >= 1600 ? 3 : rating >= 1400 ? 2 : 1
      return `${stars}★`
    }
    default:
      return ""
  }
}
