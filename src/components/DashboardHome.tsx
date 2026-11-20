import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  FileSpreadsheet,
  FolderKanban,
  Loader2,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { NavigationTab, WORK_TIME_GROUPS } from '../types';
import { AllSheetsData } from '../services/googleSheetsService';
import { Badge, Button, Card } from './ui/DesignSystem';

interface DashboardHomeProps {
  sheetsData: AllSheetsData;
  isConnected: boolean;
  isLoading?: boolean;
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  sheetsData,
  isConnected,
  isLoading = false,
  onNavigate,
}) => {
  const totalRequests = sheetsData.REQUESTS.length;
  const group1Count = sheetsData.GROUP_1.length;
  const group2Count = sheetsData.GROUP_2.length;
  const group3Count = sheetsData.GROUP_3.length;
  const totalWorkLogs = group1Count + group2Count + group3Count;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ส่วนหัวแดชบอร์ดพร้อมแถบสรุปสถิติแบบ Precision Ledger Strip (ไม่ซ้อนการ์ดหลายชั้น) */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              ศูนย์บริการซ่อมคอมพิวเตอร์และบันทึกเวลาปฏิบัติงาน IT Support
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              เลือกรายการที่ต้องการใช้งานด้านล่าง ลูกค้าและผู้รับบริการสามารถกรอกใบแจ้งซ่อมพร้อมตรวจสอบประเมินค่าใช้จ่ายเบื้องต้นได้ทันที ส่วนทีมช่างสามารถลงเวลาเข้า–ออกงานพร้อมลายเซ็นดิจิทัลและสั่งพิมพ์เอกสารขนาด A4 ได้ในคลิกเดียว
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={isConnected ? 'emerald' : 'amber'}>
                {isConnected
                  ? 'เชื่อมต่อระบบบันทึกข้อมูลออนไลน์ (Google Sheets) พร้อมใช้งาน'
                  : 'ทำงานในโหมดบันทึกในเครื่องอัตโนมัติ (ข้อมูลไม่สูญหาย)'}
              </Badge>
              {isLoading && (
                <Badge variant="blue" icon={<Loader2 className="w-3.5 h-3.5 animate-spin" />}>
                  กำลังซิงก์ข้อมูลล่าสุด...
                </Badge>
              )}
              <Badge variant="slate" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                แยกเก็บข้อมูล 4 หมวดหมู่
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="lg"
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => onNavigate('service-request')}
              className="w-full sm:w-auto"
            >
              แจ้งซ่อม / ขอรับบริการใหม่
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              icon={<FolderKanban className="w-4 h-4" />}
              onClick={() => onNavigate('history')}
              className="w-full sm:w-auto"
            >
              ติดตามงานซ่อมและประวัติ ({isLoading && totalRequests + totalWorkLogs === 0 ? 'กำลังโหลด...' : totalRequests + totalWorkLogs})
            </Button>
          </div>
        </div>

        {/* แถบสรุปสถานะแผ่นงานทั้ง 4 แผ่นงาน (Unified Ledger Strip — ไม่ใช้ 4 การ์ดแยกซ้ำซ้อน) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => onNavigate('service-request')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                1. แจ้งซ่อม / ขอรับบริการ
              </span>
              <ClipboardCheck
                className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              {isLoading && totalRequests === 0 ? (
                <span className="inline-block w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse my-0.5" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                  {totalRequests}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">รายการแจ้งซ่อม</span>
            </div>
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
              ใบรับบริการ IT Support
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-1')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                2. บันทึกเวลา ช่างวันจันทร์
              </span>
              <Users
                className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              {isLoading && group1Count === 0 ? (
                <span className="inline-block w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse my-0.5" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                  {group1Count}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">แถว (สมาชิก 2 คน)</span>
            </div>
            <div className="mt-1 text-xs text-slate-700 dark:text-slate-400 font-medium truncate">
              Work Time - Monday Technician
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-2')}
            className="p-4 sm:p-5 text-left sm:border-t lg:border-t-0 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                3. บันทึกเวลา ช่างวันอังคาร
              </span>
              <Users
                className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              {isLoading && group2Count === 0 ? (
                <span className="inline-block w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse my-0.5" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                  {group2Count}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">แถว (สมาชิก 2 คน)</span>
            </div>
            <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 font-medium truncate">
              Work Time - Tuesday Technician
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-3')}
            className="p-4 sm:p-5 text-left sm:border-t lg:border-t-0 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                4. บันทึกเวลา ช่างวันศุกร์
              </span>
              <Users
                className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              {isLoading && group3Count === 0 ? (
                <span className="inline-block w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse my-0.5" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                  {group3Count}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">แถว (สมาชิก 3 คน)</span>
            </div>
            <div className="mt-1 text-xs text-amber-800 dark:text-amber-400 font-medium truncate">
              Work Time - Friday Technician
            </div>
          </button>
        </div>
      </Card>

      {/* ส่วนเลือกแบบฟอร์มหลัก (แยก 2 หมวดหมู่ชัดเจนตามข้อกำหนด โดยไม่ซ้อนการ์ดไว้ในการ์ด) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* หมวดหมู่ที่ 1: แบบฟอร์มขอรับบริการ IT Support */}
        <Card className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div
                  className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    แจ้งซ่อมและขอรับบริการ IT Support (สำหรับผู้รับบริการ)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    สำหรับลูกค้า นักศึกษา และบุคลากรที่นำคอมพิวเตอร์ โน้ตบุ๊ก หรืออุปกรณ์ไอทีมาให้ช่างตรวจเช็ก ลงโปรแกรม หรือซ่อมบำรุง
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>สิ่งที่คุณจะได้รับจากใบแจ้งซ่อมนี้:</span>
                </span>
                <Badge variant="blue">ออกใบรับบริการทันที</Badge>
              </div>
              <ul className="space-y-2 pl-5 list-disc leading-relaxed">
                <li>
                  <strong>เลขที่ใบรับบริการอัตโนมัติ:</strong> ใช้ตรวจสอบสถานะงานซ่อมและรับเครื่องคืนได้สะดวก
                </li>
                <li>
                  <strong>ข้อมูลผู้ติดต่อชัดเจน:</strong> ระบุชื่อ เบอร์โทร และแผนก เพื่อให้ช่างติดต่อแจ้งผลได้รวดเร็ว
                </li>
                <li>
                  <strong>ระบุอาการเสียได้ละเอียด:</strong> แจ้งรุ่นอุปกรณ์และปัญหาที่พบเพื่อให้ช่างตรวจเช็กตรงจุด
                </li>
                <li>
                  <strong>ทราบราคาประเมินล่วงหน้า:</strong> เลือกรายการบริการที่ต้องการ ระบบคำนวณค่าบริการเบื้องต้นให้ทันที พร้อมพิมพ์ใบรับบริการขนาด A4
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('service-request')}
            >
              <span>กรอกใบแจ้งซ่อม / ขอรับบริการ</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* หมวดหมู่ที่ 2: แบบบันทึกเวลาปฏิบัติงาน IT Support */}
        <Card className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <div
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  ลงเวลาปฏิบัติงานช่างเทคนิคประจำวัน (สำหรับทีมช่าง IT Support)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  สำหรับช่างประจำวันจันทร์ วันอังคาร และวันศุกร์ ใช้ลงเวลาเข้างาน–ออกงาน พร้อมลงลายมือชื่อดิจิทัลแยกตามวันอย่างชัดเจน
                </p>
              </div>
            </div>

            {/* รายการเลือกแบบฟอร์มทั้ง 3 วัน (Divided Ledger Rows — ไม่ใช้การ์ดซ้อนในการ์ด) */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
              {(Object.keys(WORK_TIME_GROUPS) as Array<keyof typeof WORK_TIME_GROUPS>).map(
                (groupKey) => {
                  const group = WORK_TIME_GROUPS[groupKey];
                  const recordCount = sheetsData[groupKey].length;
                  return (
                    <div
                      key={group.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {group.dayTechnicianLabel}: สมาชิกทีม {group.memberCount} คน
                          </h3>
                          <Badge variant={group.badgeColor}>
                            ช่องลายมือชื่อ {group.memberCount} ช่อง
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums-thai">
                            (บันทึกแล้ว {recordCount} แถว)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ผู้ปฏิบัติงาน: {group.defaultMembers.join(', ')} • แผ่นงาน:{' '}
                          <strong className="text-slate-700 dark:text-slate-300 font-mono">
                            {group.worksheetName}
                          </strong>
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        className="shrink-0 sm:w-auto w-full"
                        onClick={() => onNavigate(group.tabId)}
                      >
                        <span>ลงเวลา{group.dayTechnicianLabel}</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="pt-5 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>
                รองรับการวาดลายมือชื่อบนหน้าจอสัมผัส อัปโหลดรูปลายเซ็น และพิมพ์ใบลงเวลามาตรฐาน A4
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <Database className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {isConnected ? 'ตั้งค่าการเชื่อมต่อ Google Sheets' : 'เชื่อมต่อ Google Sheets API'}
              </span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
