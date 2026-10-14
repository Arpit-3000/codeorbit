import { auth } from "@/lib/firebase"

/** True for tokens issued by Firebase (Google sign-in). Email/password sessions use the server's own JWT. */
function isFirebaseToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.iss === "string" && payload.iss.includes("securetoken.google.com")
  } catch {
    return false
  }
}

/**
 * The token to send with a request.
 *
 * Google sign-in uses a Firebase ID token that expires after an hour. Firebase renews it for us,
 * but only if we ask: so for Google sessions we wait for Firebase to restore its session (needed
 * right after a page load) and read the current token, saving it for everything else that reads it.
 * Email/password sessions are returned untouched.
 */
export async function getFreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("token")
  if (!stored || !auth || !isFirebaseToken(stored)) return stored

  try {
    await auth.authStateReady()
    const fresh: string | undefined = await auth.currentUser?.getIdToken()
    if (fresh) {
      if (fresh !== stored) localStorage.setItem("token", fresh)
      return fresh
    }
  } catch (error) {
    console.warn("[AUTH] Could not refresh the Google session token:", error)
  }
  return stored
}
