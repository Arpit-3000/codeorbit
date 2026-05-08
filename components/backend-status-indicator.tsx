"use client";

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api-client';

export function BackendStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkBackendStatus();
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      // Try to hit any endpoint to check if backend is alive
      await api.get('/auth/check', { timeout: 5000 });
      setStatus('online');
      setLastCheck(new Date());
    } catch (error: any) {
      // If it's a 404, backend is still running (just endpoint doesn't exist)
      if (error.response?.status === 404) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
      setLastCheck(new Date());
    }
  };

  // Don't show anything if backend is online
  if (status === 'online') {
    return null;
  }

  // Show checking state briefly
  if (status === 'checking') {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking Backend Status...</AlertTitle>
        <AlertDescription>
          Verifying connection to server...
        </AlertDescription>
      </Alert>
    );
  }

  // Show offline warning
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Backend Server Offline</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Cannot connect to backend server on port 5000.</p>
        <div className="mt-2 text-sm">
          <p className="font-semibold">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1 mt-1">
            <li>Open terminal in <code className="bg-muted px-1 rounded">codeorbit_backend</code> folder</li>
            <li>Run: <code className="bg-muted px-1 rounded">npm run dev</code></li>
            <li>Wait for "Server running on port 5000"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
        <button
          onClick={checkBackendStatus}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Check Again
        </button>
      </AlertDescription>
    </Alert>
  );
}
