"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signupWithEmail, signInWithGoogle, getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { AuthError, AuthFrame, AuthNotice, Field, GoogleButton, OrDivider } from "@/components/auth/auth-frame";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await signupWithEmail(email, password);
      setSuccess("Account created. Taking you to sign in…");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      const user = await getUserProfile();
      login(user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <AuthFrame
      grid={false}
      title="Create your account"
      description="One place for your LeetCode, Codeforces, CodeChef, GeeksforGeeks and GitHub."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <AuthNotice message={success} />
      <form className="space-y-4" onSubmit={handleEmailSignup}>
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 6 characters." />
        <Field
          id="confirmPassword"
          label="Confirm password"
         
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          hint={mismatch ? <span className="text-destructive">Doesn't match yet.</span> : undefined}
        />
        <Button type="submit" className="h-10 w-full" disabled={loading || googleLoading || !!success}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>
      <OrDivider />
      <GoogleButton loading={googleLoading} onClick={handleGoogleSignup} />
    </AuthFrame>
  );
}
