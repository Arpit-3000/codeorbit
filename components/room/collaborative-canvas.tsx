"use client";

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Trash2, Download } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { saveCanvasData, getCanvasData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CollaborativeCanvasProps {
  roomId: string;
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { socket } = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');

  useEffect(() => {
    loadCanvasData();
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('canvas_draw', ({ stroke }) => {
      drawStroke(stroke);
    });

    socket.on('canvas_erase', ({ area }) => {
      eraseArea(area);
    });

    socket.on('canvas_clear', () => {
      clearCanvas();
    });

    return () => {
      socket.off('canvas_draw');
      socket.off('canvas_erase');
      socket.off('canvas_clear');
    };
  }, [socket]);

  const loadCanvasData = async () => {
    try {
      const data = await getCanvasData(roomId);
      if (data.canvasData?.strokes) {
        data.canvasData.strokes.forEach((stroke: any) => {
          drawStroke(stroke);
        });
      }
    } catch (error) {
      console.error('Failed to load canvas data:', error);
    }
  };

  const drawStroke = (stroke: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < stroke.points.length; i += 2) {
      if (i === 0) {
        ctx.moveTo(stroke.points[i], stroke.points[i + 1]);
      } else {
        ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
      }
    }
    ctx.stroke();
  };

  const eraseArea = (area: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(area.x - 10, area.y - 10, 20, 20);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    if (tool === 'draw') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();

      // Emit to other users
      if (socket) {
        socket.emit('canvas_draw', {
          roomId,
          stroke: {
            type: 'draw',
            points: [x, y],
            color,
            width: lineWidth,
          },
        });
      }
    } else {
      ctx.clearRect(x - 10, y - 10, 20, 20);

      // Emit to other users
      if (socket) {
        socket.emit('canvas_erase', {
          roomId,
          area: { x, y },
        });
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    clearCanvas();
    if (socket) {
      socket.emit('canvas_clear', { roomId });
    }
  };

  const handleSave = async () => {
    try {
      await saveCanvasData(roomId, []);
      toast({
        title: 'Canvas Saved',
        description: 'Your drawing has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save canvas',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `canvas-${roomId}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="space-y-4 p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={tool === 'draw' ? 'default' : 'outline'}
            onClick={() => setTool('draw')}
          >
            Draw
          </Button>
          <Button
            size="sm"
            variant={tool === 'erase' ? 'default' : 'outline'}
            onClick={() => setTool('erase')}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Erase
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-8">{lineWidth}px</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
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
    </div>
  );
}
