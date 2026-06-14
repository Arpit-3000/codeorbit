"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { connectGithubOAuth } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function GithubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing GitHub authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get OAuth code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

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
        
        console.log('[GITHUB OAUTH] ✅ Success:', response);
        setStatus('success');
        setMessage('GitHub connected successfully!');

        toast({
          title: '✅ GitHub Connected',
          description: `Connected @${response.github?.username || 'your account'} successfully!`,
        });

        // Show success stats
        if (response.github) {
          console.log('[GITHUB OAUTH] Stats:');
          console.log('- Username:', response.github.username);
          console.log('- Repos:', response.github.publicRepos);
          console.log('- Stars:', response.github.totalStars);
          console.log('- Contributions:', response.github.totalContributions);
        }

        // Redirect to profile after 2 seconds with refresh flag
        setTimeout(() => {
          router.push('/profile?refresh=true');
        }, 2000);

      } catch (error: any) {
        console.error('[GITHUB OAUTH] ❌ Connection failed:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to connect GitHub');

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle>GitHub OAuth</CardTitle>
          <CardDescription>
            {status === 'processing' && 'Processing your GitHub authorization'}
            {status === 'success' && 'Successfully connected GitHub'}
            {status === 'error' && 'Failed to connect GitHub'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {status === 'processing' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
          
          <p className="text-center text-muted-foreground">
            {message}
          </p>

          {status === 'processing' && (
            <p className="text-sm text-center text-muted-foreground">
              Please wait while we connect your account...
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecting to your profile...
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecting back to profile...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
