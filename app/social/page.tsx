"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader, Segmented, StatusDot } from '@/components/ds/primitives';
import { UserSearchSection } from '@/components/social/user-search-section';
import { FriendsListSection } from '@/components/social/friends-list-section';
import { NotificationsSection } from '@/components/social/notifications-section';
import { PingRequestsSection } from '@/components/social/ping-requests-section';
import { RoomsSection } from '@/components/social/rooms-section';
import { BackendStatusIndicator } from '@/components/backend-status-indicator';

type PeopleView = 'friends' | 'requests' | 'discover';

/** `?tab=` values the notification bell and older links use. */
const TAB_TO_VIEW: Record<string, PeopleView | 'live'> = {
  search: 'discover',
  discover: 'discover',
  friends: 'friends',
  requests: 'requests',
  notifications: 'live',
  pings: 'live',
  rooms: 'live',
};

function CollabSpace() {
  const params = useSearchParams();
  const tab = params.get('tab') ?? '';
  const [view, setView] = useState<PeopleView>(() => {
    const t = TAB_TO_VIEW[tab];
    return t && t !== 'live' ? t : 'friends';
  });
  const [counts, setCounts] = useState({ friends: 0, requests: 0, online: 0 });
  const [pingCount, setPingCount] = useState(0);
  const liveRef = useRef<HTMLDivElement>(null);

  // Deep links to the live column scroll it into view (matters on mobile, where it stacks below).
  useEffect(() => {
    if (TAB_TO_VIEW[tab] === 'live') liveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tab]);

  const onCounts = useCallback((c: { friends: number; requests: number; online: number }) => setCounts(c), []);
  const onPingCount = useCallback((n: number) => setPingCount(n), []);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Collab Space"
        title="Work with people"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone={counts.online ? 'success' : 'neutral'} live={counts.online > 0} />
              <span className="t-num text-foreground">{counts.online}</span> friend{counts.online === 1 ? '' : 's'} online
            </span>
            {pingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <StatusDot tone="primary" live />
                {pingCount} ping{pingCount === 1 ? '' : 's'} waiting
              </span>
            )}
          </span>
        }
      />

      <BackendStatusIndicator />

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-12">
        {/* People */}
        <section aria-label="People" className="min-w-0 space-y-6 self-start rounded-lg border border-border bg-surface p-5 sm:p-6 lg:col-span-7">
          <Segmented
            label="People view"
            value={view}
            onChange={setView}
            options={[
              { value: 'friends', label: `Friends · ${counts.friends}` },
              { value: 'requests', label: counts.requests ? `Requests · ${counts.requests}` : 'Requests' },
              { value: 'discover', label: 'Discover' },
            ]}
          />
          {/* All views stay mounted so counts are live; only the active one is shown. */}
          <div hidden={view !== 'friends'}>
            <FriendsListSection view="friends" onCounts={onCounts} />
          </div>
          <div hidden={view !== 'requests'}>
            <FriendsListSection view="requests" onCounts={onCounts} />
          </div>
          <div hidden={view !== 'discover'}>
            <UserSearchSection />
          </div>
        </section>

        {/* Live */}
        <aside ref={liveRef} aria-label="Live activity" className="min-w-0 scroll-mt-24 space-y-5 lg:col-span-5">
          {[
            <PingRequestsSection key="pings" onCount={onPingCount} />,
            <RoomsSection key="rooms" />,
            <NotificationsSection key="notes" />,
          ].map((block) => (
            <div key={block.key} className="rounded-lg border border-border bg-surface p-5">
              {block}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default function SocialPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CollabSpace />
      </Suspense>
    </AppShell>
  );
}
