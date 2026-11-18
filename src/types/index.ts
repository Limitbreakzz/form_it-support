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
  | 'Hardware'
  | 'Software'
  | 'Other'
  | 'Computer'
  | 'Laptop'
  | 'Printer'
  | 'Network Device';

export const DEVICE_TYPE_LABELS_TH: Record<DeviceType, string> = {
  Hardware: 'ตัวเครื่องและอุปกรณ์ (ฮาร์ดแวร์)',
  Software: 'โปรแกรมและระบบปฏิบัติการ (ซอฟต์แวร์)',
  Other: 'อุปกรณ์อื่น ๆ',
  Computer: 'คอมพิวเตอร์ตั้งโต๊ะ (PC)',
  Laptop: 'โน้ตบุ๊ก (Laptop)',
  Printer: 'เครื่องพิมพ์และสแกนเนอร์',
  'Network Device': 'อุปกรณ์เครือข่ายและอินเทอร์เน็ต',
};

export interface ServiceCatalogItem {
  key: string;
  labelTh: string;
  category: 'software' | 'hardware';
  priceLabel: string;
  priceAmount: number;
}

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  // คอลัมน์ซ้าย: ด้านคอมพิวเตอร์และซอฟต์แวร์
  {
    key: 'ติดตั้ง Windows',
    labelTh: 'ติดตั้ง Windows',
    category: 'software',
    priceLabel: '150 บาท',
    priceAmount: 150,
  },
  {
    key: 'ติดตั้ง Microsoft office',
    labelTh: 'ติดตั้ง Microsoft office',
    category: 'software',
    priceLabel: '80 บาท',
    priceAmount: 80,
  },
  {
    key: 'แก้ไขปัญหา Hardware',
    labelTh: 'แก้ไขปัญหา Hardware',
    category: 'software',
    priceLabel: '50 บาท',
    priceAmount: 50,
  },
  {
    key: 'แก้ไขปัญหา Software',
    labelTh: 'แก้ไขปัญหา Software',
    category: 'software',
    priceLabel: '50 บาท',
    priceAmount: 50,
  },
  {
    key: 'ตรวจสอบปัญหาเบื้องต้น',
    labelTh: 'ตรวจสอบปัญหาเบื้องต้น',
    category: 'software',
    priceLabel: 'ฟรี',
    priceAmount: 0,
  },
  {
    key: 'กำจัดไวรัสเบื้องต้น',
    labelTh: 'กำจัดไวรัสเบื้องต้น',
    category: 'software',
    priceLabel: '80 บาท',
    priceAmount: 80,
  },
  // คอลัมน์ขวา: ด้านฮาร์ดแวร์
  {
    key: 'ทำความสะอาดคอมพิวเตอร์',
    labelTh: 'ทำความสะอาดคอมพิวเตอร์',
    category: 'hardware',
    priceLabel: '50 บาท',
    priceAmount: 50,
  },
  {
    key: 'ทำความสะอาดโน้ตบุ๊ก',
    labelTh: 'ทำความสะอาดโน้ตบุ๊ก',
    category: 'hardware',
    priceLabel: '50 บาท',
    priceAmount: 50,
  },
  {
    key: 'ประกอบคอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
    labelTh: 'ประกอบคอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
    category: 'hardware',
    priceLabel: 'ฟรี',
    priceAmount: 0,
  },
  {
    key: 'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
    labelTh: 'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
    category: 'hardware',
    priceLabel: 'ฟรี',
    priceAmount: 0,
  },
];

export const REQUESTED_SERVICES_LIST = [
  'ติดตั้ง Windows',
  'ติดตั้ง Microsoft office',
  'แก้ไขปัญหา Hardware',
  'แก้ไขปัญหา Software',
  'ตรวจสอบปัญหาเบื้องต้น',
  'กำจัดไวรัสเบื้องต้น',
  'ทำความสะอาดคอมพิวเตอร์',
  'ทำความสะอาดโน้ตบุ๊ก',
  'ประกอบคอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
  'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
  'Other',
] as const;

export type RequestedServiceItem = (typeof REQUESTED_SERVICES_LIST)[number];

export const REQUESTED_SERVICES_TH: Record<string, string> = {
  'ติดตั้ง Windows': 'ติดตั้ง Windows (150 บาท)',
  'ติดตั้ง Microsoft office': 'ติดตั้ง Microsoft office (80 บาท)',
  'แก้ไขปัญหา Hardware': 'แก้ไขปัญหา Hardware (50 บาท)',
  'แก้ไขปัญหา Software': 'แก้ไขปัญหา Software (50 บาท)',
  'ตรวจสอบปัญหาเบื้องต้น': 'ตรวจสอบปัญหาเบื้องต้น (ฟรี)',
  'กำจัดไวรัสเบื้องต้น': 'กำจัดไวรัสเบื้องต้น (80 บาท)',
  'ทำความสะอาดคอมพิวเตอร์': 'ทำความสะอาดคอมพิวเตอร์ (50 บาท)',
  'ทำความสะอาดโน้ตบุ๊ก': 'ทำความสะอาดโน้ตบุ๊ก (50 บาท)',
  'ประกอบคอมพิวเตอร์ (นำชิ้นส่วนมาเอง)': 'ประกอบคอมพิวเตอร์ (นำชิ้นส่วนมาเอง - ฟรี)',
  'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง)': 'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง - ฟรี)',
  // รองรับข้อมูลเดิมในระบบ
  'Computer troubleshooting': 'ตรวจสอบปัญหาเบื้องต้น',
  'Hardware repair': 'แก้ไขปัญหา Hardware',
  'Software installation': 'ติดตั้ง Microsoft office',
  'Operating system installation': 'ติดตั้ง Windows',
  'Virus and malware removal': 'กำจัดไวรัสเบื้องต้น',
  'Network troubleshooting': 'แก้ไขปัญหาระบบเครือข่าย',
  'Printer troubleshooting': 'แก้ไขปัญหาเครื่องพิมพ์',
  'Data backup and recovery': 'สำรองและกู้คืนข้อมูลสำคัญ',
  'Hardware upgrade': 'เปลี่ยนอุปกรณ์คอมพิวเตอร์ (นำชิ้นส่วนมาเอง)',
  Other: 'บริการอื่นๆ / รายละเอียดเพิ่มเติม',
};

export const ACKNOWLEDGMENT_ITEMS = [
  'ข้าพเจ้ารับทราบรายการบริการและอัตราค่าบริการเบื้องต้นแล้ว และยินยอมให้ตรวจสอบอุปกรณ์ตามรายการที่เลือก',
  'หากพบปัญหาเพิ่มเติมหรือมีค่าใช้จ่ายนอกเหนือจากรายการข้างต้น ข้าพเจ้าจะได้รับการแจ้งให้ทราบก่อนดำเนินการ',
  'ข้าพเจ้าจะไม่เรียกร้องค่าเสียหายส่วนข้อมูลในเครื่อง และได้สำรองข้อมูลสำคัญก่อนรับบริการแล้ว (หากสามารถทำได้)',
] as const;

export function getServiceThaiLabel(serviceKeyOrLabel: string): string {
  if (serviceKeyOrLabel in REQUESTED_SERVICES_TH) {
    return REQUESTED_SERVICES_TH[serviceKeyOrLabel];
  }
  return serviceKeyOrLabel;
}

export function getDeviceTypeThaiLabel(deviceType: string): string {
  if (deviceType in DEVICE_TYPE_LABELS_TH) {
    return DEVICE_TYPE_LABELS_TH[deviceType as DeviceType];
  }
  return deviceType;
}

export function calculateEstimatedServiceCost(selectedKeys: string[]): number {
  let sum = 0;
  for (const item of SERVICE_CATALOG) {
    if (selectedKeys.includes(item.key)) {
      sum += item.priceAmount;
    }
  }
  return sum;
}

export const STATUS_LABELS_TH: Record<'Completed' | 'In Progress' | 'Pending', string> = {
  Completed: 'ซ่อมเสร็จแล้ว (พร้อมรับเครื่อง)',
  'In Progress': 'กำลังตรวจซ่อม',
  Pending: 'รอคิวตรวจเช็ก',
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
  OtherDeviceText?: string;
  DeviceBrandModel: string;
  DeviceSerialNumber: string;
  ProblemDescription: string;
  AdditionalDetails: string;
  RequestedServices: string; // JSON array or comma-separated list
  OtherServiceText: string;
  ReceiverName?: string;
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
  dayTechnicianLabel: string;
  title: string;
  subtitle: string;
  shiftLabel: string;
  workingHoursLabel: string;
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
    dayTechnicianLabel: 'ช่างวันจันทร์',
    title: 'ใบลงเวลาการทำงาน — ช่างวันจันทร์',
    subtitle: 'ช่างวันจันทร์ : วัชรากร คำชมภู และ ล้อมพงษ์ สระทองมี (เวลาทำงาน 09:00 - 16:00)',
    shiftLabel: 'ช่างวันจันทร์ : วัชรากร คำชมภู และ ล้อมพงษ์ สระทองมี',
    workingHoursLabel: '09:00 - 16:00',
    worksheetName: 'Work Time - Monday Technician',
    memberCount: 2,
    defaultMembers: ['วัชรากร คำชมภู', 'ล้อมพงษ์ สระทองมี'],
    tabId: 'work-time-group-1',
    badgeColor: 'blue',
  },
  GROUP_2: {
    id: 'GROUP_2',
    groupNumber: 2,
    dayTechnicianLabel: 'ช่างวันอังคาร',
    title: 'ใบลงเวลาการทำงาน — ช่างวันอังคาร',
    subtitle: 'ช่างวันอังคาร : วีรยุทธ เปลี่ยนแก้ว และ ภควัต สุวรรณเกิด (เวลาทำงาน 09:00 - 16:00)',
    shiftLabel: 'ช่างวันอังคาร : วีรยุทธ เปลี่ยนแก้ว และ ภควัต สุวรรณเกิด',
    workingHoursLabel: '09:00 - 16:00',
    worksheetName: 'Work Time - Tuesday Technician',
    memberCount: 2,
    defaultMembers: ['วีรยุทธ เปลี่ยนแก้ว', 'ภควัต สุวรรณเกิด'],
    tabId: 'work-time-group-2',
    badgeColor: 'emerald',
  },
  GROUP_3: {
    id: 'GROUP_3',
    groupNumber: 3,
    dayTechnicianLabel: 'ช่างวันศุกร์',
    title: 'ใบลงเวลาการทำงาน — ช่างวันศุกร์',
    subtitle: 'ช่างวันศุกร์ : ปทิตตา แจ่มเล็ก กับ ศริษฐา จาคีไพบูลย์ และ ณัฐกุล แซ่ก๋วย (เวลาทำงาน 09:00 - 16:00)',
    shiftLabel: 'ช่างวันศุกร์ : ปทิตตา แจ่มเล็ก กับ ศริษฐา จาคีไพบูลย์ และ ณัฐกุล แซ่ก๋วย',
    workingHoursLabel: '09:00 - 16:00',
    worksheetName: 'Work Time - Friday Technician',
    memberCount: 3,
    defaultMembers: ['ปทิตตา แจ่มเล็ก', 'ศริษฐา จาคีไพบูลย์', 'ณัฐกุล แซ่ก๋วย'],
    tabId: 'work-time-group-3',
    badgeColor: 'amber',
  },
};

export const WORKSHEET_NAMES: Record<SheetKey, string> = {
  REQUESTS: 'IT Support Requests',
  GROUP_1: 'Work Time - Monday Technician',
  GROUP_2: 'Work Time - Tuesday Technician',
  GROUP_3: 'Work Time - Friday Technician',
};

export const WORKSHEET_LABELS_TH: Record<SheetKey, string> = {
  REQUESTS: 'รายการแจ้งซ่อมทั้งหมด',
  GROUP_1: 'ช่างวันจันทร์ (2 คน)',
  GROUP_2: 'ช่างวันอังคาร (2 คน)',
  GROUP_3: 'ช่างวันศุกร์ (3 คน)',
};

export interface TechnicianOption {
  name: string;
  shift: string;
  groupKey: 'GROUP_1' | 'GROUP_2' | 'GROUP_3';
}

/**
 * รายชื่อช่าง IT Support ทั้ง 7 คน (ช่างวันจันทร์ 2 คน, ช่างวันอังคาร 2 คน, ช่างวันศุกร์ 3 คน)
 */
export const DEFAULT_TECHNICIANS: TechnicianOption[] = [
  { name: 'วัชรากร คำชมภู', shift: 'ช่างวันจันทร์', groupKey: 'GROUP_1' },
  { name: 'ล้อมพงษ์ สระทองมี', shift: 'ช่างวันจันทร์', groupKey: 'GROUP_1' },
  { name: 'วีรยุทธ เปลี่ยนแก้ว', shift: 'ช่างวันอังคาร', groupKey: 'GROUP_2' },
  { name: 'ภควัต สุวรรณเกิด', shift: 'ช่างวันอังคาร', groupKey: 'GROUP_2' },
  { name: 'ปทิตตา แจ่มเล็ก', shift: 'ช่างวันศุกร์', groupKey: 'GROUP_3' },
  { name: 'ศริษฐา จาคีไพบูลย์', shift: 'ช่างวันศุกร์', groupKey: 'GROUP_3' },
  { name: 'ณัฐกุล แซ่ก๋วย', shift: 'ช่างวันศุกร์', groupKey: 'GROUP_3' },
];

/**
 * ดึงรายชื่อช่างทั้ง 7 คนแบบไดนามิก (ซิงก์กับชื่อที่แก้ไขใน Local Storage หากมี)
 */
export function getAllTechnicians(): TechnicianOption[] {
  try {
    const list: TechnicianOption[] = [];
    const groupKeys: ('GROUP_1' | 'GROUP_2' | 'GROUP_3')[] = ['GROUP_1', 'GROUP_2', 'GROUP_3'];
    for (const gk of groupKeys) {
      const g = WORK_TIME_GROUPS[gk];
      const storageKey = `it_support_member_names_${gk}_v1`;
      const saved = localStorage.getItem(storageKey);
      let names = g.defaultMembers;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === g.memberCount) {
            names = parsed;
          }
        } catch {
          // ignore
        }
      }
      for (const n of names) {
        list.push({ name: n, shift: g.dayTechnicianLabel, groupKey: gk });
      }
    }
    if (list.length === 7) return list;
  } catch {
    // ignore
  }
  return DEFAULT_TECHNICIANS;
}
