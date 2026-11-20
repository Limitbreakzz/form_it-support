import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Database,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AnyWorkTimeRecord,
  AuthUser,
  NavigationTab,
  ServiceRequestRecord,
  SheetKey,
  WORK_TIME_GROUPS,
} from './types';
import {
  AllSheetsData,
  createSheetRecord,
  deleteSheetRecord,
  fetchAllWorksheets,
  getCachedAllSheetsData,
  getConfiguredGasUrl,
  updateSheetRecord,
} from './services/googleSheetsService';
import { DashboardHome } from './components/DashboardHome';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ServiceRequestForm } from './components/ServiceRequestForm';
import { WorkTimeGroupForm } from './components/WorkTimeGroupForm';
import { SubmissionHistoryView } from './components/SubmissionHistoryView';
import { GoogleSheetsSetupView } from './components/GoogleSheetsSetupView';
import { LoginView } from './components/LoginView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Badge, Drawer, RunningDots, toast, ToastContainer } from './components/ui/DesignSystem';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('it_support_theme_v1') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ดึงข้อมูลแคชจากหน่วยความจำเครื่องขึ้นมาทันที 0ms ป้องกันหน้าจอแสดง 0 และป้องกันความรู้สึกข้อมูลหาย
  const [sheetsData, setSheetsData] = useState<AllSheetsData>(() => getCachedAllSheetsData());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(() => Boolean(getConfiguredGasUrl()));

  const [editingServiceRequest, setEditingServiceRequest] =
    useState<ServiceRequestRecord | null>(null);
  const [editingWorkTimeRecord, setEditingWorkTimeRecord] = useState<{
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3';
    record: AnyWorkTimeRecord;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('it_support_auth_user_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('it_support_auth_user_v1', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('it_support_auth_user_v1');
    } catch {
      // ignore
    }
    toast.info('ออกจากระบบเรียบร้อยแล้ว');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('it_support_theme_v1', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('it_support_theme_v1', 'light');
    }
  }, [darkMode]);

  const loadSheetsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllWorksheets();
      setSheetsData(result.data);
      setIsConnected(Boolean(getConfiguredGasUrl()) && (result.fromCloud || !result.error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSheetsData();
  }, [loadSheetsData]);

  const handleNavigate = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSaveServiceRequest = async (
    record: ServiceRequestRecord,
    isEdit: boolean
  ): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> => {
    const res = isEdit
      ? await updateSheetRecord<ServiceRequestRecord>('REQUESTS', record)
      : await createSheetRecord<ServiceRequestRecord>('REQUESTS', record);

    if (res.success) {
      await loadSheetsData();
      setEditingServiceRequest(null);
    }
    return {
      success: res.success,
      syncedToCloud: res.syncedToCloud,
      error: res.error,
    };
  };

  const handleSaveWorkTimeRecord = async (
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
    record: AnyWorkTimeRecord,
    isEdit: boolean
  ): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> => {
    const res = isEdit
      ? await updateSheetRecord(sheetKey, record)
      : await createSheetRecord(sheetKey, record);

    if (res.success) {
      await loadSheetsData();
    }
    return {
      success: res.success,
      syncedToCloud: res.syncedToCloud,
      error: res.error,
    };
  };

  const handleDeleteRecord = async (
    sheetKey: SheetKey,
    recordId: string
  ): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> => {
    const res = await deleteSheetRecord(sheetKey, recordId);
    if (res.success) {
      await loadSheetsData();
    }
    return {
      success: res.success,
      syncedToCloud: res.syncedToCloud,
      error: res.error,
    };
  };

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'หน้าหลัก',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'service-request',
      label: 'แจ้งซ่อม / ขอรับบริการ IT',
      icon: <Wrench className="w-5 h-5 shrink-0" />,
      badge: sheetsData.REQUESTS.length,
    },
    {
      id: 'work-time-group-1',
      label: 'ลงเวลา: ช่างวันจันทร์ (2 คน)',
      icon: <Clock className="w-5 h-5 shrink-0" />,
      badge: sheetsData.GROUP_1.length,
    },
    {
      id: 'work-time-group-2',
      label: 'ลงเวลา: ช่างวันอังคาร (2 คน)',
      icon: <Clock className="w-5 h-5 shrink-0" />,
      badge: sheetsData.GROUP_2.length,
    },
    {
      id: 'work-time-group-3',
      label: 'ลงเวลา: ช่างวันศุกร์ (3 คน)',
      icon: <Clock className="w-5 h-5 shrink-0" />,
      badge: sheetsData.GROUP_3.length,
    },
    {
      id: 'history',
      label: 'ติดตามสถานะซ่อมและประวัติ',
      icon: <FolderKanban className="w-5 h-5 shrink-0" />,
      badge:
        sheetsData.REQUESTS.length +
        sheetsData.GROUP_1.length +
        sheetsData.GROUP_2.length +
        sheetsData.GROUP_3.length,
    },
    {
      id: 'setup',
      label: 'ตั้งค่าเชื่อมต่อ Google Sheets',
      icon: <Database className="w-5 h-5 shrink-0" />,
    },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* แถบความคืบหน้าการซิงก์ข้อมูลบางเบาระดับพรีเมียม (Linear/Vercel standard) */}
      {isLoading && <div className="top-loading-bar no-print" aria-hidden="true" />}

      {/* ลิงก์ข้ามไปยังเนื้อหาหลักสำหรับผู้ใช้งานคีย์บอร์ด */}
      <a href="#main-content" className="skip-link no-print">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* แถบส่วนหัวด้านบนแบบมินิมอล พร้อมปุ่ม Hamburger Menu (ซ่อนขณะพิมพ์) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.75rem] sm:min-h-[4.25rem] py-1.5 sm:py-2 gap-3 sm:gap-4">
            {/* โลโก้ ชื่อระบบ และป้ายระบุหน้าปัจจุบัน */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setEditingServiceRequest(null);
                  handleNavigate('dashboard');
                }}
                className="flex items-center gap-3 text-left group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-xl p-1 -ml-1"
              >
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition shrink-0">
                  <Wrench className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
                    ศูนย์บริการซ่อมและดูแลคอมพิวเตอร์{' '}
                    <span className="text-blue-600 dark:text-blue-400">IT Support</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                    แจ้งซ่อมคอมพิวเตอร์ ติดตามสถานะงานซ่อม และพิมพ์ใบรับบริการขนาด A4
                  </div>
                </div>
              </button>

              {/* ป้ายบอกตำแหน่งหน้าปัจจุบันบนหน้าจอแท็บเล็ตและคอมพิวเตอร์ */}
              {(() => {
                const activeNavItem = navItems.find((item) => item.id === activeTab);
                if (!activeNavItem) return null;
                return (
                  <div className="hidden lg:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                    <span className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                      {activeNavItem.icon}
                    </span>
                    <span>{activeNavItem.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* ปุ่มควบคุมด้านขวา และปุ่ม Hamburger Menu หลัก */}
            <div className="flex items-center gap-2 shrink-0">
              {/* สถานะการเชื่อมต่อ Google Sheets */}
              <button
                type="button"
                onClick={() => handleNavigate('setup')}
                title="คลิกเพื่อดูหรือตั้งค่าการเชื่อมต่อ Google Sheets"
                className={`hidden md:inline-flex items-center gap-2 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  isLoading
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                    : isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    isLoading
                      ? 'bg-blue-500 animate-pulse'
                      : isConnected
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      กำลังซิงก์ข้อมูล
                      <RunningDots size="xs" />
                    </span>
                  ) : isConnected ? (
                    'เชื่อมต่อฐานข้อมูลแล้ว'
                  ) : (
                    'บันทึกในเครื่อง (ตั้งค่าออนไลน์)'
                  )}
                </span>
              </button>

              {/* ปุ่มสลับโหมดสว่าง / โหมดมืด */}
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                title={darkMode ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
                aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                className="min-h-[40px] min-w-[40px] p-2 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {/* ข้อมูลโปรไฟล์ผู้ใช้งานและปุ่มออกจากระบบ */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-2 text-left">
                  <div
                    className={`w-8 h-8 rounded-xl ${
                      currentUser.avatarColor || 'bg-blue-600'
                    } text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0`}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 max-w-[130px]">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.roleLabelTh}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmLogoutOpen(true)}
                  title="ออกจากระบบ"
                  aria-label="ออกจากระบบ"
                  className="min-h-[40px] px-2.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 hover:bg-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
              </div>

              {/* ปุ่มเมนูนำทางหลักสำหรับเปิด Slide-out Navigation Drawer */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-haspopup="dialog"
                aria-label="เปิดแถบเมนูนำทางหลัก"
                title="เปิดเมนูนำทาง (Navigation Menu)"
                className="min-h-[40px] min-w-[40px] px-3 py-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <Menu className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">เมนูนำทาง</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer สำหรับทุกขนาดหน้าจอ (Desktop, Tablet, Mobile) */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="เมนูใช้งานหลัก"
        subtitle="เลือกหน้าแจ้งซ่อม ติดตามสถานะงานซ่อม หรือลงเวลาปฏิบัติงาน"
        icon={<Wrench className="w-6 h-6" />}
        position="right"
        size="md"
        badge={
          <Badge variant={isConnected ? 'emerald' : 'amber'}>
            {isConnected ? 'ออนไลน์' : 'บันทึกในเครื่อง'}
          </Badge>
        }
        footer={
          <div className="space-y-3">
            {/* ข้อมูลโปรไฟล์และปุ่มออกจากระบบสำหรับหน้าจอมือถือ */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${
                    currentUser.avatarColor || 'bg-blue-600'
                  } text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.roleLabelTh}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsConfirmLogoutOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition shrink-0"
              >
                ออกจากระบบ
              </button>
            </div>

            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span>โหมดสว่าง</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" aria-hidden="true" />
                    <span>โหมดมืด</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              กดปุ่ม <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">Esc</kbd> หรือคลิกพื้นที่ด้านนอกเพื่อปิดเมนู
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* สถานะการเชื่อมต่อ Google Sheets */}
          <button
            type="button"
            onClick={() => handleNavigate('setup')}
            className={`w-full flex items-center justify-between p-4 rounded-xl text-xs sm:text-sm font-semibold border transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              isConnected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="space-y-1 pr-3">
              <div className="flex items-center gap-2.5 font-bold text-sm">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {isConnected
                    ? 'เชื่อมต่อฐานข้อมูล Google Sheets แล้ว'
                    : 'บันทึกข้อมูลไว้ในเครื่องอัตโนมัติ'}
                </span>
              </div>
              <div className="text-xs opacity-85 pl-5">
                {isConnected
                  ? 'ข้อมูลแจ้งซ่อมและเวลาปฏิบัติงานถูกบันทึกขึ้นระบบออนไลน์ทันที'
                  : 'คลิกเพื่อตั้งค่าการเชื่อมต่อ Google Sheets ออนไลน์'}
              </div>
            </div>
            <Database className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>

          {/* รายการเมนูนำทางหลัก */}
          <nav aria-label="เมนูหลักของระบบ" className="space-y-2">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 pb-1">
              เลือกหน้าที่ต้องการใช้งาน
            </div>
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    if (item.id !== 'service-request') {
                      setEditingServiceRequest(null);
                    }
                    handleNavigate(item.id);
                  }}
                  className={`w-full min-h-[54px] flex items-center justify-between px-4 py-3 rounded-xl text-sm sm:text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span className="flex items-center gap-3.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`p-2 rounded-lg shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-bold tabular-nums-thai shrink-0 ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </Drawer>

      {/* พื้นที่แสดงเนื้อหาหลัก พร้อมการเปลี่ยนหน้าจอแบบ Framer Motion */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 focus:outline-none overflow-x-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && (
              isLoading &&
              sheetsData.REQUESTS.length +
                sheetsData.GROUP_1.length +
                sheetsData.GROUP_2.length +
                sheetsData.GROUP_3.length ===
                0 ? (
                <DashboardSkeleton />
              ) : (
                <DashboardHome
                  sheetsData={sheetsData}
                  isConnected={isConnected}
                  isLoading={isLoading}
                  onNavigate={handleNavigate}
                />
              )
            )}

            {activeTab === 'service-request' && (
              <ServiceRequestForm
                existingRecords={sheetsData.REQUESTS}
                editingRecord={editingServiceRequest}
                onCancelEdit={() => {
                  setEditingServiceRequest(null);
                  handleNavigate('history');
                }}
                onSaveRecord={handleSaveServiceRequest}
                onBackToDashboard={() => {
                  setEditingServiceRequest(null);
                  handleNavigate('dashboard');
                }}
              />
            )}

            {activeTab === 'work-time-group-1' && (
              <WorkTimeGroupForm
                groupConfig={WORK_TIME_GROUPS.GROUP_1}
                records={sheetsData.GROUP_1}
                initialEditingRecord={
                  editingWorkTimeRecord?.sheetKey === 'GROUP_1'
                    ? editingWorkTimeRecord.record
                    : null
                }
                onCancelEdit={() => setEditingWorkTimeRecord(null)}
                onSaveWorkRecord={handleSaveWorkTimeRecord}
                onDeleteWorkRecord={handleDeleteRecord}
                onBackToDashboard={() => {
                  setEditingWorkTimeRecord(null);
                  handleNavigate('dashboard');
                }}
              />
            )}

            {activeTab === 'work-time-group-2' && (
              <WorkTimeGroupForm
                groupConfig={WORK_TIME_GROUPS.GROUP_2}
                records={sheetsData.GROUP_2}
                initialEditingRecord={
                  editingWorkTimeRecord?.sheetKey === 'GROUP_2'
                    ? editingWorkTimeRecord.record
                    : null
                }
                onCancelEdit={() => setEditingWorkTimeRecord(null)}
                onSaveWorkRecord={handleSaveWorkTimeRecord}
                onDeleteWorkRecord={handleDeleteRecord}
                onBackToDashboard={() => {
                  setEditingWorkTimeRecord(null);
                  handleNavigate('dashboard');
                }}
              />
            )}

            {activeTab === 'work-time-group-3' && (
              <WorkTimeGroupForm
                groupConfig={WORK_TIME_GROUPS.GROUP_3}
                records={sheetsData.GROUP_3}
                initialEditingRecord={
                  editingWorkTimeRecord?.sheetKey === 'GROUP_3'
                    ? editingWorkTimeRecord.record
                    : null
                }
                onCancelEdit={() => setEditingWorkTimeRecord(null)}
                onSaveWorkRecord={handleSaveWorkTimeRecord}
                onDeleteWorkRecord={handleDeleteRecord}
                onBackToDashboard={() => {
                  setEditingWorkTimeRecord(null);
                  handleNavigate('dashboard');
                }}
              />
            )}

            {activeTab === 'history' && (
              <SubmissionHistoryView
                sheetsData={sheetsData}
                isLoading={isLoading}
                onRefresh={loadSheetsData}
                onEditServiceRequest={(rec) => {
                  setEditingServiceRequest(rec);
                  handleNavigate('service-request');
                }}
                onEditWorkTimeRecord={(sheetKey, rec) => {
                  setEditingWorkTimeRecord({ sheetKey, record: rec });
                  handleNavigate(
                    sheetKey === 'GROUP_1'
                      ? 'work-time-group-1'
                      : sheetKey === 'GROUP_2'
                      ? 'work-time-group-2'
                      : 'work-time-group-3'
                  );
                }}
                onDeleteRecord={handleDeleteRecord}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'setup' && (
              <GoogleSheetsSetupView
                isConnected={isConnected}
                onConnectionUpdated={loadSheetsData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ส่วนท้ายเว็บไซต์ (ซ่อนขณะพิมพ์) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span>
              ศูนย์บริการซ่อมและดูแลคอมพิวเตอร์ IT Support • อาคาร 1 ชั้น 3 ห้อง 3
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-xs">
            <span>1. แจ้งซ่อม IT Support</span>
            <span aria-hidden="true">•</span>
            <span>2. ช่างวันจันทร์ (2 คน)</span>
            <span aria-hidden="true">•</span>
            <span>3. ช่างวันอังคาร (2 คน)</span>
            <span aria-hidden="true">•</span>
            <span>4. ช่างวันศุกร์ (3 คน)</span>
          </div>
        </div>
      </footer>

      {/* หน้าต่างยืนยันการออกจากระบบ */}
      <ConfirmDialog
        isOpen={isConfirmLogoutOpen}
        title="ยืนยันการออกจากระบบ"
        description={`คุณต้องการออกจากระบบการใช้งานศูนย์บริการ IT Support ในชื่อ "${currentUser?.name}" ใช่หรือไม่?`}
        confirmLabel="ยืนยันออกจากระบบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => {
          setIsConfirmLogoutOpen(false);
          handleLogout();
        }}
        onCancel={() => setIsConfirmLogoutOpen(false)}
      />

      {/* ระบบแจ้งเตือนลอยตัว Toast Feedback ทั่วทั้งระบบ */}
      <ToastContainer />
    </div>
  );
}

export default App;
