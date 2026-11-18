import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { Button, IconButton } from './ui/DesignSystem';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'success';
  details?: { label: string; value: string }[];
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'ยืนยันและบันทึกข้อมูล',
  cancelLabel = 'ยกเลิก',
  variant = 'primary',
  details,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.18)] p-6">
        <IconButton
          label="ปิดหน้าต่างยืนยัน"
          onClick={onCancel}
          disabled={isLoading}
          icon={<X className="w-4 h-4" />}
          className="absolute top-3.5 right-3.5"
        />

        <div className="flex items-start gap-4 pr-8">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                : variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
            }`}
            aria-hidden="true"
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-3.5 space-y-2 text-xs">
            {details.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-3">
                <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  {item.label}:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[230px]">
                  {item.value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
