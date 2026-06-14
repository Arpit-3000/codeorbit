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

interface Stroke {
  type: 'draw' | 'erase';
  points: number[]; // Flattened array: [x1, y1, x2, y2, ...]
  color: string;
  width: number;
  timestamp: Date;
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { joinRoom, leaveRoom } = useStream();
  const [roomChannel, setRoomChannel] = useState<Channel | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);

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
        if (stroke) {
          drawStroke(stroke);
          // Add to strokes array
          setAllStrokes(prev => [...prev, stroke]);
        }
      });

      // Listen for canvas clear events
      channel.on('canvas_clear', () => {
        clearCanvas();
        setAllStrokes([]);
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
      console.log('[CANVAS] Loading canvas data for room:', roomId);
      const data = await getCanvasData(roomId);
      
      if (data.strokes && Array.isArray(data.strokes)) {
        console.log('[CANVAS] Loaded strokes:', data.strokes.length);
        setAllStrokes(data.strokes);
        
        // Redraw all strokes
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          data.strokes.forEach((stroke: Stroke) => {
            drawStroke(stroke);
          });
        }
      }
    } catch (error) {
      console.error('[CANVAS] Failed to load canvas data:', error);
    }
  };

  const drawStroke = (stroke: Stroke) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (stroke.type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0], stroke.points[1]);
      
      for (let i = 2; i < stroke.points.length; i += 2) {
        ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
      }
      
      ctx.stroke();
    }

    // Reset to default
    ctx.globalCompositeOperation = 'source-over';
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

    // Start new stroke with first point
    setCurrentStroke([x, y]);

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

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw locally
    ctx.lineTo(x, y);
    ctx.stroke();

    // Add point to current stroke
    setCurrentStroke(prev => [...prev, x, y]);
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Create stroke object with correct format
    const stroke: Stroke = {
      type: isEraser ? 'erase' : 'draw',
      points: currentStroke,
      color: color,
      width: lineWidth,
      timestamp: new Date()
    };

    console.log('[CANVAS] Stroke completed:', {
      type: stroke.type,
      pointsCount: stroke.points.length / 2,
      color: stroke.color,
      width: stroke.width
    });

    // Add to local strokes
    const updatedStrokes = [...allStrokes, stroke];
    setAllStrokes(updatedStrokes);

    // Broadcast to other users via Stream
    if (roomChannel && currentStroke.length >= 2) {
      try {
        await roomChannel.sendEvent({
          type: 'canvas_draw',
          data: { stroke },
        });
        console.log('[CANVAS] Stroke broadcasted via Stream');
      } catch (error) {
        console.error('[CANVAS] Failed to broadcast stroke:', error);
      }
    }

    // Save to backend with correct format
    try {
      console.log('[CANVAS] Saving canvas with', updatedStrokes.length, 'strokes');
      await saveCanvasData(roomId, updatedStrokes);
      console.log('[CANVAS] ✅ Canvas saved successfully');
    } catch (error: any) {
      console.error('[CANVAS] Failed to save canvas:', error);
      toast({
        title: 'Save Failed',
        description: error.response?.data?.message || 'Failed to save canvas',
        variant: 'destructive',
      });
    }

    // Reset current stroke
    setCurrentStroke([]);
  };

  const handleClearCanvas = async () => {
    clearCanvas();
    setAllStrokes([]);
    
    if (roomChannel) {
      try {
        await roomChannel.sendEvent({
          type: 'canvas_clear',
          data: { roomId },
        });
        console.log('[CANVAS] Clear broadcasted via Stream');
      } catch (error) {
        console.error('[CANVAS] Failed to broadcast clear:', error);
      }
    }

    // Save empty canvas
    try {
      await saveCanvasData(roomId, []);
      console.log('[CANVAS] ✅ Canvas cleared and saved');
      toast({
        title: 'Canvas Cleared',
        description: 'Canvas has been cleared',
      });
    } catch (error) {
      console.error('[CANVAS] Failed to save cleared canvas:', error);
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

        {/* Canvas Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Strokes: {allStrokes.length}</span>
          <span>Drawing: {isDrawing ? 'Yes' : 'No'}</span>
          <span>Mode: {isEraser ? 'Eraser' : 'Draw'}</span>
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
