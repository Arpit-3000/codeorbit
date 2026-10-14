"use client";

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Loader2, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/social/person';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  messages: any[];
  ready: boolean;
  typingUser: string | null;
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
  currentUserId: string;
  className?: string;
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * Chat as a transcript, not bubbles: consecutive messages from one person are grouped under a
 * single name and time, and the list follows new messages unless you've scrolled up to read.
 */
export function ChatPanel({ messages, ready, typingUser, input, onInput, onSend, currentUserId, className }: ChatPanelProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, typingUser]);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-3" role="log" aria-live="polite" aria-label="Room chat">
        {!ready ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Connecting to chat…
          </p>
        ) : messages.length === 0 ? (
          <div className="py-8">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Say hi, paste a problem link, or just start drawing.</p>
          </div>
        ) : (
          <ol className="space-y-0.5">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const grouped =
                prev &&
                prev.user?.id === msg.user?.id &&
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60_000;
              const mine = msg.user?.id === currentUserId;
              return (
                <li key={msg.id} className={cn('animate-fade-in', !grouped && i > 0 && 'pt-3')}>
                  {!grouped && (
                    <div className="mb-0.5 flex items-center gap-2">
                      <PersonAvatar person={{ displayName: msg.user?.name, photoURL: msg.user?.image }} size="sm" />
                      <span className={cn('text-[13px] font-medium', mine && 'text-primary')}>{mine ? 'You' : msg.user?.name || 'User'}</span>
                      <span className="t-num text-[11px] text-faint">{timeOf(msg.created_at)}</span>
                    </div>
                  )}
                  <p className="break-words pl-9 text-sm leading-relaxed">{msg.text}</p>
                </li>
              );
            })}
          </ol>
        )}
        {typingUser && (
          <p className="mt-3 flex items-center gap-2 pl-9 text-xs text-muted-foreground" aria-live="polite">
            <span className="flex gap-0.5" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-1 rounded-full bg-muted-foreground" style={{ animation: `fade-in 0.8s ease-in-out ${d * 150}ms infinite alternate` }} />
              ))}
            </span>
            {typingUser} is typing
          </p>
        )}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <Input
          placeholder={ready ? 'Message the room' : 'Connecting…'}
          aria-label="Message"
          value={input}
          onChange={(e) => onInput(e.target.value)}
          disabled={!ready}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!ready || !input.trim()} aria-label="Send message">
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
