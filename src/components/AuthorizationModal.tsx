import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, Unlock, X } from 'lucide-react';
import { getAdminPasscode } from '../services/googleSheetsService';
import { Button } from './ui/DesignSystem';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = getAdminPasscode();
    if (pin.trim() === expected) {
      setPin('');
      setError('');
      onAuthorized();
      onClose();
    } else {
      setError('รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง (รหัสเริ่มต้นสำหรับการทดสอบคือ 1234)');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่างยืนยันสิทธิ์"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-800">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 id="auth-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              ยืนยันสิทธิ์เจ้าหน้าที่ดูแลระบบ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {actionDescription}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="staff-pin-input"
              className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              รหัสผ่านผู้ดูแลระบบ / หัวหน้าทีม (PIN)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="staff-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="กรอกรหัส PIN (ค่าเริ่มต้น: 1234)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 p-3.5 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <span>
              เมื่อปลดล็อกแล้ว คุณจะสามารถแก้ไขหรือลบรายการข้อมูลในรอบการใช้งานนี้ได้ทันที
              (รหัสเริ่มต้นคือ{' '}
              <code className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                1234
              </code>
              )
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" icon={<Unlock className="w-4 h-4" />}>
              ปลดล็อกสิทธิ์เจ้าหน้าที่
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
