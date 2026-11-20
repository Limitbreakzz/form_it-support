import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  CloudUpload,
  Copy,
  Database,
  ExternalLink,
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* ส่วนหัวหน้าตั้งค่า (ปฏิบัติตามกฎ No-Kicker Rule ของ DESIGN.md) */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              ตั้งค่าระบบเชื่อมต่อฐานข้อมูล Google Sheets
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              เชื่อมต่อเว็บแอปพลิเคชันเข้ากับ Google Sheets ของคุณอย่างปลอดภัยผ่าน Google Apps
              Script Web App โดยระบบจะสร้างและจัดการแผ่นงานทั้ง 4 แผ่นงานพร้อมหัวตารางให้อัตโนมัติ
            </p>
          </div>

          <Badge
            variant={isConnected ? 'emerald' : 'amber'}
            className="px-4 py-2 text-xs sm:text-sm"
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
      </Card>

      {/* ฟอร์มกำหนดค่า URL และคู่มือการติดตั้ง */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7 p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
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
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                คุณสามารถวาง URL ที่นี่ได้โดยตรง หรือกำหนดค่าผ่านตัวแปรสภาพแวดล้อม{' '}
                <code className="font-mono">VITE_GAS_WEB_APP_URL</code> ในไฟล์{' '}
                <code className="font-mono">.env</code> โดยไม่ต้องเปิดเผยรหัสลับ API Key ในฝั่ง Frontend
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

            <div className="flex flex-wrap items-center gap-3">
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

          {/* รายละเอียดแผ่นงานทั้ง 4 แผ่นงานที่ระบบสร้างให้อัตโนมัติ (Divided Ledger Grid — ไม่ซ้อนการ์ดหลายชั้น) */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
              โครงสร้างแผ่นงาน Google Sheets ทั้ง 4 แผ่นงาน (สร้างหัวตารางอัตโนมัติ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs bg-slate-50/50 dark:bg-slate-950/40">
              <div className="p-3.5 space-y-1">
                <div className="font-bold font-mono text-blue-600 dark:text-blue-400">
                  1. IT Support Requests
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  จัดเก็บใบคำขอรับบริการ ข้อมูลผู้แจ้ง รายละเอียดอุปกรณ์ และบริการที่เลือก
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  2. Work Time - Monday Technician
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  จัดเก็บเวลาปฏิบัติงานช่างวันจันทร์ พร้อมคอลัมน์ลายมือชื่อดิจิทัล 2 คน
                </div>
              </div>
              <div className="p-3.5 space-y-1 sm:border-t border-slate-200 dark:border-slate-800">
                <div className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  3. Work Time - Tuesday Technician
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  จัดเก็บเวลาปฏิบัติงานช่างวันอังคาร พร้อมคอลัมน์ลายมือชื่อดิจิทัล 2 คน
                </div>
              </div>
              <div className="p-3.5 space-y-1 sm:border-t border-slate-200 dark:border-slate-800">
                <div className="font-bold font-mono text-amber-800 dark:text-amber-400">
                  4. Work Time - Friday Technician
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  จัดเก็บเวลาปฏิบัติงานช่างวันศุกร์ พร้อมคอลัมน์ลายมือชื่อดิจิทัล 3 คน
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* คู่มือการติดตั้ง Google Apps Script */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <span>ขั้นตอนการติดตั้ง Google Apps Script</span>
            </h2>
            <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 list-decimal pl-4 leading-relaxed">
              <li>
                สร้างไฟล์ Google Sheets ใหม่ที่{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>sheets.new</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                ในเมนูด้านบนของ Google Sheets ไปที่{' '}
                <strong>ส่วนขยาย (Extensions) → Apps Script</strong>
              </li>
              <li>
                คัดลอกโค้ดจากกล่องด้านล่าง (หรือจากไฟล์{' '}
                <code className="font-mono">google-apps-script/Code.gs</code>) ไปวางแทนที่โค้ดเดิมทั้งหมดแล้วกดบันทึก
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
          </Card>
        </div>
      </div>

      {/* โค้ด Google Apps Script พร้อมปุ่มคัดลอกในคลิกเดียว */}
      <div className="rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-mono text-xs sm:text-sm font-bold">
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
            className={copiedCode ? '' : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'}
          >
            {copiedCode ? 'คัดลอกโค้ดเรียบร้อยแล้ว' : 'คัดลอกโค้ด Google Apps Script ทั้งหมด'}
          </Button>
        </div>
        <pre className="p-6 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed text-slate-300">
          <code>{gasSourceCode}</code>
        </pre>
      </div>
    </div>
  );
};
