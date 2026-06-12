"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eraser, Trash2, Download } from 'lucide-react';
import { useStream } from '@/contexts/stream-context';
import { saveCanvasData, getCanvasData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Channel, Event } from 'stream-chat';

interface CollaborativeCanvasProps {
  roomId: string;
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { joinRoom, leaveRoom } = useStream();
  const [roomChannel, setRoomChannel] = useState<Channel | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isEraser, setIsEraser] = useState(false);

  // Setup room channel and event listeners
  useEffect(() => {
    let channel: Channel | null = null;

    const setupChannel = async () => {
      channel = await joinRoom(roomId);
      if (!channel) return;

      setRoomChannel(channel);

      // Listen for canvas draw events
      channel.on('canvas_draw', (event: Event) => {
        const data = event.data as any;
        const { stroke } = data;
        drawStroke(stroke);
      });

      // Listen for canvas erase events
      channel.on('canvas_erase', (event: Event) => {
        const data = event.data as any;
        const { area } = data;
        eraseArea(area);
      });

      // Listen for canvas clear events
      channel.on('canvas_clear', () => {
        clearCanvas();
      });

      // Load saved canvas data
      loadCanvasData();
    };

    setupChannel();

    return () => {
      if (channel) {
        leaveRoom(channel);
      }
    };
  }, [roomId, joinRoom, leaveRoom]);

  const loadCanvasData = async () => {
    try {
      const data = await getCanvasData(roomId);
      if (data.canvasData && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = data.canvasData;
        }
      }
    } catch (error) {
      console.error('[CANVAS] Failed to load canvas data:', error);
    }
  };

  const drawStroke = (stroke: any) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const eraseArea = (area: { x: number; y: number }) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(area.x - 10, area.y - 10, 20, 20);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit to other users via Stream
    if (roomChannel) {
      if (isEraser) {
        await roomChannel.sendEvent({
          type: 'canvas_erase',
          data: { roomId, area: { x, y } },
        });
      } else {
        await roomChannel.sendEvent({
          type: 'canvas_draw',
          data: {
            roomId,
            stroke: {
              color,
              lineWidth,
              points: [{ x, y }],
            },
          },
        });
      }
    }
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save canvas data
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      try {
        await saveCanvasData(roomId, dataUrl);
      } catch (error) {
        console.error('[CANVAS] Failed to save canvas:', error);
      }
    }
  };

  const handleClearCanvas = async () => {
    clearCanvas();
    if (roomChannel) {
      await roomChannel.sendEvent({
        type: 'canvas_clear',
        data: { roomId },
      });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `canvas-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: 'Canvas Downloaded',
      description: 'Your canvas has been saved as an image',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborative Canvas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setIsEraser(false);
              }}
              className="h-8 w-16 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Size:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">{lineWidth}px</span>
          </div>

          <Button
            size="sm"
            variant={isEraser ? 'default' : 'outline'}
            onClick={() => setIsEraser(!isEraser)}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Eraser
          </Button>

          <Button size="sm" variant="outline" onClick={handleClearCanvas}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>

          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Draw on the canvas to collaborate with others in real-time
        </p>
      </CardContent>
    </Card>
  );
}
