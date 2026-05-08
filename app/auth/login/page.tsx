"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { loginWithEmail, signInWithGoogle, getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Mail, Lock, Sparkles, Code2, TrendingUp, Trophy, Activity, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
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
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/20"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `twinkle ${Math.random() * 5 + 3}s infinite ${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative size-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                  <Code2 className="size-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  CodeOrbit
                </h1>
                <p className="text-sm text-muted-foreground">Your Coding Universe</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Welcome to Your<br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Coding Universe
              </span>
            </h2>
            
            <p className="text-muted-foreground text-lg">
              Track coding stats, ratings, streaks, contests, and developer growth across platforms from a single dashboard.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: "Unified Stats", desc: "All platforms, one view" },
              { icon: Trophy, title: "Contest Tracking", desc: "Never miss a contest" },
              { icon: Activity, title: "Streak Monitor", desc: "Stay consistent" },
              { icon: Zap, title: "Real-time Sync", desc: "Always up-to-date" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 hover:border-primary/50 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <feature.icon className="size-5 text-primary mb-2" />
                <h3 className="font-semibold text-sm text-foreground mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Orbital Animation */}
          <div className="relative h-32 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-24 rounded-full border-2 border-primary/20 animate-spin-slow" />
              <div className="absolute size-32 rounded-full border-2 border-primary/10 animate-spin-slower" />
              <div className="absolute size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="size-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Code2 className="size-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                CodeOrbit
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your CodeOrbit account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full group relative overflow-hidden border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Email Login */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-border/50 focus:border-primary/50 bg-background/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-border/50 focus:border-primary/50 bg-background/50 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/25"
                disabled={loading}
                onClick={handleEmailLogin}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <p className="text-center text-sm text-muted-foreground w-full">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
