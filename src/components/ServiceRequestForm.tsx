import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Eye,
  FileSpreadsheet,
  FileText,
  Lock,
  Printer,
  RefreshCw,
  Save,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  ACKNOWLEDGMENT_ITEMS,
  calculateEstimatedServiceCost,
  DEVICE_TYPE_LABELS_TH,
  DeviceType,
  getAllTechnicians,
  getDeviceTypeThaiLabel,
  SERVICE_CATALOG,
  ServiceRequestRecord,
} from '../types';
import {
  formatDisplayDate,
  generateRecordId,
  generateUniqueReceiptNumber,
  getCurrentDateISO,
  getCurrentTime24,
  parseServicesList,
} from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';
import {
  PaperDocumentPreviewModal,
  PaperPreviewPayload,
  PrintDocumentPortal,
} from './PaperDocumentPreviewModal';
import {
  Badge,
  Button,
  Card,
  DateField,
  FormSection,
  InputField,
  SelectField,
  TextareaField,
  TimeField24,
  toast,
} from './ui/DesignSystem';

interface ServiceRequestFormProps {
  existingRecords: ServiceRequestRecord[];
  editingRecord?: ServiceRequestRecord | null;
  onCancelEdit?: () => void;
  onSaveRecord: (
    record: ServiceRequestRecord,
    isEdit: boolean
  ) => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  onBackToDashboard: () => void;
}

const PRIMARY_DEVICE_TYPES: { key: DeviceType; label: string }[] = [
  { key: 'Hardware', label: 'ตัวเครื่อง / อุปกรณ์ (ฮาร์ดแวร์)' },
  { key: 'Software', label: 'โปรแกรม / ระบบ (ซอฟต์แวร์)' },
  { key: 'Other', label: 'อุปกรณ์อื่น ๆ (ระบุเอง)' },
];

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  existingRecords,
  editingRecord,
  onCancelEdit,
  onSaveRecord,
  onBackToDashboard,
}) => {
  const existingReceiptNumbers = existingRecords.map((r) => r.ReceiptNumber);

  // ข้อมูลเลขที่ใบรับบริการและวันเวลา
  const [receiptNumber, setReceiptNumber] = useState<string>(() =>
    generateUniqueReceiptNumber(existingReceiptNumbers)
  );
  const [date, setDate] = useState<string>(() => getCurrentDateISO());
  const [time, setTime] = useState<string>('09:00');

  // 1. ข้อมูลผู้ขอรับบริการและเจ้าหน้าที่ผู้รับเรื่อง
  const technicianOptions = React.useMemo(() => getAllTechnicians(), []);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [receiverName, setReceiverName] = useState('');

  // 2. ข้อมูลอุปกรณ์และรายละเอียดปัญหา
  const [deviceType, setDeviceType] = useState<DeviceType | ''>('');
  const [otherDeviceInputRef] = useState(() => React.createRef<HTMLInputElement>());
  const [deviceBrandModel, setDeviceBrandModel] = useState('');
  const [otherDeviceText, setOtherDeviceText] = useState('');
  const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // 3. เลือกบริการที่ต้องการ (เลือกได้มากกว่า 1 รายการ)
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [otherServiceText, setOtherServiceText] = useState('');
  const [additionalDetailsText, setAdditionalDetailsText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');

  // 4. การยืนยันก่อนให้บริการและการรับทราบ
  const [acknowledgedItems, setAcknowledgedItems] = useState<boolean[]>([true, true, true]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [printRecord, setPrintRecord] = useState<ServiceRequestRecord | null>(null);
  const [previewModalPayload, setPreviewModalPayload] = useState<PaperPreviewPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isConfirmCancelEditOpen, setIsConfirmCancelEditOpen] = useState(false);
  const [submittedReceiptRecord, setSubmittedReceiptRecord] =
    useState<ServiceRequestRecord | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const softwareServices = SERVICE_CATALOG.filter((s) => s.category === 'software');
  const hardwareServices = SERVICE_CATALOG.filter((s) => s.category === 'hardware');

  useEffect(() => {
    if (editingRecord) {
      setReceiptNumber(editingRecord.ReceiptNumber);
      setDate(editingRecord.Date ? editingRecord.Date.split('T')[0] : getCurrentDateISO());
      setTime(editingRecord.Time ? editingRecord.Time.slice(0, 5) : '09:00');
      setFullName(editingRecord.FullName);
      setPhoneNumber(editingRecord.PhoneNumber);
      setDepartment(editingRecord.Department || '');
      setReceiverName(editingRecord.ReceiverName || '');
      setDeviceType((editingRecord.DeviceType as DeviceType) || '');
      if (editingRecord.OtherDeviceText) {
        setOtherDeviceText(editingRecord.OtherDeviceText);
        setDeviceBrandModel(editingRecord.DeviceBrandModel || '');
      } else {
        const raw = editingRecord.DeviceBrandModel || '';
        const m = raw.match(/^อุปกรณ์อื่น ๆ:\s*(.*?)\s*\|\s*(.*)$/);
        setOtherDeviceText(m ? m[1] : '');
        setDeviceBrandModel(m ? m[2] : raw);
      }
      setDeviceSerialNumber(editingRecord.DeviceSerialNumber || '');
      setProblemDescription(editingRecord.ProblemDescription);
      // ดึงเฉพาะตัวเลขจาก AdditionalDetails เพื่อให้ช่องแก้ไขรับเฉพาะตัวเลข และไม่สะสมคำว่า 'บาท' ซ้ำซ้อน
      const rawCost = editingRecord.AdditionalDetails || '';
      const costMatch = rawCost.match(/\d+/);
      setEstimatedCost(costMatch ? costMatch[0] : '');

      const parsedServices = parseServicesList(editingRecord.RequestedServices);
      // กรอง 'Other' ออกจาก selectedServices เสมอ เพื่อให้ selectedServices มีเฉพาะ 10 รายการในแคตตาล็อก
      setSelectedServices(parsedServices.filter((s) => s !== 'Other'));

      const rawOther = editingRecord.OtherServiceText || '';
      if (rawOther && rawOther !== '-') {
        const match = rawOther.match(/^บริการอื่น:\s*(.*?)\s*\|\s*รายละเอียด:\s*(.*)$/);
        if (match) {
          setOtherServiceText(match[1]);
          setAdditionalDetailsText(match[2]);
        } else if (rawOther.startsWith('รายละเอียด:')) {
          setOtherServiceText('');
          setAdditionalDetailsText(rawOther.replace(/^รายละเอียด:\s*/, ''));
        } else if (rawOther.startsWith('บริการอื่น:')) {
          setOtherServiceText(rawOther.replace(/^บริการอื่น:\s*/, ''));
          setAdditionalDetailsText('');
        } else {
          // หากเป็นข้อความเดิมจากระบบเวอร์ชันก่อนหน้า
          if (parsedServices.includes('Other')) {
            setOtherServiceText(rawOther);
            setAdditionalDetailsText('');
          } else {
            setOtherServiceText('');
            setAdditionalDetailsText(rawOther);
          }
        }
      } else {
        setOtherServiceText('');
        setAdditionalDetailsText('');
      }

      setErrors({});
    }
  }, [editingRecord]);

  const toggleServiceCheckbox = (serviceKey: string) => {
    setSelectedServices((prev) => {
      const next = prev.includes(serviceKey)
        ? prev.filter((item) => item !== serviceKey)
        : [...prev, serviceKey];
      const autoSum = calculateEstimatedServiceCost(next);
      setEstimatedCost(autoSum > 0 ? String(autoSum) : next.length > 0 ? '0' : '');
      return next;
    });
    if (errors.selectedServices) {
      setErrors((prev) => ({ ...prev, selectedServices: '' }));
    }
  };

  const toggleAcknowledgment = (idx: number) => {
    setAcknowledgedItems((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleRegenerateReceipt = () => {
    if (editingRecord) return;
    setReceiptNumber(generateUniqueReceiptNumber(existingReceiptNumbers));
    setTime('09:00');
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!receiptNumber.trim()) {
      nextErrors.receiptNumber = 'ยังไม่มีเลขที่ใบรับบริการ กรุณากดปุ่ม "สร้างเลขใบรับบริการใหม่"';
    }
    if (!date.trim()) {
      nextErrors.date = 'กรุณาเลือกวันที่นำอุปกรณ์มารับบริการ';
    }
    if (!time.trim()) {
      nextErrors.time = 'กรุณาระบุเวลาที่นำอุปกรณ์มารับบริการ';
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      nextErrors.time = 'กรุณากรอกเวลาแบบ 24 ชั่วโมง เช่น 09:30 หรือ 19:42';
    }
    if (!deviceType) {
      nextErrors.deviceType = 'กรุณาเลือกประเภทอุปกรณ์';
    }
    if (deviceType === 'Other' && !otherDeviceText.trim()) {
      nextErrors.otherDeviceText = 'กรุณาระบุประเภทอุปกรณ์อื่น ๆ';
    }
    if (!fullName.trim()) {
      nextErrors.fullName = 'กรุณากรอกชื่อ–นามสกุล เพื่อให้ช่างติดต่อแจ้งผลการซ่อมได้ถูกต้อง';
    }
    if (!phoneNumber.trim()) {
      nextErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้ เช่น 081-234-5678';
    } else if (!/^[0-9+\-() ]{6,20}$/.test(phoneNumber.trim())) {
      nextErrors.phoneNumber = 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอกเฉพาะตัวเลข 9–10 หลัก เช่น 081-234-5678';
    }
    if (!receiverName.trim()) {
      nextErrors.receiverName = 'กรุณาเลือกช่าง IT Support ผู้รับเรื่อง (จากทั้ง 7 คน)';
    }
    if (!deviceBrandModel.trim()) {
      nextErrors.deviceBrandModel = 'กรุณาระบุยี่ห้อและรุ่นของอุปกรณ์ เช่น โน้ตบุ๊ก Asus หรือ PC ตั้งโต๊ะ';
    }
    if (!problemDescription.trim()) {
      nextErrors.problemDescription = 'กรุณาอธิบายอาการเสียหรือปัญหาที่พบ เช่น เปิดไม่ติด จอฟ้า หรือเครื่องช้า';
    }
    const hasAnySelected = selectedServices.length > 0;
    const hasOtherService = otherServiceText.trim() !== '' && otherServiceText.trim() !== '-';
    if (!hasAnySelected && !hasOtherService) {
      nextErrors.selectedServices = 'กรุณาเลือกบริการที่ต้องการอย่างน้อย 1 รายการ หรือพิมพ์ระบุในช่อง "บริการอื่น ๆ"';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCurrentDraftRecord = (): ServiceRequestRecord => {
    const nowIso = new Date().toISOString();
    const cleanOther = otherServiceText.trim();
    const cleanDetails = additionalDetailsText.trim();

    // กรอง 'Other' ออกจาก selectedServices เสมอ เพื่อไม่ให้มี 'Other' แฝงอยู่โดยไม่ตั้งใจ
    const finalServices = selectedServices.filter((s) => s !== 'Other');
    
    // เพิ่ม 'Other' ใน RequestedServices ก็ต่อเมื่อผู้ใช้กรอกช่อง "บริการอื่น ๆ" จริง ๆ เท่านั้น
    const hasOther = cleanOther !== '' && cleanOther !== '-';
    if (hasOther) {
      finalServices.push('Other');
    }

    const cleanCostNum = estimatedCost.replace(/[^0-9]/g, '').trim();
    const computedCost =
      cleanCostNum !== ''
        ? `${cleanCostNum} บาท`
        : `${calculateEstimatedServiceCost(finalServices)} บาท`;

    const cleanPhone = phoneNumber.trim().replace(/^'+/, '');
    const normalizedPhone = cleanPhone
      ? (/^[689]\d{8}$/.test(cleanPhone) ? `0${cleanPhone}` : cleanPhone)
      : '-';

    // จัดรูปแบบ OtherServiceText ให้เก็บทั้งบริการอื่นและรายละเอียดเพิ่มเติมอย่างเป็นระเบียบ
    let combinedOtherText = '-';
    if (hasOther && cleanDetails) {
      combinedOtherText = `บริการอื่น: ${cleanOther} | รายละเอียด: ${cleanDetails}`;
    } else if (hasOther) {
      combinedOtherText = cleanOther;
    } else if (cleanDetails) {
      combinedOtherText = `รายละเอียด: ${cleanDetails}`;
    }

    return {
      RecordID: editingRecord ? editingRecord.RecordID : generateRecordId(),
      ReceiptNumber: receiptNumber.trim(),
      Date: date.trim(),
      Time: time.trim(),
      FullName: fullName.trim(),
      PhoneNumber: normalizedPhone,
      Department: department.trim() || '-',
      DeviceType: deviceType as DeviceType,
      OtherDeviceText: deviceType === 'Other' ? (otherDeviceText.trim() || '-') : '-',
      DeviceBrandModel: deviceBrandModel.trim() || '-',
      DeviceSerialNumber: deviceSerialNumber.trim() || '-',
      ProblemDescription: problemDescription.trim() || '-',
      AdditionalDetails: computedCost,
      RequestedServices: JSON.stringify(finalServices),
      OtherServiceText: combinedOtherText,
      ReceiverName: receiverName.trim() || '-',
      CreatedAt: editingRecord ? editingRecord.CreatedAt : nowIso,
      UpdatedAt: nowIso,
    };
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerFeedback(null);
    if (!validateForm()) {
      toast.error('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }
    // แสดงหน้าต่างยืนยันก่อนบันทึกข้อมูลทุกครั้ง
    setIsConfirmSubmitOpen(true);
  };

  const handlePrintPreview = () => {
    setBannerFeedback(null);
    if (!validateForm()) {
      toast.error('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วนก่อนดูตัวอย่างการพิมพ์');
      return;
    }
    const draft = buildCurrentDraftRecord();
    setPrintRecord(draft);
    setPreviewModalPayload({
      type: 'service-request',
      record: draft,
      isEdit: Boolean(editingRecord),
    });
  };

  const executeSaveRecord = async (
    recordToSave: ServiceRequestRecord,
    shouldPrintImmediately: boolean
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setBannerFeedback(null);

    try {
      const result = await onSaveRecord(recordToSave, Boolean(editingRecord));

      if (!result.success) {
        const errorMsg =
          result.error ||
          'ไม่สามารถบันทึกใบแจ้งซ่อมได้ในขณะนี้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง';
        setBannerFeedback({
          type: 'error',
          message: errorMsg,
        });
        toast.error(errorMsg);
        return;
      }

      const successMessage = result.syncedToCloud
        ? `ส่งใบแจ้งซ่อมเลขที่ ${recordToSave.ReceiptNumber} เรียบร้อยแล้ว ข้อมูลถูกบันทึกเข้าระบบออนไลน์พร้อมพิมพ์ใบรับบริการ`
        : `บันทึกใบแจ้งซ่อมเลขที่ ${recordToSave.ReceiptNumber} ไว้ในเครื่องเรียบร้อยแล้ว ระบบจะอัปเดตขึ้นออนไลน์อัตโนมัติเมื่อเชื่อมต่ออินเทอร์เน็ต`;

      setSubmittedReceiptRecord(recordToSave);
      setPrintRecord(recordToSave);
      setBannerFeedback({
        type: 'success',
        message: successMessage,
      });

      // แจ้งเตือน Tactile & Visual Feedback ทั้งบนปุ่ม และ Toast Notification ทันที
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);

      toast.success(
        `ใบรับบริการเลขที่ ${recordToSave.ReceiptNumber} (${recordToSave.FullName || 'ไม่ระบุชื่อ'})`,
        {
          title: editingRecord ? 'บันทึกการแก้ไขเรียบร้อย' : 'บันทึกและออกใบรับบริการสำเร็จ',
          action: {
            label: 'พิมพ์ใบรับบริการ (A4)',
            onClick: () => {
              setPreviewModalPayload({
                type: 'service-request',
                record: recordToSave,
                isEdit: Boolean(editingRecord),
              });
            },
          },
        }
      );

      if (!editingRecord) {
        const updatedReceipts = [...existingReceiptNumbers, recordToSave.ReceiptNumber];
        setReceiptNumber(generateUniqueReceiptNumber(updatedReceipts));
        setDate(getCurrentDateISO());
        setTime('09:00');
        setFullName('');
        setPhoneNumber('');
        setDepartment('');
        setReceiverName('');
        setDeviceType('');
        setDeviceBrandModel('');
        setOtherDeviceText('');
        setDeviceSerialNumber('');
        setProblemDescription('');
        setEstimatedCost('');
        setSelectedServices([]);
        setOtherServiceText('');
        setAdditionalDetailsText('');
      }

      if (shouldPrintImmediately) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* แถบนำทางด้านบน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="min-h-[40px] px-2.5 py-1.5 -ml-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>กลับหน้าหลัก</span>
        </button>

        <Badge variant="emerald" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
          บันทึกข้อมูลและออกใบรับบริการขนาด A4 อัตโนมัติ
        </Badge>
      </div>

      {/* แจ้งเตือนสถานะการบันทึก */}
      {bannerFeedback && (
        <div
          role="alert"
          className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 ${
            bannerFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {bannerFeedback.type === 'success' ? (
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
            <span>{bannerFeedback.message}</span>
          </div>

          {submittedReceiptRecord && bannerFeedback.type === 'success' && (
            <Button
              type="button"
              variant="success"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => {
                setPreviewModalPayload({
                  type: 'service-request',
                  record: submittedReceiptRecord,
                  isEdit: Boolean(editingRecord),
                });
              }}
            >
              พิมพ์ใบรับบริการ (A4)
            </Button>
          )}
        </div>
      )}

      {/* การ์ดแบบฟอร์มหลัก (ตามต้นฉบับ IT SUPPORT แบบสอบถามและใบลงข้อมูลการขอรับบริการ) */}
      <form onSubmit={handleInitialSubmit} noValidate>
        <Card className="overflow-hidden">
          {/* ส่วนหัวของแบบฟอร์มตามต้นฉบับ */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-blue-50/70 dark:bg-slate-800/50 border-b border-blue-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1e3a8a] text-white shrink-0 mt-0.5 shadow-sm"
                aria-hidden="true"
              >
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-[#1e3a8a] dark:text-white leading-tight">
                  {editingRecord
                    ? 'แก้ไขแบบสอบถามและใบลงข้อมูลการขอรับบริการ IT SUPPORT'
                    : 'IT SUPPORT — แบบสอบถามและใบลงข้อมูลการขอรับบริการ'}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                  งานบริการด้านคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคาร 1 ชั้น 3 ห้อง 3
                </p>
              </div>
            </div>

            {/* ซ่อนบนมือถือเพื่อตัดความซ้ำซ้อน เนื่องจากในฟอร์มด้านล่างมีช่อง "เลขที่ใบรับบริการ" ชัดเจนแล้ว */}
            <div className="hidden sm:block bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-slate-700 text-left sm:text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                เลขที่ใบรับบริการอัตโนมัติ
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums-thai">
                {receiptNumber}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* ข้อมูลการรับเรื่อง (เลขที่ใบรับบริการ, วันที่, เวลา, สถานะ) */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>ข้อมูลใบรับบริการ (ระบบออกเลขที่ให้อัตโนมัติและล็อคไว้)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                  <span>ล็อคเลขที่เอกสาร</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="เลขที่ใบรับบริการ"
                  readOnly
                  value={receiptNumber}
                  icon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  helperText="ระบบสร้างเลขอัตโนมัติและล็อคไว้เพื่อป้องกันเลขซ้ำในระบบ"
                  className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums-thai cursor-not-allowed bg-slate-100/90 dark:bg-slate-800/80"
                />

                <DateField
                  label="วันที่นำเครื่องมาซ่อม"
                  requiredMark
                  value={date}
                  onChange={setDate}
                  onSetCurrentDate={() => setDate(getCurrentDateISO())}
                  error={errors.date}
                />

                <TimeField24
                  label="เวลาที่รับเครื่อง"
                  requiredMark
                  value={time}
                  onChange={setTime}
                  onSetCurrentTime={() => setTime(getCurrentTime24())}
                  error={errors.time}
                />
              </div>
            </div>

            {/* ส่วนที่ 1: ข้อมูลผู้ขอรับบริการและช่างผู้รับเรื่อง */}
            <FormSection
              stepNumber="1"
              title="ข้อมูลผู้ขอรับบริการและเจ้าหน้าที่ผู้รับเรื่อง"
              description="กรอกข้อมูลผู้ขอรับบริการ และเลือกช่างผู้รับเรื่อง (จากรายชื่อทั้ง 7 คน) เพื่อบันทึกลงในใบรับบริการ"
              icon={<UserCheck className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField
                  label="ชื่อ - นามสกุล"
                  name="fullName"
                  autoComplete="name"
                  requiredMark
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="เช่น สมชาย ใจดี"
                  error={errors.fullName}
                />

                <InputField
                  label="เบอร์โทรศัพท์ติดต่อ"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  requiredMark
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                  }}
                  placeholder="เช่น 081-234-5678"
                  error={errors.phoneNumber}
                  className="font-mono tabular-nums-thai"
                />

                <InputField
                  label="แผนก / สาขาวิชา"
                  name="department"
                  autoComplete="organization"
                  optionalText="ถ้ามี"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น ปวช. / บุคคลทั่วไป"
                />

                <SelectField
                  label="ช่างผู้รับเรื่อง"
                  name="receiverName"
                  requiredMark
                  value={receiverName}
                  placeholder="เลือกช่างผู้รับเรื่อง"
                  onChange={(e) => {
                    setReceiverName(e.target.value);
                    if (errors.receiverName) setErrors({ ...errors, receiverName: '' });
                  }}
                  options={[
                    { value: '', label: '-- ไม่ระบุ / ล้างการเลือก --' },
                    ...technicianOptions.map((t) => ({
                      value: t.name,
                      label: t.name,
                      description: t.shift,
                      group: t.shift,
                      badge:
                        t.groupKey === 'GROUP_1'
                          ? 'วันจันทร์'
                          : t.groupKey === 'GROUP_2'
                          ? 'วันอังคาร'
                          : 'วันศุกร์',
                      badgeColor: (t.groupKey === 'GROUP_1'
                        ? 'blue'
                        : t.groupKey === 'GROUP_2'
                        ? 'purple'
                        : 'amber') as 'blue' | 'purple' | 'amber',
                    })),
                  ]}
                  error={errors.receiverName}
                />
              </div>
            </FormSection>

            {/* ส่วนที่ 2: ข้อมูลอุปกรณ์และรายละเอียดปัญหา */}
            <FormSection
              stepNumber="2"
              title="ข้อมูลอุปกรณ์และอาการเสีย"
              description="เลือกประเภทของปัญหา พร้อมระบุรุ่นอุปกรณ์และอาการเสียที่ต้องการให้ช่างตรวจเช็ก"
              icon={<Cpu className="w-4 h-4" />}
            >
              <div className="space-y-4">
                {/* ตัวเลือกประเภทอุปกรณ์ตามใบฟอร์มตัวอย่าง: ฮาร์ดแวร์ / ซอฟต์แวร์ / อื่น ๆ พร้อมช่องพิมพ์ข้อความทันที */}
                <div className="space-y-3">
                  <span className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    ประเภทอุปกรณ์ <span className="text-red-500 font-bold">*</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRIMARY_DEVICE_TYPES.map((item) => {
                      const active = deviceType === item.key;
                      return (
                        <label
                          key={item.key}
                          className={`flex items-center gap-3 p-3.5 min-h-[48px] rounded-xl border cursor-pointer select-none transition-all duration-200 active:scale-[0.99] ${
                            active
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 dark:border-blue-500 text-slate-900 dark:text-white font-semibold shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deviceTypeRadio"
                            checked={active}
                            onChange={() => {
                              setDeviceType(item.key);
                              if (errors.deviceType) setErrors((prev) => ({ ...prev, deviceType: '' }));
                              if (item.key === 'Other') {
                                setTimeout(() => otherDeviceInputRef.current?.focus(), 20);
                              }
                            }}
                            className="sr-only"
                          />
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                              active
                                ? 'bg-blue-600 border-blue-600 text-white scale-105'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                            }`}
                            aria-hidden="true"
                          >
                            {active && <Check className="w-3.5 h-3.5 stroke-[3] animate-scaleCheck" />}
                          </span>
                          <span className="text-sm">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {errors.deviceType && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{errors.deviceType}</p>
                  )}

                  {/* เมื่อเลือก "อื่น ๆ (ระบุรายละเอียด)" จะแสดงกล่องพิมพ์ข้อความด้านล่างทันทีและโฟกัสให้อัตโนมัติ */}
                  {deviceType === 'Other' && (
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 animate-fadeIn">
                      <label
                        htmlFor="other-device-specify-input"
                        className="block text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1.5"
                      >
                        โปรดระบุประเภทอุปกรณ์ / รายละเอียดอื่น ๆ{' '}
                        <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        ref={otherDeviceInputRef}
                        id="other-device-specify-input"
                        type="text"
                        value={otherDeviceText}
                        onChange={(e) => {
                          setOtherDeviceText(e.target.value);
                          if (errors.otherDeviceText) {
                            setErrors({ ...errors, otherDeviceText: '' });
                          }
                        }}
                        placeholder="พิมพ์ระบุอุปกรณ์อื่น ๆ หรือรายละเอียดที่ต้องการแจ้งที่นี่..."
                        aria-invalid={errors.otherDeviceText ? 'true' : undefined}
                        className="w-full min-h-[44px] rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      {errors.otherDeviceText && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                          {errors.otherDeviceText}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="ยี่ห้อและรุ่นของอุปกรณ์"
                    name="deviceBrandModel"
                    requiredMark
                    value={deviceBrandModel}
                    onChange={(e) => {
                      setDeviceBrandModel(e.target.value);
                      if (errors.deviceBrandModel) {
                        setErrors({ ...errors, deviceBrandModel: '' });
                      }
                    }}
                    placeholder="เช่น โน้ตบุ๊ก Asus TUF, PC ตั้งโต๊ะ หรือเครื่องพิมพ์ Epson"
                    error={errors.deviceBrandModel}
                  />

                  <InputField
                    label="หมายเลขเครื่อง หรือ Serial Number"
                    name="deviceSerialNumber"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    optionalText="ถ้ามี"
                    value={deviceSerialNumber}
                    onChange={(e) => setDeviceSerialNumber(e.target.value)}
                    placeholder="เช่น SN-98472310 (เว้นว่างได้หากไม่ทราบ)"
                    className="font-mono"
                  />
                </div>

                <TextareaField
                  id="problem-desc"
                  name="problemDescription"
                  label="อาการเสียหรือปัญหาที่พบ"
                  requiredMark
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => {
                    setProblemDescription(e.target.value);
                    if (errors.problemDescription) {
                      setErrors({ ...errors, problemDescription: '' });
                    }
                  }}
                  placeholder="อธิบายอาการเสีย เช่น เปิดเครื่องไม่ติด หน้าจอขึ้นสีฟ้า เชื่อมต่อ Wi-Fi ไม่ได้ หรือต้องการลงโปรแกรมใหม่..."
                  error={errors.problemDescription}
                />
              </div>
            </FormSection>

            {/* ส่วนที่ 3: เลือกบริการที่ต้องการ (เลือกได้มากกว่า 1 รายการ) */}
            <FormSection
              stepNumber="3"
              title="เลือกบริการที่ต้องการ (เลือกได้มากกว่า 1 รายการ)"
              description="ติ๊กเลือกบริการที่ต้องการ ระบบจะรวมราคาประเมินเบื้องต้นให้โดยอัตโนมัติ"
              icon={<Wrench className="w-4 h-4" />}
              rightElement={
                <Badge variant={selectedServices.length > 0 ? 'blue' : 'slate'}>
                  เลือกแล้ว {selectedServices.length} รายการ
                </Badge>
              }
            >
              <fieldset
                className="space-y-4 border-0 p-0 m-0"
                aria-invalid={errors.selectedServices ? 'true' : undefined}
                aria-describedby={errors.selectedServices ? 'selected-services-error' : undefined}
              >
                <legend className="sr-only">
                  เลือกบริการที่ต้องการ (ทำเครื่องหมายถูกได้มากกว่า 1 รายการ)
                </legend>

                {/* ตาราง 2 คอลัมน์ตามใบฟอร์มต้นฉบับ: ด้านคอมพิวเตอร์และซอฟต์แวร์ | ด้านฮาร์ดแวร์ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 border border-blue-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-blue-200 dark:divide-slate-700">
                  {/* คอลัมน์ซ้าย: ด้านคอมพิวเตอร์และซอฟต์แวร์ */}
                  <div className="bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-12 bg-blue-100/80 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1e3a8a] dark:text-blue-300 border-b border-blue-200 dark:border-slate-700">
                      <div className="col-span-8">ด้านคอมพิวเตอร์และซอฟต์แวร์</div>
                      <div className="col-span-4 text-right">ค่าบริการ</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {softwareServices.map((item) => {
                        const checked = selectedServices.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`grid grid-cols-12 items-center px-4 py-3 min-h-[48px] cursor-pointer select-none transition-all duration-200 active:scale-[0.99] ${
                              checked
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold text-slate-900 dark:text-white'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="col-span-8 flex items-center gap-3 pr-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleServiceCheckbox(item.key)}
                                className="sr-only"
                              />
                              <span
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  checked
                                    ? 'bg-blue-600 border-blue-600 text-white scale-105'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                }`}
                                aria-hidden="true"
                              >
                                {checked && <Check className="w-3.5 h-3.5 stroke-[3] animate-scaleCheck" />}
                              </span>
                              <span className="text-xs sm:text-sm leading-snug">{item.labelTh}</span>
                            </div>
                            <div className="col-span-4 text-right text-xs sm:text-sm font-semibold tabular-nums-thai text-slate-800 dark:text-slate-200">
                              {item.priceLabel}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* คอลัมน์ขวา: ด้านฮาร์ดแวร์ */}
                  <div className="bg-white dark:bg-slate-900 flex flex-col">
                    <div className="grid grid-cols-12 bg-blue-100/80 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1e3a8a] dark:text-blue-300 border-b border-blue-200 dark:border-slate-700">
                      <div className="col-span-8">ด้านฮาร์ดแวร์</div>
                      <div className="col-span-4 text-right">ค่าบริการ</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                      {hardwareServices.map((item) => {
                        const checked = selectedServices.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={`grid grid-cols-12 items-center px-4 py-3 min-h-[48px] cursor-pointer select-none transition-all duration-200 active:scale-[0.99] ${
                              checked
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold text-slate-900 dark:text-white'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="col-span-8 flex items-center gap-3 pr-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleServiceCheckbox(item.key)}
                                className="sr-only"
                              />
                              <span
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  checked
                                    ? 'bg-blue-600 border-blue-600 text-white scale-105'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                }`}
                                aria-hidden="true"
                              >
                                {checked && <Check className="w-3.5 h-3.5 stroke-[3] animate-scaleCheck" />}
                              </span>
                              <span className="text-xs sm:text-sm leading-snug">{item.labelTh}</span>
                            </div>
                            <div className="col-span-4 text-right text-xs sm:text-sm font-semibold tabular-nums-thai text-slate-800 dark:text-slate-200">
                              {item.priceLabel}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {errors.selectedServices && (
                  <p
                    id="selected-services-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.selectedServices}</span>
                  </p>
                )}

                {/* บริการอื่น ๆ, ประเมินค่าใช้จ่าย, และรายละเอียดเพิ่มเติม */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <InputField
                        label="บริการอื่น ๆ"
                        name="otherServiceText"
                        optionalText="ถ้ามี"
                        value={otherServiceText}
                        onChange={(e) => {
                          setOtherServiceText(e.target.value);
                          if (errors.selectedServices) {
                            setErrors({ ...errors, selectedServices: '' });
                          }
                        }}
                        placeholder="ระบุบริการ เช่น กู้ข้อมูล, ซ่อมจอ, เดินสายแลน"
                        helperText="กรอกเฉพาะเมื่อต้องการบริการนอกเหนือจากรายการด้านบน"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <InputField
                        label="ประเมินค่าใช้จ่าย"
                        name="estimatedCost"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={estimatedCost}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                          setEstimatedCost(digitsOnly);
                        }}
                        placeholder="คำนวณอัตโนมัติ"
                        helperText="ระบุเฉพาะตัวเลข (หน่วยเป็นบาท)"
                        className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums-thai"
                      />
                    </div>
                  </div>

                  <div>
                    <InputField
                      label="รายละเอียดเพิ่มเติม"
                      name="additionalDetailsText"
                      optionalText="ถ้ามี"
                      value={additionalDetailsText}
                      onChange={(e) => setAdditionalDetailsText(e.target.value)}
                      placeholder="เช่น ต้องการ Windows 11, ขอโปรแกรมเฉพาะทาง, สำรองข้อมูลไว้แล้ว"
                      helperText="ข้อมูลเสริมสำหรับช่างผู้ดูแลเครื่อง"
                    />
                  </div>
                </div>
              </fieldset>
            </FormSection>

            {/* ส่วนที่ 4: การยืนยันก่อนให้บริการและการรับทราบ */}
            <FormSection
              stepNumber="4"
              title="การยืนยันก่อนรับบริการ"
              description="โปรดตรวจสอบและรับทราบเงื่อนไขการดูแลเครื่องก่อนส่งซ่อม"
              icon={<FileText className="w-4 h-4" />}
            >
              <div className="rounded-2xl border border-blue-200 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/40 p-4 space-y-2.5">
                {ACKNOWLEDGMENT_ITEMS.map((text, idx) => {
                  const checked = acknowledgedItems[idx];
                  return (
                    <label
                      key={idx}
                      className="flex items-start gap-3 py-1.5 cursor-pointer select-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 active:scale-[0.99] transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAcknowledgment(idx)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                          checked
                            ? 'bg-blue-600 border-blue-600 text-white scale-105'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3] animate-scaleCheck" />}
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </label>
                  );
                })}
              </div>
            </FormSection>

            {/* ส่วนท้ายสำหรับส่งข้อมูล (รูปแบบเดียวกับฟอร์มบันทึกเวลาปฏิบัติงาน) */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ช่องที่มีเครื่องหมาย <span className="text-red-500 font-bold">*</span>{' '}
                จำเป็นต้องกรอกให้ครบถ้วน • สามารถกดดูตัวอย่างใบรับบริการขนาด A4 ก่อนบันทึกได้
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {editingRecord && onCancelEdit && (
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
                  icon={<Save className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  {editingRecord
                    ? 'บันทึกการแก้ไขใบรับบริการ'
                    : 'บันทึกและออกใบรับบริการ'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </form>

      {/* หน้าต่างแสดงตัวอย่างเอกสารขนาด A4 เสมือนจริงบนหน้าจอ (Responsive A4 Modal) */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(previewModalPayload)}
        mode="view-only"
        payload={previewModalPayload}
        onCancel={() => setPreviewModalPayload(null)}
      />

      {/* พอร์ทัลเอกสาร A4 ซ่อนบนหน้าจอแสดงผล 100% แต่จะแสดงเฉพาะขณะเรียก window.print() เท่านั้น */}
      <PrintDocumentPortal
        payload={
          previewModalPayload ||
          (printRecord
            ? {
                type: 'service-request',
                record: printRecord,
                isEdit: Boolean(editingRecord),
              }
            : null)
        }
      />

      {/* หน้าต่างยืนยันการบันทึกข้อมูล */}
      <ConfirmDialog
        isOpen={isConfirmSubmitOpen}
        title={editingRecord ? 'ยืนยันการบันทึกการแก้ไขข้อมูล' : 'ยืนยันการบันทึกข้อมูลและออกใบรับบริการ'}
        description={
          editingRecord
            ? `คุณต้องการบันทึกการแก้ไขข้อมูลใบรับบริการเลขที่ "${receiptNumber}" ใช่หรือไม่?`
            : `คุณต้องการบันทึกข้อมูลและออกใบรับบริการใหม่สำหรับคุณ "${fullName || 'ผู้รับบริการ'}" ใช่หรือไม่?`
        }
        confirmLabel={editingRecord ? 'ยืนยันบันทึกการแก้ไข' : 'ยืนยันบันทึกข้อมูล'}
        cancelLabel="กลับไปตรวจสอบ"
        variant={editingRecord ? 'primary' : 'success'}
        isLoading={isSubmitting}
        details={[
          { label: 'เลขที่เอกสาร', value: receiptNumber || '-' },
          { label: 'วันที่รับเรื่อง', value: `${formatDisplayDate(date)} เวลา ${time} น.` },
          { label: 'ผู้รับบริการ', value: fullName || '-' },
          { label: 'เบอร์ติดต่อ', value: phoneNumber || '-' },
          {
            label: 'ประเภทอุปกรณ์',
            value: `${getDeviceTypeThaiLabel(deviceType as DeviceType)} ${deviceBrandModel || ''}`.trim(),
          },
          {
            label: 'ประเมินค่าใช้จ่าย',
            value: `${estimatedCost || calculateEstimatedServiceCost(selectedServices)} บาท`,
          },
          { label: 'ช่างผู้รับเรื่อง', value: receiverName || '-' },
        ]}
        onConfirm={async () => {
          setIsConfirmSubmitOpen(false);
          const draft = buildCurrentDraftRecord();
          await executeSaveRecord(draft, false);
        }}
        onCancel={() => setIsConfirmSubmitOpen(false)}
      />

      {/* หน้าต่างยืนยันการยกเลิกการแก้ไข */}
      <ConfirmDialog
        isOpen={isConfirmCancelEditOpen}
        title="ยืนยันการยกเลิกการแก้ไข"
        description="คุณต้องการยกเลิกการแก้ไขและกลับสู่หน้าแบบฟอร์มปกติใช่หรือไม่? การแก้ไขที่ยังไม่ได้บันทึกจะถูกยกเลิก"
        confirmLabel="ยืนยันยกเลิก"
        cancelLabel="แก้ไขต่อ"
        variant="danger"
        onConfirm={() => {
          setIsConfirmCancelEditOpen(false);
          if (onCancelEdit) onCancelEdit();
        }}
        onCancel={() => setIsConfirmCancelEditOpen(false)}
      />
    </div>
  );
};
