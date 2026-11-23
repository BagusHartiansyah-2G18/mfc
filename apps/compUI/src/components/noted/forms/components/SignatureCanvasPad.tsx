import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@org/ui';
import { Eraser, RotateCcw, Check, PenTool } from 'lucide-react';

interface SignatureCanvasPadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  required?: boolean;
  label?: string;
  helperText?: string;
}

export function SignatureCanvasPad({
  value,
  onChange,
  required = false,
  label = 'Tanda Tangan Digital Resmi',
  helperText = 'Gunakan tetikus (mouse) atau layar sentuh (touchscreen) untuk membubuhkan tanda tangan.',
}: SignatureCanvasPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  // Inisialisasi canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jika sudah ada data URL sebelumnya, render ke canvas
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = value;
    } else {
      setHasSignature(false);
    }
  }, [value]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const saveStrokeState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-10), imageData]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cegah scrolling pada perangkat sentuh (touchscreen/mobile)
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    saveStrokeState();

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#1e1b4b'; // Deep Indigo
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cegah scrolling pada perangkat sentuh (touchscreen/mobile)
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setStrokeHistory([]);
    onChange(null);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevHistory = [...strokeHistory];
    const lastState = prevHistory.pop();
    setStrokeHistory(prevHistory);

    if (lastState) {
      ctx.putImageData(lastState, 0, 0);
      onChange(canvas.toDataURL('image/png'));
      setHasSignature(true);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
      setHasSignature(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <PenTool className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {hasSignature && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="h-3 w-3" /> Tanda Tangan Terisi
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">{helperText}</p>

      {/* Canvas Box */}
      <div className="relative rounded-xl border-2 border-dashed border-border bg-card/60 p-1 overflow-hidden shadow-2xs hover:border-primary/50 transition-colors">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
          className="w-full h-36 rounded-lg bg-white cursor-crosshair touch-none"
        />

        {/* Placeholder Watermark */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <span className="text-xs font-mono tracking-widest text-foreground font-bold">
              [ BUBURKAN TANDA TANGAN DI SINI ]
            </span>
          </div>
        )}

        {/* Toolbar Bawah */}
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-[10px] text-muted-foreground">Format: PNG Transparan Otomatis</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={strokeHistory.length === 0}
              className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Urungkan (Undo)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!hasSignature}
              className="h-6 px-2 text-[10px] gap-1 text-rose-600 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
            >
              <Eraser className="h-3 w-3" />
              <span>Hapus</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
