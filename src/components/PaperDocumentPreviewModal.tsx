import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle2,
  Cpu,
  Edit3,
  FileDown,
  FileText,
  Maximize2,
  Minimize2,
  Monitor,
  Printer,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import {
  ACKNOWLEDGMENT_ITEMS,
  AnyWorkTimeRecord,
  calculateEstimatedServiceCost,
  GroupConfig,
  SERVICE_CATALOG,
  ServiceRequestRecord,
  WorkTimeGroup1Record,
  WorkTimeGroup2Or3Record,
} from '../types';
import {
  formatDisplayDate,
  formatDisplayPhoneNumber,
  formatDisplayTime,
  formatTimeTo24Hours,
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
      pendingRecord?: AnyWorkTimeRecord | null;
      allRecordsWithPending: AnyWorkTimeRecord[];
      memberNames: string[];
      isEdit?: boolean;
    };

interface PaperDocumentPreviewModalProps {
  isOpen: boolean;
  mode: 'pre-submit' | 'view-only' | 'post-submit';
  payload: PaperPreviewPayload | null;
  autoPrint?: boolean;
  isSubmitting?: boolean;
  savedFeedbackMessage?: string;
  onConfirmAndSubmit?: (shouldPrintAfterSave?: boolean) => void;
  onEditInformation?: () => void;
  onCancel: () => void;
}

export const PaperDocumentPreviewModal: React.FC<PaperDocumentPreviewModalProps> = ({
  isOpen,
  mode,
  payload,
  autoPrint = false,
  isSubmitting = false,
  savedFeedbackMessage,
  onConfirmAndSubmit,
  onEditInformation,
  onCancel,
}) => {
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const [sheetHeightPx, setSheetHeightPx] = useState<number>(1123);
  const sheetRef = React.useRef<HTMLElement | null>(null);
  const hasAutoPrintedRef = React.useRef(false);

  // คำนวณอัตราส่วนการย่อขยายหน้ากระดาษ A4 (210mm ≈ 794px) ให้พอดีกับหน้าจอมือถือ/แท็บเล็ตโดยไม่เสียสัดส่วน A4
  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      const a4WidthPx = 794; // 210mm at 96 DPI
      const availableWidth = window.innerWidth - 32; // padding ซ้าย-ขวา
      if (zoomMode === 'fit' && availableWidth < a4WidthPx) {
        const nextScale = Math.max(0.34, Math.min(1, availableWidth / a4WidthPx));
        setFitScale(nextScale);
      } else {
        setFitScale(1);
      }
      if (sheetRef.current) {
        setSheetHeightPx(sheetRef.current.offsetHeight);
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 60);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen, zoomMode, payload]);

  // สั่งพิมพ์หรือเปิดหน้าต่างแสดงตัวอย่างการพิมพ์ของเบราว์เซอร์อัตโนมัติ (Native Print Preview) เมื่อเปิดแบบ autoPrint
  useEffect(() => {
    if (!isOpen || !payload || !autoPrint) {
      hasAutoPrintedRef.current = false;
      return;
    }

    if (hasAutoPrintedRef.current) return;
    hasAutoPrintedRef.current = true;

    const printTimer = setTimeout(() => {
      window.print();
    }, 250);

    return () => clearTimeout(printTimer);
  }, [isOpen, payload, autoPrint]);

  // รองรับการกดปุ่ม Escape เพื่อปิดหน้าต่างพรีวิว และล็อกการเลื่อนหน้าพื้นหลัง
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !payload) return null;

  const handlePrintDocument = () => {
    window.print();
  };

  const handleSaveAsPDF = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] w-screen h-screen flex flex-col bg-slate-200/95 dark:bg-slate-950/95 backdrop-blur-md overflow-y-auto print:static print:w-auto print:h-auto print:bg-white print:p-0 print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-preview-toolbar-title"
    >
      {/* =================================================================== */}
      {/* แถบควบคุมด้านบนนอกแผ่นกระดาษ A4 (Preview Toolbar — ซ่อนขณะพิมพ์)    */}
      {/* =================================================================== */}
      <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 px-4 sm:px-6 py-3.5 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* ข้อมูลสถานะเอกสาร */}
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div
              className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 shrink-0"
              aria-hidden="true"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="paper-preview-toolbar-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug"
                >
                  {mode === 'pre-submit'
                    ? 'ตรวจสอบตัวอย่างเอกสาร A4 ก่อนบันทึกข้อมูล'
                    : mode === 'post-submit'
                    ? 'บันทึกข้อมูลเรียบร้อยแล้ว — ตัวอย่างเอกสารขนาด A4'
                    : 'ตัวอย่างเอกสารขนาด A4 (ดูและสั่งพิมพ์)'}
                </h2>
                <Badge variant={mode === 'pre-submit' ? 'amber' : 'emerald'}>
                  {mode === 'pre-submit'
                    ? 'รอการยืนยัน'
                    : 'บันทึกสำเร็จแล้ว'}
                </Badge>
                <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 tabular-nums-thai">
                  • ขนาดกระดาษมาตรฐาน A4 (210 × 297 มม.)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {mode === 'pre-submit'
                  ? 'โปรดตรวจสอบความถูกต้องของข้อมูลบนหน้ากระดาษด้านล่าง คุณสามารถเลือก "บันทึกอย่างเดียว (ไม่พิมพ์)" หรือ "บันทึกและพิมพ์ A4" ได้ทันที'
                  : savedFeedbackMessage ||
                    'คุณสามารถสั่งพิมพ์ออกทางเครื่องพิมพ์ A4 บันทึกเป็นไฟล์ PDF หรือกดปิดหน้าต่างนี้หากไม่ต้องการพิมพ์กระดาษ'}
              </p>
            </div>
          </div>

          {/* กลุ่มปุ่มคำสั่งด้านบน: รองรับทั้งการดูตัวอย่าง เลือกพิมพ์ หรือไม่พิมพ์ */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))}
              title={
                zoomMode === 'fit'
                  ? 'สลับเป็นขนาดกระดาษ A4 เต็มสัดส่วน 100% (210mm)'
                  : 'สลับเป็นขนาดย่อพอดีหน้าจอ'
              }
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              {zoomMode === 'fit' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ขนาดจริง 100% (210mm)</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ย่อพอดีจอ</span>
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

            {mode === 'pre-submit' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                icon={<Printer className="w-4 h-4" />}
                onClick={handlePrintDocument}
              >
                พิมพ์ / ตัวอย่างการพิมพ์
              </Button>
            )}

            {mode !== 'pre-submit' && (
              <>
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
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintDocument}
                >
                  สั่งพิมพ์เอกสาร A4
                </Button>
              </>
            )}

            <Button
              type="button"
              variant={mode === 'post-submit' ? 'secondary' : 'ghost'}
              size="sm"
              disabled={isSubmitting}
              icon={<X className="w-4 h-4" />}
              onClick={onCancel}
            >
              {mode === 'pre-submit'
                ? 'ยกเลิก'
                : mode === 'post-submit'
                ? 'เสร็จสิ้น (ไม่ต้องพิมพ์)'
                : 'ปิดหน้าต่าง'}
            </Button>

            {mode === 'pre-submit' && onConfirmAndSubmit && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  onClick={() => onConfirmAndSubmit(false)}
                >
                  บันทึกข้อมูล (ไม่พิมพ์)
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => onConfirmAndSubmit(true)}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกและพิมพ์ A4'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* พื้นที่วางแผ่นกระดาษ A4 เสมือนจริง (210mm × 297mm True A4 Ratio)       */}
      {/* =================================================================== */}
      <div className="flex-1 w-full py-6 sm:py-10 px-4 sm:px-6 md:px-8 flex justify-center items-start overflow-x-auto print:p-0 print:block print:overflow-visible">
        <div
          className="relative flex justify-center mx-auto print:w-full print:h-auto"
          style={
            fitScale < 1
              ? {
                  width: `${Math.round(794 * fitScale)}px`,
                  height: `${Math.round(sheetHeightPx * fitScale)}px`,
                }
              : undefined
          }
        >
          <article
            ref={sheetRef}
            aria-label="เอกสารตัวอย่างขนาด A4 (210 × 297 มม.)"
            style={
              fitScale < 1
                ? {
                    transform: `scale(${fitScale})`,
                    transformOrigin: 'top center',
                  }
                : undefined
            }
            className="a4-paper-sheet w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] p-[8mm_10mm] bg-white text-slate-900 rounded-[2px] border border-slate-300 mx-auto print:shadow-none print:border-0"
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
      </div>

      {/* =================================================================== */}
      {/* แถบคำสั่งด้านล่างสำหรับความสะดวกบนมือถือและ iPad (ซ่อนขณะพิมพ์)       */}
      {/* =================================================================== */}
      <div className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-300 dark:border-slate-800 px-4 sm:px-6 py-3 no-print">
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

            {mode === 'pre-submit' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                icon={<Printer className="w-4 h-4" />}
                onClick={handlePrintDocument}
              >
                พิมพ์ / ตัวอย่างการพิมพ์
              </Button>
            )}

            {mode !== 'pre-submit' && (
              <>
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
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintDocument}
                >
                  สั่งพิมพ์เอกสาร A4
                </Button>
              </>
            )}

            <Button
              type="button"
              variant={mode === 'post-submit' ? 'secondary' : 'ghost'}
              size="sm"
              disabled={isSubmitting}
              icon={<X className="w-4 h-4" />}
              onClick={onCancel}
            >
              {mode === 'pre-submit'
                ? 'ยกเลิก'
                : mode === 'post-submit'
                ? 'เสร็จสิ้น (ไม่ต้องพิมพ์)'
                : 'ปิดหน้าต่าง'}
            </Button>

            {mode === 'pre-submit' && onConfirmAndSubmit && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  onClick={() => onConfirmAndSubmit(false)}
                >
                  บันทึกข้อมูล (ไม่พิมพ์)
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => onConfirmAndSubmit(true)}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกและพิมพ์ A4'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * ============================================================================
 * เอกสารกระดาษ A4 แบบที่ 1: IT SUPPORT — แบบสอบถามและใบลงข้อมูลการขอรับบริการ
 * ออกแบบตรงตามแบบฟอร์มตัวอย่าง (รูปที่ 1) ทุกสัดส่วน
 * ============================================================================
 */
const ServiceRequestPaperDocument: React.FC<{ record: ServiceRequestRecord }> = ({ record }) => {
  const selectedServices = parseServicesList(record.RequestedServices);
  const softwareServices = SERVICE_CATALOG.filter((s) => s.category === 'software');
  const hardwareServices = SERVICE_CATALOG.filter((s) => s.category === 'hardware');

  const isHardwareChecked =
    record.DeviceType === 'Hardware' ||
    record.DeviceType === 'Computer' ||
    record.DeviceType === 'Laptop' ||
    record.DeviceType === 'Printer' ||
    record.DeviceType === 'Network Device';
  const isSoftwareChecked = record.DeviceType === 'Software';
  const isOtherDeviceChecked = record.DeviceType === 'Other';

  const autoCost = calculateEstimatedServiceCost(selectedServices);
  const displayCost =
    record.AdditionalDetails && record.AdditionalDetails.trim() !== ''
      ? record.AdditionalDetails.replace(/\s*บาท\s*$/, '')
      : String(autoCost);

  // แยกข้อมูลอุปกรณ์อื่น ๆ (Other) ออกจากยี่ห้อรุ่นและอาการเสียอย่างชัดเจน ไม่ให้ทับซ้อนกัน
  let otherDeviceDisplayText = record.OtherDeviceText || '';
  let cleanDeviceBrandModel = record.DeviceBrandModel || '';
  if (!otherDeviceDisplayText && cleanDeviceBrandModel.startsWith('อุปกรณ์อื่น ๆ:')) {
    const match = cleanDeviceBrandModel.match(/^อุปกรณ์อื่น ๆ:\s*(.*?)\s*\|\s*(.*)$/);
    if (match) {
      otherDeviceDisplayText = match[1];
      cleanDeviceBrandModel = match[2];
    } else {
      otherDeviceDisplayText = cleanDeviceBrandModel.replace(/^อุปกรณ์อื่น ๆ:\s*/, '');
      cleanDeviceBrandModel = '';
    }
  }

  return (
    <div className="flex flex-col justify-between h-full min-h-[235mm] max-h-[265mm] text-slate-900 text-xs leading-normal select-text">
      <div className="space-y-2">
        {/* ส่วนหัวกระดาษตามแบบฟอร์มตัวอย่าง: IT SUPPORT แบบสอบถามและใบลงข้อมูลการขอรับบริการ */}
        <header className="text-center pb-1.5 border-b-2 border-[#1e3a8a] relative avoid-page-break">
          <div className="inline-block bg-[#dbeafe] border border-[#93c5fd] rounded-xl px-5 py-1 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-[#0f172a]">
              IT SUPPORT
            </h1>
            <div className="text-xs sm:text-sm font-bold text-[#1e3a8a] mt-0.5">
              แบบสอบถามและใบลงข้อมูลการขอรับบริการ
            </div>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-[#1e3a8a] mt-0.5">
            งานบริการด้านคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคาร 1 ชั้น 3 ห้อง 3
          </p>
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 tabular-nums-thai">
            <span>
              เลขที่ใบรับบริการ: <strong className="text-[#1e3a8a]">{record.ReceiptNumber}</strong>
            </span>
            <span>•</span>
            <span>
              วันที่: <strong>{formatDisplayDate(record.Date)}</strong> ({formatDisplayTime(record.Time)})
            </span>
          </div>
        </header>

        {/* 1. ข้อมูลผู้ขอรับบริการ */}
        <section className="avoid-page-break pt-0.5">
          <div className="inline-flex items-center gap-1.5 bg-[#1e3a8a] text-white font-bold text-xs px-3.5 py-0.5 rounded-full -mb-2.5 ml-3 relative z-10 shadow-sm">
            <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>1. ข้อมูลผู้ขอรับบริการ</span>
          </div>
          <div className="border-[1.5px] border-[#60a5fa] rounded-xl pt-3.5 pb-2 px-3.5 bg-white space-y-1">
            <div className="flex flex-wrap items-baseline gap-2 text-xs">
              <span className="font-bold text-slate-900 shrink-0">ชื่อ - นามสกุล :</span>
              <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-semibold text-slate-900 min-w-[200px]">
                {record.FullName}
                {record.Department && record.Department !== '-' ? ` (${record.Department})` : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 text-xs">
              <span className="font-bold text-slate-900 shrink-0">เบอร์โทร :</span>
              <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-semibold text-slate-900 tabular-nums-thai min-w-[200px]">
                {formatDisplayPhoneNumber(record.PhoneNumber)}
              </span>
            </div>
          </div>
        </section>

        {/* 2. ข้อมูลอุปกรณ์และรายละเอียดปัญหา (แยกข้อมูลอื่น ๆ, ยี่ห้อรุ่น, และอาการเสีย ออกจากกันอย่างสมบูรณ์) */}
        <section className="avoid-page-break pt-0.5">
          <div className="inline-flex items-center gap-1.5 bg-[#1e3a8a] text-white font-bold text-xs px-3.5 py-1 rounded-full -mb-2.5 ml-3 relative z-10 shadow-sm">
            <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>2. ข้อมูลอุปกรณ์และรายละเอียดปัญหา</span>
          </div>
          <div className="border-[1.5px] border-[#60a5fa] rounded-xl pt-4 pb-2.5 px-4 bg-white space-y-1.5 text-xs">
            {/* แถวที่ 1: ตัวเลือกประเภทอุปกรณ์ (ฮาร์ดแวร์ / ซอฟต์แวร์ / อื่น ๆ พร้อมระบุชื่ออุปกรณ์อื่น ๆ แยกเฉพาะ) */}
            <div className="flex flex-wrap items-center gap-5">
              <span className="font-bold text-slate-900 shrink-0">ประเภทอุปกรณ์ :</span>

              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                    isHardwareChecked
                      ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                      : 'border-slate-500 bg-white'
                  }`}
                >
                  {isHardwareChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span className={isHardwareChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                  ฮาร์ดแวร์
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                    isSoftwareChecked
                      ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                      : 'border-slate-500 bg-white'
                  }`}
                >
                  {isSoftwareChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span className={isSoftwareChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                  ซอฟต์แวร์
                </span>
              </span>

              <span className="inline-flex items-baseline gap-1.5 flex-1 min-w-[180px]">
                <span
                  className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 self-center ${
                    isOtherDeviceChecked
                      ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                      : 'border-slate-500 bg-white'
                  }`}
                >
                  {isOtherDeviceChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span className={isOtherDeviceChecked ? 'font-bold text-slate-900 shrink-0' : 'text-slate-700 shrink-0'}>
                  อื่น ๆ (ระบุ) :
                </span>
                <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 text-slate-900 font-medium min-w-[100px]">
                  {otherDeviceDisplayText || '-'}
                </span>
              </span>
            </div>

            {/* แถวที่ 2: ยี่ห้อและรุ่นของอุปกรณ์ และหมายเลขเครื่อง (Serial Number) */}
            <div className="flex flex-wrap items-baseline gap-3 pt-0.5">
              <div className="flex items-baseline gap-1.5 flex-1 min-w-[240px]">
                <span className="font-bold text-slate-900 shrink-0">ยี่ห้อและรุ่น :</span>
                <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-medium text-slate-900">
                  {cleanDeviceBrandModel || '-'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 min-w-[180px]">
                <span className="font-bold text-slate-900 shrink-0">หมายเลขเครื่อง (S/N) :</span>
                <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-medium text-slate-900 tabular-nums-thai">
                  {record.DeviceSerialNumber || '-'}
                </span>
              </div>
            </div>

            {/* แถวที่ 3: อาการเสียหรือรายละเอียดปัญหา (แยกบรรทัดเฉพาะ ไม่ปนหรือทับกับช่องอื่น ๆ) */}
            <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
              <span className="font-bold text-slate-900 shrink-0">อาการเสีย / ปัญหาที่พบ :</span>
              <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-medium text-slate-900">
                {record.ProblemDescription || '-'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. เลือกบริการที่ต้องการ (เลือกได้มากกว่า 1 รายการ) */}
        <section className="avoid-page-break pt-0.5">
          <div className="inline-flex items-center gap-1.5 bg-[#1e3a8a] text-white font-bold text-xs px-3.5 py-1 rounded-full -mb-2.5 ml-3 relative z-10 shadow-sm">
            <Monitor className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>3. เลือกบริการที่ต้องการ (เลือกได้มากกว่า 1 รายการ)</span>
          </div>

          <div className="border-[1.5px] border-[#60a5fa] rounded-xl overflow-hidden bg-white pt-1">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#dbeafe] text-[#0f172a] border-y border-[#93c5fd]">
                  <th className="py-0.5 px-2.5 text-center font-bold border-r border-[#93c5fd] w-[36%]">
                    ด้านคอมพิวเตอร์และซอฟต์แวร์
                  </th>
                  <th className="py-0.5 px-2 text-center font-bold border-r border-[#93c5fd] w-[14%]">
                    ค่าบริการ
                  </th>
                  <th className="py-0.5 px-2.5 text-center font-bold border-r border-[#93c5fd] w-[36%]">
                    ด้านฮาร์ดแวร์
                  </th>
                  <th className="py-0.5 px-2 text-center font-bold w-[14%]">
                    ค่าบริการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({
                  length: Math.max(softwareServices.length, hardwareServices.length),
                }).map((_, rowIdx) => {
                  const leftItem = softwareServices[rowIdx];
                  const rightItem = hardwareServices[rowIdx];
                  const leftChecked = leftItem && selectedServices.includes(leftItem.key);
                  const rightChecked = rightItem && selectedServices.includes(rightItem.key);

                  return (
                    <tr key={rowIdx} className="border-b border-slate-200 last:border-b-0">
                      {/* ซ้าย: ด้านคอมพิวเตอร์และซอฟต์แวร์ */}
                      <td className="py-0.5 px-2.5 border-r border-[#93c5fd] align-top">
                        {leftItem && (
                          <div className="flex items-start gap-1.5">
                            <span
                              className={`mt-0.5 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                leftChecked
                                  ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {leftChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span
                              className={
                                leftChecked ? 'font-bold text-slate-900' : 'text-slate-800'
                              }
                            >
                              {leftItem.labelTh}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-0.5 px-2 text-center border-r border-[#93c5fd] font-medium tabular-nums-thai align-top">
                        {leftItem ? leftItem.priceLabel : ''}
                      </td>

                      {/* ขวา: ด้านฮาร์ดแวร์ */}
                      <td className="py-0.5 px-2.5 border-r border-[#93c5fd] align-top">
                        {rightItem && (
                          <div className="flex items-start gap-1.5">
                            <span
                              className={`mt-0.5 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                rightChecked
                                  ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {rightChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span
                              className={
                                rightChecked ? 'font-bold text-slate-900' : 'text-slate-800'
                              }
                            >
                              {rightItem.labelTh}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-0.5 px-2 text-center font-medium tabular-nums-thai align-top">
                        {rightItem ? rightItem.priceLabel : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* บรรทัด บริการอื่น ๆ / รายละเอียดเพิ่มเติม และ ประเมินค่าใช้จ่าย ____ บาท */}
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3 px-1 text-xs">
            <div className="flex items-baseline gap-1.5 flex-1 min-w-[220px]">
              <span className="font-bold text-slate-900 shrink-0">
                บริการอื่น ๆ / รายละเอียดเพิ่มเติม :
              </span>
              <span className="flex-1 border-b border-slate-500 px-2 pb-0.5 font-medium text-slate-900">
                {record.OtherServiceText || '—'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="font-bold text-slate-900">ประเมินค่าใช้จ่าย</span>
              <span className="inline-block min-w-[80px] text-center border-b border-slate-500 px-2 pb-0.5 font-bold text-[#1e3a8a] tabular-nums-thai">
                {displayCost}
              </span>
              <span className="font-bold text-slate-900">บาท</span>
            </div>
          </div>
        </section>

        {/* 4. การยืนยันก่อนให้บริการและการรับทราบ */}
        <section className="avoid-page-break pt-0.5">
          <div className="inline-flex items-center gap-1.5 bg-[#1e3a8a] text-white font-bold text-xs px-3.5 py-0.5 rounded-full -mb-2.5 ml-3 relative z-10 shadow-sm">
            <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>4. การยืนยันก่อนให้บริการและการรับทราบ</span>
          </div>
          <div className="border-[1.5px] border-[#60a5fa] rounded-xl pt-3 pb-1.5 px-3.5 bg-white space-y-1 text-[11px]">
            {ACKNOWLEDGMENT_ITEMS.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 w-3.5 h-3.5 rounded-[3px] border border-[#1e3a8a] bg-[#1e3a8a] text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-slate-800 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* บรรทัดลงลายมือชื่อผู้ขอรับบริการ และ ลายมือชื่อผู้รับเรื่อง ท้ายกระดาษ */}
      <footer className="pt-2 mt-1 avoid-page-break">
        <div className="grid grid-cols-2 gap-8 px-2 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-900 shrink-0">ลายชื่อผู้ขอรับบริการ :</span>
            <span className="flex-1 border-b border-slate-700 text-center pb-0.5 font-medium text-slate-800">
              {record.FullName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-900 shrink-0">ลายชื่อผู้รับเรื่อง :</span>
            <span className="flex-1 border-b border-slate-700 text-center pb-0.5 font-medium text-slate-800">
              {record.ReceiverName || ''}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * ============================================================================
 * เอกสารกระดาษ A4 แบบที่ 2: ใบลงเวลาการทำงาน (26 แถวมาตรฐาน 1–26)
 * ออกแบบตรงตามใบลงเวลาการทำงานตัวอย่าง (รูปที่ 2, 3, 4) ทุกสัดส่วน
 * ============================================================================
 */
const WorkTimePaperDocument: React.FC<{
  groupConfig: GroupConfig;
  pendingRecord?: AnyWorkTimeRecord | null;
  allRecords: AnyWorkTimeRecord[];
  memberNames: string[];
}> = ({ groupConfig, pendingRecord, allRecords, memberNames }) => {
  const { memberCount } = groupConfig;

  // ดึงเดือนและ พ.ศ. จากวันที่ของรายการล่าสุด หรือวันปัจจุบันหากยังไม่มีข้อมูล
  const refDateStr = pendingRecord?.Date || allRecords[allRecords.length - 1]?.Date;
  const parsedDate = refDateStr ? new Date(refDateStr) : new Date();
  const thaiMonth = !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('th-TH', { month: 'long' })
    : '';
  const buddhistYear = !isNaN(parsedDate.getTime())
    ? String(parsedDate.getFullYear() + 543)
    : '';

  const shiftTitlePrefix =
    groupConfig.groupNumber === 1
      ? 'ช่างวันจันทร์'
      : groupConfig.groupNumber === 2
      ? 'ช่างวันอังคาร'
      : 'ช่างวันศุกร์';

  const formattedMembersLine =
    memberCount === 2
      ? `${memberNames[0] || groupConfig.defaultMembers[0]} และ ${
          memberNames[1] || groupConfig.defaultMembers[1]
        }`
      : `${memberNames[0] || groupConfig.defaultMembers[0]} กับ ${
          memberNames[1] || groupConfig.defaultMembers[1]
        } และ ${memberNames[2] || groupConfig.defaultMembers[2]}`;

  const totalRowsCount = Math.max(26, allRecords.length);

  return (
    <div className="flex flex-col justify-between h-full min-h-[255mm] max-h-[275mm] text-slate-900 text-xs leading-normal select-text">
      <div>
        {/* 1. หัวเรื่อง "ใบลงเวลาการทำงาน" ตามต้นฉบับ */}
        <header className="text-center pb-3 avoid-page-break">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight pb-2 border-b border-slate-800">
            ใบลงเวลาการทำงาน
          </h1>

          {/* บรรทัด เวลาทำงาน 09:00 - 16:00 | เดือน _________ พ.ศ. _________ */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm font-bold text-black">
            <span>เวลาทำงาน {groupConfig.workingHoursLabel || '09:00 - 16:00'}</span>
            <span className="text-slate-400">|</span>
            <span className="inline-flex items-baseline gap-1.5">
              <span>เดือน</span>
              <span className="inline-block min-w-[120px] border-b border-black text-center px-2 font-semibold">
                {thaiMonth}
              </span>
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span>พ.ศ.</span>
              <span className="inline-block min-w-[90px] border-b border-black text-center px-2 font-semibold tabular-nums-thai">
                {buddhistYear}
              </span>
            </span>
          </div>

          {/* บรรทัดรายชื่อช่างประจำวัน เช่น ช่างวันจันทร์ : วัชรากร คำชมภู และ ล้อมพงษ์ สระทองมี */}
          <div className="mt-2 text-xs sm:text-sm font-bold text-black">
            {shiftTitlePrefix} : {formattedMembersLine}
          </div>
        </header>

        {/* 2. ตาราง 26 แถวมาตรฐานตามใบลงเวลาการทำงานต้นฉบับ */}
        <section className="mt-1">
          <table className="w-full table-fixed border-collapse border border-black text-xs print-table">
            <thead>
              <tr className="bg-[#525252] text-white print:bg-[#525252] print:text-white">
                <th className="border border-black py-1.5 px-1.5 text-center font-bold w-[8%]">
                  ลำดับ
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-bold w-[16%]">
                  วันที่
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-bold w-[14%]">
                  เวลาเข้างาน
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-bold w-[14%]">
                  เวลาออกงาน
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-bold w-[32%]">
                  ลายเซ็น
                </th>
                <th className="border border-black py-1.5 px-2 text-center font-bold w-[16%]">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalRowsCount }).map((_, idx) => {
                const rowNumber = idx + 1;
                const rec = allRecords[idx];
                const isCurrentPending =
                  Boolean(pendingRecord) && Boolean(rec) && rec.RecordID === pendingRecord?.RecordID;

                let rowSigs: { name: string; sig: string }[] = [];
                if (rec) {
                  const r1 = rec as WorkTimeGroup1Record;
                  const r3 = rec as WorkTimeGroup2Or3Record;
                  rowSigs =
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
                }

                return (
                  <tr
                    key={rec ? rec.RecordID : `empty-row-${rowNumber}`}
                    className={`h-[26px] avoid-page-break ${
                      isCurrentPending ? 'bg-blue-50/70 print:bg-transparent' : ''
                    }`}
                  >
                    <td className="border border-black px-1 py-0.5 text-center font-bold text-black tabular-nums-thai">
                      {rowNumber}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center font-medium text-black whitespace-nowrap tabular-nums-thai">
                      {rec ? formatDisplayDate(rec.Date) : ''}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center font-medium text-black tabular-nums-thai">
                      {rec && rec.WorkStartTime ? formatTimeTo24Hours(rec.WorkStartTime) : ''}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-center font-medium text-black tabular-nums-thai">
                      {rec && rec.WorkEndTime ? formatTimeTo24Hours(rec.WorkEndTime) : ''}
                    </td>
                    <td className="border border-black px-1 py-0.5 text-center align-middle overflow-hidden">
                      {rec ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {rowSigs.map((sItem, sIdx) => {
                            if (!sItem.sig) return null;
                            if (sItem.sig === 'ลา' || sItem.sig === '[ลา]') {
                              return (
                                <span
                                  key={sIdx}
                                  title={`${sItem.name} (ลา)`}
                                  className="text-[9px] font-bold text-black border border-black rounded px-1 py-0.5 leading-none"
                                >
                                  ลา
                                </span>
                              );
                            }
                            if (sItem.sig === 'ขาด' || sItem.sig === '[ขาด]') {
                              return (
                                <span
                                  key={sIdx}
                                  title={`${sItem.name} (ขาด)`}
                                  className="text-[9px] font-bold text-black border border-black rounded px-1 py-0.5 leading-none"
                                >
                                  ขาด
                                </span>
                              );
                            }
                            return (
                              <img
                                key={sIdx}
                                src={sItem.sig}
                                alt={`ลายมือชื่อ ${sItem.name}`}
                                title={sItem.name}
                                className="h-[22px] max-w-[68px] object-contain"
                              />
                            );
                          })}
                        </div>
                      ) : null}
                    </td>
                    <td className="border border-black px-1.5 py-0.5 text-left text-black truncate">
                      {rec ? rec.Remarks || '' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * พอร์ทัลเอกสารสำหรับสั่งพิมพ์ window.print() โดยเฉพาะ
 * ซ่อนบนหน้าจอแสดงผล 100% (ไม่มีหน้าต่าง Modal หรือแถบเครื่องมือมาบดบังฟอร์ม)
 * ปรากฏเฉพาะขณะที่เบราว์เซอร์เปิดหน้าต่าง Native Print Preview (window.print())
 * ============================================================================
 */
export interface PrintDocumentPortalProps {
  payload: PaperPreviewPayload | null;
}

export const PrintDocumentPortal: React.FC<PrintDocumentPortalProps> = ({ payload }) => {
  if (!payload) return null;

  return createPortal(
    <div className="print-only" aria-hidden="true">
      <article className="a4-paper-sheet bg-white text-slate-900 mx-auto">
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
    </div>,
    document.body
  );
};
