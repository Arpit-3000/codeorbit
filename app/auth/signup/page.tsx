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
  signupWithEmail,
  signInWithGoogle,
  getUserProfile,
} from "@/lib/auth";

import { useAuth } from "@/contexts/auth-context";

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

    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      <Card className="w-full max-w-md">

        <CardHeader className="space-y-1">

          <CardTitle className="text-2xl font-bold text-center">
            Create an account
          </CardTitle>

          <CardDescription className="text-center">
            Join CodeOrbit to track your coding journey
          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
          >

            {googleLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}

            Continue with Google

          </Button>

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

          <form onSubmit={handleEmailSignup} className="space-y-4">

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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="confirmPassword">Confirm Password</Label>

              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >

              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}

              Create Account

            </Button>

          </form>

        </CardContent>

        <CardFooter>

          <p className="text-center text-sm text-muted-foreground w-full">

            Already have an account?{" "}

            <Link
              href="/auth/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>

          </p>

        </CardFooter>

      </Card>

    </div>

  );

}
