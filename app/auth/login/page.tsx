"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";

import {
  loginWithEmail,
  signInWithGoogle,
  getUserProfile,
} from "@/lib/auth";

import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {

  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");

  
  const handleEmailLogin = async () => {

    // alert("LOGIN CLICKED");
    setLoading(true);
    setError("");

    try {

      const response = await loginWithEmail(email, password);

      console.log("LOGIN RESPONSE:", response);

      const user = await getUserProfile();

      login(user);

      router.push("/");

    } catch (err: any) {

      console.log(err);

      setError(err.message || "Login failed");

    } finally {

      setLoading(false);

    }

  };
  const handleGoogleLogin = async () => {

    setGoogleLoading(true);
    setError("");

    try {

      // Step 1: google auth
      await signInWithGoogle();

      // Step 2: fetch profile
      const user = await getUserProfile();

      // Step 3: save user
      login(user);

      // Step 4: redirect
      router.push("/");

    } catch (err: any) {

      setError(err.message || "Google sign-in failed");

    } finally {

      setGoogleLoading(false);

    }

  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      <Card className="w-full max-w-md">

        <CardHeader className="space-y-1">

          <CardTitle className="text-2xl font-bold text-center">
            Welcome back
          </CardTitle>

          <CardDescription className="text-center">
            Sign in to your CodeOrbit account
          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Login */}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >

            {googleLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}

            Continue with Google

          </Button>

          {/* Divider */}

          <div className="relative">

            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>

          </div>

          {/* Email Login */}

         <div className="space-y-4">

  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>

    <Input
      id="email"
      type="email"
      placeholder="Enter your email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>

    <Input
      id="password"
      type="password"
      placeholder="Enter your password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>

  <Button
    type="button"
    className="w-full"
    disabled={loading}
    onClick={handleEmailLogin}
  >
    {loading && (
      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
    )}

    Sign In
  </Button>

</div>
        </CardContent>

        <CardFooter>

          <p className="text-center text-sm text-muted-foreground w-full">

            Don't have an account?{" "}

            <Link
              href="/auth/signup"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>

          </p>

        </CardFooter>

      </Card>

    </div>

  );

}
