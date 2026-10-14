"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eraser, Loader2, Check, Pencil, Trash2 } from 'lucide-react';
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
import { useStream } from '@/contexts/stream-context';
import { saveCanvasData, getCanvasData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Channel } from 'stream-chat';

interface CollaborativeCanvasProps {
  roomId: string;
}

interface Stroke {
  type: 'draw' | 'erase';
  points: number[]; // Flattened array: [x1, y1, x2, y2, ...]
  color: string;
  width: number;
  timestamp: Date;
}

/** Logical board size. Strokes are stored in these units so every client, at any panel size, agrees. */
const BOARD_W = 800;
const BOARD_H = 600;
const ERASER_WIDTH = 20;
const SAVE_DEBOUNCE_MS = 600;

const SWATCHES = ['#1a1814', '#c2410c', '#0f766e', '#1d4ed8', '#be123c'];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: BOARD_W, h: BOARD_H });
  const { joinRoom, leaveRoom } = useStream();
  const [roomChannel, setRoomChannel] = useState<Channel | null>(null);
  const [color, setColor] = useState(SWATCHES[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmClear, setConfirmClear] = useState(false);

  // Drawing state lives in refs: a pointer move must not re-render the toolbar.
  const drawing = useRef(false);
  const current = useRef<number[]>([]);
  const strokes = useRef<Stroke[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlash = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ctx = () => canvasRef.current?.getContext('2d') ?? null;

  const paint = useCallback((stroke: Stroke) => {
    const c = ctx();
    if (!c || stroke.points.length < 2) return;
    if (stroke.type === 'erase') {
      c.globalCompositeOperation = 'destination-out';
      c.lineWidth = ERASER_WIDTH;
    } else {
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = stroke.color;
      c.lineWidth = stroke.width;
    }
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(stroke.points[0], stroke.points[1]);
    for (let i = 2; i < stroke.points.length; i += 2) c.lineTo(stroke.points[i], stroke.points[i + 1]);
    // a single tap should leave a dot
    if (stroke.points.length === 2) c.lineTo(stroke.points[0] + 0.01, stroke.points[1]);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }, []);

  const clearBoard = useCallback(() => {
    const c = ctx();
    if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const redrawAll = useCallback(
    (list: Stroke[]) => {
      clearBoard();
      list.forEach(paint);
    },
    [clearBoard, paint]
  );

  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      setSaveState('saving');
      await saveCanvasData(roomId, strokes.current);
      setSaveState('saved');
      if (savedFlash.current) clearTimeout(savedFlash.current);
      savedFlash.current = setTimeout(() => setSaveState('idle'), 1800);
    } catch (error: any) {
      console.error('[CANVAS] Failed to save canvas:', error);
      setSaveState('error');
      toast({
        title: 'Board not saved',
        description: error.response?.data?.message || "Your last strokes couldn't be saved. They're still visible to everyone in the room.",
        variant: 'destructive',
      });
    }
  }, [roomId]);

  // Saving after every stroke re-uploads the whole board; coalesce bursts of strokes into one save.
  const scheduleSave = useCallback(() => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

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

  // Channel + live events
  useEffect(() => {
    let channel: Channel | null = null;
    let alive = true;

    const onDraw = (event: any) => {
      const stroke = event?.data?.stroke as Stroke | undefined;
      if (!stroke) return;
      paint(stroke);
      strokes.current = [...strokes.current, stroke];
      setStrokeCount(strokes.current.length);
    };
    const onClear = () => {
      clearBoard();
      strokes.current = [];
      setStrokeCount(0);
    };

    (async () => {
      channel = await joinRoom(roomId);
      if (!channel || !alive) return;
      setRoomChannel(channel);
      channel.on('canvas_draw' as any, onDraw);
      channel.on('canvas_clear' as any, onClear);

      // Load the saved board. The API nests it as { canvasData: { strokes } }.
      try {
        const data = await getCanvasData(roomId);
        const saved = data?.canvasData?.strokes ?? data?.strokes;
        if (alive && Array.isArray(saved)) {
          strokes.current = saved;
          setStrokeCount(saved.length);
          redrawAll(saved);
        }
      } catch (error) {
        console.error('[CANVAS] Failed to load canvas data:', error);
      }
    })();

    return () => {
      alive = false;
      if (channel) {
        channel.off('canvas_draw' as any, onDraw);
        channel.off('canvas_clear' as any, onClear);
        leaveRoom(channel);
      }
      // don't lose strokes drawn in the last moments
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveCanvasData(roomId, strokes.current).catch(() => {});
      }
      if (savedFlash.current) clearTimeout(savedFlash.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, joinRoom, leaveRoom]);

  /** Pointer position in logical board units, independent of how big the canvas is on screen. */
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * BOARD_W, ((e.clientY - rect.top) / rect.height) * BOARD_H];
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const [x, y] = point(e);
    current.current = [x, y];

    const c = ctx();
    if (!c) return;
    if (isEraser) {
      c.globalCompositeOperation = 'destination-out';
      c.lineWidth = ERASER_WIDTH;
    } else {
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = color;
      c.lineWidth = lineWidth;
    }
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = ctx();
    if (!c) return;
    const [x, y] = point(e);
    c.lineTo(x, y);
    c.stroke();
    current.current.push(x, y);
  };

  const endStroke = async () => {
    if (!drawing.current) return;
    drawing.current = false;
    const points = current.current;
    current.current = [];
    if (points.length < 2) return;

    const stroke: Stroke = {
      type: isEraser ? 'erase' : 'draw',
      points,
      color,
      width: lineWidth,
      timestamp: new Date(),
    };
    // a lone tap becomes a dot for everyone, not just locally
    if (points.length === 2) paint(stroke);

    strokes.current = [...strokes.current, stroke];
    setStrokeCount(strokes.current.length);
    scheduleSave();

    if (roomChannel) {
      try {
        await roomChannel.sendEvent({ type: 'canvas_draw', data: { stroke } } as any);
      } catch (error) {
        console.error('[CANVAS] Failed to broadcast stroke:', error);
      }
    }
  };

  const handleClear = async () => {
    setConfirmClear(false);
    clearBoard();
    strokes.current = [];
    setStrokeCount(0);

    if (roomChannel) {
      try {
        await roomChannel.sendEvent({ type: 'canvas_clear', data: { roomId } } as any);
      } catch (error) {
        console.error('[CANVAS] Failed to broadcast clear:', error);
      }
    }
    await flushSave();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export on the board's paper colour (the canvas itself is transparent).
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const o = out.getContext('2d')!;
    o.fillStyle = '#fbfaf7';
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `board-${roomId}-${Date.now()}.png`;
    link.href = out.toDataURL();
    link.click();
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
            width={BOARD_W}
            height={BOARD_H}
            aria-label="Shared whiteboard"
            className={cn('block size-full touch-none', isEraser ? 'cursor-cell' : 'cursor-crosshair')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
          {strokeCount === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-(--board-ink)/35">
              Draw anywhere. Everyone in the room sees it live.
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
          <Button size="icon-sm" variant={!isEraser ? 'secondary' : 'ghost'} onClick={() => setIsEraser(false)} aria-pressed={!isEraser} aria-label="Pen" title="Pen">
            <Pencil />
          </Button>
          <Button size="icon-sm" variant={isEraser ? 'secondary' : 'ghost'} onClick={() => setIsEraser(true)} aria-pressed={isEraser} aria-label="Eraser" title="Eraser">
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
                  setIsEraser(false);
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
                  setIsEraser(false);
                }}
                aria-label="Custom ink colour"
                className="absolute -inset-2 size-9 cursor-pointer opacity-0"
              />
              <span className="block size-full bg-[conic-gradient(from_0deg,#be123c,#c2410c,#ca8a04,#0f766e,#1d4ed8,#be123c)]" />
            </label>
          </div>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <div className="flex w-24 items-center px-2">
            <Slider value={[lineWidth]} min={1} max={10} step={1} onValueChange={(v) => setLineWidth(v[0])} aria-label="Stroke size" disabled={isEraser} />
          </div>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <Button size="icon-sm" variant="ghost" onClick={handleDownload} aria-label="Download as PNG" title="Download as PNG">
            <Download />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={strokeCount === 0} aria-label="Clear board" title="Clear board">
            <Trash2 />
          </Button>

          <span className="t-num ml-1 hidden min-w-14 items-center gap-1 px-1 text-[11px] text-faint sm:flex" aria-live="polite">
            {saveState === 'saving' && (<><Loader2 className="size-3 animate-spin" /> Saving</>)}
            {saveState === 'saved' && (<><Check className="size-3 text-success" /> Saved</>)}
            {saveState === 'error' && <span className="text-destructive">Unsaved</span>}
          </span>
        </div>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the board for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything drawn in this room will be erased for all participants. This can't be undone.
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
