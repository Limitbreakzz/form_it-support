import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  FileSpreadsheet,
  FolderKanban,
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
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  sheetsData,
  isConnected,
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
              ระบบจัดการข้อมูลงานบริการและบันทึกเวลาปฏิบัติงาน IT Support
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              เลือกแบบฟอร์มที่ต้องการใช้งานด้านล่าง ข้อมูลคำขอรับบริการและตารางลงเวลาปฏิบัติงานพร้อมลายมือชื่อดิจิทัลจะถูกจัดเก็บลงในแผ่นงาน
              Google Sheets แยกตามหมวดหมู่อย่างเป็นระบบ พร้อมรองรับการพิมพ์เอกสารขนาด A4
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={isConnected ? 'emerald' : 'amber'}>
                {isConnected
                  ? 'สถานะฐานข้อมูล: เชื่อมต่อ Google Sheets พร้อมใช้งาน'
                  : 'สถานะฐานข้อมูล: โหมดสำรองข้อมูลในเครื่อง (รอตั้งค่า Web App URL)'}
              </Badge>
              <Badge variant="slate" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                แยกจัดเก็บ 4 แผ่นงานอิสระ
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="lg"
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => onNavigate('service-request')}
            >
              แจ้งขอรับบริการใหม่
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              icon={<FolderKanban className="w-4 h-4" />}
              onClick={() => onNavigate('history')}
            >
              ดูประวัติทั้งหมด ({totalRequests + totalWorkLogs})
            </Button>
          </div>
        </div>

        {/* แถบสรุปสถานะแผ่นงานทั้ง 4 แผ่นงาน (Unified Ledger Strip — ไม่ใช้ 4 การ์ดแยกซ้ำซ้อน) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => onNavigate('service-request')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                1. ใบคำขอรับบริการ
              </span>
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                {totalRequests}
              </span>
              <span className="text-xs text-slate-500">รายการ</span>
            </div>
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
              IT Support Requests
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-1')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                2. บันทึกเวลา กลุ่มที่ 1
              </span>
              <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                {group1Count}
              </span>
              <span className="text-xs text-slate-500">แถว (สมาชิก 2 คน)</span>
            </div>
            <div className="mt-1 text-xs text-slate-700 dark:text-slate-400 font-medium truncate">
              Work Time - Group 1
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-2')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                3. บันทึกเวลา กลุ่มที่ 2
              </span>
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                {group2Count}
              </span>
              <span className="text-xs text-slate-500">แถว (สมาชิก 3 คน)</span>
            </div>
            <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 font-medium truncate">
              Work Time - Group 2
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('work-time-group-3')}
            className="p-4 sm:p-5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                4. บันทึกเวลา กลุ่มที่ 3
              </span>
              <Users className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums-thai">
                {group3Count}
              </span>
              <span className="text-xs text-slate-500">แถว (สมาชิก 3 คน)</span>
            </div>
            <div className="mt-1 text-xs text-amber-800 dark:text-amber-400 font-medium truncate">
              Work Time - Group 3
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
                  className="p-3 rounded-2xl bg-blue-600 text-white shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    หมวดหมู่ที่ 1: แบบฟอร์มขอรับบริการ IT Support
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    สำหรับบันทึกข้อมูลเมื่อผู้ใช้งานหรือลูกค้านำอุปกรณ์มาขอรับบริการตรวจซ่อมและแก้ไขปัญหาทางเทคนิค
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>ส่วนประกอบมาตรฐานในใบรับบริการ:</span>
                </span>
                <Badge variant="blue">IT Support Requests</Badge>
              </div>
              <ul className="space-y-2 pl-5 list-disc leading-relaxed">
                <li>
                  <strong>ข้อมูลใบรับบริการ:</strong> สร้างเลขที่ใบรับบริการอัตโนมัติ พร้อมวันที่และเวลาปัจจุบัน
                </li>
                <li>
                  <strong>ข้อมูลผู้ขอรับบริการ:</strong> ชื่อ-นามสกุล เบอร์โทรศัพท์ติดต่อ และหน่วยงานต้นสังกัด
                </li>
                <li>
                  <strong>ข้อมูลอุปกรณ์และปัญหา:</strong> ประเภทอุปกรณ์ ยี่ห้อ/รุ่น หมายเลขเครื่อง และรายละเอียดอาการเสีย
                </li>
                <li>
                  <strong>บริการที่ร้องขอ:</strong> เลือกได้หลายรายการ (✓) พร้อมพิมพ์ใบรับบริการขนาด A4
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('service-request')}
            >
              <span>เปิดแบบฟอร์มขอรับบริการ IT Support</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* หมวดหมู่ที่ 2: แบบบันทึกเวลาปฏิบัติงาน IT Support (แยก 3 กลุ่มอิสระในรูปแบบ Ledger List) */}
        <Card className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start gap-3.5">
              <div
                className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  หมวดหมู่ที่ 2: แบบบันทึกเวลาปฏิบัติงาน (IT Support Work Time Record)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  บันทึกเวลาเริ่มปฏิบัติงาน เวลาเลิกงาน และลายมือชื่อดิจิทัลของสมาชิกทีม IT Support
                  โดยแยกแบบฟอร์มและแผ่นงาน Google Sheets ออกเป็น 3 กลุ่มอิสระ ไม่รวมปะปนกัน
                </p>
              </div>
            </div>

            {/* รายการเลือกแบบฟอร์มทั้ง 3 กลุ่ม (Divided Ledger Rows — ไม่ใช้การ์ดซ้อนในการ์ด) */}
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
                            กลุ่มที่ {group.groupNumber}: สมาชิกทีม {group.memberCount} คน
                          </h3>
                          <Badge variant={group.badgeColor}>
                            ช่องลายมือชื่อ {group.memberCount} ช่อง
                          </Badge>
                          <span className="text-xs text-slate-500 tabular-nums-thai">
                            (บันทึกแล้ว {recordCount} แถว)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          แผ่นงาน Google Sheets แยกเฉพาะ:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
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
                        <span>เปิดฟอร์มกลุ่มที่ {group.groupNumber}</span>
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
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                รองรับการวาดลายมือชื่อบนหน้าจอสัมผัส อัปโหลดรูปลายเซ็น และพิมพ์ใบลงเวลามาตรฐาน A4
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] px-1"
            >
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
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
