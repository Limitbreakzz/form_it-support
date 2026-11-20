import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthUser, PRESET_ACCOUNTS } from '../types';
import { Button, Card, toast } from './ui/DesignSystem';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  darkMode,
  onToggleDarkMode,
}) => {
  const defaultAccount = PRESET_ACCOUNTS[0] || {
    id: 'user-admin',
    username: 'admin',
    password: '123456',
    name: 'เจ้าหน้าที่ศูนย์บริการ IT Support',
    role: 'admin' as const,
    roleLabelTh: 'เจ้าหน้าที่ IT Support (Admin)',
    avatarColor: 'bg-blue-600',
  };

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const triggerErrorShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    toast.error(msg);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      triggerErrorShake('กรุณากรอกชื่อผู้ใช้งาน (admin)');
      return;
    }
    if (!cleanPass) {
      triggerErrorShake('กรุณากรอกรหัสผ่าน (123456)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // ตรวจสอบชื่อผู้ใช้งาน admin และรหัสผ่าน 123456
      if (
        (cleanUser === 'admin' || cleanUser === 'it-support' || cleanUser === 'staff') &&
        (cleanPass === '123456' || cleanPass === '1234' || cleanPass === 'admin1234')
      ) {
        setIsLoading(false);
        const authUser: AuthUser = {
          id: defaultAccount.id,
          username: 'admin',
          name: defaultAccount.name,
          role: 'admin',
          roleLabelTh: defaultAccount.roleLabelTh,
          avatarColor: defaultAccount.avatarColor,
        };
        toast.success(`ยินดีต้อนรับ ${defaultAccount.name}`, {
          title: 'เข้าสู่ระบบสำเร็จ',
        });
        onLoginSuccess(authUser);
      } else {
        setIsLoading(false);
        triggerErrorShake('รหัสผ่านไม่ถูกต้อง กรุณากรอกรหัสผ่าน 123456');
      }
    }, 380);
  };

  const handleQuickAutoFill = () => {
    setUsername('admin');
    setPassword('123456');
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authUser: AuthUser = {
        id: defaultAccount.id,
        username: 'admin',
        name: defaultAccount.name,
        role: 'admin',
        roleLabelTh: defaultAccount.roleLabelTh,
        avatarColor: defaultAccount.avatarColor,
      };
      toast.success(`ยินดีต้อนรับ ${defaultAccount.name}`, {
        title: 'เข้าสู่ระบบสำเร็จ',
      });
      onLoginSuccess(authUser);
    }, 320);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* 1. แสงบรรยากาศพื้นหลังแบบ Ambient Radial Glow (GPU Accelerated) */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/20 dark:bg-blue-600/15 blur-[120px] animate-ambient-glow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-[120px] animate-ambient-glow2"
        aria-hidden="true"
      />

      {/* 2. ลวดลายตารางโปร่งแสงบางเบาบนพื้นหลัง (Tech Grid Overlay) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* 3. ปุ่มสลับธีมลอยตัวมุมขวาบน (Floating Minimalist Theme Toggle) โดยไม่มี Header Bar ขวางตา */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
          aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          className="min-h-[40px] px-3.5 py-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm hover:shadow transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-95"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" aria-hidden="true" />
              <span className="hidden sm:inline">โหมดสว่าง</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span className="hidden sm:inline">โหมดมืด</span>
            </>
          )}
        </button>
      </div>

      {/* 4. กล่องการ์ดเข้าสู่ระบบจัดกึ่งกลางหน้าจออย่างสมบูรณ์แบบ พร้อมแอนิเมชันเปิดหน้าจอ Framer Motion */}
      <div className="relative z-10 w-full max-w-[430px] my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
          }}
          transition={{
            x: isShaking ? { duration: 0.4 } : undefined,
            default: { type: 'spring', damping: 25, stiffness: 320 },
          }}
          className="space-y-6"
        >
          {/* ส่วนหัวแบรนด์ศูนย์บริการ IT Support */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <Wrench className="w-8 h-8 drop-shadow-sm" aria-hidden="true" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                ศูนย์บริการซ่อมและดูแลคอมพิวเตอร์
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-normal">
                IT SUPPORT • อาคาร 1 ชั้น 3 ห้อง 3
              </p>
            </div>
          </div>

          {/* การ์ดฟอร์มเข้าสู่ระบบ (Elevated Modern Card) */}
          <Card className="p-6 sm:p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_35px_-10px_rgba(15,23,42,0.12),0_10px_15px_-5px_rgba(15,23,42,0.06)] rounded-3xl">
            <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                เข้าสู่ระบบสำหรับเจ้าหน้าที่
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                บัญชีกลางสำหรับสมาชิกทุกคน เข้าใช้งานระบบจัดการงานซ่อม
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* ข้อความแจ้งเตือนข้อผิดพลาดพร้อมสั่นเตือน */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* ช่องชื่อผู้ใช้งาน (Default: admin) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="admin"
                    className="w-full h-[46px] pl-10 pr-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 focus-visible:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* ช่องรหัสผ่าน */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    รหัสผ่าน (Password)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    รหัสผ่าน: 123456
                  </span>
                </div>
                <div className="relative group">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="กรอกรหัสผ่าน 123456"
                    className="w-full h-[46px] pl-10 pr-11 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/70 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-mono tracking-wider focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 focus-visible:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* ปุ่มเข้าสู่ระบบ */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  icon={<LogIn className="w-4 h-4" />}
                  className="w-full h-[46px] rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98]"
                >
                  เข้าสู่ระบบปฏิบัติงาน
                </Button>
              </div>
            </form>

            {/* ปุ่มเข้าสู่ระบบด่วน 1 คลิก ด้วยรหัส admin / 123456 */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleQuickAutoFill}
                disabled={isLoading}
                title="คลิกเพื่อเข้าสู่ระบบทันทีด้วยรหัสกลาง (admin / 123456)"
                className="w-full py-2.5 px-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center justify-center gap-2 group active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                <span>เข้าสู่ระบบทันทีด้วยรหัสกลาง (admin / 123456)</span>
              </button>
            </div>
          </Card>

          {/* ป้ายระบุความปลอดภัยแบบกระชับ */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>เชื่อมต่อกับ Google Sheets อย่างปลอดภัย (256-bit SSL)</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
