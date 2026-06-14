"use client";

import { useState, useEffect } from 'react';
import { Github, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getGithubStatus, refreshGithub, disconnectGithub } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ConnectGithubModal } from './connect-github-modal';

export function GithubStatus() {
  const [githubData, setGithubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  useEffect(() => {
    fetchGithubStatus();
  }, []);

  const fetchGithubStatus = async () => {
    try {
      setLoading(true);
      console.log('[GITHUB STATUS] Fetching status...');
      
      const response = await getGithubStatus();
      console.log('[GITHUB STATUS] Response:', response);
      
      if (response.connected && response.github) {
        setGithubData(response.github);
        console.log('[GITHUB STATUS] ✅ Connected:', response.github.username);
      } else {
        setGithubData(null);
        console.log('[GITHUB STATUS] Not connected');
      }
    } catch (error: any) {
      console.error('[GITHUB STATUS] ❌ Error:', error);
      setGithubData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setActionLoading(true);
      console.log('[GITHUB STATUS] Refreshing data...');
      
      await refreshGithub();
      await fetchGithubStatus();
      
      toast({
        title: 'Data Refreshed',
        description: 'Your GitHub data has been updated',
      });
    } catch (error: any) {
      console.error('[GITHUB STATUS] Refresh failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to refresh GitHub data',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect GitHub? This will remove all your GitHub data.'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      console.log('[GITHUB STATUS] Disconnecting...');
      
      await disconnectGithub();
      setGithubData(null);
      
      toast({
        title: 'GitHub Disconnected',
        description: 'Your GitHub account has been disconnected',
      });
    } catch (error: any) {
      console.error('[GITHUB STATUS] Disconnect failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to disconnect GitHub',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!githubData) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub
            </CardTitle>
            <CardDescription>
              Connect your GitHub account to track contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="p-4 rounded-full bg-muted">
                <Github className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Not Connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your repositories, contributions, and stars
                </p>
              </div>
              <Button onClick={() => setConnectModalOpen(true)}>
                <Github className="h-4 w-4 mr-2" />
                Connect GitHub
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConnectGithubModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
          githubData={null}
          onUpdate={fetchGithubStatus}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub
                <Badge variant="outline" className="text-green-500 border-green-500">
                  Connected
                </Badge>
              </CardTitle>
              <CardDescription>@{githubData.username}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={actionLoading}
              >
                <Unplug className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={githubData.avatar} alt={githubData.username} />
              <AvatarFallback>
                {githubData.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">@{githubData.username}</p>
              <a
                href={`https://github.com/${githubData.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Profile →
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{githubData.publicRepos || 0}</p>
              <p className="text-xs text-muted-foreground">Repositories</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{githubData.totalStars || 0}</p>
              <p className="text-xs text-muted-foreground">Stars</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{githubData.followers || 0}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{githubData.totalContributions || 0}</p>
              <p className="text-xs text-muted-foreground">Contributions</p>
            </div>
          </div>

          {githubData.connectedAt && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Connected on {new Date(githubData.connectedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      <ConnectGithubModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        githubData={githubData}
        onUpdate={fetchGithubStatus}
      />
    </>
  );
}
