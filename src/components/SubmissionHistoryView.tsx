import React, { useMemo, useState } from 'react';
import {
  Calendar,
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
} from 'lucide-react';
import {
  AnyWorkTimeRecord,
  getDeviceTypeThaiLabel,
  getServiceThaiLabel,
  NavigationTab,
  ServiceRequestRecord,
  SheetKey,
  STATUS_LABELS_TH,
  WORKSHEET_LABELS_TH,
  WORKSHEET_NAMES,
} from '../types';
import { AllSheetsData } from '../services/googleSheetsService';
import {
  exportToExcelCSV,
  formatDisplayDate,
  formatDisplayTime,
  parseServicesList,
} from '../utils/formatters';
import { PaperDocumentPreviewModal } from './PaperDocumentPreviewModal';
import { ConfirmDialog } from './ConfirmDialog';
import { SkeletonLoader } from './SkeletonLoader';
import { Badge, Button, Card } from './ui/DesignSystem';

interface SubmissionHistoryViewProps {
  sheetsData: AllSheetsData;
  isLoading: boolean;
  isAuthorized: boolean;
  onRefresh: () => void;
  onRequestAuthorization: (reason: string, callback: () => void) => void;
  onEditServiceRequest: (record: ServiceRequestRecord) => void;
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
  onDeleteRecord,
  onNavigate,
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetKey>('REQUESTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ServiceRequestRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    sheetKey: SheetKey;
    recordId: string;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        'สถานะ',
      ];
      const rows = filteredRequests.map((r) => [
        r.ReceiptNumber,
        r.Date,
        r.Time,
        r.FullName,
        r.PhoneNumber,
        r.Department,
        getDeviceTypeThaiLabel(r.DeviceType),
        r.DeviceBrandModel,
        r.DeviceSerialNumber,
        r.ProblemDescription,
        r.AdditionalDetails,
        parseServicesList(r.RequestedServices).map(getServiceThaiLabel).join('; '),
        STATUS_LABELS_TH[r.Status] || r.Status,
      ]);
      exportToExcelCSV('IT_Support_Requests_Export', headers, rows);
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
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteRecord(deleteTarget.sheetKey, deleteTarget.recordId);
      setDeleteTarget(null);
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

        {/* แท็บสลับแผ่นงานทั้ง 4 แผ่นงาน */}
        <div
          className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4"
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
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
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
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th scope="col" className="py-3.5 px-4 font-bold">เลขที่ใบรับบริการ</th>
                    <th scope="col" className="py-3.5 px-4 font-bold">วันที่ / เวลา</th>
                    <th scope="col" className="py-3.5 px-4 font-bold">ผู้ขอรับบริการ</th>
                    <th scope="col" className="py-3.5 px-4 font-bold">อุปกรณ์และอาการเสีย</th>
                    <th scope="col" className="py-3.5 px-4 font-bold">บริการที่ร้องขอ (✓)</th>
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
                            <span className="font-mono">{rec.PhoneNumber}</span>
                            {rec.Department ? ` • ${rec.Department}` : ''}
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
                          <div className="flex flex-wrap gap-1">
                            {services.map((srv) => (
                              <Badge key={srv} variant="blue" className="text-xs py-0.5 px-2">
                                ✓ {getServiceThaiLabel(srv)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(rec)}
                              title="ดูรายละเอียดใบรับบริการ"
                              aria-label={`ดูใบรับบริการ ${rec.ReceiptNumber}`}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(rec)}
                              title="พิมพ์ใบรับบริการ"
                              aria-label={`พิมพ์ใบรับบริการ ${rec.ReceiptNumber}`}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition"
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
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition"
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
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 transition"
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

              <div className="overflow-x-auto">
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
                                return (
                                  <div
                                    key={mIdx}
                                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                                  >
                                    {sig && (
                                      <img
                                        src={sig}
                                        alt={name}
                                        className="h-6 w-12 object-contain bg-white rounded"
                                      />
                                    )}
                                    <span className="text-xs font-medium">{name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">{rec.Remarks || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              title="ลบรายการ"
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
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* หน้าต่างแสดงและพิมพ์ใบรับบริการรูปแบบกระดาษ A4 */}
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
