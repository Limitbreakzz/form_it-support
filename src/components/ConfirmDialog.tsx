import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { Button } from './ui/DesignSystem';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="ปิดหน้าต่างยืนยัน"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                : variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 pr-4">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? 'กำลังบันทึกข้อมูล...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
