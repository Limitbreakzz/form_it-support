import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  FolderOpen,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import {
  AnyWorkTimeRecord,
  getDeviceTypeThaiLabel,
  getServiceThaiLabel,
  GroupConfig,
  NavigationTab,
  ServiceRequestRecord,
  SheetKey,
  WORK_TIME_GROUPS,
  WORKSHEET_LABELS_TH,
  WORKSHEET_NAMES,
} from '../types';
import { AllSheetsData } from '../services/googleSheetsService';
import {
  calculateDurationHours,
  exportToExcelCSV,
  formatDisplayDate,
  formatDisplayPhoneNumber,
  formatDisplayTime,
  parseServicesList,
} from '../utils/formatters';
import {
  PaperDocumentPreviewModal,
  PaperPreviewPayload,
  PrintDocumentPortal,
} from './PaperDocumentPreviewModal';
import { ConfirmDialog } from './ConfirmDialog';
import { SkeletonLoader } from './SkeletonLoader';
import { Badge, Button, Card, Drawer, toast } from './ui/DesignSystem';

function formatOtherTextPreview(raw: string, hasOtherBadge: boolean, isDesktop = false): React.ReactNode {
  if (!raw || raw === '-') return null;
  const textSize = isDesktop ? 'text-xs' : 'text-[11px]';
  const m = raw.match(/^บริการอื่น:\s*(.*?)\s*\|\s*รายละเอียด:\s*(.*)$/);
  if (m) {
    const detail = m[2]?.trim();
    if (!detail || detail === '-') return null;
    return (
      <div className={`${textSize} text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2`}>
        <span className="font-semibold text-slate-600 dark:text-slate-300">รายละเอียด:</span> {detail}
      </div>
    );
  }
  if (raw.startsWith('รายละเอียด:')) {
    const detail = raw.replace(/^รายละเอียด:\s*/, '').trim();
    if (!detail || detail === '-') return null;
    return (
      <div className={`${textSize} text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2`}>
        <span className="font-semibold text-slate-600 dark:text-slate-300">รายละเอียด:</span> {detail}
      </div>
    );
  }
  if (!hasOtherBadge && !raw.startsWith('บริการอื่น:')) {
    return <div className={`${textSize} text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2`}>{raw}</div>;
  }
  return null;
}

interface SubmissionHistoryViewProps {
  sheetsData: AllSheetsData;
  isLoading: boolean;
  isAuthorized: boolean;
  onRefresh: () => void;
  onRequestAuthorization: (reason: string, callback: () => void) => void;
  onEditServiceRequest: (record: ServiceRequestRecord) => void;
  onEditWorkTimeRecord?: (
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
    record: AnyWorkTimeRecord
  ) => void;
  onDeleteRecord: (
    sheetKey: SheetKey,
    recordId: string
  ) => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  onNavigate: (tab: NavigationTab) => void;
}

export const SubmissionHistoryView: React.FC<SubmissionHistoryViewProps> = ({
  sheetsData,
  isLoading,
  isAuthorized,
  onRefresh,
  onRequestAuthorization,
  onEditServiceRequest,
  onEditWorkTimeRecord,
  onDeleteRecord,
  onNavigate,
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetKey>('REQUESTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ServiceRequestRecord | null>(null);
  const [printReceiptRecord, setPrintReceiptRecord] = useState<ServiceRequestRecord | null>(null);

  // States สำหรับรายการบันทึกเวลาทำงาน (Work Time)
  const [selectedWorkRecord, setSelectedWorkRecord] = useState<{
    record: AnyWorkTimeRecord;
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3';
  } | null>(null);
  const [previewWorkTimeA4, setPreviewWorkTimeA4] = useState<PaperPreviewPayload | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    sheetKey: SheetKey;
    recordId: string;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePrintWorkTime = (
    rec: AnyWorkTimeRecord,
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3'
  ) => {
    const groupConfig = WORK_TIME_GROUPS[sheetKey];
    const memberStorageKey = `it_support_member_names_${sheetKey}_v1`;
    let memberNames = groupConfig.defaultMembers;
    try {
      const saved = localStorage.getItem(memberStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === groupConfig.memberCount) {
          memberNames = parsed;
        }
      }
    } catch {
      // ignore
    }
    const allRecords = sheetsData[sheetKey] as AnyWorkTimeRecord[];
    setPreviewWorkTimeA4({
      type: 'work-time',
      groupConfig,
      pendingRecord: rec,
      allRecordsWithPending: allRecords,
      memberNames,
    });
  };

  const handleEditWorkTime = (
    rec: AnyWorkTimeRecord,
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3'
  ) => {
    const doEdit = () => {
      if (onEditWorkTimeRecord) {
        onEditWorkTimeRecord(sheetKey, rec);
      } else {
        const tabMap: Record<string, NavigationTab> = {
          GROUP_1: 'work-time-group-1',
          GROUP_2: 'work-time-group-2',
          GROUP_3: 'work-time-group-3',
        };
        onNavigate(tabMap[sheetKey]);
      }
    };

    if (isAuthorized) {
      doEdit();
    } else {
      onRequestAuthorization(
        `ต้องการสิทธิ์เพื่อแก้ไขรายการบันทึกเวลาลำดับที่ #${rec.SequenceNo}`,
        doEdit
      );
    }
  };

  const filteredRequests = useMemo(() => {
    return sheetsData.REQUESTS.filter((rec) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        rec.ReceiptNumber.toLowerCase().includes(q) ||
        rec.FullName.toLowerCase().includes(q) ||
        rec.PhoneNumber.toLowerCase().includes(q) ||
        rec.DeviceBrandModel.toLowerCase().includes(q) ||
        rec.ProblemDescription.toLowerCase().includes(q);

      const cleanDate = rec.Date ? rec.Date.split('T')[0] : '';
      const matchesDate = !dateFilter || cleanDate === dateFilter;
      return matchesQuery && matchesDate;
    });
  }, [sheetsData.REQUESTS, searchQuery, dateFilter]);

  const filteredWorkRecords = useMemo(() => {
    if (activeSheet === 'REQUESTS') return [];
    const list = sheetsData[activeSheet] as AnyWorkTimeRecord[];
    return list.filter((rec) => {
      const q = searchQuery.trim().toLowerCase();
      const rAny = rec as unknown as Record<string, string>;
      const matchesQuery =
        !q ||
        String(rec.SequenceNo).toLowerCase().includes(q) ||
        String(rec.Remarks || '').toLowerCase().includes(q) ||
        String(rAny.Member1Name || '').toLowerCase().includes(q) ||
        String(rAny.Member2Name || '').toLowerCase().includes(q) ||
        String(rAny.Member3Name || '').toLowerCase().includes(q);

      const cleanDate = rec.Date ? rec.Date.split('T')[0] : '';
      const matchesDate = !dateFilter || cleanDate === dateFilter;
      return matchesQuery && matchesDate;
    });
  }, [sheetsData, activeSheet, searchQuery, dateFilter]);

  const handleExportCurrentSheet = () => {
    if (activeSheet === 'REQUESTS') {
      const headers = [
        'เลขที่ใบรับบริการ',
        'วันที่',
        'เวลา',
        'ชื่อ-นามสกุลผู้ขอรับบริการ',
        'เบอร์โทรศัพท์',
        'หน่วยงาน/แผนก',
        'ประเภทอุปกรณ์',
        'ยี่ห้อ/รุ่น',
        'หมายเลขเครื่อง (S/N)',
        'อาการเสียที่แจ้ง',
        'รายละเอียดเพิ่มเติม',
        'บริการที่ร้องขอ',
        'ผู้รับเรื่อง (ช่าง)',
      ];
      const rows = filteredRequests.map((r) => [
        r.ReceiptNumber,
        r.Date,
        r.Time,
        r.FullName,
        formatDisplayPhoneNumber(r.PhoneNumber),
        r.Department || '-',
        getDeviceTypeThaiLabel(r.DeviceType),
        r.DeviceBrandModel,
        r.DeviceSerialNumber,
        r.ProblemDescription,
        r.AdditionalDetails,
        parseServicesList(r.RequestedServices).map(getServiceThaiLabel).join('; '),
        r.ReceiverName || '—',
      ]);
      exportToExcelCSV('IT_Support_Requests_Export', headers, rows);
      toast.info('ส่งออกไฟล์ข้อมูลใบแจ้งซ่อม Excel/CSV เรียบร้อยแล้ว');
    } else {
      const headers = [
        'ลำดับที่ (No.)',
        'วันที่ปฏิบัติงาน',
        'เวลาเริ่มงาน',
        'เวลาเลิกงาน',
        'สมาชิกคนที่ 1',
        'สมาชิกคนที่ 2',
        ...(activeSheet !== 'GROUP_1' ? ['สมาชิกคนที่ 3'] : []),
        'หมายเหตุ',
      ];
      const rows = filteredWorkRecords.map((r) => {
        const anyRec = r as unknown as Record<string, string>;
        return [
          r.SequenceNo,
          r.Date,
          r.WorkStartTime,
          r.WorkEndTime,
          anyRec.Member1Name || '',
          anyRec.Member2Name || '',
          ...(activeSheet !== 'GROUP_1' ? [anyRec.Member3Name || ''] : []),
          r.Remarks,
        ];
      });
      exportToExcelCSV(`${WORKSHEET_NAMES[activeSheet].replace(/\s+/g, '_')}_Export`, headers, rows);
      toast.info(`ส่งออกไฟล์ Excel/CSV "${WORKSHEET_NAMES[activeSheet]}" เรียบร้อยแล้ว`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    const targetLabel = deleteTarget.label;
    try {
      await onDeleteRecord(deleteTarget.sheetKey, deleteTarget.recordId);
      setDeleteTarget(null);
      toast.success(`ลบรายการ "${targetLabel}" ออกจาก Google Sheets เรียบร้อยแล้ว`);
    } catch {
      toast.error('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ส่วนหัวและตัวกรองการค้นหา */}
      <Card className="p-6 space-y-5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              ประวัติการบันทึกข้อมูลและระบบค้นหา (Records & Search)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              ค้นหาตามเลขที่ใบรับบริการ ชื่อผู้ขอรับบริการ ชื่อสมาชิกทีม หรือกรองตามวันที่จากทั้ง 4 แผ่นงาน Google Sheets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={
                isAuthorized ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )
              }
              onClick={() =>
                onRequestAuthorization(
                  'ปลดล็อกสิทธิ์ผู้ดูแลระบบเพื่อแก้ไขหรือลบข้อมูลในประวัติการส่งฟอร์ม',
                  () => {}
                )
              }
            >
              {isAuthorized ? 'สิทธิ์เจ้าหน้าที่: ปลดล็อกแล้ว' : 'ปลดล็อกแก้ไข/ลบ'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={onRefresh}
            >
              ซิงก์ข้อมูลล่าสุด
            </Button>

            <Button
              type="button"
              variant="success"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCurrentSheet}
            >
              ส่งออกไฟล์ CSV / Excel
            </Button>
          </div>
        </div>

        {/* แท็บสลับแผ่นงานทั้ง 4 แผ่นงาน พร้อมแถบเลื่อนแนวนอนและการบอกใบ้ (Scroll Hint) บนมือถือ */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 pb-4">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 overscroll-x-contain"
            role="tablist"
            aria-label="เลือกแผ่นงาน Google Sheets"
          >
            {(['REQUESTS', 'GROUP_1', 'GROUP_2', 'GROUP_3'] as SheetKey[]).map((key) => {
              const isSelected = activeSheet === key;
              const count = sheetsData[key].length;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveSheet(key)}
                  className={`min-h-[44px] shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>{WORKSHEET_LABELS_TH[key]}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs tabular-nums-thai ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Subtle scroll indicator for narrow screens */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-white dark:from-slate-900 to-transparent sm:hidden" aria-hidden="true" />
        </div>

        {/* ช่องค้นหาและตัวกรองวันที่ */}
        <search aria-label="ค้นหาและกรองประวัติการบันทึกข้อมูล" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              name="searchQuery"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="ค้นหาข้อมูล"
              placeholder={
                activeSheet === 'REQUESTS'
                  ? 'ค้นหาด้วยเลขที่ใบรับบริการ (ITS-...), ชื่อผู้ขอรับบริการ, เบอร์โทร หรือชื่อรุ่นอุปกรณ์...'
                  : 'ค้นหาด้วยชื่อสมาชิกทีม, ลำดับที่ (No.) หรือหมายเหตุการปฏิบัติงาน...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="sm:col-span-3 relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="date"
              name="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="กรองตามวันที่"
              className="w-full h-[44px] min-h-[44px] max-h-[44px] pl-10 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-left text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-full"
              icon={<Filter className="w-3.5 h-3.5" />}
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </search>
      </Card>

      {/* ตารางแสดงข้อมูล หรือ Skeleton Shimmer ขณะโหลด */}
      {isLoading ? (
        <SkeletonLoader rows={5} />
      ) : activeSheet === 'REQUESTS' ? (
        <Card className="overflow-hidden no-print">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                ไม่พบรายการคำขอรับบริการ IT Support
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {searchQuery || dateFilter
                  ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหาหรือวันที่ที่เลือก กรุณาลองเปลี่ยนคำค้นหาใหม่'
                  : 'ยังไม่มีข้อมูลคำขอรับบริการถูกส่งเข้ามาในแผ่นงาน IT Support Requests'}
              </p>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('service-request')}
                >
                  สร้างใบคำขอรับบริการรายการแรก
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* รายการแบบ Mobile Card List สำหรับหน้าจอขนาดเล็ก (<640px) */}
              <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRequests.map((rec) => {
                  const services = parseServicesList(rec.RequestedServices);
                  return (
                    <article
                      key={rec.RecordID}
                      className="p-4 space-y-3 bg-white dark:bg-slate-900 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 tabular-nums-thai">
                            {rec.ReceiptNumber}
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                            {rec.FullName}
                            {rec.Department ? ` • ${rec.Department}` : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {rec.ReceiverName && (
                            <Badge variant="blue" className="text-xs">
                              {rec.ReceiverName}
                            </Badge>
                          )}
                          <div className="text-[11px] font-mono text-slate-500 tabular-nums-thai mt-1">
                            {formatDisplayDate(rec.Date)} {formatDisplayTime(rec.Time)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {getDeviceTypeThaiLabel(rec.DeviceType)} — {rec.DeviceBrandModel}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {rec.ProblemDescription}
                        </div>
                      </div>

                      {services.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {services.map((srv) => {
                              const label =
                                srv === 'Other' && rec.OtherServiceText && rec.OtherServiceText !== '-'
                                  ? (() => {
                                      const m = rec.OtherServiceText.match(/^บริการอื่น:\s*(.*?)(?:\s*\|\s*รายละเอียด:.*)?$/);
                                      return m
                                        ? `บริการอื่น ๆ: ${m[1]}`
                                        : rec.OtherServiceText.startsWith('รายละเอียด:')
                                        ? 'บริการอื่น ๆ'
                                        : `บริการอื่น ๆ: ${rec.OtherServiceText}`;
                                    })()
                                  : getServiceThaiLabel(srv);
                              return (
                                <Badge
                                  key={srv}
                                  variant="blue"
                                  icon={<Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                                  className="text-[11px] py-0.5 px-2"
                                >
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                          {formatOtherTextPreview(rec.OtherServiceText, services.includes('Other'))}
                        </div>
                      )}

                      {/* Touch Target 44x44px Action Bar สำหรับมือถือ */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(rec)}
                          title="ดูรายละเอียดใบรับบริการ"
                          aria-label={`ดูใบรับบริการ ${rec.ReceiptNumber}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPrintReceiptRecord(rec);
                            setTimeout(() => {
                              window.print();
                            }, 60);
                          }}
                          title="พิมพ์ใบรับบริการ (A4)"
                          aria-label={`พิมพ์ใบรับบริการ ${rec.ReceiptNumber}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAuthorized) {
                              onEditServiceRequest(rec);
                            } else {
                              onRequestAuthorization(
                                `ต้องการสิทธิ์เพื่อแก้ไขใบคำขอรับบริการ ${rec.ReceiptNumber}`,
                                () => onEditServiceRequest(rec)
                              );
                            }
                          }}
                          title="แก้ไขข้อมูล"
                          aria-label={`แก้ไขใบรับบริการ ${rec.ReceiptNumber}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const openDel = () =>
                              setDeleteTarget({
                                sheetKey: 'REQUESTS',
                                recordId: rec.RecordID,
                                label: `ใบรับบริการเลขที่ ${rec.ReceiptNumber} (${rec.FullName})`,
                              });
                            if (isAuthorized) {
                              openDel();
                            } else {
                              onRequestAuthorization(
                                `ต้องการสิทธิ์เพื่อลบใบคำขอรับบริการ ${rec.ReceiptNumber}`,
                                openDel
                              );
                            }
                          }}
                          title="ลบรายการ"
                          aria-label={`ลบใบรับบริการ ${rec.ReceiptNumber}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ตารางแสดงผลสำหรับแท็บเล็ตและเดสก์ท็อป (sm ขึ้นไป) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <th scope="col" className="py-3.5 px-4 font-bold">เลขที่ใบรับบริการ</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">วันที่ / เวลา</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">ผู้ขอรับบริการ</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">อุปกรณ์และอาการเสีย</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">บริการที่ร้องขอ</th>
                      <th scope="col" className="py-3.5 px-4 font-bold text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredRequests.map((rec) => {
                      const services = parseServicesList(rec.RequestedServices);
                      return (
                        <tr
                          key={rec.RecordID}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap tabular-nums-thai">
                            {rec.ReceiptNumber}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {formatDisplayDate(rec.Date)}
                            </div>
                            <div className="text-xs font-mono text-slate-500 tabular-nums-thai">
                              {formatDisplayTime(rec.Time)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {rec.FullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              <span className="font-mono">{formatDisplayPhoneNumber(rec.PhoneNumber)}</span>
                              {rec.Department && rec.Department !== '-' ? ` • ${rec.Department}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {getDeviceTypeThaiLabel(rec.DeviceType)} — {rec.DeviceBrandModel}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {rec.ProblemDescription}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {services.map((srv) => {
                                  const label =
                                    srv === 'Other' && rec.OtherServiceText && rec.OtherServiceText !== '-'
                                      ? (() => {
                                          const m = rec.OtherServiceText.match(/^บริการอื่น:\s*(.*?)(?:\s*\|\s*รายละเอียด:.*)?$/);
                                          return m
                                            ? `บริการอื่น ๆ: ${m[1]}`
                                            : rec.OtherServiceText.startsWith('รายละเอียด:')
                                            ? 'บริการอื่น ๆ'
                                            : `บริการอื่น ๆ: ${rec.OtherServiceText}`;
                                        })()
                                      : getServiceThaiLabel(srv);
                                  return (
                                    <Badge
                                      key={srv}
                                      variant="blue"
                                      icon={<Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                                      className="text-xs py-0.5 px-2"
                                    >
                                      {label}
                                    </Badge>
                                  );
                                })}
                              </div>
                              {formatOtherTextPreview(rec.OtherServiceText, services.includes('Other'), true)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(rec)}
                                title="ดูรายละเอียดใบรับบริการ"
                                aria-label={`ดูใบรับบริการ ${rec.ReceiptNumber}`}
                                className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPrintReceiptRecord(rec);
                                  setTimeout(() => {
                                    window.print();
                                  }, 60);
                                }}
                                title="พิมพ์ใบรับบริการ (A4)"
                                aria-label={`พิมพ์ใบรับบริการ ${rec.ReceiptNumber}`}
                                className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 inline-flex items-center justify-center transition"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAuthorized) {
                                    onEditServiceRequest(rec);
                                  } else {
                                    onRequestAuthorization(
                                      `ต้องการสิทธิ์เพื่อแก้ไขใบคำขอรับบริการ ${rec.ReceiptNumber}`,
                                      () => onEditServiceRequest(rec)
                                    );
                                  }
                                }}
                                title="แก้ไขข้อมูล"
                                aria-label={`แก้ไขใบรับบริการ ${rec.ReceiptNumber}`}
                                className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 inline-flex items-center justify-center transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const openDel = () =>
                                    setDeleteTarget({
                                      sheetKey: 'REQUESTS',
                                      recordId: rec.RecordID,
                                      label: `ใบรับบริการเลขที่ ${rec.ReceiptNumber} (${rec.FullName})`,
                                    });
                                  if (isAuthorized) {
                                    openDel();
                                  } else {
                                    onRequestAuthorization(
                                      `ต้องการสิทธิ์เพื่อลบใบคำขอรับบริการ ${rec.ReceiptNumber}`,
                                      openDel
                                    );
                                  }
                                }}
                                title="ลบรายการ"
                                aria-label={`ลบใบรับบริการ ${rec.ReceiptNumber}`}
                                className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 inline-flex items-center justify-center transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden no-print">
          {filteredWorkRecords.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                ยังไม่มีข้อมูลในแผ่นงาน {WORKSHEET_LABELS_TH[activeSheet]}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                เปิดแบบฟอร์มบันทึกเวลาปฏิบัติงานของกลุ่มนี้เพื่อเพิ่มข้อมูลและลงลายมือชื่อดิจิทัล
              </p>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    onNavigate(
                      activeSheet === 'GROUP_1'
                        ? 'work-time-group-1'
                        : activeSheet === 'GROUP_2'
                        ? 'work-time-group-2'
                        : 'work-time-group-3'
                    )
                  }
                >
                  ไปยังฟอร์ม {WORKSHEET_LABELS_TH[activeSheet]}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  แสดงข้อมูลทั้งหมด {filteredWorkRecords.length} รายการ จากแผ่นงาน{' '}
                  <strong className="font-mono text-slate-700 dark:text-slate-200">
                    {WORKSHEET_NAMES[activeSheet]}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(
                      activeSheet === 'GROUP_1'
                        ? 'work-time-group-1'
                        : activeSheet === 'GROUP_2'
                        ? 'work-time-group-2'
                        : 'work-time-group-3'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Printer className="w-3.5 h-3.5" />
                  เปิดมุมมองตารางพิมพ์ใบลงเวลาขนาด A4
                </button>
              </div>

              {/* รายการแบบ Mobile Card List สำหรับกลุ่มบันทึกเวลา (<640px) */}
              <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
                {filteredWorkRecords.map((rec, idx) => {
                  const anyRec = rec as unknown as Record<string, string>;
                  const memberCount = activeSheet === 'GROUP_1' ? 2 : 3;
                  return (
                    <article
                      key={rec.RecordID}
                      className="p-4 space-y-3 bg-white dark:bg-slate-900 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 tabular-nums-thai">
                            ลำดับที่ #{rec.SequenceNo || idx + 1}
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                            วันที่ {formatDisplayDate(rec.Date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 tabular-nums-thai">
                            {formatDisplayTime(rec.WorkStartTime)} – {formatDisplayTime(rec.WorkEndTime)}
                          </span>
                        </div>
                      </div>

                      {/* รายชื่อและลายเซ็นสมาชิก */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          สมาชิกผู้ปฏิบัติงาน ({memberCount} คน):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: memberCount }).map((_, mIdx) => {
                            const name = anyRec[`Member${mIdx + 1}Name`];
                            const sig = anyRec[`Member${mIdx + 1}Signature`];
                            const isLeave = sig === 'ลา' || sig === '[ลา]' || (typeof sig === 'string' && sig.trim().startsWith('ลา'));
                            const isAbsent = sig === 'ขาด' || sig === '[ขาด]' || (typeof sig === 'string' && (sig.trim().startsWith('ขาด') || sig.trim().startsWith('ไม่มา')));
                            const isImage = Boolean(typeof sig === 'string' && (sig.startsWith('data:image/') || sig.startsWith('http://') || sig.startsWith('https://')));

                            return (
                              <div
                                key={mIdx}
                                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs"
                              >
                                {isLeave ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    ลา
                                  </span>
                                ) : isAbsent ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                    ขาด
                                  </span>
                                ) : isImage ? (
                                  <img
                                    src={sig}
                                    alt={name}
                                    className="h-5 w-10 object-contain bg-white rounded border border-slate-100"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : null}
                                <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {rec.Remarks && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">หมายเหตุ: </span>
                          {rec.Remarks}
                        </div>
                      )}

                      {/* Touch Target 44x44px Action Bar สำหรับมือถือ */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWorkRecord({
                              record: rec,
                              sheetKey: activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
                            })
                          }
                          title="ดูรายละเอียดการลงเวลา"
                          aria-label={`ดูรายละเอียดการลงเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePrintWorkTime(rec, activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3')
                          }
                          title="พิมพ์ใบลงเวลา A4"
                          aria-label={`พิมพ์ใบลงเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleEditWorkTime(rec, activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3')
                          }
                          title="แก้ไขข้อมูล"
                          aria-label={`แก้ไขบันทึกเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="ลบรายการ"
                          aria-label={`ลบรายการแถวที่ #${rec.SequenceNo || idx + 1}`}
                          onClick={() => {
                            const openDel = () =>
                              setDeleteTarget({
                                sheetKey: activeSheet,
                                recordId: rec.RecordID,
                                label: `${WORKSHEET_LABELS_TH[activeSheet]} แถวที่ #${rec.SequenceNo}`,
                              });
                            if (isAuthorized) {
                              openDel();
                            } else {
                              onRequestAuthorization(
                                'ต้องการสิทธิ์เพื่อลบรายการบันทึกเวลาปฏิบัติงาน',
                                openDel
                              );
                            }
                          }}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 inline-flex items-center justify-center transition active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ตารางแสดงผลสำหรับจอแท็บเล็ตและเดสก์ท็อป (sm ขึ้นไป) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <th scope="col" className="py-3 px-4 font-bold">ลำดับที่</th>
                      <th scope="col" className="py-3 px-4 font-bold">วันที่ปฏิบัติงาน</th>
                      <th scope="col" className="py-3 px-4 font-bold">เวลาเริ่ม–เลิกงาน</th>
                      <th scope="col" className="py-3 px-4 font-bold">ลายมือชื่อสมาชิกในกลุ่ม</th>
                      <th scope="col" className="py-3 px-4 font-bold">หมายเหตุ</th>
                      <th scope="col" className="py-3 px-4 font-bold text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredWorkRecords.map((rec, idx) => {
                      const anyRec = rec as unknown as Record<string, string>;
                      const memberCount = activeSheet === 'GROUP_1' ? 2 : 3;
                      return (
                        <tr key={rec.RecordID} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold tabular-nums-thai">
                            #{rec.SequenceNo || idx + 1}
                          </td>
                          <td className="py-3 px-4">{formatDisplayDate(rec.Date)}</td>
                          <td className="py-3 px-4 font-mono tabular-nums-thai">
                            {formatDisplayTime(rec.WorkStartTime)} –{' '}
                            {formatDisplayTime(rec.WorkEndTime)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {Array.from({ length: memberCount }).map((_, mIdx) => {
                                const name = anyRec[`Member${mIdx + 1}Name`];
                                const sig = anyRec[`Member${mIdx + 1}Signature`];
                                const isLeave = sig === 'ลา' || sig === '[ลา]' || (typeof sig === 'string' && sig.trim().startsWith('ลา'));
                                const isAbsent = sig === 'ขาด' || sig === '[ขาด]' || (typeof sig === 'string' && (sig.trim().startsWith('ขาด') || sig.trim().startsWith('ไม่มา')));
                                const isImage = Boolean(typeof sig === 'string' && (sig.startsWith('data:image/') || sig.startsWith('http://') || sig.startsWith('https://')));

                                return (
                                  <div
                                    key={mIdx}
                                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                                  >
                                    {isLeave ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        ลา
                                      </span>
                                    ) : isAbsent ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                        ขาด
                                      </span>
                                    ) : isImage ? (
                                      <img
                                        src={sig}
                                        alt={name}
                                        className="h-6 w-12 object-contain bg-white rounded border border-slate-100 dark:border-slate-700"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    ) : null}
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">{rec.Remarks || '—'}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedWorkRecord({
                                    record: rec,
                                    sheetKey: activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
                                  })
                                }
                                title="ดูรายละเอียดการลงเวลา"
                                aria-label={`ดูรายละเอียดการลงเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                                className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition active:scale-95"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePrintWorkTime(rec, activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3')
                                }
                                title="พิมพ์ใบลงเวลา A4"
                                aria-label={`พิมพ์ใบลงเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                                className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center transition active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditWorkTime(rec, activeSheet as 'GROUP_1' | 'GROUP_2' | 'GROUP_3')
                                }
                                title="แก้ไขข้อมูล"
                                aria-label={`แก้ไขบันทึกเวลาลำดับที่ #${rec.SequenceNo || idx + 1}`}
                                className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 inline-flex items-center justify-center transition active:scale-95"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="ลบรายการ"
                                aria-label={`ลบรายการแถวที่ #${rec.SequenceNo || idx + 1}`}
                                onClick={() => {
                                  const openDel = () =>
                                    setDeleteTarget({
                                      sheetKey: activeSheet,
                                      recordId: rec.RecordID,
                                      label: `${WORKSHEET_LABELS_TH[activeSheet]} แถวที่ #${rec.SequenceNo}`,
                                    });
                                  if (isAuthorized) {
                                    openDel();
                                  } else {
                                    onRequestAuthorization(
                                      'ต้องการสิทธิ์เพื่อลบรายการบันทึกเวลาปฏิบัติงาน',
                                      openDel
                                    );
                                  }
                                }}
                                className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 inline-flex items-center justify-center transition active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* พอร์ทัลเอกสาร A4 สำหรับสั่งพิมพ์ window.print() ทันทีโดยไม่ต้องเปิดหน้าต่าง Modal */}
      <PrintDocumentPortal
        payload={
          printReceiptRecord
            ? {
                type: 'service-request',
                record: printReceiptRecord,
              }
            : null
        }
      />

      {/* หน้าต่างแสดงใบรับบริการรูปแบบกระดาษ A4 เมื่อกดไอคอนดวงตา (ดูรายละเอียด) */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(selectedReceipt)}
        mode="view-only"
        payload={
          selectedReceipt
            ? {
                type: 'service-request',
                record: selectedReceipt,
              }
            : null
        }
        onCancel={() => setSelectedReceipt(null)}
      />

      {/* หน้าต่างแสดงเอกสาร A4 ใบลงเวลาการทำงาน เมื่อกดไอคอนเครื่องพิมพ์ */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(previewWorkTimeA4)}
        mode="view-only"
        payload={previewWorkTimeA4}
        onCancel={() => setPreviewWorkTimeA4(null)}
      />

      {/* Drawer แสดงรายละเอียดบันทึกเวลาปฏิบัติงานเมื่อกดไอคอนดวงตา */}
      <Drawer
        isOpen={Boolean(selectedWorkRecord)}
        onClose={() => setSelectedWorkRecord(null)}
        title={
          selectedWorkRecord
            ? `บันทึกเวลาลำดับที่ #${selectedWorkRecord.record.SequenceNo || 1}`
            : 'รายละเอียดบันทึกเวลาปฏิบัติงาน'
        }
        subtitle={
          selectedWorkRecord
            ? `${WORK_TIME_GROUPS[selectedWorkRecord.sheetKey].dayTechnicianLabel} • เวลาทำการ ${WORK_TIME_GROUPS[selectedWorkRecord.sheetKey].workingHoursLabel}`
            : ''
        }
        icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        badge={
          selectedWorkRecord ? (
            <Badge variant="blue" className="text-xs">
              {WORK_TIME_GROUPS[selectedWorkRecord.sheetKey].dayTechnicianLabel}
            </Badge>
          ) : undefined
        }
        footer={
          selectedWorkRecord ? (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  const rec = selectedWorkRecord.record;
                  const sk = selectedWorkRecord.sheetKey;
                  setSelectedWorkRecord(null);
                  const openDel = () =>
                    setDeleteTarget({
                      sheetKey: sk,
                      recordId: rec.RecordID,
                      label: `${WORKSHEET_LABELS_TH[sk]} แถวที่ #${rec.SequenceNo}`,
                    });
                  if (isAuthorized) {
                    openDel();
                  } else {
                    onRequestAuthorization(
                      'ต้องการสิทธิ์เพื่อลบรายการบันทึกเวลาปฏิบัติงาน',
                      openDel
                    );
                  }
                }}
              >
                ลบรายการ
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    const rec = selectedWorkRecord.record;
                    const sk = selectedWorkRecord.sheetKey;
                    setSelectedWorkRecord(null);
                    handlePrintWorkTime(rec, sk);
                  }}
                >
                  พิมพ์ใบลงเวลา A4
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => {
                    const rec = selectedWorkRecord.record;
                    const sk = selectedWorkRecord.sheetKey;
                    setSelectedWorkRecord(null);
                    handleEditWorkTime(rec, sk);
                  }}
                >
                  แก้ไขข้อมูล
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedWorkRecord && (
          <div className="space-y-5 text-sm">
            {/* ข้อมูลวันเวลา */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">วันที่ปฏิบัติงาน</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatDisplayDate(selectedWorkRecord.record.Date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ลำดับที่ในแผ่นงาน</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                    #{selectedWorkRecord.record.SequenceNo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ช่วงเวลาปฏิบัติงาน</div>
                  <div className="font-semibold text-slate-900 dark:text-white font-mono mt-0.5 tabular-nums-thai">
                    {formatDisplayTime(selectedWorkRecord.record.WorkStartTime)} –{' '}
                    {formatDisplayTime(selectedWorkRecord.record.WorkEndTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">รวมระยะเวลา</div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {calculateDurationHours(
                      selectedWorkRecord.record.WorkStartTime,
                      selectedWorkRecord.record.WorkEndTime
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">หมายเหตุการปฏิบัติงาน</div>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {selectedWorkRecord.record.Remarks || 'ไม่มีหมายเหตุเพิ่มเติม'}
                  </div>
                </div>
              </div>
            </div>

            {/* ลายมือชื่อสมาชิกประจำวัน */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>
                  ลายมือชื่อดิจิทัลของสมาชิก ({WORK_TIME_GROUPS[selectedWorkRecord.sheetKey].memberCount} คน)
                </span>
              </div>
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                {Array.from({ length: WORK_TIME_GROUPS[selectedWorkRecord.sheetKey].memberCount }).map((_, mIdx) => {
                  const anyRec = selectedWorkRecord.record as unknown as Record<string, string>;
                  const name = anyRec[`Member${mIdx + 1}Name`] || `สมาชิกคนที่ ${mIdx + 1}`;
                  const sig = anyRec[`Member${mIdx + 1}Signature`];
                  return (
                    <div
                      key={mIdx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          สมาชิกคนที่ {mIdx + 1}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                          {name}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {sig === 'ลา' || sig === '[ลา]' || (typeof sig === 'string' && sig.trim().startsWith('ลา')) ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            สถานะ: ลาปฏิบัติงาน
                          </span>
                        ) : sig === 'ขาด' || sig === '[ขาด]' || (typeof sig === 'string' && (sig.trim().startsWith('ขาด') || sig.trim().startsWith('ไม่มา'))) ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                            สถานะ: ไม่มา / ขาดปฏิบัติงาน
                          </span>
                        ) : typeof sig === 'string' && (sig.startsWith('data:image/') || sig.startsWith('http://') || sig.startsWith('https://')) ? (
                          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                            <img
                              src={sig}
                              alt={`ลายเซ็น ${name}`}
                              className="h-10 w-28 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">ไม่มีลายเซ็น</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* หน้าต่างยืนยันการลบข้อมูล */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="ยืนยันการลบข้อมูลออกจากระบบ"
        description={`คุณต้องการลบรายการ "${deleteTarget?.label}" ใช่หรือไม่? การดำเนินการนี้จะลบข้อมูลออกจากแผ่นงาน Google Sheets ด้วย`}
        confirmLabel="ยืนยันการลบถาวร"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
