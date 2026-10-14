"use client";

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api-client';

/** Silent while the API is reachable; a slim banner with a retry once it isn't. */
export function BackendStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [retrying, setRetrying] = useState(false);

  const check = useCallback(async () => {
    try {
      await api.get('/auth/check', { timeout: 5000 });
      setStatus('online');
    } catch (error: any) {
      // A 404 still means the server answered
      setStatus(error.response?.status === 404 ? 'online' : 'offline');
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  if (status !== 'offline') return null;

  return (
    <div role="alert" className="mb-6 flex flex-col gap-3 border-l-2 border-destructive bg-destructive/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="text-sm">
          <p className="font-medium">Can't reach the CodeOrbit server</p>
          <p className="text-xs text-muted-foreground">
            Friends, pings and rooms need a live connection. We check again every 30 seconds. If you're running locally, make sure the backend is up on port 5000.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={retrying}
        onClick={async () => {
          setRetrying(true);
          await check();
          setRetrying(false);
        }}
      >
        <RotateCw className={retrying ? 'animate-spin' : ''} /> Check now
      </Button>
    </div>
  );
}
