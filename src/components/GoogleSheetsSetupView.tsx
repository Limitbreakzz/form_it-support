import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  CloudUpload,
  Copy,
  Database,
  ExternalLink,
  Info,
  RefreshCw,
  Server,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import {
  getConfiguredGasUrl,
  setConfiguredGasUrl,
  syncPendingRecordsToCloud,
  testGoogleSheetsConnection,
} from '../services/googleSheetsService';
import gasSourceCode from '../../google-apps-script/Code.gs?raw';
import { Badge, Button, Card, RunningDots, toast } from './ui/DesignSystem';

interface GoogleSheetsSetupViewProps {
  isConnected: boolean;
  onConnectionUpdated: () => Promise<void>;
}

export const GoogleSheetsSetupView: React.FC<GoogleSheetsSetupViewProps> = ({
  isConnected,
  onConnectionUpdated,
}) => {
  const [urlInput, setUrlInput] = useState<string>(() => getConfiguredGasUrl());
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMsg(null);
    setConfiguredGasUrl(urlInput);

    try {
      if (!urlInput.trim()) {
        setStatusMsg({
          type: 'info',
          text: 'ล้างค่า URL ของ Google Apps Script แล้ว ขณะนี้ระบบทำงานในโหมดสำรองข้อมูลในเครื่องจนกว่าจะระบุ Web App URL ใหม่',
        });
        await onConnectionUpdated();
        return;
      }

      const result = await testGoogleSheetsConnection(urlInput.trim());
      if (result.connected) {
        setStatusMsg({
          type: 'success',
          text: `${result.message} • แผ่นงานที่พร้อมใช้งาน: ${
            result.sheets?.join(', ') ||
            'IT Support Requests, Work Time - Monday Technician, Work Time - Tuesday Technician, Work Time - Friday Technician'
          }`,
        });
        toast.success('เชื่อมต่อ Google Sheets สำเร็จเรียบร้อย');
        await onConnectionUpdated();
      } else {
        setStatusMsg({
          type: 'error',
          text: result.message,
        });
        toast.error(result.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSyncPending = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await syncPendingRecordsToCloud();
      await onConnectionUpdated();
      const syncText = `ซิงก์ข้อมูลขึ้น Google Sheets เสร็จสมบูรณ์: สำเร็จ ${res.syncedCount} รายการ (ไม่สำเร็จ ${res.failedCount} รายการ)`;
      setStatusMsg({
        type: res.failedCount === 0 ? 'success' : 'error',
        text: syncText,
      });
      if (res.failedCount === 0) {
        toast.success(`ซิงก์ข้อมูลขึ้น Google Sheets สำเร็จ ${res.syncedCount} รายการ`);
      } else {
        toast.error(`ซิงก์สำเร็จ ${res.syncedCount} รายการ (ไม่สำเร็จ ${res.failedCount} รายการ)`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyGasCode = async () => {
    try {
      await navigator.clipboard.writeText(gasSourceCode);
      setCopiedCode(true);
      toast.success('คัดลอกโค้ด Google Apps Script ไปยังคลิปบอร์ดแล้ว');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ส่วนหัวหน้าตั้งค่า */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              ตั้งค่าระบบเชื่อมต่อฐานข้อมูล Google Sheets
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              เชื่อมต่อเว็บแอปพลิเคชันเข้ากับ Google Sheets ของคุณอย่างปลอดภัยผ่าน Google Apps
              Script Web App โดยระบบจะสร้างและจัดการแผ่นงานทั้ง 4 แผ่นงานพร้อมหัวตารางให้อัตโนมัติ
            </p>
          </div>

          <div className="shrink-0">
            <Badge
              variant={isConnected ? 'emerald' : 'amber'}
              className="px-3.5 py-2 text-xs sm:text-sm"
            >
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
              <span>{isConnected ? 'เชื่อมต่อ Google Sheets แล้ว' : 'รอการระบุ Web App URL'}</span>
            </Badge>
          </div>
        </div>
      </Card>

      {/* ฟอร์มกำหนดค่า URL และคู่มือการติดตั้ง (สมดุล 2 คอลัมน์บนจอคอมพิวเตอร์ และเรียงลำดับอ่านง่ายบนจอพกพา) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* คอลัมน์ซ้าย: ฟอร์มระบุ URL และทดสอบการเชื่อมต่อ */}
        <Card className="p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. ระบุ URL ของ Google Apps Script Web App
              </h2>
            </div>

            <form onSubmit={handleSaveAndTest} className="space-y-4">
              <div>
                <label
                  htmlFor="gas-url-input"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Web App URL ที่ได้จากการ Deploy (`https://script.google.com/macros/s/.../exec`)
                </label>
                <input
                  id="gas-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  สามารถวาง URL ได้โดยตรง หรือกำหนดผ่านตัวแปรสภาพแวดล้อม{' '}
                  <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                    VITE_GAS_WEB_APP_URL
                  </code>{' '}
                  ในไฟล์ <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code>
                </p>
              </div>

              {statusMsg && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 leading-relaxed ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                      : statusMsg.type === 'error'
                      ? 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
                      : 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <ShieldAlert
                      className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={testing}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  {testing ? (
                    <span className="inline-flex items-center">
                      กำลังทดสอบการเชื่อมต่อ
                      <RunningDots size="xs" />
                    </span>
                  ) : (
                    'บันทึกและทดสอบการเชื่อมต่อ'
                  )}
                </Button>

                {urlInput.trim() && (
                  <Button
                    type="button"
                    variant="success"
                    isLoading={syncing}
                    icon={<CloudUpload className="w-4 h-4" />}
                    onClick={handleSyncPending}
                  >
                    {syncing ? (
                      <span className="inline-flex items-center">
                        กำลังซิงก์ข้อมูล
                        <RunningDots size="xs" />
                      </span>
                    ) : (
                      'ส่งข้อมูลที่ค้างในเครื่องขึ้น Google Sheets'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            ระบบรองรับทั้งโหมดออนไลน์ Google Sheets และโหมดทำงานออฟไลน์ในเครื่องโดยอัตโนมัติ
          </div>
        </Card>

        {/* คอลัมน์ขวา: คู่มือการติดตั้ง Google Apps Script แบบเป็นขั้นตอน */}
        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base sm:text-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <span>2. ขั้นตอนการติดตั้ง Google Apps Script</span>
            </h2>
            <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5 leading-relaxed">
              <li>
                สร้างไฟล์ Google Sheets ใหม่ที่{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>sheets.new</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                ในเมนูด้านบนของ Google Sheets ไปที่{' '}
                <strong>ส่วนขยาย (Extensions) → Apps Script</strong>
              </li>
              <li>
                คัดลอกโค้ดจากกล่องด้านล่าง (ไฟล์{' '}
                <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">
                  google-apps-script/Code.gs
                </code>
                ) ไปวางแทนที่โค้ดเดิมทั้งหมดแล้วกดบันทึก
              </li>
              <li>
                คลิกปุ่ม{' '}
                <strong>
                  ทำให้ใช้งานได้ (Deploy) → การทำให้ใช้งานได้รายการใหม่ (New deployment)
                </strong>{' '}
                แล้วเลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong>
              </li>
              <li>
                ตั้งค่า <em>ดำเนินการในฐานะ (Execute as)</em> เป็น <strong>ฉัน (Me)</strong> และตั้งค่า{' '}
                <em>ผู้ที่มีสิทธิ์เข้าถึง (Who has access)</em> เป็น <strong>ทุกคน (Anyone)</strong>
              </li>
              <li>
                กดยืนยันการ Deploy และคัดลอก <strong>Web App URL</strong> มาวางในช่องทางด้านซ้าย
              </li>
            </ol>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">คำแนะนำ:</span>{' '}
              หากแก้ไขโค้ดในภายหลัง ให้กดเผยแพร่เวอร์ชันใหม่เสมอ เพื่อให้ระบบอัปเดตข้อมูลล่าสุด
            </div>
          </div>
        </Card>
      </div>

      {/* โครงสร้างแผ่นงานทั้ง 4 แผ่นงาน (ขยายเต็มพื้นที่ Responsive 4 คอลัมน์) */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>3. โครงสร้างแผ่นงาน Google Sheets ทั้ง 4 แผ่นงาน (สร้างหัวตารางอัตโนมัติ)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              เมื่อส่งข้อมูลครั้งแรก ระบบ Google Apps Script จะสร้างแท็บแผ่นงานและหัวตารางเหล่านี้ให้อัตโนมัติ
            </p>
          </div>
          <Badge variant="blue" className="self-start sm:self-auto shrink-0">
            4 แผ่นงาน (Worksheets)
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* แผ่นงานที่ 1 */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold mb-1.5">
                Worksheet 1
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                IT Support Requests
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                จัดเก็บใบคำขอรับบริการ ข้อมูลผู้แจ้ง รายละเอียดอุปกรณ์ และบริการที่เลือก
              </p>
            </div>
            <div className="pt-3 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 font-mono">
              คอลัมน์: A ถึง N (14 คอลัมน์)
            </div>
          </div>

          {/* แผ่นงานที่ 2 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold mb-1.5">
                Worksheet 2
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Work Time - Monday Technician
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                จัดเก็บเวลาปฏิบัติงานช่างวันจันทร์ พร้อมคอลัมน์ลายมือชื่อดิจิทัล 2 คน
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              คอลัมน์: A ถึง G (7 คอลัมน์)
            </div>
          </div>

          {/* แผ่นงานที่ 3 */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold mb-1.5">
                Worksheet 3
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Work Time - Tuesday Technician
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                จัดเก็บเวลาปฏิบัติงานช่างวันอังคาร พร้อมคอลัมน์ลายมือชื่อดิจิทัล 2 คน
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
              คอลัมน์: A ถึง G (7 คอลัมน์)
            </div>
          </div>

          {/* แผ่นงานที่ 4 */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-bold mb-1.5">
                Worksheet 4
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Work Time - Friday Technician
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                จัดเก็บเวลาปฏิบัติงานช่างวันศุกร์ พร้อมคอลัมน์ลายมือชื่อดิจิทัล 3 คน
              </p>
            </div>
            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-300 font-mono">
              คอลัมน์: A ถึง H (8 คอลัมน์)
            </div>
          </div>
        </div>
      </Card>

      {/* โค้ด Google Apps Script พร้อมปุ่มคัดลอกในคลิกเดียว */}
      <div className="rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-mono text-xs sm:text-sm font-bold truncate">
              google-apps-script/Code.gs (โค้ด Backend API สำหรับวางใน Google Sheets)
            </span>
          </div>
          <Button
            type="button"
            variant={copiedCode ? 'success' : 'outline'}
            size="sm"
            icon={
              copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )
            }
            onClick={handleCopyGasCode}
            className={copiedCode ? '' : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700 shrink-0'}
          >
            <span className="hidden sm:inline">
              {copiedCode ? 'คัดลอกโค้ดเรียบร้อยแล้ว' : 'คัดลอกโค้ด Google Apps Script ทั้งหมด'}
            </span>
            <span className="sm:hidden">
              {copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
            </span>
          </Button>
        </div>
        <pre className="p-4 sm:p-6 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed text-slate-300">
          <code>{gasSourceCode}</code>
        </pre>
      </div>
    </div>
  );
};
