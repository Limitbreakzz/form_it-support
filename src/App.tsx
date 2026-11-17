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
  X,
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
      label: 'หน้าหลักแดชบอร์ด',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'service-request',
      label: 'ฟอร์ม 1: ขอรับบริการ IT',
      icon: <Wrench className="w-4 h-4" />,
      badge: sheetsData.REQUESTS.length,
    },
    {
      id: 'work-time-group-1',
      label: 'บันทึกเวลา กลุ่ม 1 (2 คน)',
      icon: <Clock className="w-4 h-4" />,
      badge: sheetsData.GROUP_1.length,
    },
    {
      id: 'work-time-group-2',
      label: 'บันทึกเวลา กลุ่ม 2 (3 คน)',
      icon: <Clock className="w-4 h-4" />,
      badge: sheetsData.GROUP_2.length,
    },
    {
      id: 'work-time-group-3',
      label: 'บันทึกเวลา กลุ่ม 3 (3 คน)',
      icon: <Clock className="w-4 h-4" />,
      badge: sheetsData.GROUP_3.length,
    },
    {
      id: 'history',
      label: 'ประวัติและค้นหาข้อมูล',
      icon: <FolderKanban className="w-4 h-4" />,
      badge:
        sheetsData.REQUESTS.length +
        sheetsData.GROUP_1.length +
        sheetsData.GROUP_2.length +
        sheetsData.GROUP_3.length,
    },
    {
      id: 'setup',
      label: 'ตั้งค่า Google Sheets',
      icon: <Database className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ลิงก์ข้ามไปยังเนื้อหาหลักสำหรับผู้ใช้งานคีย์บอร์ด */}
      <a href="#main-content" className="skip-link no-print">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* แถบเมนูด้านบน (ซ่อนขณะพิมพ์) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4rem] py-2 gap-4">
            {/* โลโก้และชื่อระบบ */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
            >
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  ระบบจัดการงานบริการ{' '}
                  <span className="text-blue-600 dark:text-blue-400">IT Support</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  เชื่อมโยงฐานข้อมูล Google Sheets อัตโนมัติครบ 4 แผ่นงาน
                </div>
              </div>
            </button>

            {/* ปุ่มควบคุมด้านขวา */}
            <div className="flex items-center gap-2.5">
              {/* สถานะการเชื่อมต่อ Google Sheets */}
              <button
                type="button"
                onClick={() => setActiveTab('setup')}
                title="คลิกเพื่อตั้งค่าการเชื่อมต่อ Google Sheets"
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isConnected ? 'เชื่อมต่อ Google Sheets แล้ว' : 'ตั้งค่า Google Sheets API'}
              </button>

              {/* ปุ่มสลับสิทธิ์เจ้าหน้าที่ */}
              <button
                type="button"
                onClick={() => {
                  if (isAuthorized) {
                    setIsAuthorized(false);
                  } else {
                    handleRequestAuthorization(
                      'ยืนยันรหัสผ่านเพื่อปลดล็อกสิทธิ์การแก้ไขและลบข้อมูล',
                      () => {}
                    );
                  }
                }}
                title={
                  isAuthorized
                    ? 'คลิกเพื่อล็อกสิทธิ์เจ้าหน้าที่'
                    : 'คลิกเพื่อปลดล็อกสิทธิ์แก้ไขและลบข้อมูล'
                }
                className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                  isAuthorized
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAuthorized ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isAuthorized ? 'โหมดเจ้าหน้าที่' : 'ล็อกการแก้ไข'}
                </span>
              </button>

              {/* ปุ่มสลับโหมดสว่าง / โหมดมืด */}
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                title={darkMode ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
                aria-label={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* ปุ่มเมนูบนหน้าจอมือถือ */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="เปิดหรือปิดเมนูนำทาง"
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* แถบเมนูนำทางสำหรับหน้าจอคอมพิวเตอร์ */}
          <nav
            aria-label="เมนูหลักของระบบ"
            className="hidden lg:flex items-center gap-1.5 py-2.5 overflow-x-auto border-t border-slate-100 dark:border-slate-800/80"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id !== 'service-request') {
                      setEditingServiceRequest(null);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-mono tabular-nums-thai ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* เมนูนำทางสำหรับหน้าจอมือถือและแท็บเล็ต */}
          {mobileMenuOpen && (
            <nav
              aria-label="เมนูนำทางบนมือถือ"
              className="lg:hidden py-3 space-y-1 border-t border-slate-200 dark:border-slate-800"
            >
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id !== 'service-request') {
                        setEditingServiceRequest(null);
                      }
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums-thai">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* พื้นที่แสดงเนื้อหาหลัก */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none">
        {activeTab === 'dashboard' && (
          <DashboardHome
            sheetsData={sheetsData}
            isConnected={isConnected}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'service-request' && (
          <ServiceRequestForm
            existingRecords={sheetsData.REQUESTS}
            editingRecord={editingServiceRequest}
            onCancelEdit={() => {
              setEditingServiceRequest(null);
              setActiveTab('history');
            }}
            onSaveRecord={handleSaveServiceRequest}
            onBackToDashboard={() => {
              setEditingServiceRequest(null);
              setActiveTab('dashboard');
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
            onBackToDashboard={() => setActiveTab('dashboard')}
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
            onBackToDashboard={() => setActiveTab('dashboard')}
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
            onBackToDashboard={() => setActiveTab('dashboard')}
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
              setActiveTab('service-request');
            }}
            onDeleteRecord={handleDeleteRecord}
            onNavigate={(tab) => setActiveTab(tab)}
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
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              ระบบจัดการข้อมูลงานบริการและบันทึกเวลาปฏิบัติงาน IT Support • เชื่อมต่อฐานข้อมูล Google Sheets
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span>1. IT Support Requests</span>
            <span>•</span>
            <span>2. Work Time - Group 1 (2 คน)</span>
            <span>•</span>
            <span>3. Work Time - Group 2 (3 คน)</span>
            <span>•</span>
            <span>4. Work Time - Group 3 (3 คน)</span>
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
    </div>
  );
}

export default App;
