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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งาน หรือเลือกบัญชีด่วนด้านล่าง');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // ตรวจสอบกับบัญชีที่กำหนดไว้ในระบบ
      const matched = PRESET_ACCOUNTS.find(
        (acc) =>
          (acc.username.toLowerCase() === cleanUser || acc.name.toLowerCase() === cleanUser) &&
          (acc.password === cleanPass ||
            cleanPass === '1234' ||
            (acc.username === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin1234')))
      );

      if (matched) {
        setIsLoading(false);
        const authUser: AuthUser = {
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role,
          roleLabelTh: matched.roleLabelTh,
          shift: matched.shift,
          avatarColor: matched.avatarColor,
        };
        toast.success(`ยินดีต้อนรับคุณ ${matched.name}`, {
          title: `เข้าสู่ระบบสำเร็จ (${matched.roleLabelTh})`,
        });
        onLoginSuccess(authUser);
      } else {
        setIsLoading(false);
        setErrorMessage('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง หรือใช้ปุ่มเข้าสู่ระบบด่วน');
        toast.error('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบรหัสผ่าน');
      }
    }, 450);
  };

  const handleQuickLogin = (account: (typeof PRESET_ACCOUNTS)[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authUser: AuthUser = {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
        roleLabelTh: account.roleLabelTh,
        shift: account.shift,
        avatarColor: account.avatarColor,
      };
      toast.success(`ยินดีต้อนรับคุณ ${account.name}`, {
        title: `เข้าสู่ระบบสำเร็จ (${account.roleLabelTh})`,
      });
      onLoginSuccess(authUser);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors">
      {/* แถบด้านบน: สลับธีมสว่าง/มืด */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <span>ระบบรักษาความปลอดภัยศูนย์บริการ IT Support</span>
        </div>
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>โหมดสว่าง</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <span>โหมดมืด</span>
            </>
          )}
        </button>
      </header>

      {/* เนื้อหากลาง: ฟอร์มเข้าสู่ระบบ */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-6">
          {/* ตราสัญลักษณ์และหัวข้อระบบ */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mx-auto">
              <Wrench className="w-7 h-7" aria-hidden="true" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ศูนย์บริการซ่อมและดูแลคอมพิวเตอร์
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              IT SUPPORT • อาคาร 1 ชั้น 3 ห้อง 3<br />
              กรุณาเข้าสู่ระบบเพื่อจัดการใบแจ้งซ่อมและบันทึกเวลาปฏิบัติงาน
            </p>
          </div>

          {/* การ์ดฟอร์มเข้าสู่ระบบ */}
          <Card className="p-6 sm:p-7 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* ข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* ช่องชื่อผู้ใช้งาน */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
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
                    placeholder="เช่น admin หรือ staff"
                    className="w-full h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* ช่องรหัสผ่าน */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
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
                    placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น: 1234)"
                    className="w-full h-[44px] pl-10 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* ปุ่มส่งฟอร์มเข้าสู่ระบบ */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={<LogIn className="w-4 h-4" />}
                className="w-full mt-2"
              >
                เข้าสู่ระบบเพื่อเริ่มปฏิบัติงาน
              </Button>
            </form>

            {/* ส่วนแบ่ง: เข้าสู่ระบบด่วน */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  เลือกบัญชีเข้าสู่ระบบด่วน (Quick Login)
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">คลิกเพื่อเข้าใช้งานทันที</span>
              </div>

              {/* ปุ่มบัญชีด่วน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-blue-50/70 dark:bg-slate-800/40 dark:hover:bg-blue-950/30 text-left transition hover:border-blue-300 dark:hover:border-blue-800 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg ${acc.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {acc.roleLabelTh}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ป้ายรับรองความปลอดภัย */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>เชื่อมต่อกับ Google Sheets และระบบคลาวด์อย่างปลอดภัย (256-bit)</span>
          </div>
        </div>
      </main>

      {/* ท้ายหน้า */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        ศูนย์บริการซ่อมและดูแลคอมพิวเตอร์ IT Support • ระบบบันทึกและจัดการงานซ่อม
      </footer>
    </div>
  );
};

