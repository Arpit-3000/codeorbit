// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Icons } from '@/components/ui/icons';
// import { signupWithEmail, signInWithGoogle } from '@/lib/auth';
// import { useAuth } from '@/contexts/auth-context';

// export default function SignupPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [googleLoading, setGoogleLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const router = useRouter();
//   const { login } = useAuth();

//   const handleEmailSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       setLoading(false);
//       return;
//     }

//     if (password.length < 6) {
//       setError('Password must be at least 6 characters long');
//       setLoading(false);
//       return;
//     }

//     try {
//       await signupWithEmail(email, password);
//       setSuccess('Account created successfully! Please sign in.');
//       setTimeout(() => {
//         router.push('/auth/login');
//       }, 2000);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleSignup = async () => {
//     setGoogleLoading(true);
//     setError('');

//     try {
//       const response = await signInWithGoogle();
//       login(response.user);
//       router.push('/');
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background px-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
//           <CardDescription className="text-center">
//             Join CodeOrbit to track your coding journey
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {error && (
//             <Alert variant="destructive">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}
          
//           {success && (
//             <Alert>
//               <AlertDescription>{success}</AlertDescription>
//             </Alert>
//           )}
          
//           <Button
//             variant="outline"
//             className="w-full"
//             onClick={handleGoogleSignup}
//             disabled={googleLoading}
//           >
//             {googleLoading ? (
//               <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
//             ) : (
//               <Icons.google className="mr-2 h-4 w-4" />
//             )}
//             Continue with Google
//           </Button>
          
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <span className="w-full border-t" />
//             </div>
//             <div className="relative flex justify-center text-xs uppercase">
//               <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
//             </div>
//           </div>

//           <form onSubmit={handleEmailSignup} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Create a password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password</Label>
//               <Input
//                 id="confirmPassword"
//                 type="password"
//                 placeholder="Confirm your password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? (
//                 <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
//               ) : null}
//               Create Account
//             </Button>
//           </form>
//         </CardContent>
//         <CardFooter>
//           <p className="text-center text-sm text-muted-foreground w-full">
//             Already have an account?{' '}
//             <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
//               Sign in
//             </Link>
//           </p>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }


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
import { signupWithEmail, signInWithGoogle, getUserProfile } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Mail, Lock, Sparkles, Code2, TrendingUp, Trophy, Activity, Zap, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setSuccess("Account created successfully! Please sign in.");
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
              Start Your Journey in<br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Developer Excellence
              </span>
            </h2>
            
            <p className="text-muted-foreground text-lg">
              Join thousands of developers tracking their coding journey across multiple platforms in one unified dashboard.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            {[
              "Track stats from LeetCode, Codeforces, CodeChef & more",
              "Monitor your coding streaks and consistency",
              "Never miss important contests and competitions",
              "Get AI-powered insights on your progress",
              "Connect with other developers",
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mt-0.5 size-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CheckCircle2 className="size-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {benefit}
                </p>
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
              Create an account
            </CardTitle>
            <CardDescription className="text-center">
              Join CodeOrbit to track your coding journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-primary/50 bg-primary/10">
                <AlertDescription className="text-primary">{success}</AlertDescription>
              </Alert>
            )}

            {/* Google Signup */}
            <Button
              variant="outline"
              className="w-full group relative overflow-hidden border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              onClick={handleGoogleSignup}
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

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
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
                    placeholder="Create a password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 border-border/50 focus:border-primary/50 bg-background/50 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/25"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <p className="text-center text-sm text-muted-foreground w-full">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium transition-colors"
              >
                Sign in
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
