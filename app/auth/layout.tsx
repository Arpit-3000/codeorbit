"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The GitHub OAuth callback lives under /auth but only makes sense for a signed-in user,
  // so it must not be bounced to the dashboard like the login and signup pages are.
  const isOAuthCallback = pathname.startsWith('/auth/github');

  useEffect(() => {
    if (!loading && user && !isOAuthCallback) {
      router.push('/');
    }
  }, [user, loading, router, isOAuthCallback]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && !isOAuthCallback) {
    return null;
  }

  return <>{children}</>;
}
