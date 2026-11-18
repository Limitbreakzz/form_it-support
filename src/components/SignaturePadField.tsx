import React, { useEffect, useId, useRef, useState } from 'react';
import { Eraser, PenTool, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface SignaturePadFieldProps {
  label: string;
  memberName: string;
  onMemberNameChange: (name: string) => void;
  value: string; // Base64 PNG Data URL
  onChange: (dataUrl: string) => void;
  error?: string;
}

export const SignaturePadField: React.FC<SignaturePadFieldProps> = ({
  label,
  memberName,
  onMemberNameChange,
  value,
  onChange,
  error,
}) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const memberInputId = useId();
  const errorId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (mode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
  }, [value, mode]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = 320;
        offscreen.height = 120;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, offscreen.width, offscreen.height);
          const ratio = Math.min(offscreen.width / img.width, offscreen.height / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const x = (offscreen.width - w) / 2;
          const y = (offscreen.height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          onChange(offscreen.toDataURL('image/png'));
        }
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        error
          ? 'border-red-400 bg-red-50/40 dark:border-red-500/70 dark:bg-red-950/20'
          : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
            {label}
          </span>
          {value && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>ลงชื่อแล้ว</span>
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
          role="group"
          aria-label="เลือกรูปแบบการลงลายมือชื่อ"
        >
          <button
            type="button"
            aria-pressed={mode === 'draw'}
            onClick={() => setMode('draw')}
            className={`min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              mode === 'draw'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>วาดลายเซ็น</span>
          </button>
          <button
            type="button"
            aria-pressed={mode === 'upload'}
            onClick={() => setMode('upload')}
            className={`min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              mode === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>อัปโหลดรูปภาพ</span>
          </button>
        </div>
      </div>

      {/* ชื่อ-นามสกุล สมาชิกในกลุ่ม */}
      <div className="mb-3">
        <label
          htmlFor={memberInputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
        >
          ชื่อ - นามสกุล ผู้ปฏิบัติงาน{' '}
          <span className="text-red-500 font-bold" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={memberInputId}
          type="text"
          required
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          value={memberName}
          onChange={(e) => onMemberNameChange(e.target.value)}
          placeholder={`ระบุชื่อ - นามสกุล (${label})`}
          className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* พื้นที่ลงลายมือชื่อดิจิทัล */}
      {mode === 'draw' ? (
        <div className="relative">
          <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden">
            {!value && !isDrawing && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 px-4 text-center select-none"
                aria-hidden="true"
              >
                ใช้นิ้ว ปากกาสไตลัส หรือเมาส์วาดลายเซ็นในกรอบนี้
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={320}
              height={115}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={finishDrawing}
              onMouseLeave={finishDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={finishDrawing}
              onTouchCancel={finishDrawing}
              aria-label={`พื้นที่วาดลายมือชื่อสำหรับ ${memberName || label}`}
              className="relative z-10 w-full h-[115px] cursor-crosshair touch-none"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>พื้นหลังขาวมาตรฐานสำหรับการพิมพ์เอกสาร A4</span>
            <button
              type="button"
              onClick={handleClear}
              className="min-h-[34px] px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <Eraser className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>ล้างลายเซ็น</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex flex-col items-center justify-center min-h-[115px]">
            {value ? (
              <img
                src={value}
                alt={`ลายมือชื่อของ ${memberName || label}`}
                className="max-h-20 object-contain bg-white rounded px-2 py-1"
              />
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">
                เลือกรูปภาพลายมือชื่อ (รองรับไฟล์ PNG, JPG หรือ WebP)
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label={`อัปโหลดไฟล์รูปภาพลายมือชื่อสำหรับ ${memberName || label}`}
              onChange={handleImageUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-300 cursor-pointer"
            />
          </div>
          {value && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="min-h-[34px] px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <Eraser className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>ลบรูปภาพลายเซ็น</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
