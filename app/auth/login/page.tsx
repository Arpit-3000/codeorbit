"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginWithEmail, signInWithGoogle, getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { AuthError, AuthFrame, Field, GoogleButton, OrDivider } from "@/components/auth/auth-frame";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      const user = await getUserProfile();
      login(user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      const user = await getUserProfile();
      login(user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthFrame
      grid={false}
      title="Welcome back"
      description="Sign in to pick up where your streak left off."
      footer={
        <>
          New to CodeOrbit?{" "}
          <Link href="/auth/signup" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailLogin();
        }}
      >
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" className="h-10 w-full" disabled={loading || googleLoading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>
      <OrDivider />
      <GoogleButton loading={googleLoading} onClick={handleGoogleLogin} />
    </AuthFrame>
  );
}
