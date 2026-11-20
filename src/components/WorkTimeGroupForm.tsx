import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Lock,
  PlusCircle,
  Printer,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import {
  AnyWorkTimeRecord,
  GroupConfig,
  WorkTimeGroup1Record,
  WorkTimeGroup2Or3Record,
} from '../types';
import {
  calculateDurationHours,
  exportToExcelCSV,
  formatDisplayDate,
  formatDisplayTime,
  generateRecordId,
  getCurrentDateISO,
  getCurrentTime24,
} from '../utils/formatters';
import { SignaturePadField, MemberAttendanceStatus } from './SignaturePadField';
import { ConfirmDialog } from './ConfirmDialog';
import {
  PaperDocumentPreviewModal,
  PrintDocumentPortal,
  PaperPreviewPayload,
} from './PaperDocumentPreviewModal';
import { Badge, Button, Card, DateField, Drawer, IconButton, InputField, TimeField24, toast } from './ui/DesignSystem';

interface WorkTimeGroupFormProps {
  groupConfig: GroupConfig;
  records: AnyWorkTimeRecord[];
  initialEditingRecord?: AnyWorkTimeRecord | null;
  onCancelEdit?: () => void;
  isAuthorized?: boolean;
  onRequestAuthorization?: (reason: string, callback: () => void) => void;
  onSaveWorkRecord: (
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
    record: AnyWorkTimeRecord,
    isEdit: boolean
  ) => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  onDeleteWorkRecord: (
    sheetKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3',
    recordId: string
  ) => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  onBackToDashboard: () => void;
}

export const WorkTimeGroupForm: React.FC<WorkTimeGroupFormProps> = ({
  groupConfig,
  records,
  initialEditingRecord,
  onCancelEdit,
  onSaveWorkRecord,
  onDeleteWorkRecord,
  onBackToDashboard,
}) => {
  const { id: sheetKey, groupNumber, dayTechnicianLabel, memberCount, worksheetName } = groupConfig;
  const memberStorageKey = `it_support_member_names_${sheetKey}_v1`;

  const getInitialNames = (): string[] => {
    // ล้างค่าเก่าที่อาจมีพิมพ์ผิดใน localStorage ทิ้ง เพื่อให้ตรงกับรายชื่อทางการ 100%
    try {
      localStorage.removeItem(memberStorageKey);
    } catch {
      // ignore
    }
    return groupConfig.defaultMembers;
  };

  const [date, setDate] = useState<string>(() => getCurrentDateISO());
  const [workStartTime, setWorkStartTime] = useState<string>('09:00');
  const [workEndTime, setWorkEndTime] = useState<string>('16:00');
  const [remarks, setRemarks] = useState<string>('');

  const parseSigAndStatus = (
    sigVal?: string
  ): { sig: string; status: MemberAttendanceStatus } => {
    const val = (sigVal || '').trim();
    if (val === 'ลา' || val === '[ลา]') return { sig: '', status: 'leave' };
    if (val === 'ขาด' || val === '[ขาด]') return { sig: '', status: 'absent' };
    return { sig: val, status: 'present' };
  };

  const [memberNames, setMemberNames] = useState<string[]>(getInitialNames);
  const [memberSignatures, setMemberSignatures] = useState<string[]>(() =>
    Array(memberCount).fill('')
  );
  const [memberStatuses, setMemberStatuses] = useState<MemberAttendanceStatus[]>(() =>
    Array(memberCount).fill('present')
  );

  const [editingRecord, setEditingRecord] = useState<AnyWorkTimeRecord | null>(null);
  const [drawerWorkRecord, setDrawerWorkRecord] = useState<AnyWorkTimeRecord | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [printWorkPayload, setPrintWorkPayload] = useState<PaperPreviewPayload | null>(null);
  const [previewModalPayload, setPreviewModalPayload] = useState<PaperPreviewPayload | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AnyWorkTimeRecord | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<AnyWorkTimeRecord | null>(null);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmCancelEditOpen, setIsConfirmCancelEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (initialEditingRecord) {
      setEditingRecord(initialEditingRecord);
      setDate(
        initialEditingRecord.Date
          ? initialEditingRecord.Date.split('T')[0]
          : getCurrentDateISO()
      );
      setWorkStartTime(
        initialEditingRecord.WorkStartTime
          ? initialEditingRecord.WorkStartTime.slice(0, 5)
          : '08:30'
      );
      setWorkEndTime(
        initialEditingRecord.WorkEndTime
          ? initialEditingRecord.WorkEndTime.slice(0, 5)
          : '16:00'
      );
      setRemarks(
        initialEditingRecord.Remarks && initialEditingRecord.Remarks !== '-'
          ? initialEditingRecord.Remarks
          : ''
      );

      if (memberCount === 2) {
        const r1 = initialEditingRecord as WorkTimeGroup1Record;
        setMemberNames([
          groupConfig.defaultMembers[0],
          groupConfig.defaultMembers[1],
        ]);
        const p1 = parseSigAndStatus(r1.Member1Signature);
        const p2 = parseSigAndStatus(r1.Member2Signature);
        setMemberSignatures([p1.sig, p2.sig]);
        setMemberStatuses([p1.status, p2.status]);
      } else {
        const r3 = initialEditingRecord as WorkTimeGroup2Or3Record;
        setMemberNames([
          groupConfig.defaultMembers[0],
          groupConfig.defaultMembers[1],
          groupConfig.defaultMembers[2] || '',
        ]);
        const p1 = parseSigAndStatus(r3.Member1Signature);
        const p2 = parseSigAndStatus(r3.Member2Signature);
        const p3 = parseSigAndStatus(r3.Member3Signature);
        setMemberSignatures([p1.sig, p2.sig, p3.sig]);
        setMemberStatuses([p1.status, p2.status, p3.status]);
      }
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setEditingRecord(null);
      setDrawerWorkRecord(null);
      setPrintWorkPayload(null);
      setDate(getCurrentDateISO());
      setWorkStartTime('09:00');
      setWorkEndTime('16:00');
      setRemarks('');
      setMemberNames(getInitialNames());
      setMemberSignatures(Array(memberCount).fill(''));
      setMemberStatuses(Array(memberCount).fill('present'));
      setErrors({});
      setFeedback(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetKey, memberCount, initialEditingRecord]);

  const handleMemberNameChange = (idx: number, val: string) => {
    const next = [...memberNames];
    next[idx] = val;
    setMemberNames(next);
    try {
      localStorage.setItem(memberStorageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleMemberSignatureChange = (idx: number, dataUrl: string) => {
    const next = [...memberSignatures];
    next[idx] = dataUrl;
    setMemberSignatures(next);
    if (errors[`sig_${idx}`]) {
      setErrors((prev) => ({ ...prev, [`sig_${idx}`]: '' }));
    }
  };

  const handleAttendanceStatusChange = (idx: number, status: MemberAttendanceStatus) => {
    const next = [...memberStatuses];
    next[idx] = status;
    setMemberStatuses(next);
    if (status !== 'present') {
      // Clear signature error immediately when marked leave or absent
      if (errors[`sig_${idx}`]) {
        setErrors((prev) => ({ ...prev, [`sig_${idx}`]: '' }));
      }
    }
  };

  const executeDoEdit = (rec: AnyWorkTimeRecord) => {
    setEditingRecord(rec);
    setDate(rec.Date ? rec.Date.split('T')[0] : getCurrentDateISO());
    setWorkStartTime(rec.WorkStartTime ? rec.WorkStartTime.slice(0, 5) : '08:30');
    setWorkEndTime(rec.WorkEndTime ? rec.WorkEndTime.slice(0, 5) : '17:30');
    setRemarks(rec.Remarks || '');

    if (memberCount === 2) {
      const r1 = rec as WorkTimeGroup1Record;
      setMemberNames([
        groupConfig.defaultMembers[0],
        groupConfig.defaultMembers[1],
      ]);
      const p1 = parseSigAndStatus(r1.Member1Signature);
      const p2 = parseSigAndStatus(r1.Member2Signature);
      setMemberSignatures([p1.sig, p2.sig]);
      setMemberStatuses([p1.status, p2.status]);
    } else {
      const r3 = rec as WorkTimeGroup2Or3Record;
      setMemberNames([
        groupConfig.defaultMembers[0],
        groupConfig.defaultMembers[1],
        groupConfig.defaultMembers[2] || '',
      ]);
      const p1 = parseSigAndStatus(r3.Member1Signature);
      const p2 = parseSigAndStatus(r3.Member2Signature);
      const p3 = parseSigAndStatus(r3.Member3Signature);
      setMemberSignatures([p1.sig, p2.sig, p3.sig]);
      setMemberStatuses([p1.status, p2.status, p3.status]);
    }
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingRow = (rec: AnyWorkTimeRecord) => {
    setRecordToEdit(rec);
  };

  const requestDeleteRow = (rec: AnyWorkTimeRecord) => {
    setRecordToDelete(rec);
  };

  const validateEntry = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!date.trim()) nextErrors.date = 'กรุณาเลือกวันที่มาปฏิบัติงาน';
    if (!workStartTime.trim()) nextErrors.workStartTime = 'กรุณาระบุเวลาเข้างาน';
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workStartTime.trim()))
      nextErrors.workStartTime = 'กรุณากรอกเวลาแบบ 24 ชั่วโมง เช่น 08:30';
    if (!workEndTime.trim()) nextErrors.workEndTime = 'กรุณาระบุเวลาออกงาน';
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workEndTime.trim()))
      nextErrors.workEndTime = 'กรุณากรอกเวลาแบบ 24 ชั่วโมง เช่น 16:30';

    for (let i = 0; i < memberCount; i++) {
      if (!memberNames[i]?.trim()) {
        nextErrors[`sig_${i}`] = `กรุณากรอกชื่อ–นามสกุลของช่างคนที่ ${i + 1}`;
      } else if (memberStatuses[i] === 'present' && !memberSignatures[i]) {
        nextErrors[`sig_${i}`] = `กรุณาวาดลายเซ็นหรืออัปโหลดรูปลายเซ็นของ ${memberNames[i]} (หรือเลือกสถานะ "ลา" / "ขาด" หากไม่ได้มาปฏิบัติงาน)`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildDraftWorkTimeRecord = (): AnyWorkTimeRecord => {
    const nowIso = new Date().toISOString();
    const sequenceNo = editingRecord
      ? editingRecord.SequenceNo
      : String(records.length + 1);

    const getFinalSig = (idx: number) => {
      if (memberStatuses[idx] === 'leave') return 'ลา';
      if (memberStatuses[idx] === 'absent') return 'ขาด';
      return memberSignatures[idx] || '';
    };

    if (memberCount === 2) {
      const group1Record: WorkTimeGroup1Record = {
        RecordID: editingRecord ? editingRecord.RecordID : generateRecordId(),
        SequenceNo: sequenceNo,
        Date: date.trim(),
        WorkStartTime: workStartTime.trim(),
        WorkEndTime: workEndTime.trim(),
        Member1Name: memberNames[0].trim(),
        Member1Signature: getFinalSig(0),
        Member2Name: memberNames[1].trim(),
        Member2Signature: getFinalSig(1),
        Remarks: remarks.trim() || '-',
        CreatedAt: editingRecord ? editingRecord.CreatedAt : nowIso,
        UpdatedAt: nowIso,
      };
      return group1Record;
    } else {
      const group2Or3Record: WorkTimeGroup2Or3Record = {
        RecordID: editingRecord ? editingRecord.RecordID : generateRecordId(),
        SequenceNo: sequenceNo,
        Date: date.trim(),
        WorkStartTime: workStartTime.trim(),
        WorkEndTime: workEndTime.trim(),
        Member1Name: memberNames[0].trim(),
        Member1Signature: getFinalSig(0),
        Member2Name: memberNames[1].trim(),
        Member2Signature: getFinalSig(1),
        Member3Name: memberNames[2].trim(),
        Member3Signature: getFinalSig(2),
        Remarks: remarks.trim() || '-',
        CreatedAt: editingRecord ? editingRecord.CreatedAt : nowIso,
        UpdatedAt: nowIso,
      };
      return group2Or3Record;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!validateEntry()) {
      toast.error('กรุณากรอกวันที่ เวลาเริ่ม-เลิกงาน และลงลายมือชื่อให้ครบถ้วน');
      return;
    }
    // แสดงหน้าต่างยืนยันก่อนบันทึกเวลาปฏิบัติงาน
    setIsConfirmSubmitOpen(true);
  };

  const handlePrintPreview = () => {
    setFeedback(null);
    if (!validateEntry()) {
      toast.error('กรุณากรอกข้อมูลเวลาปฏิบัติงานให้ครบถ้วนก่อนดูตัวอย่างการพิมพ์');
      return;
    }
    const draft = buildDraftWorkTimeRecord();
    const payload: PaperPreviewPayload = {
      type: 'work-time',
      groupConfig,
      pendingRecord: draft,
      allRecordsWithPending: editingRecord
        ? records.map((r) => (r.RecordID === draft.RecordID ? draft : r))
        : [...records, draft],
      memberNames,
    };
    setPrintWorkPayload(payload);
    setPreviewModalPayload(payload);
  };

  const executeSaveWorkRecord = async (
    payload: AnyWorkTimeRecord,
    shouldPrintImmediately: boolean
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    const sequenceNo = payload.SequenceNo;

    try {
      const res = await onSaveWorkRecord(sheetKey, payload, Boolean(editingRecord));
      if (!res.success) {
        const errorMsg =
          res.error || 'ไม่สามารถบันทึกเวลาปฏิบัติงานได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
        setFeedback({
          type: 'error',
          message: errorMsg,
        });
        toast.error(errorMsg);
        return;
      }

      const successMessage = res.syncedToCloud
        ? `บันทึกเวลาปฏิบัติงานลำดับที่ #${sequenceNo} (${dayTechnicianLabel}) เข้าระบบออนไลน์เรียบร้อยแล้ว`
        : `บันทึกเวลาปฏิบัติงานลำดับที่ #${sequenceNo} (${dayTechnicianLabel}) ไว้ในเครื่องเรียบร้อยแล้ว`;

      setPrintWorkPayload({
        type: 'work-time',
        groupConfig,
        pendingRecord: payload,
        allRecordsWithPending: records.some((r) => r.RecordID === payload.RecordID)
          ? records
          : [...records, payload],
        memberNames,
      });
      setFeedback({
        type: 'success',
        message: successMessage,
      });

      // แจ้งเตือน Tactile & Visual Feedback ทั้งบนปุ่ม และ Toast Notification ทันที
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);

      toast.success(
        `บันทึกเวลาปฏิบัติงานลำดับที่ #${sequenceNo} (${dayTechnicianLabel}) เรียบร้อยแล้ว`,
        {
          title: editingRecord ? 'แก้ไขเวลาปฏิบัติงานสำเร็จ' : 'บันทึกเวลาปฏิบัติงานสำเร็จ',
          action: {
            label: 'พิมพ์ใบลงเวลา (A4)',
            onClick: handlePrintA4,
          },
        }
      );

      setEditingRecord(null);
      if (onCancelEdit) onCancelEdit();
      setRemarks('');
      setWorkStartTime('09:00');
      setWorkEndTime('16:00');
      setMemberSignatures(Array(memberCount).fill(''));

      if (shouldPrintImmediately) {
        setTimeout(() => {
          window.print();
        }, 100);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onDeleteWorkRecord(sheetKey, recordToDelete.RecordID);
      const deletedSeq = recordToDelete.SequenceNo;
      setRecordToDelete(null);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `ลบรายการและปรับปรุงลำดับที่ (No.) ใหม่ในแผ่นงาน "${worksheetName}" เรียบร้อยแล้ว`,
        });
        toast.success(`ลบรายการลำดับที่ #${deletedSeq} ออกจากระบบเรียบร้อยแล้ว`);
      } else {
        toast.error('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers =
      memberCount === 2
        ? [
            'ลำดับที่ (No.)',
            'วันที่ปฏิบัติงาน',
            'เวลาเริ่มงาน',
            'เวลาเลิกงาน',
            `${memberNames[0] || 'สมาชิกคนที่ 1'} (ลายมือชื่อ)`,
            `${memberNames[1] || 'สมาชิกคนที่ 2'} (ลายมือชื่อ)`,
            'หมายเหตุ',
          ]
        : [
            'ลำดับที่ (No.)',
            'วันที่ปฏิบัติงาน',
            'เวลาเริ่มงาน',
            'เวลาเลิกงาน',
            `${memberNames[0] || 'สมาชิกคนที่ 1'} (ลายมือชื่อ)`,
            `${memberNames[1] || 'สมาชิกคนที่ 2'} (ลายมือชื่อ)`,
            `${memberNames[2] || 'สมาชิกคนที่ 3'} (ลายมือชื่อ)`,
            'หมายเหตุ',
          ];

    const rows = records.map((rec, idx) => {
      if (memberCount === 2) {
        const r = rec as WorkTimeGroup1Record;
        return [
          String(idx + 1),
          r.Date,
          r.WorkStartTime,
          r.WorkEndTime,
          r.Member1Signature ? `ลงชื่อแล้ว (${r.Member1Name})` : 'ยังไม่ลงชื่อ',
          r.Member2Signature ? `ลงชื่อแล้ว (${r.Member2Name})` : 'ยังไม่ลงชื่อ',
          r.Remarks,
        ];
      } else {
        const r = rec as WorkTimeGroup2Or3Record;
        return [
          String(idx + 1),
          r.Date,
          r.WorkStartTime,
          r.WorkEndTime,
          r.Member1Signature ? `ลงชื่อแล้ว (${r.Member1Name})` : 'ยังไม่ลงชื่อ',
          r.Member2Signature ? `ลงชื่อแล้ว (${r.Member2Name})` : 'ยังไม่ลงชื่อ',
          r.Member3Signature ? `ลงชื่อแล้ว (${r.Member3Name})` : 'ยังไม่ลงชื่อ',
          r.Remarks,
        ];
      }
    });

    exportToExcelCSV(`Work_Time_Day_${groupNumber}`, headers, rows);
    toast.info(`ส่งออกไฟล์ Excel/CSV แผ่นงาน "${worksheetName}" เรียบร้อยแล้ว`);
  };

  const handlePrintA4 = () => {
    const payload: PaperPreviewPayload = {
      type: 'work-time',
      groupConfig,
      pendingRecord: null,
      allRecordsWithPending: records,
      memberNames,
    };
    setPrintWorkPayload(payload);
    setPreviewModalPayload(payload);
  };

  const nextSequenceNumber = editingRecord ? editingRecord.SequenceNo : String(records.length + 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* แถบนำทางและป้ายระบุแผ่นงาน (ซ่อนขณะพิมพ์) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="min-h-[40px] px-2.5 py-1.5 -ml-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>กลับหน้าหลัก</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={groupConfig.badgeColor} icon={<Users className="w-3.5 h-3.5" />}>
            {dayTechnicianLabel} ({memberCount} คน)
          </Badge>
          <Badge variant="emerald" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
            แผ่นงาน: {worksheetName}
          </Badge>
        </div>
      </div>

      {/* แจ้งเตือนผลการบันทึก พร้อมปุ่มดูและพิมพ์ใบลงเวลาขนาด A4 */}
      {feedback && (
        <div
          role="alert"
          className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 no-print ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{feedback.message}</span>
          </div>

          {feedback.type === 'success' && (
            <Button
              type="button"
              variant="success"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrintA4}
            >
              พิมพ์ใบลงเวลา (A4)
            </Button>
          )}
        </div>
      )}

      {/* แบบฟอร์มบันทึกเวลาปฏิบัติงานรายวัน (ซ่อนขณะพิมพ์เพื่อให้พิมพ์เฉพาะตาราง A4) */}
      <form onSubmit={handleFormSubmit} noValidate className="no-print">
        <Card className="overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {groupConfig.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {groupConfig.subtitle}
                </p>
              </div>
            </div>

            {/* ซ่อนบนมือถือเพื่อตัดความซ้ำซ้อน เนื่องจากในฟอร์มด้านล่างมีช่อง "1. ลำดับที่ (รันอัตโนมัติ)" ชัดเจนแล้ว */}
            <div className="hidden sm:block bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-left sm:text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ลำดับที่ (Sequence No.)
              </div>
              <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums-thai">
                #{nextSequenceNumber}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* 1. ลำดับที่, 2. วันที่, 3. เวลาเริ่มงาน, 4. เวลาเลิกงาน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField
                label="1. ลำดับที่ (รันอัตโนมัติ)"
                readOnly
                value={nextSequenceNumber}
                icon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                helperText="ระบบรันลำดับต่อเนื่องให้อัตโนมัติและล็อคไว้"
                className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums-thai cursor-not-allowed bg-slate-100/90 dark:bg-slate-800/80"
              />

              <DateField
                label="2. วันที่มาปฏิบัติงาน"
                requiredMark
                value={date}
                onChange={setDate}
                onSetCurrentDate={() => setDate(getCurrentDateISO())}
                error={errors.date}
              />

              <TimeField24
                label="3. เวลาเข้างาน"
                requiredMark
                value={workStartTime}
                onChange={setWorkStartTime}
                onSetCurrentTime={() => setWorkStartTime(getCurrentTime24())}
                error={errors.workStartTime}
              />

              <TimeField24
                label="4. เวลาออกงาน"
                requiredMark
                value={workEndTime}
                onChange={setWorkEndTime}
                onSetCurrentTime={() => setWorkEndTime(getCurrentTime24())}
                error={errors.workEndTime}
              />
            </div>

            {/* 5. ลายมือชื่อดิจิทัลของสมาชิกในแต่ละวัน */}
            <fieldset className="space-y-3 border-0 p-0 m-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  5. บันทึกการปฏิบัติงานและลงลายมือชื่อ ({dayTechnicianLabel} {memberCount} คน){' '}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </legend>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  เลือกสถานะ [มา / ลา / ขาด] หากขาดหรือลาไม่ต้องเซ็น ระบบจะบันทึกสถานะให้อัตโนมัติ
                </span>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  memberCount === 2 ? 'md:grid-cols-2' : 'lg:grid-cols-3'
                } gap-4`}
              >
                {Array.from({ length: memberCount }).map((_, idx) => (
                  <SignaturePadField
                    key={`${sheetKey}_sig_${idx}`}
                    label={`${dayTechnicianLabel} • คนที่ ${idx + 1}`}
                    memberName={memberNames[idx] || ''}
                    onMemberNameChange={(val) => handleMemberNameChange(idx, val)}
                    value={memberSignatures[idx] || ''}
                    onChange={(dataUrl) => handleMemberSignatureChange(idx, dataUrl)}
                    attendanceStatus={memberStatuses[idx] || 'present'}
                    onAttendanceStatusChange={(status) => handleAttendanceStatusChange(idx, status)}
                    error={errors[`sig_${idx}`]}
                  />
                ))}
              </div>
            </fieldset>

            {/* 6. หมายเหตุ */}
            <InputField
              label="6. หมายเหตุ / งานที่ดูแลในวันนี้"
              optionalText="ถ้ามี"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="เช่น ประจำจุดรับซ่อมคอมพิวเตอร์, ลงโปรแกรมห้องปฏิบัติการ, ตรวจเช็กระบบเครือข่าย..."
            />

            {/* ปุ่มบันทึกข้อมูล (รูปแบบเดียวกับฟอร์มขอรับบริการ IT Support) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                รวมเวลาปฏิบัติงาน:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {calculateDurationHours(workStartTime, workEndTime)}
                </strong>{' '}
                • แผ่นงาน <strong className="font-mono">{worksheetName}</strong>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {editingRecord && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmCancelEditOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    ยกเลิกการแก้ไข
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isSubmitting}
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintPreview}
                  className="w-full sm:w-auto"
                >
                  ตัวอย่างการพิมพ์ (A4)
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  isSuccess={isSavedSuccess}
                  successText="บันทึกสำเร็จเรียบร้อย"
                  icon={
                    editingRecord ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )
                  }
                  className="w-full sm:w-auto"
                >
                  {editingRecord
                    ? `บันทึกการแก้ไขลำดับที่ #${editingRecord.SequenceNo}`
                    : 'บันทึกเวลาปฏิบัติงาน'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </form>

      {/* ===================================================================== */}
      {/* ตารางบันทึกเวลาปฏิบัติงานและใบลงเวลารูปแบบกระดาษมาตรฐาน A4             */}
      {/* ===================================================================== */}
      <Card className="p-6 sm:p-8 print-sheet-container">
        {/* แถบเครื่องมือจัดการตาราง (ซ่อนขณะพิมพ์) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              ตารางบันทึกเวลาปฏิบัติงาน — {dayTechnicianLabel} ({records.length} รายการ)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดวางในรูปแบบใบลงเวลาปฏิบัติงานมาตรฐาน A4 พร้อมแสดงลายมือชื่อดิจิทัลของสมาชิกทั้ง{' '}
              {memberCount} คนอย่างชัดเจน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={records.length === 0}
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCSV}
            >
              ส่งออก CSV / Excel
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrintA4}
            >
              พิมพ์ใบลงเวลา (A4)
            </Button>
          </div>
        </div>

        {/* ส่วนหัวเอกสารสำหรับพิมพ์ลงกระดาษ A4 (ตามต้นฉบับใบลงเวลาการทำงาน) */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-700 pb-4 mb-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white print:text-black">
            ใบลงเวลาการทำงาน
          </h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black">
            <span>เวลาทำงาน {groupConfig.workingHoursLabel || '09:00 - 16:00'}</span>
            <span className="text-slate-400">|</span>
            <span>
              เดือน{' '}
              <span className="inline-block min-w-[100px] border-b border-slate-600 dark:border-slate-400 print:border-black px-2">
                {new Date(date || Date.now()).toLocaleDateString('th-TH', { month: 'long' })}
              </span>
            </span>
            <span>
              พ.ศ.{' '}
              <span className="inline-block min-w-[70px] border-b border-slate-600 dark:border-slate-400 print:border-black px-2 tabular-nums-thai">
                {new Date(date || Date.now()).getFullYear() + 543}
              </span>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white print:text-black mt-2">
            {groupConfig.groupNumber === 1
              ? 'ช่างวันจันทร์'
              : groupConfig.groupNumber === 2
              ? 'ช่างวันอังคาร'
              : 'ช่างวันศุกร์'}{' '}
            :{' '}
            {memberCount === 2
              ? `${memberNames[0] || groupConfig.defaultMembers[0]} และ ${
                  memberNames[1] || groupConfig.defaultMembers[1]
                }`
              : `${memberNames[0] || groupConfig.defaultMembers[0]} กับ ${
                  memberNames[1] || groupConfig.defaultMembers[1]
                } และ ${memberNames[2] || groupConfig.defaultMembers[2]}`}
          </p>
        </div>

        {/* ตารางแสดงข้อมูล (โครงสร้างครบ 6 คอลัมน์หลักตามข้อกำหนด) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs sm:text-sm print-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold w-14"
                >
                  ลำดับที่
                  <div className="text-xs font-normal text-slate-500">(No.)</div>
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-left font-bold"
                >
                  วันที่ปฏิบัติงาน
                  <div className="text-xs font-normal text-slate-500">(Date)</div>
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold"
                >
                  เวลาเริ่มงาน
                  <div className="text-xs font-normal text-slate-500">(Start Time)</div>
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold"
                >
                  เวลาเลิกงาน
                  <div className="text-xs font-normal text-slate-500">(End Time)</div>
                </th>
                <th
                  scope="colgroup"
                  colSpan={memberCount}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-bold bg-blue-50/70 dark:bg-blue-950/40"
                >
                  ลายมือชื่อผู้ปฏิบัติงาน ({dayTechnicianLabel} จำนวน {memberCount} คน)
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-left font-bold"
                >
                  หมายเหตุ
                  <div className="text-xs font-normal text-slate-500">(Remarks)</div>
                </th>
                <th
                  scope="col"
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold no-print w-24"
                >
                  จัดการ
                </th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                {Array.from({ length: memberCount }).map((_, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className="border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-center font-semibold text-xs"
                  >
                    {memberNames[idx] || `สมาชิกคนที่ ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6 + memberCount}
                    className="border border-slate-300 dark:border-slate-700 px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    ยังไม่มีข้อมูลบันทึกเวลาปฏิบัติงานของ{dayTechnicianLabel}{' '}
                    กรุณากรอกข้อมูลและลงลายมือชื่อในแบบฟอร์มด้านบนเพื่อเพิ่มรายการแรก
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => {
                  const r1 = rec as WorkTimeGroup1Record;
                  const r3 = rec as WorkTimeGroup2Or3Record;
                  const sigs =
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
                    <tr
                      key={rec.RecordID}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-mono font-bold tabular-nums-thai">
                        {rec.SequenceNo || index + 1}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 whitespace-nowrap font-medium">
                        {formatDisplayDate(rec.Date)}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-mono tabular-nums-thai whitespace-nowrap">
                        {formatDisplayTime(rec.WorkStartTime)}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-mono tabular-nums-thai whitespace-nowrap">
                        {formatDisplayTime(rec.WorkEndTime)}
                      </td>

                      {/* แสดงลายมือชื่อดิจิทัลของสมาชิกแต่ละคน หรือสถานะลา/ขาด */}
                      {sigs.map((item, sIdx) => {
                        const isLeave = item.sig === 'ลา' || item.sig === '[ลา]' || (typeof item.sig === 'string' && item.sig.trim().startsWith('ลา'));
                        const isAbsent = item.sig === 'ขาด' || item.sig === '[ขาด]' || (typeof item.sig === 'string' && (item.sig.trim().startsWith('ขาด') || item.sig.trim().startsWith('ไม่มา')));
                        const isImg = typeof item.sig === 'string' && (item.sig.startsWith('data:image/') || item.sig.startsWith('http://') || item.sig.startsWith('https://'));

                        return (
                          <td
                            key={sIdx}
                            className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center align-middle"
                          >
                            {isLeave ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 print:border-black print:text-black">
                                  ลา
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-black mt-0.5">
                                  {item.name}
                                </span>
                              </div>
                            ) : isAbsent ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-700 print:border-black print:text-black">
                                  ขาด
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 print:text-black mt-0.5">
                                  {item.name}
                                </span>
                              </div>
                            ) : isImg ? (
                              <div className="flex flex-col items-center justify-center">
                                <img
                                  src={item.sig}
                                  alt={`ลายมือชื่อ ${item.name || `สมาชิกคนที่ ${sIdx + 1}`}`}
                                  className="h-10 max-w-[110px] object-contain bg-white rounded px-1"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-400 print:text-black mt-0.5">
                                  {item.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2">
                        {rec.Remarks || '—'}
                      </td>

                      <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <IconButton
                            label={`ดูรายละเอียดรายการลำดับที่ ${rec.SequenceNo || index + 1}`}
                            variant="neutral"
                            onClick={() => setDrawerWorkRecord(rec)}
                            icon={<Eye className="w-4 h-4" />}
                          />
                          <IconButton
                            label={`แก้ไขรายการลำดับที่ ${rec.SequenceNo || index + 1}`}
                            variant="primary"
                            onClick={() => startEditingRow(rec)}
                            icon={<Edit3 className="w-4 h-4" />}
                          />
                          <IconButton
                            label={`ลบรายการลำดับที่ ${rec.SequenceNo || index + 1}`}
                            variant="danger"
                            onClick={() => requestDeleteRow(rec)}
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ส่วนลงนามรับรองสำหรับเอกสารฉบับพิมพ์ A4 */}
        <div className="mt-8 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs text-slate-600 dark:text-slate-400 print:grid-cols-2 print:text-black">
          <div>
            <p className="font-semibold">ลายมือชื่อผู้ปฏิบัติงาน ({dayTechnicianLabel} / ผู้ตรวจสอบ):</p>
            <div className="h-10 border-b border-dashed border-slate-400 max-w-xs mt-2" />
          </div>
          <div className="sm:text-right print:text-right">
            <p className="font-semibold">ลายมือชื่ออาจารย์ที่ปรึกษา / หัวหน้างาน IT Support:</p>
            <div className="h-10 border-b border-dashed border-slate-400 max-w-xs sm:ml-auto print:ml-auto mt-2" />
          </div>
        </div>
      </Card>

      {/* แถบด้านข้าง (Drawer) แสดงรายละเอียดบันทึกเวลาและลายมือชื่อดิจิทัลรายแถว */}
      <Drawer
        isOpen={Boolean(drawerWorkRecord)}
        onClose={() => setDrawerWorkRecord(null)}
        title={
          drawerWorkRecord
            ? `บันทึกเวลาลำดับที่ #${drawerWorkRecord.SequenceNo}`
            : 'รายละเอียดบันทึกเวลาปฏิบัติงาน'
        }
        subtitle={groupConfig.shiftLabel}
        icon={<Clock className="w-5 h-5" />}
        size="md"
        badge={
          <Badge variant={groupConfig.badgeColor}>
            {dayTechnicianLabel}
          </Badge>
        }
        footer={
          drawerWorkRecord && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => {
                  const target = drawerWorkRecord;
                  setDrawerWorkRecord(null);
                  startEditingRow(target);
                }}
              >
                แก้ไขรายการนี้
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => {
                  setDrawerWorkRecord(null);
                  handlePrintA4();
                }}
              >
                เปิดหน้าพิมพ์ใบลงเวลา (A4)
              </Button>
            </div>
          )
        }
      >
        {drawerWorkRecord && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>ข้อมูลวันและเวลาปฏิบัติงาน</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3.5 bg-white dark:bg-slate-900">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ลำดับที่ (Sequence No.)</div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums-thai">
                    #{drawerWorkRecord.SequenceNo}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">วันที่ปฏิบัติงาน</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {formatDisplayDate(drawerWorkRecord.Date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">เวลาเข้างาน – ออกงาน</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums-thai">
                    {formatDisplayTime(drawerWorkRecord.WorkStartTime)} –{' '}
                    {formatDisplayTime(drawerWorkRecord.WorkEndTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">รวมระยะเวลา</div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {calculateDurationHours(
                      drawerWorkRecord.WorkStartTime,
                      drawerWorkRecord.WorkEndTime
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">หมายเหตุการปฏิบัติงาน</div>
                  <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {drawerWorkRecord.Remarks || 'ไม่มีหมายเหตุเพิ่มเติม'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>ลายมือชื่อดิจิทัลของสมาชิกประจำวัน ({memberCount} คน)</span>
              </div>
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                {Array.from({ length: memberCount }).map((_, mIdx) => {
                  const anyRec = drawerWorkRecord as unknown as Record<string, string>;
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
                      {sig === 'ลา' || sig === '[ลา]' || (typeof sig === 'string' && sig.trim().startsWith('ลา')) ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 self-start sm:self-auto shrink-0">
                          สถานะ: ลาปฏิบัติงาน
                        </span>
                      ) : sig === 'ขาด' || sig === '[ขาด]' || (typeof sig === 'string' && (sig.trim().startsWith('ขาด') || sig.trim().startsWith('ไม่มา'))) ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 self-start sm:self-auto shrink-0">
                          สถานะ: ไม่มา / ขาดปฏิบัติงาน
                        </span>
                      ) : typeof sig === 'string' && (sig.startsWith('data:image/') || sig.startsWith('http://') || sig.startsWith('https://')) ? (
                        <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm self-start sm:self-auto shrink-0">
                          <img
                            src={sig}
                            alt={`ลายมือชื่อ ${name}`}
                            className="h-12 max-w-[140px] object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <Badge variant="amber" className="self-start sm:self-auto shrink-0">
                          ยังไม่ลงลายมือชื่อ
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* หน้าต่างแสดงตัวอย่างเอกสารขนาด A4 เสมือนจริงบนหน้าจอ (Responsive A4 Modal) */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(previewModalPayload)}
        mode="view-only"
        payload={previewModalPayload}
        onCancel={() => setPreviewModalPayload(null)}
      />

      {/* พอร์ทัลเอกสาร A4 ซ่อนบนหน้าจอแสดงผล 100% แต่จะแสดงเฉพาะขณะเรียก window.print() เท่านั้น */}
      <PrintDocumentPortal payload={previewModalPayload || printWorkPayload} />

      {/* หน้าต่างยืนยันการลบรายการ */}
      <ConfirmDialog
        isOpen={Boolean(recordToDelete)}
        title="ยืนยันการลบข้อมูลเวลาปฏิบัติงาน"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการลำดับที่ #${recordToDelete?.SequenceNo} ออกจากแผ่นงาน "${worksheetName}" อย่างถาวร?`}
        confirmLabel="ยืนยันการลบข้อมูล"
        cancelLabel="ยกเลิก"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />

      {/* หน้าต่างยืนยันการบันทึกเวลาปฏิบัติงาน */}
      <ConfirmDialog
        isOpen={isConfirmSubmitOpen}
        title={editingRecord ? 'ยืนยันการบันทึกการแก้ไขเวลาปฏิบัติงาน' : 'ยืนยันการบันทึกเวลาปฏิบัติงาน'}
        description={
          editingRecord
            ? `คุณต้องการบันทึกการแก้ไขเวลาปฏิบัติงาน ลำดับที่ #${editingRecord.SequenceNo} (${dayTechnicianLabel}) ใช่หรือไม่?`
            : `คุณต้องการบันทึกเวลาปฏิบัติงานประจำวัน (${dayTechnicianLabel}) วันที่ ${formatDisplayDate(date)} ใช่หรือไม่?`
        }
        confirmLabel={editingRecord ? 'ยืนยันบันทึกการแก้ไข' : 'ยืนยันบันทึกข้อมูล'}
        cancelLabel="กลับไปตรวจสอบ"
        variant={editingRecord ? 'primary' : 'success'}
        isLoading={isSubmitting}
        details={[
          { label: 'กลุ่มช่าง', value: dayTechnicianLabel },
          { label: 'วันที่ปฏิบัติงาน', value: formatDisplayDate(date) },
          { label: 'เวลาเริ่ม–เลิกงาน', value: `${workStartTime} - ${workEndTime} น.` },
          { label: 'ผู้ปฏิบัติงาน', value: memberNames.filter(Boolean).join(', ') },
        ]}
        onConfirm={async () => {
          setIsConfirmSubmitOpen(false);
          const draft = buildDraftWorkTimeRecord();
          await executeSaveWorkRecord(draft, false);
        }}
        onCancel={() => setIsConfirmSubmitOpen(false)}
      />

      {/* หน้าต่างยืนยันการเปิดแก้ไขบันทึกเวลาปฏิบัติงาน */}
      <ConfirmDialog
        isOpen={Boolean(recordToEdit)}
        title="ยืนยันการเปิดแก้ไขข้อมูลลงเวลา"
        description={`คุณต้องการเปิดแบบฟอร์มเพื่อแก้ไขข้อมูลเวลาปฏิบัติงาน ลำดับที่ #${recordToEdit?.SequenceNo} วันที่ ${formatDisplayDate(recordToEdit?.Date || '')} ใช่หรือไม่?`}
        confirmLabel="ยืนยันเปิดแก้ไข"
        cancelLabel="ยกเลิก"
        variant="primary"
        onConfirm={() => {
          if (recordToEdit) {
            executeDoEdit(recordToEdit);
            setRecordToEdit(null);
          }
        }}
        onCancel={() => setRecordToEdit(null)}
      />

      {/* หน้าต่างยืนยันการยกเลิกการแก้ไข */}
      <ConfirmDialog
        isOpen={isConfirmCancelEditOpen}
        title="ยืนยันการยกเลิกการแก้ไข"
        description="คุณต้องการยกเลิกการแก้ไขและกลับสู่หน้าแบบฟอร์มปกติใช่หรือไม่? ข้อมูลที่แก้ไขจะถูกรีเซ็ต"
        confirmLabel="ยืนยันยกเลิก"
        cancelLabel="แก้ไขต่อ"
        variant="danger"
        onConfirm={() => {
          setIsConfirmCancelEditOpen(false);
          setEditingRecord(null);
          setRemarks('');
          setMemberSignatures(Array(memberCount).fill(''));
          setMemberStatuses(Array(memberCount).fill('present'));
          if (onCancelEdit) onCancelEdit();
        }}
        onCancel={() => setIsConfirmCancelEditOpen(false)}
      />
    </div>
  );
};
