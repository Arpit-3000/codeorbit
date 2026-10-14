"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { connectGithubOAuth } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function GithubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing GitHub authorization...');

  // React runs effects twice in development; a GitHub code is single-use, so only ever start once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const handleCallback = async () => {
      try {
        // Get OAuth code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Verify the `state` we sent matches what came back (CSRF protection)
        const returnedState = searchParams.get('state');
        let expectedState: string | null = null;
        try {
          expectedState = sessionStorage.getItem('github_oauth_state');
          sessionStorage.removeItem('github_oauth_state');
        } catch {}
        if (code && (!expectedState || returnedState !== expectedState)) {
          setStatus('error');
          setMessage('This sign-in link did not start from this browser session, so it was rejected for your safety. Please start the GitHub connection again.');
          setTimeout(() => router.push('/profile'), 4000);
          return;
        }

        console.log('[GITHUB OAUTH] Callback received');
        console.log('[GITHUB OAUTH] Code:', code ? 'Present' : 'Missing');
        console.log('[GITHUB OAUTH] Error:', error);

        // Handle OAuth errors
        if (error) {
          console.error('[GITHUB OAUTH] Authorization error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Authorization was denied or failed');
          
          toast({
            title: 'Authorization Failed',
            description: errorDescription || 'GitHub authorization was denied',
            variant: 'destructive',
          });

          setTimeout(() => router.push('/profile'), 3000);
          return;
        }

        // Check if code is present
        if (!code) {
          console.error('[GITHUB OAUTH] No authorization code received');
          setStatus('error');
          setMessage('No authorization code received from GitHub');
          
          toast({
            title: 'Error',
            description: 'No authorization code received',
            variant: 'destructive',
          });

          setTimeout(() => router.push('/profile'), 3000);
          return;
        }

        // Send code to backend
        console.log('[GITHUB OAUTH] Sending code to backend...');
        setMessage('Connecting your GitHub account...');

        const response = await connectGithubOAuth(code);
        
        console.log('[GITHUB OAUTH] ✅ Backend Response:', response);
        
        // Check if connection was successful
        if (!response.github || !response.github.username) {
          console.error('[GITHUB OAUTH] Invalid response - no GitHub data received');
          throw new Error('GitHub data not received from backend');
        }
        
        setStatus('success');
        setMessage('GitHub connected successfully!');

        toast({
          title: '✅ GitHub Connected',
          description: `Connected @${response.github.username} successfully!`,
        });

        // Show success stats
        console.log('[GITHUB OAUTH] GitHub Data:');
        console.log('- Username:', response.github.username);
        console.log('- Repos:', response.github.publicRepos);
        console.log('- Stars:', response.github.totalStars);
        console.log('- Contributions:', response.github.totalContributions);
        console.log('- Avatar:', response.github.avatar);

        // Wait a bit for backend to save, then redirect
        setTimeout(() => {
          console.log('[GITHUB OAUTH] Redirecting to profile...');
          router.push('/profile?refresh=true&github=connected');
        }, 2000);

      } catch (error: any) {
        console.error('[GITHUB OAUTH] ❌ Connection failed:', error);
        console.error('[GITHUB OAUTH] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setStatus('error');
        const detail = error.response?.data?.error as string | undefined;
        setMessage(
          [error.response?.data?.message || 'Failed to connect GitHub', detail].filter(Boolean).join(': ')
        );

        toast({
          title: 'Connection Failed',
          description: error.response?.data?.message || 'Failed to connect GitHub account',
          variant: 'destructive',
        });

        setTimeout(() => router.push('/profile'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div role="status" aria-live="polite" className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <p className="t-eyebrow">GitHub</p>
          <h1 className="t-display text-4xl">
            {status === 'processing' && 'Connecting…'}
            {status === 'success' && 'Connected.'}
            {status === 'error' && "That didn't work."}
          </h1>
        </div>

        <div className="flex items-start gap-3 border-l-2 border-border-strong pl-4">
          {status === 'processing' && <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle className="mt-0.5 size-4 shrink-0 text-success" />}
          {status === 'error' && <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
          <div className="space-y-1 text-sm">
            <p>{message}</p>
            <p className="text-xs text-muted-foreground">
              {status === 'processing' && 'Hang tight while we link your account and import your contributions.'}
              {status === 'success' && 'Taking you to your portfolio.'}
              {status === 'error' && 'Taking you back to your portfolio. You can try again from there.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
