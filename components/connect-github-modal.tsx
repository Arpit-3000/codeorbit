"use client";

import { useState } from 'react';
import { Github, ExternalLink, Loader2, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { disconnectGithub, refreshGithub } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
// Use API route as callback - GitHub will call this, which redirects to the page
const REDIRECT_URI = `${FRONTEND_URL}/api/auth/callback/github`;

interface GitHubData {
  username: string;
  avatar: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalStars: number;
  totalContributions: number;
  connectedAt?: string;
}

interface ConnectGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  githubData: GitHubData | null;
  onUpdate: () => void;
}

export function ConnectGithubModal({ 
  open, 
  onOpenChange, 
  githubData,
  onUpdate 
}: ConnectGithubModalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'connect' | 'disconnect' | 'refresh' | null>(null);

  const handleConnect = () => {
    console.log('[GITHUB OAUTH] Initiating OAuth flow');
    console.log('[GITHUB OAUTH] Client ID:', GITHUB_CLIENT_ID ? 'Present' : 'Missing');
    console.log('[GITHUB OAUTH] Redirect URI:', REDIRECT_URI);

    if (!GITHUB_CLIENT_ID || GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID_HERE') {
      toast({
        title: 'Configuration Error',
        description: 'GitHub Client ID not configured. Please add NEXT_PUBLIC_GITHUB_CLIENT_ID to .env.local',
        variant: 'destructive',
      });
      return;
    }

    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    githubAuthUrl.searchParams.set('scope', 'read:user,repo');
    githubAuthUrl.searchParams.set('state', Math.random().toString(36).substring(7)); // CSRF protection

    console.log('[GITHUB OAUTH] Redirecting to:', githubAuthUrl.toString());

    // Redirect to GitHub
    window.location.href = githubAuthUrl.toString();
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect GitHub? This will remove all your GitHub data.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setAction('disconnect');
      console.log('[GITHUB] Disconnecting...');

      await disconnectGithub();

      console.log('[GITHUB] ✅ Disconnected successfully');

      toast({
        title: 'GitHub Disconnected',
        description: 'Your GitHub account has been disconnected',
      });

      onUpdate(); // Refresh user data
      onOpenChange(false);
    } catch (error: any) {
      console.error('[GITHUB] Disconnect failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to disconnect GitHub',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setAction('refresh');
      console.log('[GITHUB] Refreshing data...');

      const response = await refreshGithub();

      console.log('[GITHUB] ✅ Refreshed successfully');

      toast({
        title: 'Data Refreshed',
        description: 'Your GitHub data has been updated',
      });

      onUpdate(); // Refresh user data
    } catch (error: any) {
      console.error('[GITHUB] Refresh failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to refresh GitHub data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Connection
          </DialogTitle>
          <DialogDescription>
            {githubData 
              ? 'Manage your GitHub connection' 
              : 'Connect your GitHub account to track contributions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!githubData ? (
            // Not Connected State
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="p-4 rounded-full bg-muted">
                  <Github className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Connect Your GitHub</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your repositories, contributions, and stars
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What we'll access:</p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Public profile information
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Repository data
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Contribution statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                    Private repository access
                  </li>
                </ul>
              </div>

              <Button
                className="w-full"
                onClick={handleConnect}
                disabled={loading}
              >
                <Github className="h-4 w-4 mr-2" />
                Connect with GitHub
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            // Connected State
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={githubData.avatar} alt={githubData.username} />
                  <AvatarFallback>
                    {githubData.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">@{githubData.username}</p>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <a
                    href={`https://github.com/${githubData.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{githubData.publicRepos}</p>
                  <p className="text-xs text-muted-foreground">Repositories</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{githubData.totalStars}</p>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{githubData.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{githubData.totalContributions}</p>
                  <p className="text-xs text-muted-foreground">Contributions</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading && action === 'refresh' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Github className="h-4 w-4 mr-2" />
                  )}
                  Refresh Data
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading && action === 'disconnect' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>

              {githubData.connectedAt && (
                <p className="text-xs text-center text-muted-foreground">
                  Connected on {new Date(githubData.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
