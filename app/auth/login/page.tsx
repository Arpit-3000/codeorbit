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
import { Eye, EyeOff, Mail, Lock, Sparkles, Code2, TrendingUp, Trophy, Activity, Zap, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        
        {/* Animated Stars */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.5 + 0.2,
                animation: `twinkle ${Math.random() * 5 + 3}s infinite ${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000,transparent)]" />
      </div>

      {/* Left Side - Enhanced Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg space-y-8 animate-fade-in">
          {/* Logo & Title with Glow */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
                <div className="relative size-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 p-[2px]">
                  <div className="size-full rounded-2xl bg-slate-950 flex items-center justify-center">
                    <Code2 className="size-10 text-primary" />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  CodeOrbit
                </h1>
                <p className="text-sm text-slate-400 mt-1">Your Coding Universe</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Welcome to Your
              </h2>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight animate-gradient">
                Coding Universe
              </h2>
            </div>
            
            <p className="text-slate-300 text-lg leading-relaxed">
              Track coding stats, ratings, streaks, contests, and developer growth across platforms from a single dashboard.
            </p>
          </div>

          {/* Enhanced Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: "Unified Stats", desc: "All platforms, one view", color: "from-blue-500 to-cyan-500" },
              { icon: Trophy, title: "Contest Tracking", desc: "Never miss a contest", color: "from-yellow-500 to-orange-500" },
              { icon: Activity, title: "Streak Monitor", desc: "Stay consistent", color: "from-green-500 to-emerald-500" },
              { icon: Zap, title: "Real-time Sync", desc: "Always up-to-date", color: "from-purple-500 to-pink-500" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5 hover:border-primary/50 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-xl`} />
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${feature.color} mb-3`}>
                  <feature.icon className="size-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Enhanced Orbital Animation */}
          <div className="relative h-40 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Outer ring */}
              <div className="absolute size-36 rounded-full border-2 border-primary/20 animate-spin-slow" />
              {/* Middle ring */}
              <div className="absolute size-28 rounded-full border-2 border-purple-500/20 animate-spin-slower" />
              {/* Inner ring */}
              <div className="absolute size-20 rounded-full border-2 border-cyan-500/20 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
              
              {/* Center glow */}
              <div className="absolute size-20 rounded-full bg-gradient-to-br from-primary/30 via-purple-500/30 to-cyan-500/30 backdrop-blur-sm flex items-center justify-center animate-pulse-slow">
                <Sparkles className="size-8 text-primary animate-pulse" />
              </div>
              
              {/* Orbiting dots */}
              <div className="absolute size-36 animate-spin-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
              </div>
              <div className="absolute size-28 animate-spin-slower">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="size-8 rounded-full border-2 border-slate-900 bg-gradient-to-br from-primary to-purple-500" />
              ))}
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-white font-semibold">1000+</span> developers tracking their journey
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-primary/10 animate-fade-in">
          <CardHeader className="space-y-1 pb-6">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-500 rounded-xl blur-lg opacity-75" />
                <div className="relative size-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 p-[2px]">
                  <div className="size-full rounded-xl bg-slate-950 flex items-center justify-center">
                    <Code2 className="size-6 text-primary" />
                  </div>
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
                CodeOrbit
              </span>
            </div>

            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Sign in to your CodeOrbit account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 animate-shake">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full group relative overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-primary/50 transition-all duration-300 h-12"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {googleLoading ? (
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-5 w-5" />
              )}
              <span className="text-white">Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Email Login */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-300">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 border-slate-700 bg-slate-800/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-white placeholder:text-slate-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 border-slate-700 bg-slate-800/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-white placeholder:text-slate-500 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-12 group relative overflow-hidden bg-gradient-to-r from-primary via-purple-500 to-cyan-500 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 text-white font-semibold"
                disabled={loading}
                onClick={handleEmailLogin}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <p className="text-center text-sm text-slate-400 w-full">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:text-primary/80 font-semibold hover:underline underline-offset-4 transition-colors inline-flex items-center gap-1"
              >
                Sign up
                <ArrowRight className="size-3" />
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 30s linear infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out backwards;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
