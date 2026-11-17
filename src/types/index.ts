export type SheetKey = 'REQUESTS' | 'GROUP_1' | 'GROUP_2' | 'GROUP_3';

export type NavigationTab =
  | 'dashboard'
  | 'service-request'
  | 'work-time-group-1'
  | 'work-time-group-2'
  | 'work-time-group-3'
  | 'history'
  | 'setup';

export type DeviceType =
  | 'Computer'
  | 'Laptop'
  | 'Printer'
  | 'Network Device'
  | 'Other';

export const DEVICE_TYPE_LABELS_TH: Record<DeviceType, string> = {
  Computer: 'คอมพิวเตอร์ตั้งโต๊ะ (PC / Computer)',
  Laptop: 'คอมพิวเตอร์พกพา (Notebook / Laptop)',
  Printer: 'เครื่องพิมพ์และสแกนเนอร์ (Printer)',
  'Network Device': 'อุปกรณ์เครือข่าย (Network Device)',
  Other: 'อุปกรณ์อื่นๆ (Other)',
};

export const REQUESTED_SERVICES_LIST = [
  'Computer troubleshooting',
  'Hardware repair',
  'Software installation',
  'Operating system installation',
  'Virus and malware removal',
  'Network troubleshooting',
  'Printer troubleshooting',
  'Data backup and recovery',
  'Hardware upgrade',
  'Other',
] as const;

export type RequestedServiceItem = (typeof REQUESTED_SERVICES_LIST)[number];

export const REQUESTED_SERVICES_TH: Record<RequestedServiceItem, string> = {
  'Computer troubleshooting': 'ตรวจสอบและแก้ไขปัญหาคอมพิวเตอร์เบื้องต้น',
  'Hardware repair': 'ซ่อมแซมและเปลี่ยนชิ้นส่วนฮาร์ดแวร์ (Hardware Repair)',
  'Software installation': 'ติดตั้งและอัปเดตโปรแกรมใช้งาน (Software Installation)',
  'Operating system installation': 'ติดตั้งระบบปฏิบัติการใหม่ (OS Installation)',
  'Virus and malware removal': 'สแกนและกำจัดไวรัส / มัลแวร์ (Virus & Malware Removal)',
  'Network troubleshooting': 'แก้ไขปัญหาระบบเครือข่ายและอินเทอร์เน็ต (Network)',
  'Printer troubleshooting': 'แก้ไขปัญหาเครื่องพิมพ์และอุปกรณ์ต่อพ่วง (Printer)',
  'Data backup and recovery': 'สำรองและกู้คืนข้อมูลสำคัญ (Data Backup & Recovery)',
  'Hardware upgrade': 'อัปเกรดสเปกอุปกรณ์ เช่น RAM / SSD (Hardware Upgrade)',
  Other: 'บริการอื่นๆ (ระบุรายละเอียดเพิ่มเติม)',
};

export function getServiceThaiLabel(serviceKeyOrLabel: string): string {
  if (serviceKeyOrLabel in REQUESTED_SERVICES_TH) {
    return REQUESTED_SERVICES_TH[serviceKeyOrLabel as RequestedServiceItem];
  }
  return serviceKeyOrLabel;
}

export function getDeviceTypeThaiLabel(deviceType: string): string {
  if (deviceType in DEVICE_TYPE_LABELS_TH) {
    return DEVICE_TYPE_LABELS_TH[deviceType as DeviceType];
  }
  return deviceType;
}

export const STATUS_LABELS_TH: Record<'Completed' | 'In Progress' | 'Pending', string> = {
  Completed: 'ดำเนินการเสร็จสิ้น',
  'In Progress': 'กำลังดำเนินการ',
  Pending: 'รอดำเนินการ',
};

export interface ServiceRequestRecord {
  RecordID: string;
  ReceiptNumber: string;
  Date: string;
  Time: string;
  FullName: string;
  PhoneNumber: string;
  Department: string;
  DeviceType: DeviceType;
  DeviceBrandModel: string;
  DeviceSerialNumber: string;
  ProblemDescription: string;
  AdditionalDetails: string;
  RequestedServices: string; // JSON array or comma-separated list
  OtherServiceText: string;
  Status: 'Completed' | 'In Progress' | 'Pending';
  CreatedAt: string;
  UpdatedAt: string;
  SyncStatus?: 'synced' | 'pending_sync' | 'local_only';
}

export interface WorkTimeGroup1Record {
  RecordID: string;
  SequenceNo: string;
  Date: string;
  WorkStartTime: string;
  WorkEndTime: string;
  Member1Name: string;
  Member1Signature: string; // Base64 Data URL PNG
  Member2Name: string;
  Member2Signature: string; // Base64 Data URL PNG
  Remarks: string;
  CreatedAt: string;
  UpdatedAt: string;
  SyncStatus?: 'synced' | 'pending_sync' | 'local_only';
}

export interface WorkTimeGroup2Or3Record {
  RecordID: string;
  SequenceNo: string;
  Date: string;
  WorkStartTime: string;
  WorkEndTime: string;
  Member1Name: string;
  Member1Signature: string;
  Member2Name: string;
  Member2Signature: string;
  Member3Name: string;
  Member3Signature: string;
  Remarks: string;
  CreatedAt: string;
  UpdatedAt: string;
  SyncStatus?: 'synced' | 'pending_sync' | 'local_only';
}

export type AnyWorkTimeRecord = WorkTimeGroup1Record | WorkTimeGroup2Or3Record;

export interface GroupConfig {
  id: 'GROUP_1' | 'GROUP_2' | 'GROUP_3';
  groupNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  worksheetName: string;
  memberCount: 2 | 3;
  defaultMembers: string[];
  tabId: NavigationTab;
  badgeColor: 'blue' | 'emerald' | 'amber';
}

export const WORK_TIME_GROUPS: Record<'GROUP_1' | 'GROUP_2' | 'GROUP_3', GroupConfig> = {
  GROUP_1: {
    id: 'GROUP_1',
    groupNumber: 1,
    title: 'แบบบันทึกเวลาปฏิบัติงาน IT Support — กลุ่มที่ 1',
    subtitle: 'สำหรับสมาชิกทีม IT Support จำนวน 2 คน (แยกแผ่นงาน Google Sheets อิสระ)',
    worksheetName: 'Work Time - Group 1',
    memberCount: 2,
    defaultMembers: ['สมาชิกคนที่ 1', 'สมาชิกคนที่ 2'],
    tabId: 'work-time-group-1',
    badgeColor: 'blue',
  },
  GROUP_2: {
    id: 'GROUP_2',
    groupNumber: 2,
    title: 'แบบบันทึกเวลาปฏิบัติงาน IT Support — กลุ่มที่ 2',
    subtitle: 'สำหรับสมาชิกทีม IT Support จำนวน 3 คน (แยกแผ่นงาน Google Sheets อิสระ)',
    worksheetName: 'Work Time - Group 2',
    memberCount: 3,
    defaultMembers: ['สมาชิกคนที่ 1', 'สมาชิกคนที่ 2', 'สมาชิกคนที่ 3'],
    tabId: 'work-time-group-2',
    badgeColor: 'emerald',
  },
  GROUP_3: {
    id: 'GROUP_3',
    groupNumber: 3,
    title: 'แบบบันทึกเวลาปฏิบัติงาน IT Support — กลุ่มที่ 3',
    subtitle: 'สำหรับสมาชิกทีม IT Support จำนวน 3 คน (แยกแผ่นงาน Google Sheets อิสระ)',
    worksheetName: 'Work Time - Group 3',
    memberCount: 3,
    defaultMembers: ['สมาชิกคนที่ 1', 'สมาชิกคนที่ 2', 'สมาชิกคนที่ 3'],
    tabId: 'work-time-group-3',
    badgeColor: 'amber',
  },
};

export const WORKSHEET_NAMES: Record<SheetKey, string> = {
  REQUESTS: 'IT Support Requests',
  GROUP_1: 'Work Time - Group 1',
  GROUP_2: 'Work Time - Group 2',
  GROUP_3: 'Work Time - Group 3',
};

export const WORKSHEET_LABELS_TH: Record<SheetKey, string> = {
  REQUESTS: 'คำขอรับบริการ (IT Support Requests)',
  GROUP_1: 'บันทึกเวลา กลุ่มที่ 1 (2 คน)',
  GROUP_2: 'บันทึกเวลา กลุ่มที่ 2 (3 คน)',
  GROUP_3: 'บันทึกเวลา กลุ่มที่ 3 (3 คน)',
};
