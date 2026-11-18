import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, KeyRound, Lock, ShieldCheck, Unlock, X } from 'lucide-react';
import { getAdminPasscode } from '../services/googleSheetsService';
import { Button, IconButton, toast } from './ui/DesignSystem';

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  actionDescription?: string;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  actionDescription = 'ต้องการสิทธิ์เจ้าหน้าที่เพื่อแก้ไขหรือลบข้อมูลในระบบ',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const errorId = useId();

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = getAdminPasscode();
    if (pin.trim() === expected) {
      setPin('');
      setError('');
      toast.success('ยืนยันรหัสผ่านเจ้าหน้าที่สำเร็จ ปลดล็อกสิทธิ์แล้ว');
      onAuthorized();
      onClose();
    } else {
      const errText = 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง (รหัสเริ่มต้นคือ 1234)';
      setError(errText);
      toast.error('รหัสผ่านไม่ถูกต้อง');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.18)] p-6">
        <IconButton
          label="ปิดหน้าต่างยืนยันสิทธิ์"
          onClick={onClose}
          icon={<X className="w-4 h-4" />}
          className="absolute top-3.5 right-3.5"
        />

        <div className="flex items-start gap-3.5 mb-5 pr-8">
          <div
            className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-800 shrink-0"
            aria-hidden="true"
          >
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              ยืนยันสิทธิ์เจ้าหน้าที่ดูแลระบบ
            </h2>
            <p
              id="auth-modal-desc"
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed"
            >
              {actionDescription}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="staff-pin-input"
              className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              รหัสผ่านผู้ดูแลระบบ / หัวหน้าทีม (PIN){' '}
              <span className="text-red-500 font-bold" aria-hidden="true">
                *
              </span>
            </label>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="staff-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                autoFocus
                required
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="กรอกรหัส PIN (ค่าเริ่มต้น: 1234)"
                className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-500/20'
                }`}
              />
            </div>
            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 p-3.5 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <ShieldCheck
              className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5"
              aria-hidden="true"
            />
            <span>
              เมื่อปลดล็อกแล้ว คุณจะสามารถแก้ไขหรือลบรายการข้อมูลในรอบการใช้งานนี้ได้ทันที
              (รหัสเริ่มต้นคือ{' '}
              <code className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                1234
              </code>
              )
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Unlock className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              ปลดล็อกสิทธิ์เจ้าหน้าที่
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
