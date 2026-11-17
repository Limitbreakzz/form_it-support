import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  Lock,
  PlusCircle,
  Printer,
  Save,
  Trash2,
  Unlock,
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
} from '../utils/formatters';
import { SignaturePadField } from './SignaturePadField';
import { ConfirmDialog } from './ConfirmDialog';
import { PaperDocumentPreviewModal } from './PaperDocumentPreviewModal';
import { Badge, Button, Card, InputField } from './ui/DesignSystem';

interface WorkTimeGroupFormProps {
  groupConfig: GroupConfig;
  records: AnyWorkTimeRecord[];
  isAuthorized: boolean;
  onRequestAuthorization: (reason: string, callback: () => void) => void;
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
  isAuthorized,
  onRequestAuthorization,
  onSaveWorkRecord,
  onDeleteWorkRecord,
  onBackToDashboard,
}) => {
  const { id: sheetKey, groupNumber, memberCount, worksheetName } = groupConfig;
  const memberStorageKey = `it_support_member_names_${sheetKey}_v1`;

  const getInitialNames = (): string[] => {
    try {
      const saved = localStorage.getItem(memberStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === memberCount) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return groupConfig.defaultMembers;
  };

  const [date, setDate] = useState<string>(() => getCurrentDateISO());
  const [workStartTime, setWorkStartTime] = useState<string>('08:30');
  const [workEndTime, setWorkEndTime] = useState<string>('17:30');
  const [remarks, setRemarks] = useState<string>('');

  const [memberNames, setMemberNames] = useState<string[]>(getInitialNames);
  const [memberSignatures, setMemberSignatures] = useState<string[]>(() =>
    Array(memberCount).fill('')
  );

  const [editingRecord, setEditingRecord] = useState<AnyWorkTimeRecord | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDraftWorkRecord, setPreviewDraftWorkRecord] =
    useState<AnyWorkTimeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AnyWorkTimeRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setEditingRecord(null);
    setDate(getCurrentDateISO());
    setWorkStartTime('08:30');
    setWorkEndTime('17:30');
    setRemarks('');
    setMemberNames(getInitialNames());
    setMemberSignatures(Array(memberCount).fill(''));
    setErrors({});
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetKey, memberCount]);

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

  const startEditingRow = (rec: AnyWorkTimeRecord) => {
    const doEdit = () => {
      setEditingRecord(rec);
      setDate(rec.Date ? rec.Date.split('T')[0] : getCurrentDateISO());
      setWorkStartTime(rec.WorkStartTime ? rec.WorkStartTime.slice(0, 5) : '08:30');
      setWorkEndTime(rec.WorkEndTime ? rec.WorkEndTime.slice(0, 5) : '17:30');
      setRemarks(rec.Remarks || '');

      if (memberCount === 2) {
        const r1 = rec as WorkTimeGroup1Record;
        setMemberNames([
          r1.Member1Name || 'สมาชิกคนที่ 1',
          r1.Member2Name || 'สมาชิกคนที่ 2',
        ]);
        setMemberSignatures([r1.Member1Signature || '', r1.Member2Signature || '']);
      } else {
        const r3 = rec as WorkTimeGroup2Or3Record;
        setMemberNames([
          r3.Member1Name || 'สมาชิกคนที่ 1',
          r3.Member2Name || 'สมาชิกคนที่ 2',
          r3.Member3Name || 'สมาชิกคนที่ 3',
        ]);
        setMemberSignatures([
          r3.Member1Signature || '',
          r3.Member2Signature || '',
          r3.Member3Signature || '',
        ]);
      }
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isAuthorized) {
      doEdit();
    } else {
      onRequestAuthorization(
        `ต้องการสิทธิ์เพื่อแก้ไขรายการลำดับที่ #${rec.SequenceNo} ในแผ่นงาน ${worksheetName}`,
        doEdit
      );
    }
  };

  const requestDeleteRow = (rec: AnyWorkTimeRecord) => {
    if (isAuthorized) {
      setRecordToDelete(rec);
    } else {
      onRequestAuthorization(
        `ต้องการสิทธิ์เพื่อลบรายการลำดับที่ #${rec.SequenceNo} จากแผ่นงาน ${worksheetName}`,
        () => setRecordToDelete(rec)
      );
    }
  };

  const validateEntry = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!date.trim()) nextErrors.date = 'กรุณาระบุวันที่ปฏิบัติงาน';
    if (!workStartTime.trim()) nextErrors.workStartTime = 'กรุณาระบุเวลาเริ่มปฏิบัติงาน';
    if (!workEndTime.trim()) nextErrors.workEndTime = 'กรุณาระบุเวลาสิ้นสุดการปฏิบัติงาน';

    for (let i = 0; i < memberCount; i++) {
      if (!memberNames[i]?.trim()) {
        nextErrors[`sig_${i}`] = `กรุณาระบุชื่อ-นามสกุลของสมาชิกคนที่ ${i + 1}`;
      } else if (!memberSignatures[i]) {
        nextErrors[`sig_${i}`] = `กรุณาลงลายมือชื่อดิจิทัลสำหรับ ${memberNames[i]}`;
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

    if (memberCount === 2) {
      const group1Record: WorkTimeGroup1Record = {
        RecordID: editingRecord ? editingRecord.RecordID : generateRecordId(),
        SequenceNo: sequenceNo,
        Date: date.trim(),
        WorkStartTime: workStartTime.trim(),
        WorkEndTime: workEndTime.trim(),
        Member1Name: memberNames[0].trim(),
        Member1Signature: memberSignatures[0],
        Member2Name: memberNames[1].trim(),
        Member2Signature: memberSignatures[1],
        Remarks: remarks.trim(),
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
        Member1Signature: memberSignatures[0],
        Member2Name: memberNames[1].trim(),
        Member2Signature: memberSignatures[1],
        Member3Name: memberNames[2].trim(),
        Member3Signature: memberSignatures[2],
        Remarks: remarks.trim(),
        CreatedAt: editingRecord ? editingRecord.CreatedAt : nowIso,
        UpdatedAt: nowIso,
      };
      return group2Or3Record;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!validateEntry()) return;
    // แสดงตัวอย่างเอกสารขนาด A4 (Paper-Style Document Preview) ก่อนยืนยันการบันทึกข้อมูล
    setPreviewDraftWorkRecord(buildDraftWorkTimeRecord());
  };

  const handleConfirmSave = async () => {
    if (isSubmitting || !previewDraftWorkRecord) return;
    setIsSubmitting(true);
    setFeedback(null);

    const payload = previewDraftWorkRecord;
    const sequenceNo = payload.SequenceNo;

    try {
      const res = await onSaveWorkRecord(sheetKey, payload, Boolean(editingRecord));
      setPreviewDraftWorkRecord(null);
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'ไม่สามารถบันทึกข้อมูลเวลาปฏิบัติงานได้',
        });
        return;
      }

      setFeedback({
        type: 'success',
        message: res.syncedToCloud
          ? `บันทึกรายการลำดับที่ #${sequenceNo} ลงในแผ่นงาน Google Sheets "${worksheetName}" สำเร็จแล้ว`
          : `บันทึกรายการลำดับที่ #${sequenceNo} ลงในระบบสำรองสำหรับแผ่นงาน "${worksheetName}" เรียบร้อยแล้ว`,
      });

      setEditingRecord(null);
      setRemarks('');
      setMemberSignatures(Array(memberCount).fill(''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onDeleteWorkRecord(sheetKey, recordToDelete.RecordID);
      setRecordToDelete(null);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `ลบรายการและปรับปรุงลำดับที่ (No.) ใหม่ในแผ่นงาน "${worksheetName}" เรียบร้อยแล้ว`,
        });
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

    exportToExcelCSV(`Work_Time_Group_${groupNumber}`, headers, rows);
  };

  const handlePrintA4 = () => {
    window.print();
  };

  const nextSequenceNumber = editingRecord ? editingRecord.SequenceNo : String(records.length + 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* แถบนำทางและป้ายระบุแผ่นงาน (ซ่อนขณะพิมพ์) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับสู่หน้าแดชบอร์ดหลัก
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={groupConfig.badgeColor} icon={<Users className="w-3.5 h-3.5" />}>
            กลุ่มที่ {groupNumber} (สมาชิก {memberCount} คน)
          </Badge>
          <Badge variant="emerald" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
            แผ่นงาน: {worksheetName}
          </Badge>
        </div>
      </div>

      {/* แจ้งเตือนผลการบันทึก */}
      {feedback && (
        <div
          role="alert"
          className={`rounded-2xl p-4 border flex items-center gap-3 text-sm font-medium no-print ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* แบบฟอร์มบันทึกเวลาปฏิบัติงานรายวัน (ซ่อนขณะพิมพ์เพื่อให้พิมพ์เฉพาะตาราง A4) */}
      <form onSubmit={handleFormSubmit} noValidate className="no-print">
        <Card className="overflow-hidden">
          <div className="px-6 sm:px-8 py-6 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {groupConfig.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {groupConfig.subtitle}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-left sm:text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ลำดับที่ (Sequence No.)
              </div>
              <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums-thai">
                #{nextSequenceNumber}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* 1. ลำดับที่, 2. วันที่, 3. เวลาเริ่มงาน, 4. เวลาเลิกงาน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <InputField
                label="1. ลำดับที่ (No. อัตโนมัติ)"
                readOnly
                value={nextSequenceNumber}
                className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums-thai"
              />

              <InputField
                label="2. วันที่ปฏิบัติงาน"
                type="date"
                requiredMark
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
              />

              <InputField
                label="3. เวลาเริ่มปฏิบัติงาน"
                type="time"
                requiredMark
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                error={errors.workStartTime}
                className="font-mono tabular-nums-thai"
              />

              <InputField
                label="4. เวลาสิ้นสุดปฏิบัติงาน"
                type="time"
                requiredMark
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                error={errors.workEndTime}
                className="font-mono tabular-nums-thai"
              />
            </div>

            {/* 5. ลายมือชื่อดิจิทัลของสมาชิกในกลุ่ม (2 คนสำหรับกลุ่ม 1, 3 คนสำหรับกลุ่ม 2 และ 3) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  5. ลายมือชื่อดิจิทัลของสมาชิกกลุ่มที่ {groupNumber} (ครบทั้ง {memberCount} คน){' '}
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  สามารถวาดลายเซ็นบนหน้าจอ หรืออัปโหลดไฟล์รูปภาพลายมือชื่อได้
                </span>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  memberCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                } gap-4`}
              >
                {Array.from({ length: memberCount }).map((_, idx) => (
                  <SignaturePadField
                    key={`${sheetKey}_sig_${idx}`}
                    label={`กลุ่มที่ ${groupNumber} • สมาชิกคนที่ ${idx + 1}`}
                    memberName={memberNames[idx] || ''}
                    onMemberNameChange={(val) => handleMemberNameChange(idx, val)}
                    value={memberSignatures[idx] || ''}
                    onChange={(dataUrl) => handleMemberSignatureChange(idx, dataUrl)}
                    error={errors[`sig_${idx}`]}
                  />
                ))}
              </div>
            </div>

            {/* 6. หมายเหตุ */}
            <InputField
              label="6. หมายเหตุ / รายละเอียดงานที่ปฏิบัติในกะนี้ (Remarks)"
              optionalText="ไม่บังคับ"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="เช่น ดูแลห้องปฏิบัติการคอมพิวเตอร์, ตรวจสอบระบบเครือข่าย, ให้บริการประจำจุด Helpdesk..."
            />

            {/* ปุ่มบันทึกข้อมูล */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                รวมระยะเวลาปฏิบัติงาน:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {calculateDurationHours(workStartTime, workEndTime)}
                </strong>{' '}
                • บันทึกลงแผ่นงาน <strong className="font-mono">{worksheetName}</strong>
              </div>

              <div className="flex items-center gap-3">
                {editingRecord && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingRecord(null);
                      setRemarks('');
                      setMemberSignatures(Array(memberCount).fill(''));
                    }}
                  >
                    ยกเลิกการแก้ไข
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  icon={
                    editingRecord ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )
                  }
                >
                  {editingRecord
                    ? `บันทึกการแก้ไขแถวที่ #${editingRecord.SequenceNo}`
                    : 'เพิ่มรายการบันทึกเวลาปฏิบัติงาน'}
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
              ตารางบันทึกเวลาปฏิบัติงาน — กลุ่มที่ {groupNumber} ({records.length} รายการ)
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
              icon={
                isAuthorized ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )
              }
              onClick={() =>
                onRequestAuthorization(
                  'ปลดล็อกสิทธิ์การแก้ไขและลบข้อมูลในตารางบันทึกเวลาปฏิบัติงาน',
                  () => {}
                )
              }
            >
              {isAuthorized ? 'ปลดล็อกแก้ไข/ลบแล้ว' : 'ปลดล็อกแก้ไข/ลบ'}
            </Button>

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
              variant="primary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrintA4}
            >
              พิมพ์ใบลงเวลา (A4)
            </Button>
          </div>
        </div>

        {/* ส่วนหัวเอกสารสำหรับพิมพ์ลงกระดาษ A4 */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-700 pb-4 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white print:text-black">
            แบบบันทึกเวลาปฏิบัติงานทีม IT Support — กลุ่มที่ {groupNumber}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
            แผ่นงาน Google Sheets: <strong className="font-mono">{worksheetName}</strong> •
            จำนวนสมาชิกในกลุ่ม: {memberCount} คน
          </p>
        </div>

        {/* ตารางแสดงข้อมูล (โครงสร้างครบ 6 คอลัมน์หลักตามข้อกำหนด) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs sm:text-sm print-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <th
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold w-14"
                >
                  ลำดับที่
                  <div className="text-xs font-normal text-slate-500">(No.)</div>
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-left font-bold"
                >
                  วันที่ปฏิบัติงาน
                  <div className="text-xs font-normal text-slate-500">(Date)</div>
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold"
                >
                  เวลาเริ่มงาน
                  <div className="text-xs font-normal text-slate-500">(Start Time)</div>
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center font-bold"
                >
                  เวลาเลิกงาน
                  <div className="text-xs font-normal text-slate-500">(End Time)</div>
                </th>
                <th
                  colSpan={memberCount}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-bold bg-blue-50/70 dark:bg-blue-950/40"
                >
                  ลายมือชื่อผู้ปฏิบัติงาน (สมาชิกกลุ่มที่ {groupNumber} จำนวน {memberCount} คน)
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-left font-bold"
                >
                  หมายเหตุ
                  <div className="text-xs font-normal text-slate-500">(Remarks)</div>
                </th>
                <th
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
                    ยังไม่มีข้อมูลบันทึกเวลาปฏิบัติงานของกลุ่มที่ {groupNumber}{' '}
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
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-mono tabular-nums-thai">
                        {formatDisplayTime(rec.WorkStartTime)}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2 text-center font-mono tabular-nums-thai">
                        {formatDisplayTime(rec.WorkEndTime)}
                      </td>

                      {/* แสดงลายมือชื่อดิจิทัลของสมาชิกแต่ละคน */}
                      {sigs.map((item, sIdx) => (
                        <td
                          key={sIdx}
                          className="border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-center align-middle"
                        >
                          {item.sig ? (
                            <div className="flex flex-col items-center justify-center">
                              <img
                                src={item.sig}
                                alt={`ลายมือชื่อ ${item.name || `สมาชิกคนที่ ${sIdx + 1}`}`}
                                className="h-10 max-w-[110px] object-contain bg-white rounded px-1"
                              />
                              <span className="text-xs text-slate-500 dark:text-slate-400 print:text-black mt-0.5">
                                {item.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>
                      ))}

                      <td className="border border-slate-300 dark:border-slate-700 px-3 py-2">
                        {rec.Remarks || '—'}
                      </td>

                      <td className="border border-slate-300 dark:border-slate-700 px-2 py-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingRow(rec)}
                            title="แก้ไขรายการนี้"
                            aria-label={`แก้ไขรายการลำดับที่ ${rec.SequenceNo || index + 1}`}
                            className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 transition"
                          >
                            <Edit3 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteRow(rec)}
                            title="ลบรายการนี้"
                            aria-label={`ลบรายการลำดับที่ ${rec.SequenceNo || index + 1}`}
                            className="p-2 min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60 transition"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
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
        <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs text-slate-600 dark:text-slate-400 print:text-black">
          <div>
            <p className="font-semibold">ลายมือชื่อหัวหน้ากลุ่มที่ {groupNumber} (ผู้ตรวจสอบ):</p>
            <div className="h-10 border-b border-dashed border-slate-400 max-w-xs mt-2" />
          </div>
          <div className="text-right">
            <p className="font-semibold">ลายมือชื่ออาจารย์ที่ปรึกษา / หัวหน้างาน IT Support:</p>
            <div className="h-10 border-b border-dashed border-slate-400 max-w-xs ml-auto mt-2" />
          </div>
        </div>
      </Card>

      {/* หน้าต่างแสดงตัวอย่างเอกสารกระดาษ A4 ก่อนยืนยันการบันทึกเวลาปฏิบัติงาน */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(previewDraftWorkRecord)}
        mode="pre-submit"
        payload={
          previewDraftWorkRecord
            ? {
                type: 'work-time',
                groupConfig,
                pendingRecord: previewDraftWorkRecord,
                allRecordsWithPending: editingRecord
                  ? records.map((r) =>
                      r.RecordID === previewDraftWorkRecord.RecordID
                        ? previewDraftWorkRecord
                        : r
                    )
                  : [...records, previewDraftWorkRecord],
                memberNames,
                isEdit: Boolean(editingRecord),
              }
            : null
        }
        isSubmitting={isSubmitting}
        onConfirmAndSubmit={handleConfirmSave}
        onEditInformation={() => setPreviewDraftWorkRecord(null)}
        onCancel={() => setPreviewDraftWorkRecord(null)}
      />

      {/* หน้าต่างยืนยันการลบรายการ */}
      <ConfirmDialog
        isOpen={Boolean(recordToDelete)}
        title="ยืนยันการลบข้อมูลเวลาปฏิบัติงาน"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการลำดับที่ #${recordToDelete?.SequenceNo} ออกจากแผ่นงาน "${worksheetName}" อย่างถาวร?`}
        confirmLabel="ยืนยันการลบข้อมูล"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
};
