import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  FileDown,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import {
  AnyWorkTimeRecord,
  getDeviceTypeThaiLabel,
  getServiceThaiLabel,
  GroupConfig,
  REQUESTED_SERVICES_LIST,
  ServiceRequestRecord,
  STATUS_LABELS_TH,
  WorkTimeGroup1Record,
  WorkTimeGroup2Or3Record,
} from '../types';
import {
  calculateDurationHours,
  formatDisplayDate,
  formatDisplayTime,
  parseServicesList,
} from '../utils/formatters';
import { Badge, Button } from './ui/DesignSystem';

export type PaperPreviewPayload =
  | {
      type: 'service-request';
      record: ServiceRequestRecord;
      isEdit?: boolean;
    }
  | {
      type: 'work-time';
      groupConfig: GroupConfig;
      pendingRecord: AnyWorkTimeRecord;
      allRecordsWithPending: AnyWorkTimeRecord[];
      memberNames: string[];
      isEdit?: boolean;
    };

interface PaperDocumentPreviewModalProps {
  isOpen: boolean;
  mode: 'pre-submit' | 'view-only';
  payload: PaperPreviewPayload | null;
  isSubmitting?: boolean;
  onConfirmAndSubmit?: () => void;
  onEditInformation?: () => void;
  onCancel: () => void;
}

export const PaperDocumentPreviewModal: React.FC<PaperDocumentPreviewModalProps> = ({
  isOpen,
  mode,
  payload,
  isSubmitting = false,
  onConfirmAndSubmit,
  onEditInformation,
  onCancel,
}) => {
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');

  // รองรับการกดปุ่ม Escape เพื่อปิดหน้าต่างพรีวิว
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !payload) return null;

  const handlePrintDocument = () => {
    window.print();
  };

  const handleSaveAsPDF = () => {
    window.print();
  };

  const documentFormCode =
    payload.type === 'service-request'
      ? 'FM-ITS-REQ-01'
      : `FM-ITS-WT-G0${payload.groupConfig.groupNumber}`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-200/95 dark:bg-slate-950/95 backdrop-blur-md overflow-y-auto animate-fadeIn print:static print:bg-white print:p-0 print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-preview-toolbar-title"
    >
      {/* =================================================================== */}
      {/* แถบควบคุมด้านบนนอกแผ่นกระดาษ A4 (Preview Toolbar — ซ่อนขณะพิมพ์)    */}
      {/* =================================================================== */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* ข้อมูลสถานะเอกสาร */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 shrink-0"
              aria-hidden="true"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="paper-preview-toolbar-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  {mode === 'pre-submit'
                    ? 'ตรวจสอบเอกสารขนาด A4 ก่อนยืนยันส่งข้อมูล'
                    : 'เอกสารใบรับบริการและบันทึกเวลาขนาด A4'}
                </h2>
                <Badge variant={mode === 'pre-submit' ? 'amber' : 'emerald'}>
                  {mode === 'pre-submit'
                    ? 'รอกดยืนยันส่งข้อมูล'
                    : 'บันทึกข้อมูลแล้ว'}
                </Badge>
                <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 tabular-nums-thai">
                  • รหัสแบบฟอร์ม: {documentFormCode} (A4 210 × 297 มม.)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {mode === 'pre-submit'
                  ? 'โปรดตรวจสอบความถูกต้องของข้อมูลบนหน้ากระดาษจริงด้านล่าง ข้อมูลจะถูกบันทึกเมื่อคลิกปุ่ม "ยืนยันส่งข้อมูล" เท่านั้น'
                  : 'สามารถสั่งพิมพ์ออกทางเครื่องพิมพ์ขนาด A4 หรือเลือก Destination เป็น "Save as PDF" เพื่อจัดเก็บไฟล์ได้ทันที'}
              </p>
            </div>
          </div>

          {/* กลุ่มปุ่มคำสั่งมาตรฐานครบทั้ง 5 ปุ่มตามข้อกำหนด */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* ปุ่มสลับมุมมองขนาดกระดาษบนหน้าจอ */}
            <button
              type="button"
              onClick={() => setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))}
              title={
                zoomMode === 'fit'
                  ? 'สลับเป็นขนาดกระดาษ A4 เต็มสัดส่วน (210mm)'
                  : 'สลับเป็นขนาดพอดีหน้าจอ'
              }
              className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {zoomMode === 'fit' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ขนาดจริง A4</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>พอดีหน้าจอ</span>
                </>
              )}
            </button>

            {mode === 'pre-submit' && onEditInformation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                icon={<Edit3 className="w-4 h-4" />}
                onClick={onEditInformation}
              >
                กลับไปแก้ไข
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrintDocument}
            >
              พิมพ์เอกสาร
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              icon={<FileDown className="w-4 h-4" />}
              onClick={handleSaveAsPDF}
            >
              บันทึกเป็น PDF
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              icon={<X className="w-4 h-4" />}
              onClick={onCancel}
            >
              ยกเลิก
            </Button>

            {mode === 'pre-submit' && onConfirmAndSubmit && (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={onConfirmAndSubmit}
              >
                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันส่งข้อมูล'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* พื้นที่วางแผ่นกระดาษ A4 เสมือนจริง (Neutral Desk Surface + White Sheet) */}
      {/* =================================================================== */}
      <div className="flex-1 w-full py-6 sm:py-10 px-2 sm:px-6 md:px-8 flex justify-center items-start overflow-x-auto print:p-0 print:block print:overflow-visible">
        <article
          aria-label="เอกสารตัวอย่างขนาด A4"
          className={`a4-paper-sheet bg-white text-slate-900 rounded-[2px] border border-slate-300 transition-all duration-200 mx-auto print:shadow-none print:border-0 print:p-0 print:max-w-none print:min-h-0 ${
            zoomMode === 'actual'
              ? 'w-[210mm] min-w-[210mm] min-h-[297mm] p-[16mm]'
              : 'w-full max-w-[210mm] min-h-[270mm] sm:min-h-[297mm] p-5 sm:p-10 md:p-[16mm]'
          }`}
        >
          {payload.type === 'service-request' ? (
            <ServiceRequestPaperDocument record={payload.record} />
          ) : (
            <WorkTimePaperDocument
              groupConfig={payload.groupConfig}
              pendingRecord={payload.pendingRecord}
              allRecords={payload.allRecordsWithPending}
              memberNames={payload.memberNames}
            />
          )}
        </article>
      </div>

      {/* =================================================================== */}
      {/* แถบคำสั่งด้านล่างสำหรับความสะดวกบนมือถือและ iPad (ซ่อนขณะพิมพ์)       */}
      {/* =================================================================== */}
      <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-300 dark:border-slate-800 px-4 sm:px-6 py-3 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span>
              {mode === 'pre-submit'
                ? 'เอกสารฉบับนี้เป็นตัวอย่างก่อนการบันทึกจริง ข้อมูลทั้งหมดในฟอร์มยังคงอยู่หากต้องการกลับไปแก้ไข'
                : 'เอกสารฉบับนี้จัดวางตามสัดส่วนกระดาษมาตรฐาน A4 พร้อมสำหรับพิมพ์หรือบันทึกเป็น PDF'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {mode === 'pre-submit' && onEditInformation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                icon={<Edit3 className="w-4 h-4" />}
                onClick={onEditInformation}
              >
                กลับไปแก้ไข
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrintDocument}
            >
              พิมพ์เอกสาร
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              icon={<FileDown className="w-4 h-4" />}
              onClick={handleSaveAsPDF}
            >
              บันทึกเป็น PDF
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              icon={<X className="w-4 h-4" />}
              onClick={onCancel}
            >
              ยกเลิก
            </Button>

            {mode === 'pre-submit' && onConfirmAndSubmit && (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={onConfirmAndSubmit}
              >
                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันส่งข้อมูล'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * เอกสารกระดาษ A4 แบบที่ 1: ใบรับคำขอใช้บริการและแจ้งซ่อมอุปกรณ์ IT Support
 * ออกแบบในสไตล์แบบฟอร์มศูนย์บริการเทคนิคมาตรฐาน (Official Service Center Form)
 * ============================================================================
 */
const ServiceRequestPaperDocument: React.FC<{ record: ServiceRequestRecord }> = ({ record }) => {
  const selectedServices = parseServicesList(record.RequestedServices);

  return (
    <div className="flex flex-col justify-between min-h-[255mm] text-slate-900 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-5">
        {/* 1. ส่วนหัวกระดาษศูนย์บริการ (Official Letterhead & Document Control Box) */}
        <header className="border-b-2 border-slate-900 pb-4 avoid-page-break">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* โลโก้และชื่อศูนย์บริการ */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-lg border-2 border-slate-900 bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700">
                  ศูนย์บริการเทคนิคและเทคโนโลยีสารสนเทศ (IT Support Service Center)
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  ใบรับคำขอใช้บริการและแจ้งซ่อมอุปกรณ์ (Service Request Form)
                </h1>
                <p className="text-xs text-slate-600">
                  เอกสารหลักฐานการรับแจ้งซ่อมและตรวจสอบอุปกรณ์ • แผ่นงานฐานข้อมูล: IT Support Requests
                </p>
              </div>
            </div>

            {/* กรอบควบคุมเลขที่เอกสารมุมขวาบน */}
            <table className="border-collapse border border-slate-900 text-xs shrink-0 w-full sm:w-auto">
              <tbody>
                <tr>
                  <th className="border border-slate-900 bg-slate-100 px-2.5 py-1 text-left font-bold text-slate-700">
                    รหัสเอกสาร
                  </th>
                  <td className="border border-slate-900 px-3 py-1 font-bold text-slate-900 tabular-nums-thai">
                    FM-ITS-REQ-01
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-900 bg-slate-100 px-2.5 py-1 text-left font-bold text-slate-700">
                    เลขที่ใบรับบริการ
                  </th>
                  <td className="border border-slate-900 px-3 py-1 font-bold text-blue-800 tabular-nums-thai">
                    {record.ReceiptNumber}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* 2. ตารางส่วนที่ 1 และ ส่วนที่ 2: ข้อมูลใบรับบริการ และ ข้อมูลผู้ขอรับบริการ */}
        <section className="avoid-page-break">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>ส่วนที่ 1 และ 2: ข้อมูลการรับเรื่องและข้อมูลผู้ขอรับบริการ (Receipt & Requester Details)</span>
            <span className="font-normal text-slate-200">สำหรับเจ้าหน้าที่และผู้รับบริการ</span>
          </div>
          <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm print-table">
            <tbody>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[20%]">
                  เลขที่ใบรับบริการ
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 tabular-nums-thai w-[30%]">
                  {record.ReceiptNumber}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[20%]">
                  ชื่อ-นามสกุล ผู้แจ้ง
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 w-[30%]">
                  {record.FullName}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  วันที่รับแจ้ง
                </th>
                <td className="border border-slate-900 px-3 py-2 font-medium text-slate-900">
                  {formatDisplayDate(record.Date)}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  เบอร์โทรศัพท์ติดต่อ
                </th>
                <td className="border border-slate-900 px-3 py-2 font-semibold text-slate-900 tabular-nums-thai">
                  {record.PhoneNumber}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  เวลารับแจ้ง
                </th>
                <td className="border border-slate-900 px-3 py-2 font-medium text-slate-900 tabular-nums-thai">
                  {formatDisplayTime(record.Time)}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  หน่วยงาน / แผนก
                </th>
                <td className="border border-slate-900 px-3 py-2 font-medium text-slate-900">
                  {record.Department || 'ไม่ได้ระบุ'}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  สถานะการดำเนินงาน
                </th>
                <td colSpan={3} className="border border-slate-900 px-3 py-2 font-bold text-slate-900">
                  {STATUS_LABELS_TH[record.Status] || 'ดำเนินการเสร็จสิ้น'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. ตารางส่วนที่ 3: ข้อมูลอุปกรณ์และรายละเอียดอาการเสีย */}
        <section className="avoid-page-break">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>ส่วนที่ 3: ข้อมูลอุปกรณ์และรายละเอียดอาการเสีย (Device & Problem Specification)</span>
            <span className="font-normal text-slate-200">การตรวจสอบเบื้องต้น</span>
          </div>
          <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm print-table">
            <tbody>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[20%]">
                  ประเภทอุปกรณ์
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 w-[30%]">
                  {getDeviceTypeThaiLabel(record.DeviceType)}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[20%]">
                  ยี่ห้อ / รุ่น (Model)
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 w-[30%]">
                  {record.DeviceBrandModel}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  หมายเลขเครื่อง (S/N)
                </th>
                <td colSpan={3} className="border border-slate-900 px-3 py-2 font-semibold text-slate-900 tabular-nums-thai">
                  {record.DeviceSerialNumber || 'ไม่ได้ระบุหมายเลขเครื่อง'}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2.5 text-left font-bold align-top">
                  อาการเสีย / ปัญหาที่พบ
                </th>
                <td colSpan={3} className="border border-slate-900 px-3 py-2.5 text-slate-900 whitespace-pre-wrap min-h-[64px]">
                  {record.ProblemDescription}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2.5 text-left font-bold align-top">
                  รายละเอียดเพิ่มเติม / อุปกรณ์ที่ฝากไว้
                </th>
                <td colSpan={3} className="border border-slate-900 px-3 py-2.5 text-slate-900 whitespace-pre-wrap">
                  {record.AdditionalDetails || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 4. ตารางส่วนที่ 4: รายการบริการที่ร้องขอ (Checkboxes ✓) */}
        <section className="avoid-page-break">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>ส่วนที่ 4: รายการบริการที่ต้องการให้ดำเนินการ (Requested Services)</span>
            <span className="font-normal text-slate-200">
              เลือกแล้ว {selectedServices.length} รายการ
            </span>
          </div>
          <div className="border border-t-0 border-slate-900 p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {REQUESTED_SERVICES_LIST.map((service) => {
                const isChecked =
                  selectedServices.includes(service) ||
                  selectedServices.includes(getServiceThaiLabel(service));
                return (
                  <div
                    key={service}
                    className="flex items-start gap-2.5 py-1 border-b border-dotted border-slate-300 last:border-b-0 sm:nth-last-child(-n+2):border-b-0"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-500 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <div className={isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                      <span>{getServiceThaiLabel(service)}</span>
                      {service === 'Other' && isChecked && record.OtherServiceText && (
                        <span className="block text-xs font-semibold text-blue-900 mt-0.5">
                          ระบุเพิ่มเติม: {record.OtherServiceText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 5. ส่วนลงนามรับรองและเงื่อนไขการรับบริการท้ายกระดาษ A4 */}
      <footer className="pt-6 mt-6 border-t border-slate-400 space-y-4 avoid-page-break">
        <div className="text-xs text-slate-600 leading-normal bg-slate-50 border border-slate-300 p-2.5">
          <strong>หมายเหตุการรับบริการ:</strong> ข้าพเจ้าได้ตรวจสอบรายละเอียดอุปกรณ์ อาการเสีย
          และรายการบริการที่ร้องขอข้างต้นแล้วว่าถูกต้องตรงตามความประสงค์ทุกประการ
        </div>

        <table className="w-full border-collapse border border-slate-900 text-xs print-table">
          <tbody>
            <tr>
              <td className="border border-slate-900 p-4 text-center w-1/2 align-bottom">
                <div className="h-14 border-b border-dashed border-slate-600 max-w-[200px] mx-auto mb-2" />
                <div className="font-bold text-slate-900">ลงชื่อผู้ขอรับบริการ / ผู้ส่งซ่อม</div>
                <div className="text-slate-700 mt-0.5">({record.FullName})</div>
                <div className="text-slate-600 mt-0.5">
                  วันที่: {formatDisplayDate(record.Date)}
                </div>
              </td>
              <td className="border border-slate-900 p-4 text-center w-1/2 align-bottom">
                <div className="h-14 border-b border-dashed border-slate-600 max-w-[200px] mx-auto mb-2" />
                <div className="font-bold text-slate-900">
                  ลงชื่อเจ้าหน้าที่ IT Support ผู้รับเรื่อง
                </div>
                <div className="text-slate-700 mt-0.5">
                  (........................................................)
                </div>
                <div className="text-slate-600 mt-0.5">
                  วันที่: {formatDisplayDate(record.Date)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>ระบบจัดการข้อมูลงานบริการ IT Support • แผ่นงาน: IT Support Requests</span>
          <span className="tabular-nums-thai">เลขที่อ้างอิง: {record.ReceiptNumber}</span>
        </div>
      </footer>
    </div>
  );
};

/**
 * ============================================================================
 * เอกสารกระดาษ A4 แบบที่ 2: ใบลงเวลาปฏิบัติงานทีม IT Support (Work Time Sheet)
 * ออกแบบในสไตล์ใบลงเวลาปฏิบัติงานราชการ/องค์กรมาตรฐาน (Official Attendance Sheet)
 * ============================================================================
 */
const WorkTimePaperDocument: React.FC<{
  groupConfig: GroupConfig;
  pendingRecord: AnyWorkTimeRecord;
  allRecords: AnyWorkTimeRecord[];
  memberNames: string[];
}> = ({ groupConfig, pendingRecord, allRecords, memberNames }) => {
  const { groupNumber, memberCount, worksheetName } = groupConfig;
  const r1 = pendingRecord as WorkTimeGroup1Record;
  const r3 = pendingRecord as WorkTimeGroup2Or3Record;
  const pendingSignatures =
    memberCount === 2
      ? [
          { name: r1.Member1Name, sig: r1.Member1Signature },
          { name: r1.Member2Name, sig: r1.Member2Signature },
        ]
      : [
          { name: r3.Member1Name, sig: r3.Member1Signature },
          { name: r3.Member2Name, sig: r3.Member2Signature },
          { name: r3.Member3Name, sig: r3.Member3Signature },
        ];

  return (
    <div className="flex flex-col justify-between min-h-[255mm] text-slate-900 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-5">
        {/* 1. ส่วนหัวกระดาษใบลงเวลาปฏิบัติงาน */}
        <header className="border-b-2 border-slate-900 pb-4 avoid-page-break">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-lg border-2 border-slate-900 bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-700">
                  ศูนย์บริการเทคนิคและเทคโนโลยีสารสนเทศ (IT Support Service Center)
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  บัญชีลงเวลาปฏิบัติงานทีม IT Support — กลุ่มที่ {groupNumber}
                </h1>
                <p className="text-xs text-slate-600">
                  เอกสารบันทึกเวลาปฏิบัติงานและลายมือชื่อดิจิทัล • แผ่นงานฐานข้อมูล:{' '}
                  <strong>{worksheetName}</strong>
                </p>
              </div>
            </div>

            <table className="border-collapse border border-slate-900 text-xs shrink-0 w-full sm:w-auto">
              <tbody>
                <tr>
                  <th className="border border-slate-900 bg-slate-100 px-2.5 py-1 text-left font-bold text-slate-700">
                    รหัสแบบฟอร์ม
                  </th>
                  <td className="border border-slate-900 px-3 py-1 font-bold text-slate-900 tabular-nums-thai">
                    FM-ITS-WT-G0{groupNumber}
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-900 bg-slate-100 px-2.5 py-1 text-left font-bold text-slate-700">
                    กลุ่มปฏิบัติงาน
                  </th>
                  <td className="border border-slate-900 px-3 py-1 font-bold text-slate-900">
                    กลุ่มที่ {groupNumber} (สมาชิก {memberCount} คน)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* 2. ตารางสรุปรายการลงเวลาที่กำลังตรวจสอบในรอบนี้พร้อมลายมือชื่อขนาดชัดเจน */}
        <section className="avoid-page-break">
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>
              ส่วนที่ 1: ข้อมูลการลงเวลาปฏิบัติงานรายการล่าสุด (ลำดับที่ #{pendingRecord.SequenceNo})
            </span>
            <span className="font-normal text-slate-200">
              ระยะเวลาปฏิบัติงาน:{' '}
              {calculateDurationHours(pendingRecord.WorkStartTime, pendingRecord.WorkEndTime)}
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm print-table">
            <tbody>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[18%]">
                  ลำดับที่ (No.)
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 tabular-nums-thai w-[32%]">
                  #{pendingRecord.SequenceNo}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold w-[18%]">
                  วันที่ปฏิบัติงาน
                </th>
                <td className="border border-slate-900 px-3 py-2 font-bold text-slate-900 w-[32%]">
                  {formatDisplayDate(pendingRecord.Date)}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  เวลาเริ่มปฏิบัติงาน
                </th>
                <td className="border border-slate-900 px-3 py-2 font-semibold text-slate-900 tabular-nums-thai">
                  {formatDisplayTime(pendingRecord.WorkStartTime)}
                </td>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  เวลาเลิกปฏิบัติงาน
                </th>
                <td className="border border-slate-900 px-3 py-2 font-semibold text-slate-900 tabular-nums-thai">
                  {formatDisplayTime(pendingRecord.WorkEndTime)}
                </td>
              </tr>
              <tr>
                <th className="border border-slate-900 bg-slate-100 px-3 py-2 text-left font-bold">
                  หมายเหตุการปฏิบัติงาน
                </th>
                <td colSpan={3} className="border border-slate-900 px-3 py-2 text-slate-900">
                  {pendingRecord.Remarks || 'ไม่มีหมายเหตุเพิ่มเติม'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ตารางช่องลายมือชื่อสมาชิกในกลุ่มสำหรับรายการนี้ */}
          <table className="w-full border-collapse border border-t-0 border-slate-900 text-xs print-table">
            <thead>
              <tr className="bg-slate-100">
                {pendingSignatures.map((item, idx) => (
                  <th
                    key={idx}
                    className="border border-slate-900 px-3 py-1.5 text-center font-bold text-slate-900"
                  >
                    ลายมือชื่อสมาชิกคนที่ {idx + 1}: {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {pendingSignatures.map((item, idx) => (
                  <td
                    key={idx}
                    className="border border-slate-900 p-3 text-center align-middle bg-white"
                  >
                    {item.sig ? (
                      <div className="flex flex-col items-center justify-center min-h-[76px]">
                        <img
                          src={item.sig}
                          alt={`ลายมือชื่อของ ${item.name}`}
                          className="h-14 max-w-[160px] object-contain"
                        />
                        <span className="text-xs font-medium text-slate-700 mt-1">
                          ({item.name})
                        </span>
                      </div>
                    ) : (
                      <div className="min-h-[76px] flex items-center justify-center text-slate-400">
                        ยังไม่ได้ลงลายมือชื่อ
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. ตารางบันทึกเวลาปฏิบัติงานสะสมของกลุ่ม (Complete Attendance Sheet Table) */}
        <section>
          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>
              ส่วนที่ 2: ตารางบันทึกเวลาปฏิบัติงานสะสม — กลุ่มที่ {groupNumber} (รวมทั้งหมด{' '}
              {allRecords.length} แถว)
            </span>
            <span className="font-normal text-slate-200">แผ่นงาน: {worksheetName}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th
                    rowSpan={2}
                    className="border border-slate-900 px-2 py-2 text-center font-bold w-12"
                  >
                    ลำดับ
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 px-2.5 py-2 text-left font-bold"
                  >
                    วันที่ปฏิบัติงาน
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 px-2 py-2 text-center font-bold"
                  >
                    เวลาเริ่มงาน
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 px-2 py-2 text-center font-bold"
                  >
                    เวลาเลิกงาน
                  </th>
                  <th
                    colSpan={memberCount}
                    className="border border-slate-900 px-2.5 py-1.5 text-center font-bold bg-slate-200/80"
                  >
                    ลายมือชื่อผู้ปฏิบัติงาน (สมาชิกกลุ่มที่ {groupNumber} จำนวน {memberCount} คน)
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 px-2.5 py-2 text-left font-bold"
                  >
                    หมายเหตุ
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-900">
                  {Array.from({ length: memberCount }).map((_, idx) => (
                    <th
                      key={idx}
                      className="border border-slate-900 px-2 py-1.5 text-center font-semibold"
                    >
                      {memberNames[idx] || `สมาชิกคนที่ ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRecords.map((rec, index) => {
                  const row1 = rec as WorkTimeGroup1Record;
                  const row3 = rec as WorkTimeGroup2Or3Record;
                  const rowSigs =
                    memberCount === 2
                      ? [
                          { name: row1.Member1Name, sig: row1.Member1Signature },
                          { name: row1.Member2Name, sig: row1.Member2Signature },
                        ]
                      : [
                          { name: row3.Member1Name, sig: row3.Member1Signature },
                          { name: row3.Member2Name, sig: row3.Member2Signature },
                          { name: row3.Member3Name, sig: row3.Member3Signature },
                        ];
                  const isCurrentPending = rec.RecordID === pendingRecord.RecordID;

                  return (
                    <tr
                      key={rec.RecordID}
                      className={`avoid-page-break ${
                        isCurrentPending ? 'bg-blue-50/70 print:bg-transparent' : ''
                      }`}
                    >
                      <td className="border border-slate-900 px-2 py-1.5 text-center font-bold tabular-nums-thai">
                        {rec.SequenceNo || index + 1}
                      </td>
                      <td className="border border-slate-900 px-2.5 py-1.5 whitespace-nowrap font-medium">
                        {formatDisplayDate(rec.Date)}
                      </td>
                      <td className="border border-slate-900 px-2 py-1.5 text-center tabular-nums-thai">
                        {formatDisplayTime(rec.WorkStartTime)}
                      </td>
                      <td className="border border-slate-900 px-2 py-1.5 text-center tabular-nums-thai">
                        {formatDisplayTime(rec.WorkEndTime)}
                      </td>
                      {rowSigs.map((sItem, sIdx) => (
                        <td
                          key={sIdx}
                          className="border border-slate-900 px-2 py-1 text-center align-middle"
                        >
                          {sItem.sig ? (
                            <div className="flex flex-col items-center justify-center">
                              <img
                                src={sItem.sig}
                                alt={`ลายมือชื่อ ${sItem.name}`}
                                className="h-8 max-w-[95px] object-contain"
                              />
                              <span className="text-xs text-slate-700 mt-0.5">{sItem.name}</span>
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      ))}
                      <td className="border border-slate-900 px-2.5 py-1.5">
                        {rec.Remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 4. ส่วนลงนามรับรองท้ายกระดาษใบลงเวลาปฏิบัติงาน */}
      <footer className="pt-6 mt-6 border-t border-slate-400 space-y-4 avoid-page-break">
        <table className="w-full border-collapse border border-slate-900 text-xs print-table">
          <tbody>
            <tr>
              <td className="border border-slate-900 p-4 text-center w-1/2 align-bottom">
                <div className="h-12 border-b border-dashed border-slate-600 max-w-[200px] mx-auto mb-2" />
                <div className="font-bold text-slate-900">
                  ลงชื่อหัวหน้ากลุ่มที่ {groupNumber} (ผู้ตรวจสอบเวลาปฏิบัติงาน)
                </div>
                <div className="text-slate-700 mt-0.5">
                  (........................................................)
                </div>
              </td>
              <td className="border border-slate-900 p-4 text-center w-1/2 align-bottom">
                <div className="h-12 border-b border-dashed border-slate-600 max-w-[200px] mx-auto mb-2" />
                <div className="font-bold text-slate-900">
                  ลงชื่ออาจารย์ที่ปรึกษา / หัวหน้างาน IT Support
                </div>
                <div className="text-slate-700 mt-0.5">
                  (........................................................)
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>ระบบจัดการข้อมูลงานบริการ IT Support • แผ่นงาน: {worksheetName}</span>
          <span className="tabular-nums-thai">รหัสแบบฟอร์ม: FM-ITS-WT-G0{groupNumber}</span>
        </div>
      </footer>
    </div>
  );
};
