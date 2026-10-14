"use client";

import { useState, useEffect, useMemo } from 'react';
import { Building2, Github, GitFork, Globe, MapPin, RefreshCw, Star, Twitter, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState, ErrorState, Section, Segmented, Stat, StatusDot, timeAgo } from '@/components/ds/primitives';
import { YearHeatmap } from '@/components/dashboard/year-heatmap';
import { getGithubStatus, refreshGithub, disconnectGithub, type GithubProfile, type GithubRepo } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ConnectGithubModal } from './connect-github-modal';

const n = (v: number | undefined | null) => (v ?? 0).toLocaleString();

/** Current and longest streak, active days and best day from the contribution calendar. */
function streaks(days: { date: string; count: number }[]) {
  let longest = 0;
  let run = 0;
  let best = { date: '', count: 0 };
  let active = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      active++;
      longest = Math.max(longest, run);
    } else run = 0;
    if (d.count > best.count) best = d;
  }
  // today may legitimately still be empty, so a streak is allowed to end yesterday
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }
  return { current, longest, active, best };
}

const TYPE_ROWS = [
  { key: 'commits', label: 'Commits', tone: 'var(--chart-1)' },
  { key: 'pullRequests', label: 'Pull requests', tone: 'var(--chart-2)' },
  { key: 'reviews', label: 'Code reviews', tone: 'var(--chart-3)' },
  { key: 'issues', label: 'Issues', tone: 'var(--chart-4)' },
] as const;

function RepoRow({ r }: { r: GithubRepo }) {
  return (
    <li>
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="group block border-b border-border py-3.5 outline-offset-[-2px]">
        <span className="flex items-baseline justify-between gap-4">
          <span className="truncate text-sm font-medium group-hover:text-primary">{r.name}</span>
          <span className="t-num flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3" /> {n(r.stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="size-3" /> {n(r.forks)}
            </span>
          </span>
        </span>
        {r.description && <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted-foreground">{r.description}</span>}
        <span className="mt-2 flex items-center gap-3 text-xs text-faint">
          {r.language && (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: r.languageColor || 'var(--chart-5)' }} />
              {r.language}
            </span>
          )}
          {r.pushedAt && <span>Updated {timeAgo(r.pushedAt)}</span>}
        </span>
      </a>
    </li>
  );
}

export function GithubStatus() {
  const [githubData, setGithubData] = useState<GithubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [repoView, setRepoView] = useState<'pinned' | 'top'>('pinned');

  useEffect(() => {
    fetchGithubStatus();
  }, []);

  const fetchGithubStatus = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const response = await getGithubStatus();
      setGithubData(response.connected && response.github ? response.github : null);
    } catch (error: any) {
      console.error('[GITHUB STATUS] Error:', error);
      setGithubData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setActionLoading(true);
      await refreshGithub();
      await fetchGithubStatus();
      toast({ title: 'GitHub refreshed', description: 'Your profile, repositories and contributions are up to date.' });
    } catch (error: any) {
      console.error('[GITHUB STATUS] Refresh failed:', error);
      toast({
        title: "Couldn't refresh GitHub",
        description: error.response?.data?.error || error.response?.data?.message || 'Failed to refresh GitHub data',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      await disconnectGithub();
      setGithubData(null);
      toast({ title: 'GitHub disconnected', description: 'Your GitHub account has been disconnected' });
    } catch (error: any) {
      console.error('[GITHUB STATUS] Disconnect failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to disconnect GitHub',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  };

  const days = githubData?.days ?? [];
  const st = useMemo(() => streaks(days), [days]);

  if (loading && !githubData) {
    return (
      <div className="space-y-10" aria-busy="true" aria-label="Loading GitHub">
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 rounded-md" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        compact
        title="Couldn't load GitHub"
        description="The server didn't respond. Your connection hasn't been changed."
        onRetry={fetchGithubStatus}
      />
    );
  }

  if (!githubData) {
    return (
      <>
        <EmptyState
          icon={<Github className="size-4" />}
          title="GitHub isn't connected"
          description="Add your username to see repositories, languages, stars, pull requests and your full contribution calendar."
          action={
            <Button onClick={() => setConnectModalOpen(true)}>
              <Github /> Connect GitHub
            </Button>
          }
        />
        <ConnectGithubModal open={connectModalOpen} onOpenChange={setConnectModalOpen} githubData={null} onUpdate={fetchGithubStatus} />
      </>
    );
  }

  const g = githubData;
  const c = g.contributions;
  const typeTotal = c ? TYPE_ROWS.reduce((s, r) => s + (c[r.key] || 0), 0) : 0;
  const hasPinned = (g.pinned?.length ?? 0) > 0;
  const hasTop = (g.topRepos?.length ?? 0) > 0;
  const shownView = repoView === 'pinned' && !hasPinned ? 'top' : repoView === 'top' && !hasTop ? 'pinned' : repoView;
  const repos = (shownView === 'pinned' ? g.pinned : g.topRepos) ?? [];
  const websiteHref = g.blog ? (/^https?:\/\//.test(g.blog) ? g.blog : `https://${g.blog}`) : null;
  const joined = g.githubCreatedAt ? new Date(g.githubCreatedAt).getFullYear() : null;

  return (
    <>
      <div className="space-y-14">
        {/* Identity */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="size-20 rounded-md after:rounded-md">
            <AvatarImage className="rounded-md" src={g.avatar} alt={g.username} />
            <AvatarFallback className="rounded-md">{g.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="t-display text-3xl leading-tight">{g.name || g.username}</h3>
              <a
                href={g.profileUrl || `https://github.com/${g.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="t-num inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <StatusDot tone="success" /> @{g.username}
              </a>
            </div>
            {g.bio && <p className="max-w-2xl text-[15px] leading-relaxed">{g.bio}</p>}
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {g.company && (
                <li className="flex items-center gap-1.5"><Building2 className="size-3.5" /> {g.company}</li>
              )}
              {g.location && (
                <li className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {g.location}</li>
              )}
              {websiteHref && (
                <li>
                  <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                    <Globe className="size-3.5" /> {g.blog}
                  </a>
                </li>
              )}
              {g.twitter && (
                <li>
                  <a href={`https://twitter.com/${g.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                    <Twitter className="size-3.5" /> @{g.twitter}
                  </a>
                </li>
              )}
              {joined && <li>On GitHub since {joined}</li>}
              {g.hireable && <li className="text-success">Open to work</li>}
            </ul>
          </div>

          <div className="flex gap-2 sm:flex-col">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={actionLoading}>
              <RefreshCw className={actionLoading ? 'animate-spin' : ''} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} disabled={actionLoading}>
              <Unplug /> Disconnect
            </Button>
          </div>
        </div>

        {g.needsRefresh && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-primary bg-primary-soft px-4 py-3">
            <p className="text-sm">
              <span className="font-medium">More is available.</span>{' '}
              <span className="text-muted-foreground">This connection was made before languages, pull requests, repositories and organisations were imported.</span>
            </p>
            <Button size="sm" onClick={handleRefresh} disabled={actionLoading}>
              <RefreshCw className={actionLoading ? 'animate-spin' : ''} /> Import now
            </Button>
          </div>
        )}

        {/* Headline numbers */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
          <Stat label="Contributions" value={n(g.totalContributions)} hint="past year" tone="primary" />
          <Stat label="Repositories" value={n(g.publicRepos)} hint={g.publicGists ? `${n(g.publicGists)} gists` : 'public'} />
          <Stat label="Stars earned" value={n(g.totalStars)} hint={g.totalForks !== undefined ? `${n(g.totalForks)} forks` : undefined} />
          <Stat label="Followers" value={n(g.followers)} hint={`${n(g.following)} following`} />
          {g.pullRequestsTotal !== undefined && <Stat label="Pull requests" value={n(g.pullRequestsTotal)} hint="all time" />}
          {g.issuesTotal !== undefined && <Stat label="Issues opened" value={n(g.issuesTotal)} hint="all time" />}
          {days.length > 0 && <Stat label="Current streak" value={st.current} unit="days" tone={st.current > 0 ? 'primary' : 'default'} />}
          {days.length > 0 && <Stat label="Longest streak" value={st.longest} unit="days" hint="past year" />}
        </div>

        {/* Calendar */}
        {days.length > 0 && (
          <Section
            title="Contribution calendar"
            aside={
              st.best.count > 0
                ? `busiest day: ${st.best.count} on ${new Date(st.best.date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} · ${st.active} active days`
                : undefined
            }
          >
            <YearHeatmap data={days} />
          </Section>
        )}

        {/* How the work is spread */}
        {(c || (g.languages?.length ?? 0) > 0) && (
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
            {c && typeTotal > 0 && (
              <Section title="What you contribute" eyebrow="past year">
                <div className="space-y-5">
                  <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm" role="img" aria-label={TYPE_ROWS.map((r) => `${r.label} ${c[r.key]}`).join(', ')}>
                    {TYPE_ROWS.filter((r) => c[r.key] > 0).map((r) => (
                      <span key={r.key} className="animate-draw-bar h-full" style={{ width: `${(c[r.key] / typeTotal) * 100}%`, background: r.tone }} title={`${r.label}: ${c[r.key]}`} />
                    ))}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {TYPE_ROWS.map((r) => (
                      <div key={r.key}>
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="size-2 rounded-[2px]" style={{ background: r.tone }} /> {r.label}
                        </dt>
                        <dd className="t-num mt-1 text-xl">{n(c[r.key])}</dd>
                        <dd className="t-num text-xs text-faint">{Math.round((c[r.key] / typeTotal) * 100)}%</dd>
                      </div>
                    ))}
                  </dl>
                  {c.private > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Plus <span className="t-num text-foreground">{n(c.private)}</span> private contributions that GitHub counts but doesn't detail.
                    </p>
                  )}
                </div>
              </Section>
            )}

            {(g.languages?.length ?? 0) > 0 && (
              <Section title="Languages" eyebrow="by code written">
                <div className="space-y-5">
                  <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm" role="img" aria-label={g.languages!.map((l) => `${l.name} ${l.percent}%`).join(', ')}>
                    {g.languages!.map((l) => (
                      <span key={l.name} className="animate-draw-bar h-full" style={{ width: `${Math.max(l.percent, 1)}%`, background: l.color || 'var(--chart-5)' }} title={`${l.name}: ${l.percent}%`} />
                    ))}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                    {g.languages!.map((l) => (
                      <li key={l.name} className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: l.color || 'var(--chart-5)' }} />
                        <span className="truncate">{l.name}</span>
                        <span className="t-num ml-auto text-xs text-muted-foreground">{l.percent}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Repositories */}
        {(hasPinned || hasTop) && (
          <Section
            title="Repositories"
            aside={
              hasPinned && hasTop ? (
                <Segmented
                  label="Repository list"
                  size="sm"
                  value={shownView}
                  onChange={setRepoView}
                  options={[
                    { value: 'pinned', label: 'Pinned' },
                    { value: 'top', label: 'Most starred' },
                  ]}
                />
              ) : (
                shownView === 'pinned' ? 'pinned' : 'most starred'
              )
            }
          >
            <ul className="grid gap-x-12 lg:grid-cols-2 [&>li:last-child]:border-b-0">{repos.map((r) => <RepoRow key={r.url} r={r} />)}</ul>
          </Section>
        )}

        {/* Organisations */}
        {(g.organizations?.length ?? 0) > 0 && (
          <Section title="Organisations" aside={`${g.organizations!.length}`}>
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {g.organizations!.map((o) => (
                <li key={o.login}>
                  <a href={o.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5">
                    <Avatar className="size-8 rounded-md after:rounded-md">
                      <AvatarImage className="rounded-md" src={o.avatar} alt="" />
                      <AvatarFallback className="rounded-md text-xs">{o.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm group-hover:text-primary">{o.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className={cn('text-xs text-faint')}>
          {g.lastFetched ? `Updated ${timeAgo(g.lastFetched)}` : 'Not refreshed since connecting'}
          {g.connectedAt && ` · connected ${new Date(g.connectedAt).toLocaleDateString()}`}
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your GitHub stats and contribution history from CodeOrbit. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep connected</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConnectGithubModal open={connectModalOpen} onOpenChange={setConnectModalOpen} githubData={githubData} onUpdate={fetchGithubStatus} />
    </>
  );
}
