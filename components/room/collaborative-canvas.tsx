"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eraser, Pencil, Trash2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
import { StatusDot } from '@/components/ds/primitives';
import { useRoomSync, type JoinAck } from './room-sync';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Realtime shared whiteboard.
 *
 * How it stays consistent (the server half is services/whiteboard.service.js):
 *  - Every committed object (stroke, erase, text) gets a global `seq` from the server. Everyone renders in `seq`
 *    order, so overlapping strokes look identical on every screen.
 *  - Your own strokes are drawn instantly (optimistic) and streamed to peers as small volatile chunks while you
 *    draw, so they see the line grow with no end-of-stroke delay. The final commit carries the full stroke, so a
 *    dropped chunk can never corrupt the board.
 *  - Nobody uploads the whole board; there is nothing to overwrite.
 *  - A text object can be edited by one person at a time (server-held lock); others see who is editing it.
 *  - If the connection drops, unsent work is kept and replayed (idempotently, by id) after the socket rejoins.
 */

interface CollaborativeCanvasProps {
  roomId: string;
}

interface StrokeItem {
  id: string;
  kind: 'stroke' | 'erase';
  points: number[]; // flattened [x1, y1, x2, y2, ...] in board units
  color: string;
  width: number;
  seq: number;
}
interface TextItem {
  id: string;
  kind: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  seq: number;
}
type Item = StrokeItem | TextItem;

interface LiveStroke {
  kind: 'stroke' | 'erase';
  color: string;
  width: number;
  pts: number[];
  overlapped: boolean;
}

type Tool = 'pen' | 'eraser' | 'text';

/** Logical board size. Everything is stored in these units so every client, at any panel size, agrees. */
const BOARD_W = 800;
const BOARD_H = 600;
/** Backing-store resolution multiplier, so lines stay crisp on high-DPI screens. */
const RES = 2;
const ERASER_WIDTH = 20;
const PENDING = Number.MAX_SAFE_INTEGER;
const CHUNK_MS = 25;
const TEXT_SYNC_MS = 60;
const LOCK_HEARTBEAT_MS = 8000;
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const LINE_HEIGHT = 1.25;

const SWATCHES = ['#1a1814', '#c2410c', '#0f766e', '#1d4ed8', '#be123c'];

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const textSize = (lineWidth: number) => 12 + lineWidth * 3;

/** Draw one stroke / erase onto a context already scaled to board units. */
function paintStroke(c: CanvasRenderingContext2D, kind: 'stroke' | 'erase', pts: number[], color: string, width: number) {
  if (pts.length < 2) return;
  c.globalCompositeOperation = kind === 'erase' ? 'destination-out' : 'source-over';
  c.strokeStyle = color;
  c.lineWidth = kind === 'erase' ? ERASER_WIDTH : width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  if (pts.length === 2) c.lineTo(pts[0] + 0.01, pts[1]); // a tap leaves a dot
  c.stroke();
  c.globalCompositeOperation = 'source-over';
}

function textBox(c: CanvasRenderingContext2D, t: TextItem) {
  c.font = `${t.size}px ${FONT}`;
  const lines = t.text.split('\n');
  const w = Math.max(24, ...lines.map((l) => c.measureText(l).width));
  return { x: t.x, y: t.y, w, h: Math.max(1, lines.length) * t.size * LINE_HEIGHT };
}

function paintText(c: CanvasRenderingContext2D, t: TextItem) {
  if (!t.text) return;
  c.globalCompositeOperation = 'source-over';
  c.font = `${t.size}px ${FONT}`;
  c.fillStyle = t.color;
  c.textBaseline = 'top';
  t.text.split('\n').forEach((line, i) => c.fillText(line, t.x, t.y + i * t.size * LINE_HEIGHT));
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: BOARD_W, h: BOARD_H });
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(SWATCHES[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [itemCount, setItemCount] = useState(0);
  const sync = useRoomSync();
  const status = sync.status;
  const [confirmClear, setConfirmClear] = useState(false);
  const [editor, setEditor] = useState<{ id: string; x: number; y: number; size: number; color: string; text: string } | null>(null);

  // Everything the pointer path touches lives in refs: a pointer move must not re-render React.
  const socketRef = useRef(sync.socket);
  socketRef.current = sync.socket;
  const joined = sync.joinedRef;
  const me = useRef<{ id: string; name: string } | null>(null);
  const items = useRef<Item[]>([]);
  const live = useRef<Map<string, LiveStroke>>(new Map());
  const locks = useRef<Map<string, { userId: string; name: string }>>(new Map());
  const local = useRef<{ id: string; kind: 'stroke' | 'erase'; color: string; width: number; pts: number[]; unsent: number[]; overlapped: boolean } | null>(null);
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const toolRef = useRef({ tool, color, lineWidth });
  toolRef.current = { tool, color, lineWidth };
  const fitRef = useRef(fit);
  fitRef.current = fit;

  // Work that still has to reach the server (idempotent by id, replayed after a reconnect).
  const pendingOps = useRef<Map<string, () => Promise<void>>>(new Map());
  const pendingTextFinal = useRef<Set<string>>(new Set());
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redrawQueued = useRef(false);

  /* ----------------------------- rendering ----------------------------- */

  const ctx = () => {
    const c = canvasRef.current?.getContext('2d') ?? null;
    c?.setTransform(RES, 0, 0, RES, 0, 0);
    return c;
  };

  /** Repaint everything in server order, then live strokes, then your in-progress stroke. */
  const paintAll = useCallback((c: CanvasRenderingContext2D, overlays: boolean) => {
    c.clearRect(0, 0, BOARD_W, BOARD_H);
    const editing = editorRef.current?.id;
    for (const it of items.current) {
      if (it.kind === 'text') {
        if (it.id !== editing) paintText(c, it);
      } else paintStroke(c, it.kind, it.points, it.color, it.width);
    }
    live.current.forEach((s) => paintStroke(c, s.kind, s.pts, s.color, s.width));
    const l = local.current;
    if (l) paintStroke(c, l.kind, l.pts, l.color, l.width);

    if (overlays) {
      // Show who is editing which text
      locks.current.forEach((lock, id) => {
        if (lock.userId === me.current?.id) return;
        const t = items.current.find((i) => i.id === id);
        if (!t || t.kind !== 'text') return;
        const b = textBox(c, t);
        c.save();
        c.strokeStyle = '#c2410c';
        c.lineWidth = 1;
        c.setLineDash([4, 3]);
        c.strokeRect(b.x - 4, b.y - 3, b.w + 8, b.h + 6);
        c.setLineDash([]);
        c.font = `11px ${FONT}`;
        c.textBaseline = 'bottom';
        c.fillStyle = '#c2410c';
        c.fillText(`${lock.name} is typing…`, b.x - 4, b.y - 5);
        c.restore();
      });
    }
  }, []);

  const redraw = useCallback(() => {
    if (redrawQueued.current) return;
    redrawQueued.current = true;
    requestAnimationFrame(() => {
      redrawQueued.current = false;
      const c = ctx();
      if (c) paintAll(c, true);
    });
  }, [paintAll]);

  const syncCount = () => setItemCount(items.current.filter((i) => i.kind !== 'text' || i.text.trim() || i.id === editorRef.current?.id).length);

  /** Insert keeping `seq` order. Returns true when it landed last (so it can be painted incrementally). */
  const insertItem = (item: Item): boolean => {
    const list = items.current;
    const existing = list.findIndex((i) => i.id === item.id);
    if (existing >= 0) list.splice(existing, 1);
    let idx = list.length;
    while (idx > 0 && list[idx - 1].seq > item.seq) idx--;
    list.splice(idx, 0, item);
    return idx === list.length - 1;
  };

  /* ----------------------------- transport ----------------------------- */

  const send = sync.send;

  /** Send now if connected; otherwise (or on failure) keep it and replay after the next join. */
  const submit = useCallback(
    async (key: string, run: () => Promise<{ ok: boolean; seq?: number }>, onOk?: (seq?: number) => void) => {
      const attempt = async () => {
        const ack = await run();
        if (ack.ok) {
          pendingOps.current.delete(key);
          onOk?.(ack.seq);
        } else throw new Error('retry');
      };
      pendingOps.current.set(key, attempt);
      try {
        await attempt();
      } catch {
        /* stays pending */
      }
    },
    []
  );

  const closeEditor = useCallback(() => {
    editorRef.current = null;
    setEditor(null);
    if (textTimer.current) {
      clearTimeout(textTimer.current);
      textTimer.current = null;
    }
  }, []);

  /* ----------------------------- lifecycle ----------------------------- */

  // Fit the 4:3 board inside whatever space the panel currently has.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const availW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const availH = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (availW <= 0 || availH <= 0) return;
      const w = Math.min(availW, (availH * BOARD_W) / BOARD_H);
      setFit({ w: Math.floor(w), h: Math.floor((w * BOARD_H) / BOARD_W) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const socket = sync.socket;
    if (!socket) return;
    let alive = true;
    const offs: Array<() => void> = [];
    // The socket is shared with the editor and call presence, so remove only our own listeners on cleanup.
    const on = (event: string, fn: (...args: any[]) => void) => {
      socket.on(event, fn);
      offs.push(() => socket.off(event, fn));
    };

    // Runs on every successful join (first connect and each reconnect)
    offs.push(
      sync.onJoined(async (ack: JoinAck) => {
        if (!alive) return;
        me.current = { id: ack.userId, name: ack.name };

        // The server snapshot is the truth. Keep only our not-yet-confirmed work on top of it.
        const unconfirmed = items.current.filter((i) => i.seq === PENDING && !(ack.items as Item[]).some((s) => s.id === i.id));
        items.current = [...(ack.items as Item[])].sort((a, b) => a.seq - b.seq).concat(unconfirmed);
        live.current.clear();
        locks.current = new Map((ack.locks as any[]).map((l) => [l.id, { userId: l.userId, name: l.name }]));
        syncCount();
        redraw();

        // Replay unsent work, then re-take the lock on a text we were editing when the link dropped.
        for (const run of [...pendingOps.current.values()]) await run().catch(() => {});
        const e = editorRef.current;
        if (e) {
          const res = await send('text:lock', { id: e.id });
          if (!res.ok) {
            closeEditor();
            toast({ title: 'Text is being edited', description: `${res.by || 'Someone'} took over this text while you were offline.` });
          }
        }
        for (const id of [...pendingTextFinal.current]) {
          const it = items.current.find((i) => i.id === id);
          if (it && it.kind === 'text') {
            await send('text:lock', { id });
            await send('text:update', { id, text: it.text, x: it.x, y: it.y, size: it.size, color: it.color });
            await send('text:release', { id });
          }
          pendingTextFinal.current.delete(id);
        }
      })
    );

    // A peer's stroke growing live
    on('stroke:chunk', (c: { id: string; kind: 'stroke' | 'erase'; color: string; width: number; start: boolean; pts: number[] }) => {
      let s = live.current.get(c.id);
      const ctx2 = ctx();
      if (!s) {
        s = { kind: c.kind, color: c.color, width: c.width, pts: [], overlapped: false };
        // Strokes that exist at the same time can interleave differently on each screen; mark them so we
        // re-render in committed order once they land.
        if (live.current.size > 0 || local.current) {
          s.overlapped = true;
          live.current.forEach((o) => (o.overlapped = true));
          if (local.current) local.current.overlapped = true;
        }
        live.current.set(c.id, s);
      }
      const from = s.pts.length >= 2 ? s.pts.slice(-2) : [];
      s.pts.push(...c.pts);
      if (ctx2) paintStroke(ctx2, s.kind, [...from, ...c.pts], s.color, s.width);
    });

    on('op:add', (item: Item) => {
      const l = live.current.get(item.id);
      live.current.delete(item.id);
      const wasLast = insertItem(item);
      if (item.kind === 'text' || !wasLast || l?.overlapped) redraw();
      else if (!l) {
        const c = ctx();
        if (c) paintStroke(c, item.kind, item.points, item.color, item.width);
      }
      syncCount();
    });

    on('op:update', (u: { id: string; text: string; x: number; y: number; size: number; color: string }) => {
      const it = items.current.find((i) => i.id === u.id);
      if (it && it.kind === 'text') Object.assign(it, u);
      redraw();
      syncCount();
    });

    on('op:remove', ({ id }: { id: string }) => {
      items.current = items.current.filter((i) => i.id !== id);
      locks.current.delete(id);
      if (editorRef.current?.id === id) closeEditor();
      redraw();
      syncCount();
    });

    on('op:clear', () => {
      items.current = [];
      live.current.clear();
      locks.current.clear();
      pendingOps.current.clear();
      if (editorRef.current) closeEditor();
      redraw();
      syncCount();
    });

    on('lock:acquire', (l: { id: string; userId: string; name: string }) => {
      locks.current.set(l.id, { userId: l.userId, name: l.name });
      redraw();
    });
    on('lock:release', ({ id }: { id: string }) => {
      locks.current.delete(id);
      redraw();
    });
    on('lock:lost', ({ id }: { id: string }) => {
      if (editorRef.current?.id === id) {
        closeEditor();
        toast({ title: 'Edit ended', description: 'You were idle for a while, so the text was released.' });
      }
    });

    return () => {
      alive = false;
      offs.forEach((off) => off());
      items.current = [];
      live.current.clear();
      locks.current.clear();
      if (textTimer.current) clearTimeout(textTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.socket]);

  // Stream the in-progress stroke while the pointer is down.
  useEffect(() => {
    const t = setInterval(() => {
      const l = local.current;
      if (!l || l.unsent.length === 0 || !joined.current) return;
      const pts = l.unsent;
      const start = l.pts.length === pts.length;
      l.unsent = [];
      socketRef.current?.volatile.emit('stroke:chunk', { id: l.id, kind: l.kind, color: l.color, width: l.width, start, pts });
    }, CHUNK_MS);
    return () => clearInterval(t);
  }, []);

  // Keep the editing lock alive while someone is typing slowly.
  useEffect(() => {
    if (!editor) return;
    const t = setInterval(() => {
      const e = editorRef.current;
      if (e) send('text:update', { id: e.id });
    }, LOCK_HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [editor?.id, send]);

  // Re-render when the editor opens/closes so the editing text hides/shows on the canvas.
  useEffect(() => {
    redraw();
    syncCount();
  }, [editor?.id, redraw]);

  /* ----------------------------- drawing ----------------------------- */

  /** Pointer position in board units, independent of how big the canvas is on screen. */
  const point = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      Math.min(BOARD_W, Math.max(0, ((e.clientX - rect.left) / rect.width) * BOARD_W)),
      Math.min(BOARD_H, Math.max(0, ((e.clientY - rect.top) / rect.height) * BOARD_H)),
    ];
  };

  const commitText = useCallback(
    async (id: string) => {
      const it = items.current.find((i) => i.id === id);
      if (!it || it.kind !== 'text') return;
      if (textTimer.current) {
        clearTimeout(textTimer.current);
        textTimer.current = null;
      }
      const res = await send('text:update', { id, text: it.text, x: it.x, y: it.y, size: it.size, color: it.color });
      if (res.ok) await send('text:release', { id });
      else pendingTextFinal.current.add(id);
    },
    [send]
  );

  const finishEditing = useCallback(() => {
    const e = editorRef.current;
    if (!e) return;
    closeEditor();
    const it = items.current.find((i) => i.id === e.id);
    if (it && it.kind === 'text' && !it.text.trim()) {
      items.current = items.current.filter((i) => i.id !== e.id); // an abandoned click leaves nothing behind
      pendingOps.current.delete(`text:${e.id}`);
    }
    commitText(e.id);
    redraw();
    syncCount();
  }, [closeEditor, commitText, redraw]);

  const openEditorFor = (t: TextItem) => {
    const next = { id: t.id, x: t.x, y: t.y, size: t.size, color: t.color, text: t.text };
    editorRef.current = next;
    setEditor(next);
  };

  const onTextPointer = async (x: number, y: number) => {
    const c = ctx();
    // Topmost text under the pointer?
    const hit = c
      ? [...items.current].reverse().find((i): i is TextItem => {
          if (i.kind !== 'text') return false;
          const b = textBox(c, i);
          return x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4;
        })
      : undefined;

    if (hit) {
      if (!joined.current) return;
      const res = await send('text:lock', { id: hit.id });
      if (!res.ok) {
        toast({
          title: res.error === 'locked' ? 'Someone is editing this' : 'Text unavailable',
          description: res.error === 'locked' ? `${res.by || 'A teammate'} is editing it right now. Try again in a moment.` : 'It was removed.',
        });
        return;
      }
      const fresh = res.item as TextItem;
      Object.assign(hit, fresh);
      locks.current.set(hit.id, { userId: me.current!.id, name: me.current!.name });
      openEditorFor(hit);
      return;
    }

    const { color: col, lineWidth: lw } = toolRef.current;
    const t: TextItem = { id: uid(), kind: 'text', x, y, text: '', color: col, size: textSize(lw), seq: PENDING };
    insertItem(t);
    locks.current.set(t.id, { userId: me.current?.id ?? 'me', name: me.current?.name ?? 'You' });
    openEditorFor(t);
    submit(
      `text:${t.id}`,
      () => send('text:create', { id: t.id, x: t.x, y: t.y, text: t.text, color: t.color, size: t.size }),
      (seq) => {
        const cur = items.current.find((i) => i.id === t.id);
        if (cur && seq) {
          cur.seq = seq;
          items.current.sort((a, b) => a.seq - b.seq);
        }
      }
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (status === 'denied') return;
    const [x, y] = point(e);
    const { tool: tl, color: col, lineWidth: lw } = toolRef.current;

    if (tl === 'text') {
      e.preventDefault();
      if (editorRef.current) finishEditing();
      onTextPointer(x, y);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const kind = tl === 'eraser' ? 'erase' : 'stroke';
    const overlapped = live.current.size > 0;
    if (overlapped) live.current.forEach((o) => (o.overlapped = true));
    local.current = { id: uid(), kind, color: col, width: lw, pts: [x, y], unsent: [x, y], overlapped };
    const c = ctx();
    if (c) paintStroke(c, kind, [x, y], col, lw);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const l = local.current;
    if (!l) return;
    const c = ctx();
    // Coalesced events recover the samples the browser merged between frames: smoother curves.
    const native = e.nativeEvent as PointerEvent;
    const samples = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
    for (const s of samples.length ? samples : [native]) {
      const [x, y] = point(s);
      const n = l.pts.length;
      if (c) paintStroke(c, l.kind, [l.pts[n - 2], l.pts[n - 1], x, y], l.color, l.width);
      l.pts.push(x, y);
      l.unsent.push(x, y);
    }
  };

  const endStroke = () => {
    const l = local.current;
    if (!l) return;
    local.current = null;

    const item: StrokeItem = { id: l.id, kind: l.kind, points: l.pts, color: l.color, width: l.width, seq: PENDING };
    items.current.push(item);
    syncCount();

    submit(
      `stroke:${l.id}`,
      () => send('stroke:commit', { id: l.id, kind: l.kind, points: l.pts, color: l.color, width: l.width }),
      (seq) => {
        if (!seq) return;
        // Peers' strokes may have been committed before ours was acknowledged: if so, our position in
        // the global order changed, so repaint in the agreed order.
        const idx = items.current.indexOf(item);
        item.seq = seq;
        const displaced = items.current.slice(idx + 1).some((o) => o.seq !== PENDING && o.seq < seq);
        items.current.sort((a, b) => a.seq - b.seq);
        if (displaced || l.overlapped) redraw();
      }
    );
  };

  const onEditorChange = (value: string) => {
    const e = editorRef.current;
    if (!e) return;
    const it = items.current.find((i) => i.id === e.id);
    if (it && it.kind === 'text') it.text = value;
    const next = { ...e, text: value };
    editorRef.current = next;
    setEditor(next);
    // Throttled live sync so the other person watches the text appear as it's typed
    if (textTimer.current) return;
    textTimer.current = setTimeout(() => {
      textTimer.current = null;
      const cur = items.current.find((i) => i.id === e.id);
      if (cur && cur.kind === 'text') send('text:update', { id: cur.id, text: cur.text });
    }, TEXT_SYNC_MS);
  };

  const handleClear = async () => {
    setConfirmClear(false);
    if (editorRef.current) closeEditor();
    items.current = [];
    live.current.clear();
    locks.current.clear();
    pendingOps.current.clear();
    redraw();
    syncCount();
    const res = await send('clear', {});
    if (!res.ok) toast({ title: 'Not synced', description: "Couldn't clear for everyone. Check your connection and try again.", variant: 'destructive' });
  };

  const handleDownload = () => {
    // Export on the board's paper colour (the canvas itself is transparent), without the "is typing" overlays.
    const layer = document.createElement('canvas');
    layer.width = BOARD_W * RES;
    layer.height = BOARD_H * RES;
    const lc = layer.getContext('2d')!;
    lc.setTransform(RES, 0, 0, RES, 0, 0);
    const editing = editorRef.current;
    editorRef.current = null;
    paintAll(lc, false);
    editorRef.current = editing;

    const out = document.createElement('canvas');
    out.width = layer.width;
    out.height = layer.height;
    const o = out.getContext('2d')!;
    o.fillStyle = '#fbfaf7';
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(layer, 0, 0);
    const link = document.createElement('a');
    link.download = `board-${roomId}-${Date.now()}.png`;
    link.href = out.toDataURL();
    link.click();
  };

  const scale = fit.w / BOARD_W;
  const isEraser = tool === 'eraser';

  const statusCopy: Record<'connecting' | 'live' | 'offline' | 'denied', { tone: 'success' | 'warning' | 'primary' | 'destructive'; label: string }> = {
    live: { tone: 'success', label: 'Live' },
    connecting: { tone: 'primary', label: 'Connecting' },
    offline: { tone: 'warning', label: 'Offline' },
    denied: { tone: 'destructive', label: 'No access' },
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* The board: letterboxed to its logical aspect ratio and centred in whatever space the panel gives it */}
      <div ref={areaRef} className="flex min-h-0 flex-1 items-center justify-center p-3 pb-20 sm:p-6 sm:pb-20">
        <div
          className="relative shrink-0 overflow-hidden rounded-sm border border-border-strong bg-board shadow-md"
          style={{ width: fit.w, height: fit.h }}
        >
          <canvas
            ref={canvasRef}
            width={BOARD_W * RES}
            height={BOARD_H * RES}
            aria-label="Shared whiteboard"
            className={cn('block size-full touch-none', tool === 'text' ? 'cursor-text' : isEraser ? 'cursor-cell' : 'cursor-crosshair')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />

          {/* In-place text editor: lives over the canvas at the text's position; the canvas draws the result */}
          {editor && (
            <textarea
              key={editor.id}
              autoFocus
              value={editor.text}
              onChange={(e) => onEditorChange(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                  e.preventDefault();
                  finishEditing();
                }
              }}
              rows={Math.max(1, editor.text.split('\n').length)}
              spellCheck={false}
              aria-label="Board text"
              placeholder="Type…"
              className="absolute resize-none overflow-hidden whitespace-pre rounded-[2px] border border-dashed border-primary/70 bg-transparent p-0 outline-none placeholder:text-(--board-ink)/30"
              style={{
                left: editor.x * scale - 1,
                top: editor.y * scale - 1,
                minWidth: 80 * scale,
                width: `${Math.max(8, ...editor.text.split('\n').map((l) => l.length + 1))}ch`,
                maxWidth: (BOARD_W - editor.x) * scale,
                fontFamily: FONT,
                fontSize: editor.size * scale,
                lineHeight: LINE_HEIGHT,
                color: editor.color,
              }}
            />
          )}

          {itemCount === 0 && !editor && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-(--board-ink)/35">
              Draw or type anywhere. Everyone in the room sees it live.
            </p>
          )}
        </div>
      </div>

      {/* Tools float over the bottom edge of the board */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3">
        <div
          role="toolbar"
          aria-label="Drawing tools"
          className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-border-strong bg-popover/95 p-1 shadow-lg backdrop-blur"
        >
          <Button size="icon-sm" variant={tool === 'pen' ? 'secondary' : 'ghost'} onClick={() => setTool('pen')} aria-pressed={tool === 'pen'} aria-label="Pen" title="Pen">
            <Pencil />
          </Button>
          <Button size="icon-sm" variant={tool === 'text' ? 'secondary' : 'ghost'} onClick={() => setTool('text')} aria-pressed={tool === 'text'} aria-label="Text" title="Text: click the board to type, click text to edit">
            <Type />
          </Button>
          <Button size="icon-sm" variant={isEraser ? 'secondary' : 'ghost'} onClick={() => setTool('eraser')} aria-pressed={isEraser} aria-label="Eraser" title="Eraser">
            <Eraser />
          </Button>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <div className="flex items-center gap-1 px-1" role="radiogroup" aria-label="Ink colour">
            {SWATCHES.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={!isEraser && color === s}
                aria-label={`Ink ${s}`}
                onClick={() => {
                  setColor(s);
                  if (isEraser) setTool('pen');
                }}
                className={cn(
                  'size-5 rounded-full border border-black/10 transition-transform hover:scale-110',
                  !isEraser && color === s && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover'
                )}
                style={{ background: s }}
              />
            ))}
            <label className="relative ml-0.5 size-5 cursor-pointer overflow-hidden rounded-full border border-border-strong" title="Custom colour">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  if (isEraser) setTool('pen');
                }}
                aria-label="Custom ink colour"
                className="absolute -inset-2 size-9 cursor-pointer opacity-0"
              />
              <span className="block size-full bg-[conic-gradient(from_0deg,#be123c,#c2410c,#ca8a04,#0f766e,#1d4ed8,#be123c)]" />
            </label>
          </div>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <div className="flex w-24 items-center px-2">
            <Slider value={[lineWidth]} min={1} max={10} step={1} onValueChange={(v) => setLineWidth(v[0])} aria-label={tool === 'text' ? 'Text size' : 'Stroke size'} disabled={isEraser} />
          </div>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <Button size="icon-sm" variant="ghost" onClick={handleDownload} aria-label="Download as PNG" title="Download as PNG">
            <Download />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={itemCount === 0} aria-label="Clear board" title="Clear board">
            <Trash2 />
          </Button>

          <span className="t-num ml-1 hidden min-w-16 items-center gap-1.5 px-1 text-[11px] text-faint sm:flex" role="status" aria-live="polite">
            <StatusDot tone={statusCopy[status].tone as any} live={status === 'connecting'} />
            {statusCopy[status].label}
          </span>
        </div>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the board for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything drawn or written in this room will be erased for all participants. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep drawing</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>Clear board</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
