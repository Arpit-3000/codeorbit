
import api from "./auth";

/* -------------------------
   LeetCode
--------------------------*/

export const connectLeetCode = async (username: string) => {
  const res = await api.post("/leetcode/connect", { username });
  return res.data;
};

export const verifyLeetCode = async () => {
  const res = await api.post("/leetcode/verify");
  return res.data;
};


/* -------------------------
   Codeforces
--------------------------*/

export const connectCodeforces = async (handle: string) => {
  const res = await api.post("/codeforces/connect", { handle });
  return res.data;
};


/* -------------------------
   GitHub
--------------------------*/

export const connectGithub = async (username: string) => {
  const res = await api.post("/github/connect", { username });
  return res.data;
};


/* -------------------------
   CodeChef
--------------------------*/

export const connectCodeChef = async (username: string) => {
  const res = await api.post("/codechef/connect", { username });
  return res.data;
};


/* -------------------------
   GFG
--------------------------*/

export const connectGFG = async (username: string) => {
  const res = await api.post("/gfg/connect", { username });
  return res.data;
};


/* -------------------------
   Leaderboard
--------------------------*/

export const getLeaderboard = async () => {
  const res = await api.get("/leaderboard");
  return res.data;
};

