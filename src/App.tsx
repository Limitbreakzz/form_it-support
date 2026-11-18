import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Database,
  FolderKanban,
  LayoutDashboard,
  Lock,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Unlock,
  Wrench,
} from 'lucide-react';
import {
  AnyWorkTimeRecord,
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
  getConfiguredGasUrl,
  updateSheetRecord,
} from './services/googleSheetsService';
import { DashboardHome } from './components/DashboardHome';
import { ServiceRequestForm } from './components/ServiceRequestForm';
import { WorkTimeGroupForm } from './components/WorkTimeGroupForm';
import { SubmissionHistoryView } from './components/SubmissionHistoryView';
import { GoogleSheetsSetupView } from './components/GoogleSheetsSetupView';
import { AuthorizationModal } from './components/AuthorizationModal';
import { Badge, Drawer, ToastContainer } from './components/ui/DesignSystem';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('it_support_theme_v1') === 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sheetsData, setSheetsData] = useState<AllSheetsData>({
    REQUESTS: [],
    GROUP_1: [],
    GROUP_2: [],
    GROUP_3: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(() => Boolean(getConfiguredGasUrl()));

  const [editingServiceRequest, setEditingServiceRequest] =
    useState<ServiceRequestRecord | null>(null);

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    reason: string;
    callback: (() => void) | null;
  }>({
    isOpen: false,
    reason: '',
    callback: null,
  });

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

  const handleRequestAuthorization = (reason: string, callback: () => void) => {
    if (isAuthorized) {
      callback();
      return;
    }
    setAuthModalState({
      isOpen: true,
      reason,
      callback,
    });
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ลิงก์ข้ามไปยังเนื้อหาหลักสำหรับผู้ใช้งานคีย์บอร์ด */}
      <a href="#main-content" className="skip-link no-print">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* แถบส่วนหัวด้านบนแบบมินิมอล พร้อมปุ่ม Hamburger Menu (ซ่อนขณะพิมพ์) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-3 sm:gap-4">
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
                  isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <span>{isConnected ? 'เชื่อมต่อฐานข้อมูลแล้ว' : 'บันทึกในเครื่อง (ตั้งค่าออนไลน์)'}</span>
              </button>

              {/* ปุ่มสลับสิทธิ์เจ้าหน้าที่ */}
              <button
                type="button"
                onClick={() => {
                  if (isAuthorized) {
                    setIsAuthorized(false);
                  } else {
                    handleRequestAuthorization(
                      'กรุณากรอกรหัสผ่านเจ้าหน้าที่ (PIN) เพื่อปลดล็อกการแก้ไขและลบข้อมูล',
                      () => {}
                    );
                  }
                }}
                title={
                  isAuthorized
                    ? 'คลิกเพื่อออกจากโหมดเจ้าหน้าที่'
                    : 'สำหรับเจ้าหน้าที่: คลิกเพื่อปลดล็อกการแก้ไขและลบข้อมูล'
                }
                aria-label={isAuthorized ? 'โหมดเจ้าหน้าที่ (คลิกเพื่อล็อก)' : 'สำหรับเจ้าหน้าที่ (คลิกเพื่อปลดล็อกการแก้ไข)'}
                className={`min-h-[40px] min-w-[40px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  isAuthorized
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAuthorized ? (
                  <Unlock className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {isAuthorized ? 'โหมดเจ้าหน้าที่' : 'สำหรับเจ้าหน้าที่'}
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
            <div className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthorized) {
                    setIsAuthorized(false);
                  } else {
                    handleRequestAuthorization(
                      'ยืนยันรหัสผ่านเพื่อปลดล็อกสิทธิ์การแก้ไขและลบข้อมูล',
                      () => {}
                    );
                  }
                }}
                className={`flex-1 min-h-[46px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  isAuthorized
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isAuthorized ? (
                  <Unlock className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{isAuthorized ? 'โหมดเจ้าหน้าที่ (ปลดล็อกแล้ว)' : 'ปลดล็อกโหมดเจ้าหน้าที่'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                className="min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
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

      {/* พื้นที่แสดงเนื้อหาหลัก */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
      >
        {activeTab === 'dashboard' && (
          <DashboardHome
            sheetsData={sheetsData}
            isConnected={isConnected}
            onNavigate={handleNavigate}
          />
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
            isAuthorized={isAuthorized}
            onRequestAuthorization={handleRequestAuthorization}
            onSaveWorkRecord={handleSaveWorkTimeRecord}
            onDeleteWorkRecord={handleDeleteRecord}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {activeTab === 'work-time-group-2' && (
          <WorkTimeGroupForm
            groupConfig={WORK_TIME_GROUPS.GROUP_2}
            records={sheetsData.GROUP_2}
            isAuthorized={isAuthorized}
            onRequestAuthorization={handleRequestAuthorization}
            onSaveWorkRecord={handleSaveWorkTimeRecord}
            onDeleteWorkRecord={handleDeleteRecord}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {activeTab === 'work-time-group-3' && (
          <WorkTimeGroupForm
            groupConfig={WORK_TIME_GROUPS.GROUP_3}
            records={sheetsData.GROUP_3}
            isAuthorized={isAuthorized}
            onRequestAuthorization={handleRequestAuthorization}
            onSaveWorkRecord={handleSaveWorkTimeRecord}
            onDeleteWorkRecord={handleDeleteRecord}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {activeTab === 'history' && (
          <SubmissionHistoryView
            sheetsData={sheetsData}
            isLoading={isLoading}
            isAuthorized={isAuthorized}
            onRefresh={loadSheetsData}
            onRequestAuthorization={handleRequestAuthorization}
            onEditServiceRequest={(rec) => {
              setEditingServiceRequest(rec);
              handleNavigate('service-request');
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

      {/* หน้าต่างยืนยันรหัสผ่านเจ้าหน้าที่ */}
      <AuthorizationModal
        isOpen={authModalState.isOpen}
        actionDescription={authModalState.reason}
        onClose={() => setAuthModalState({ isOpen: false, reason: '', callback: null })}
        onAuthorized={() => {
          setIsAuthorized(true);
          if (authModalState.callback) {
            authModalState.callback();
          }
        }}
      />
      {/* ระบบแจ้งเตือนลอยตัว Toast Feedback ทั่วทั้งระบบ */}
      <ToastContainer />
    </div>
  );
}

export default App;
