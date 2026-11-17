import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Save,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  DEVICE_TYPE_LABELS_TH,
  DeviceType,
  getServiceThaiLabel,
  REQUESTED_SERVICES_LIST,
  RequestedServiceItem,
  ServiceRequestRecord,
} from '../types';
import {
  generateRecordId,
  generateUniqueReceiptNumber,
  getCurrentDateISO,
  getCurrentTime24,
  parseServicesList,
} from '../utils/formatters';
import { PaperDocumentPreviewModal } from './PaperDocumentPreviewModal';
import {
  Badge,
  Button,
  Card,
  CheckboxCard,
  FormSection,
  InputField,
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

const DEVICE_TYPES: DeviceType[] = [
  'Computer',
  'Laptop',
  'Printer',
  'Network Device',
  'Other',
];

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  existingRecords,
  editingRecord,
  onCancelEdit,
  onSaveRecord,
  onBackToDashboard,
}) => {
  const existingReceiptNumbers = existingRecords.map((r) => r.ReceiptNumber);

  // ส่วนที่ 1: ข้อมูลใบรับบริการ
  const [receiptNumber, setReceiptNumber] = useState<string>(() =>
    generateUniqueReceiptNumber(existingReceiptNumbers)
  );
  const [date, setDate] = useState<string>(() => getCurrentDateISO());
  const [time, setTime] = useState<string>(() => getCurrentTime24());

  // ส่วนที่ 2: ข้อมูลผู้ขอรับบริการ
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');

  // ส่วนที่ 3: ข้อมูลอุปกรณ์และรายละเอียดอาการเสีย
  const [deviceType, setDeviceType] = useState<DeviceType>('Laptop');
  const [deviceBrandModel, setDeviceBrandModel] = useState('');
  const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // ส่วนที่ 4: รายการบริการที่ร้องขอ (เลือกได้หลายรายการ ✓)
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [otherServiceText, setOtherServiceText] = useState('');
  const [status, setStatus] = useState<'Completed' | 'In Progress' | 'Pending'>('Completed');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDraftRecord, setPreviewDraftRecord] =
    useState<ServiceRequestRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceiptRecord, setSubmittedReceiptRecord] =
    useState<ServiceRequestRecord | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setReceiptNumber(editingRecord.ReceiptNumber);
      setDate(editingRecord.Date ? editingRecord.Date.split('T')[0] : getCurrentDateISO());
      setTime(editingRecord.Time ? editingRecord.Time.slice(0, 5) : getCurrentTime24());
      setFullName(editingRecord.FullName);
      setPhoneNumber(editingRecord.PhoneNumber);
      setDepartment(editingRecord.Department || '');
      setDeviceType((editingRecord.DeviceType as DeviceType) || 'Laptop');
      setDeviceBrandModel(editingRecord.DeviceBrandModel);
      setDeviceSerialNumber(editingRecord.DeviceSerialNumber || '');
      setProblemDescription(editingRecord.ProblemDescription);
      setAdditionalDetails(editingRecord.AdditionalDetails || '');
      setSelectedServices(parseServicesList(editingRecord.RequestedServices));
      setOtherServiceText(editingRecord.OtherServiceText || '');
      setStatus(editingRecord.Status || 'Completed');
      setErrors({});
    }
  }, [editingRecord]);

  const toggleServiceCheckbox = (service: RequestedServiceItem) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service]
    );
    if (errors.selectedServices) {
      setErrors((prev) => ({ ...prev, selectedServices: '' }));
    }
  };

  const handleRegenerateReceipt = () => {
    if (editingRecord) return;
    setReceiptNumber(generateUniqueReceiptNumber(existingReceiptNumbers));
    setTime(getCurrentTime24());
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!receiptNumber.trim()) {
      nextErrors.receiptNumber = 'กรุณาระบุเลขที่ใบรับบริการ';
    }
    if (!date.trim()) {
      nextErrors.date = 'กรุณาระบุวันที่แจ้งขอรับบริการ';
    }
    if (!time.trim()) {
      nextErrors.time = 'กรุณาระบุเวลาที่แจ้งขอรับบริการ';
    }
    if (!fullName.trim()) {
      nextErrors.fullName = 'กรุณากรอกชื่อ-นามสกุลของผู้ขอรับบริการ';
    }
    if (!phoneNumber.trim()) {
      nextErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์ติดต่อ';
    } else if (!/^[0-9+\-() ]{6,20}$/.test(phoneNumber.trim())) {
      nextErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ตัวเลข 6–20 หลัก)';
    }
    if (!deviceBrandModel.trim()) {
      nextErrors.deviceBrandModel = 'กรุณาระบุยี่ห้อและรุ่นของอุปกรณ์';
    }
    if (!problemDescription.trim()) {
      nextErrors.problemDescription = 'กรุณาระบุอาการเสียหรือปัญหาที่ต้องการให้ตรวจสอบ';
    }
    if (selectedServices.length === 0) {
      nextErrors.selectedServices = 'กรุณาเลือกบริการที่ต้องการอย่างน้อย 1 รายการ (✓)';
    }
    if (selectedServices.includes('Other') && !otherServiceText.trim()) {
      nextErrors.otherServiceText = 'กรุณาระบุรายละเอียดสำหรับบริการอื่นๆ';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCurrentDraftRecord = (): ServiceRequestRecord => {
    const nowIso = new Date().toISOString();
    return {
      RecordID: editingRecord ? editingRecord.RecordID : generateRecordId(),
      ReceiptNumber: receiptNumber.trim(),
      Date: date.trim(),
      Time: time.trim(),
      FullName: fullName.trim(),
      PhoneNumber: phoneNumber.trim(),
      Department: department.trim(),
      DeviceType: deviceType,
      DeviceBrandModel: deviceBrandModel.trim(),
      DeviceSerialNumber: deviceSerialNumber.trim(),
      ProblemDescription: problemDescription.trim(),
      AdditionalDetails: additionalDetails.trim(),
      RequestedServices: JSON.stringify(selectedServices),
      OtherServiceText: selectedServices.includes('Other') ? otherServiceText.trim() : '',
      Status: status,
      CreatedAt: editingRecord ? editingRecord.CreatedAt : nowIso,
      UpdatedAt: nowIso,
    };
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBannerFeedback(null);
    if (!validateForm()) {
      return;
    }
    // แสดงตัวอย่างเอกสารขนาด A4 (Paper-Style Document Preview) ก่อนยืนยันการบันทึกจริง
    setPreviewDraftRecord(buildCurrentDraftRecord());
  };

  const handleConfirmedSave = async () => {
    if (isSubmitting || !previewDraftRecord) return;
    setIsSubmitting(true);
    setBannerFeedback(null);

    const recordToSave = previewDraftRecord;

    try {
      const result = await onSaveRecord(recordToSave, Boolean(editingRecord));
      setPreviewDraftRecord(null);

      if (!result.success) {
        setBannerFeedback({
          type: 'error',
          message: result.error || 'ไม่สามารถบันทึกข้อมูลใบคำขอรับบริการได้',
        });
        return;
      }

      setSubmittedReceiptRecord(recordToSave);
      setBannerFeedback({
        type: 'success',
        message: result.syncedToCloud
          ? `บันทึกใบคำขอรับบริการเลขที่ ${recordToSave.ReceiptNumber} ลงใน Google Sheets ("IT Support Requests") เรียบร้อยแล้ว`
          : `บันทึกใบคำขอรับบริการเลขที่ ${recordToSave.ReceiptNumber} ลงในระบบสำรองเรียบร้อยแล้ว (พร้อมซิงก์ไปยัง Google Sheets)`,
      });

      if (!editingRecord) {
        const updatedReceipts = [...existingReceiptNumbers, recordToSave.ReceiptNumber];
        setReceiptNumber(generateUniqueReceiptNumber(updatedReceipts));
        setDate(getCurrentDateISO());
        setTime(getCurrentTime24());
        setFullName('');
        setPhoneNumber('');
        setDepartment('');
        setDeviceType('Laptop');
        setDeviceBrandModel('');
        setDeviceSerialNumber('');
        setProblemDescription('');
        setAdditionalDetails('');
        setSelectedServices([]);
        setOtherServiceText('');
        setStatus('Completed');
      } else if (onCancelEdit) {
        onCancelEdit();
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับสู่หน้าแดชบอร์ดหลัก
        </button>

        <Badge variant="emerald" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
          แผ่นงานปลายทาง: IT Support Requests
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{bannerFeedback.message}</span>
          </div>

          {submittedReceiptRecord && bannerFeedback.type === 'success' && (
            <Button
              type="button"
              variant="success"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => setSubmittedReceiptRecord(submittedReceiptRecord)}
            >
              ดูและพิมพ์ใบรับบริการ
            </Button>
          )}
        </div>
      )}

      {/* การ์ดแบบฟอร์มหลัก */}
      <form onSubmit={handleInitialSubmit} noValidate>
        <Card className="overflow-hidden">
          {/* ส่วนหัวของแบบฟอร์ม */}
          <div className="px-6 sm:px-8 py-6 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="p-3 rounded-2xl bg-blue-600 text-white shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {editingRecord
                    ? 'แก้ไขข้อมูลใบคำขอรับบริการ IT Support'
                    : 'แบบฟอร์มขอรับบริการ IT Support (Service Request Form)'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  กรอกข้อมูลผู้แจ้งซ่อม รายละเอียดอุปกรณ์ และเลือกบริการที่ต้องการเพื่อบันทึกลงในแผ่นงาน IT Support Requests
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left sm:text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                เลขที่ใบรับบริการอัตโนมัติ
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums-thai">
                {receiptNumber}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* ส่วนที่ 1: ข้อมูลใบรับบริการ */}
            <FormSection
              stepNumber="1"
              title="ข้อมูลใบรับบริการ (Receipt Information)"
              description="ระบบสร้างเลขที่ใบรับบริการไม่ซ้ำกันโดยอัตโนมัติ และตั้งค่าวันที่/เวลาปัจจุบันให้พร้อมใช้งาน"
              icon={<ClipboardList className="w-4 h-4" />}
              rightElement={
                !editingRecord && (
                  <button
                    type="button"
                    onClick={handleRegenerateReceipt}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    สุ่มเลขที่ใบรับบริการใหม่
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="เลขที่ใบรับบริการ (สร้างอัตโนมัติ)"
                  readOnly
                  value={receiptNumber}
                  className="font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums-thai"
                />

                <InputField
                  label="วันที่รับแจ้ง (แก้ไขได้)"
                  type="date"
                  requiredMark
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />

                <InputField
                  label="เวลารับแจ้ง"
                  type="time"
                  requiredMark
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  error={errors.time}
                  className="font-mono tabular-nums-thai"
                />
              </div>
            </FormSection>

            {/* ส่วนที่ 2: ข้อมูลผู้ขอรับบริการ */}
            <FormSection
              stepNumber="2"
              title="ข้อมูลผู้ขอรับบริการ (Customer / Requester Information)"
              description="ระบุชื่อและช่องทางติดต่อของผู้แจ้งซ่อมหรือผู้ขอรับบริการ"
              icon={<UserCheck className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  label="ชื่อ-นามสกุล ผู้ขอรับบริการ"
                  name="fullName"
                  autoComplete="name"
                  requiredMark
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="เช่น สมชาย ประเสริฐกุล"
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
                  label="หน่วยงาน / แผนก / คณะ"
                  name="department"
                  autoComplete="organization"
                  optionalText="ไม่บังคับ"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น ฝ่ายบัญชี / คณะวิศวกรรมศาสตร์"
                />
              </div>
            </FormSection>

            {/* ส่วนที่ 3: ข้อมูลอุปกรณ์และรายละเอียดอาการเสีย */}
            <FormSection
              stepNumber="3"
              title="ข้อมูลอุปกรณ์และรายละเอียดปัญหา (Device & Problem Details)"
              description="ระบุประเภทอุปกรณ์ รุ่น และอาการเสียที่ตรวจพบเพื่อให้ช่างเทคนิควิเคราะห์ได้แม่นยำ"
              icon={<Cpu className="w-4 h-4" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="device-type-select"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      ประเภทอุปกรณ์ <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      id="device-type-select"
                      name="deviceType"
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {DEVICE_TYPES.map((dt) => (
                        <option key={dt} value={dt}>
                          {DEVICE_TYPE_LABELS_TH[dt]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <InputField
                    label="ยี่ห้อ / รุ่นอุปกรณ์ (Brand / Model)"
                    requiredMark
                    value={deviceBrandModel}
                    onChange={(e) => {
                      setDeviceBrandModel(e.target.value);
                      if (errors.deviceBrandModel) {
                        setErrors({ ...errors, deviceBrandModel: '' });
                      }
                    }}
                    placeholder="เช่น Dell Latitude 5420 / HP LaserJet"
                    error={errors.deviceBrandModel}
                  />

                  <InputField
                    label="หมายเลขเครื่อง (Serial Number)"
                    name="deviceSerialNumber"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    optionalText="ไม่บังคับ"
                    value={deviceSerialNumber}
                    onChange={(e) => setDeviceSerialNumber(e.target.value)}
                    placeholder="เช่น SN-98472310"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="problem-desc"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      รายละเอียดอาการเสีย / ปัญหาที่พบ{' '}
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                      id="problem-desc"
                      rows={3}
                      value={problemDescription}
                      onChange={(e) => {
                        setProblemDescription(e.target.value);
                        if (errors.problemDescription) {
                          setErrors({ ...errors, problemDescription: '' });
                        }
                      }}
                      placeholder="อธิบายอาการเสียหรือปัญหาที่ต้องการให้ตรวจสอบแก้ไข..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.problemDescription
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-500/20'
                      }`}
                    />
                    {errors.problemDescription && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.problemDescription}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="additional-details"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      รายละเอียดเพิ่มเติม / อุปกรณ์ที่นำมาฝากไว้{' '}
                      <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      id="additional-details"
                      rows={3}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="เช่น มีสายชาร์จอะแดปเตอร์ กระเป๋า หรือต้องการให้สำรองข้อมูลในไดรฟ์ D..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* ส่วนที่ 4: รายการบริการที่ร้องขอ (เลือกได้มากกว่า 1 รายการ ✓) */}
            <FormSection
              stepNumber="4"
              title="รายการบริการที่ต้องการ (Requested Services — เลือกได้มากกว่า 1 รายการ ✓)"
              description="ทำเครื่องหมายถูก (✓) หน้าบริการที่ต้องการให้ทีม IT Support ดำเนินการ"
              icon={<Wrench className="w-4 h-4" />}
              rightElement={
                <Badge variant={selectedServices.length > 0 ? 'blue' : 'slate'}>
                  เลือกแล้ว {selectedServices.length} รายการ
                </Badge>
              }
            >
              <fieldset className="space-y-3 border-0 p-0 m-0">
                <legend className="sr-only">
                  เลือกรายการบริการ IT Support ที่ต้องการ (เลือกได้มากกว่า 1 รายการ)
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REQUESTED_SERVICES_LIST.map((service) => {
                    const isChecked = selectedServices.includes(service);
                    return (
                      <CheckboxCard
                        key={service}
                        checked={isChecked}
                        onChange={() => toggleServiceCheckbox(service)}
                        title={getServiceThaiLabel(service)}
                        subtitle={service}
                      />
                    );
                  })}
                </div>

                {errors.selectedServices && (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.selectedServices}</span>
                  </p>
                )}

                {/* ช่องกรอกข้อมูลเพิ่มเติมเมื่อเลือก "Other" */}
                {selectedServices.includes('Other') && (
                  <div className="pt-2 animate-fadeIn">
                    <InputField
                      label="โปรดระบุรายละเอียดสำหรับบริการอื่นๆ"
                      name="otherServiceText"
                      requiredMark
                      value={otherServiceText}
                      onChange={(e) => {
                        setOtherServiceText(e.target.value);
                        if (errors.otherServiceText) {
                          setErrors({ ...errors, otherServiceText: '' });
                        }
                      }}
                      placeholder="ระบุบริการด้านไอทีอื่นๆ ที่ต้องการให้ดำเนินการ..."
                      error={errors.otherServiceText}
                    />
                  </div>
                )}
              </fieldset>
            </FormSection>

            {/* ส่วนท้ายสำหรับส่งข้อมูล */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ช่องที่มีเครื่องหมาย <span className="text-red-500 font-bold">*</span>{' '}
                จำเป็นต้องกรอกให้ครบถ้วนก่อนบันทึกข้อมูลลงใน Google Sheets
              </div>

              <div className="flex items-center gap-3">
                {editingRecord && onCancelEdit && (
                  <Button type="button" variant="outline" onClick={onCancelEdit}>
                    ยกเลิกการแก้ไข
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  icon={<Save className="w-4 h-4" />}
                >
                  {editingRecord
                    ? 'บันทึกการแก้ไขใบคำขอรับบริการ'
                    : 'ตรวจสอบและบันทึกใบคำขอรับบริการ'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </form>

      {/* หน้าต่างแสดงตัวอย่างเอกสารกระดาษ A4 ก่อนยืนยันการบันทึก (Paper-Style Document Preview) */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(previewDraftRecord)}
        mode="pre-submit"
        payload={
          previewDraftRecord
            ? {
                type: 'service-request',
                record: previewDraftRecord,
                isEdit: Boolean(editingRecord),
              }
            : null
        }
        isSubmitting={isSubmitting}
        onConfirmAndSubmit={handleConfirmedSave}
        onEditInformation={() => setPreviewDraftRecord(null)}
        onCancel={() => setPreviewDraftRecord(null)}
      />

      {/* หน้าต่างแสดงใบรับบริการขนาด A4 หลังบันทึกข้อมูลสำเร็จ */}
      <PaperDocumentPreviewModal
        isOpen={Boolean(submittedReceiptRecord)}
        mode="view-only"
        payload={
          submittedReceiptRecord
            ? {
                type: 'service-request',
                record: submittedReceiptRecord,
              }
            : null
        }
        onCancel={() => setSubmittedReceiptRecord(null)}
      />
    </div>
  );
};
