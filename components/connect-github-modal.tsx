"use client";

import { useState } from 'react';
import { Github, ExternalLink, Loader2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ds/primitives';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { connectGithub, disconnectGithub, refreshGithub } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

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
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const [username, setUsername] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);

  const cleaned = username.trim().replace(/^@/, '');
  const validFormat = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(cleaned);

  const handleConnect = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validFormat) {
      setConnectError('Enter a valid GitHub username: letters, numbers and single hyphens, up to 39 characters.');
      return;
    }
    try {
      setLoading(true);
      setAction('connect');
      setConnectError(null);
      const res = await connectGithub(cleaned);
      toast({
        title: 'GitHub connected',
        description: `Linked @${res.github?.username ?? cleaned} and imported your contributions.`,
      });
      setUsername('');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[GITHUB] Connect failed:', error);
      setConnectError(
        error.response?.data?.message ||
          (error.message === 'Network Error' ? "Can't reach the CodeOrbit server. Is the backend running?" : 'Failed to connect GitHub')
      );
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleDisconnect = async () => {
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
      setConfirmDisconnect(false);
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) setConfirmDisconnect(false); onOpenChange(o); }}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="space-y-1.5 border-b border-border px-6 py-5">
          <DialogTitle className="t-display text-3xl">GitHub</DialogTitle>
          <DialogDescription>
            {githubData ? 'Your connection and what we have stored from it.' : 'Type your username to add your repositories, stars and contribution history.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {!githubData ? (
            <form onSubmit={handleConnect} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="github-username">GitHub username</Label>
                <div className="relative">
                  <Github className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="github-username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setConnectError(null);
                    }}
                    placeholder="octocat"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    aria-invalid={!!connectError}
                    aria-describedby="github-username-help"
                    className="pl-9"
                  />
                </div>
                {connectError ? (
                  <p id="github-username-help" role="alert" className="flex items-start gap-2 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {connectError}
                  </p>
                ) : (
                  <p id="github-username-help" className="text-xs text-muted-foreground">
                    The name in your profile URL: github.com/<span className="text-foreground">{cleaned || 'username'}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <p className="t-eyebrow">What CodeOrbit reads</p>
                <ul className="space-y-2 text-muted-foreground">
                  {['Your public profile', 'Repository star counts', 'Contribution totals and your activity calendar'].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <Check className="size-3.5 shrink-0 text-success" /> {t}
                    </li>
                  ))}
                </ul>
                <p className="pt-1 text-xs text-faint">Public information only. No GitHub login or permissions are requested.</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !cleaned}>
                {loading && action === 'connect' ? <Loader2 className="animate-spin" /> : <Github />}
                {loading && action === 'connect' ? 'Importing your GitHub…' : 'Connect GitHub'}
              </Button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="size-14 rounded-md after:rounded-md">
                  <AvatarImage className="rounded-md" src={githubData.avatar} alt={githubData.username} />
                  <AvatarFallback className="rounded-md">{githubData.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <StatusDot tone="success" /> @{githubData.username}
                  </p>
                  <a
                    href={`https://github.com/${githubData.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    View on GitHub <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5">
                {[
                  ['Contributions', githubData.totalContributions],
                  ['Repositories', githubData.publicRepos],
                  ['Stars', githubData.totalStars],
                  ['Followers', githubData.followers],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="t-eyebrow">{k}</dt>
                    <dd className="t-num mt-1.5 text-2xl">{Number(v ?? 0).toLocaleString()}</dd>
                  </div>
                ))}
              </dl>

              {confirmDisconnect ? (
                <div role="alert" className="space-y-3 border-l-2 border-destructive bg-destructive/8 px-4 py-3">
                  <p className="text-sm">Remove GitHub and its stats from CodeOrbit? You can reconnect later.</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={loading}>
                      {loading && action === 'disconnect' && <Loader2 className="animate-spin" />}
                      Yes, disconnect
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(false)} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={loading && action === 'refresh' ? 'animate-spin' : ''} />
                    {loading && action === 'refresh' ? 'Refreshing' : 'Refresh data'}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDisconnect(true)} disabled={loading} className="text-muted-foreground hover:text-destructive">
                    Disconnect
                  </Button>
                </div>
              )}

              {githubData.connectedAt && (
                <p className="text-xs text-faint">Connected {new Date(githubData.connectedAt).toLocaleDateString()}</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
