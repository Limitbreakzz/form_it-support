import {
  AnyWorkTimeRecord,
  ServiceRequestRecord,
  SheetKey,
  WorkTimeGroup1Record,
  WorkTimeGroup2Or3Record,
  WORKSHEET_NAMES,
} from '../types';
import { generateRecordId } from '../utils/formatters';

const STORAGE_KEYS: Record<SheetKey, string> = {
  REQUESTS: 'it_support_sheet_requests_v1',
  GROUP_1: 'it_support_sheet_group_1_v1',
  GROUP_2: 'it_support_sheet_group_2_v1',
  GROUP_3: 'it_support_sheet_group_3_v1',
};

const GAS_URL_STORAGE_KEY = 'it_support_gas_web_app_url_v1';
const ADMIN_PIN_STORAGE_KEY = 'it_support_admin_pin_v1';

export interface AllSheetsData {
  REQUESTS: ServiceRequestRecord[];
  GROUP_1: WorkTimeGroup1Record[];
  GROUP_2: WorkTimeGroup2Or3Record[];
  GROUP_3: WorkTimeGroup2Or3Record[];
}

export interface ApiActionResult<T = unknown> {
  success: boolean;
  syncedToCloud: boolean;
  sheetName: string;
  data?: T;
  error?: string;
}

/**
 * ตรวจสอบว่าแอปกำลังทำงานบนเครื่องตัวเอง (localhost) หรือในวง LAN หรือไม่
 * เพื่อไม่ให้ยิงหา Port 4100 เมื่อรันอยู่บนโฮสติ้งคลาวด์ เช่น Vercel
 */
export function isLocalOrLanEnvironment(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const h = window.location.hostname;
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.endsWith('.local')
  );
}

/**
 * สร้าง Base URL สำหรับเชื่อมต่อกับ LAN Backend Server (Port 4100) แบบไดนามิก
 * รองรับทั้งการเข้าผ่าน localhost และเข้าผ่าน IP ของเครื่องในวง LAN เดียวกัน
 */
export function getLanBackendBaseUrl(): string {
  const customEnv = import.meta.env.VITE_BACKEND_API_URL;
  if (customEnv && typeof customEnv === 'string' && customEnv.trim()) {
    return customEnv.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:4100`;
  }
  return 'http://localhost:4100';
}

async function fetchLanBackend<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  // หากรันอยู่บนคลาวด์ เช่น Vercel (form-it-support...vercel.app) ไม่ต้องพยายามเชื่อมต่อ Port 4100
  // เพื่อไม่ให้เสียเวลารอ Timeout 3.5 วินาทีทุกครั้งที่โหลดหน้าเว็บ
  if (!isLocalOrLanEnvironment() && !import.meta.env.VITE_BACKEND_API_URL) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const baseUrl = getLanBackendBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * ดึงค่า URL ของ Google Apps Script Web App ที่ตั้งค่าไว้
 */
export function getConfiguredGasUrl(): string {
  const fromStorage = localStorage.getItem(GAS_URL_STORAGE_KEY);
  if (fromStorage && fromStorage.trim().startsWith('https://script.google.com/')) {
    return fromStorage.trim();
  }
  const envUrl = import.meta.env.VITE_GAS_WEB_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('https://script.google.com/')) {
    return envUrl.trim();
  }
  return 'https://script.google.com/macros/s/AKfycbxCtB8Hkh1ARiCKdLir321BxeENl_5ybBEhFJrQTnlrLLELq_s5Xwep4Htd7eUfzDVe/exec';
}

export function setConfiguredGasUrl(url: string): void {
  const clean = url.trim();
  if (!clean) {
    localStorage.removeItem(GAS_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(GAS_URL_STORAGE_KEY, clean);
  }
  // ซิงก์การตั้งค่าไปยัง LAN Backend เพื่อให้ทุกอุปกรณ์ในวง LAN ใช้ URL เดียวกันอัตโนมัติ
  void fetchLanBackend('/api/config', {
    method: 'POST',
    body: JSON.stringify({ gasUrl: clean }),
  });
}

export function getAdminPasscode(): string {
  return localStorage.getItem(ADMIN_PIN_STORAGE_KEY) || '1234';
}

export function setAdminPasscode(pin: string): void {
  if (pin.trim().length >= 4) {
    const cleanPin = pin.trim();
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, cleanPin);
    void fetchLanBackend('/api/config', {
      method: 'POST',
      body: JSON.stringify({ adminPin: cleanPin }),
    });
  }
}

/**
 * อ่านและเขียนข้อมูลสำรองในหน่วยความจำเบราว์เซอร์ (ป้องกันข้อมูลสูญหายกรณีอินเทอร์เน็ตขัดข้อง)
 */
export function getLocalSheetRecords<T>(sheetKey: SheetKey): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[sheetKey]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalSheetRecords<T>(sheetKey: SheetKey, records: T[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS[sheetKey], JSON.stringify(records));
  } catch (e) {
    console.error('ไม่สามารถสำรองข้อมูลลงในหน่วยความจำเครื่องได้:', e);
  }
}

/**
 * ดึงข้อมูลที่มีอยู่ในหน่วยความจำเครื่อง (LocalStorage) ทั้งหมดทันที 0ms
 * เพื่อนำมาแสดงผลแบบ Instant (Stale-While-Revalidate) ป้องกันตัวเลขสถิติแสดง 0 หรือตัวหนังสือกระพริบหายขณะโหลด
 */
export function getCachedAllSheetsData(): AllSheetsData {
  return {
    REQUESTS: getLocalSheetRecords<ServiceRequestRecord>('REQUESTS'),
    GROUP_1: getLocalSheetRecords<WorkTimeGroup1Record>('GROUP_1'),
    GROUP_2: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_2'),
    GROUP_3: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_3'),
  };
}

/**
 * ทดสอบการเชื่อมต่อกับ Google Apps Script Web App URL
 */
export async function testGoogleSheetsConnection(customUrl?: string): Promise<{
  connected: boolean;
  message: string;
  sheets?: string[];
}> {
  const url = (customUrl ?? getConfiguredGasUrl()).trim();
  if (!url) {
    return {
      connected: false,
      message: 'ยังไม่ได้กำหนด URL ของ Google Apps Script Web App',
    };
  }
  if (!url.startsWith('https://script.google.com/macros/s/')) {
    return {
      connected: false,
      message: 'รูปแบบ URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}action=ping`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    if (json && json.success) {
      return {
        connected: true,
        message: 'เชื่อมต่อกับฐานข้อมูล Google Sheets สำเร็จเรียบร้อยแล้ว',
        sheets: json.sheets,
      };
    }
    return {
      connected: false,
      message: json?.error || 'ได้รับการตอบกลับที่ไม่สมบูรณ์จาก Google Apps Script',
    };
  } catch (err) {
    return {
      connected: false,
      message:
        err instanceof Error
          ? `ไม่สามารถเชื่อมต่อได้: ${err.message}`
          : 'ไม่สามารถติดต่อเซิร์ฟเวอร์ Google Apps Script ได้ในขณะนี้',
    };
  }
}

/**
 * ดึงข้อมูลทั้ง 4 แผ่นงานจาก Google Sheets และ LAN Backend พร้อมผสานข้อมูลในเครื่อง
 */
export async function fetchAllWorksheets(): Promise<{
  data: AllSheetsData;
  fromCloud: boolean;
  error?: string;
}> {
  // 1. ดึงข้อมูลและการตั้งค่าที่แชร์ร่วมกันจาก LAN Backend Server (Port 4100)
  const lanResponse = await fetchLanBackend<{
    success: boolean;
    data?: AllSheetsData;
    config?: { gasUrl?: string; adminPin?: string };
  }>('/api/sheets');

  if (lanResponse?.success && lanResponse.config) {
    if (lanResponse.config.gasUrl && !localStorage.getItem(GAS_URL_STORAGE_KEY)) {
      localStorage.setItem(GAS_URL_STORAGE_KEY, lanResponse.config.gasUrl);
    }
    if (lanResponse.config.adminPin) {
      localStorage.setItem(ADMIN_PIN_STORAGE_KEY, lanResponse.config.adminPin);
    }
  }

  const mergeRows = <T extends { RecordID: string }>(primary: T[], secondary: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of secondary) {
      if (item && item.RecordID) map.set(item.RecordID, item);
    }
    for (const item of primary) {
      if (item && item.RecordID) map.set(item.RecordID, item);
    }
    return Array.from(map.values());
  };

  const browserData: AllSheetsData = {
    REQUESTS: getLocalSheetRecords<ServiceRequestRecord>('REQUESTS'),
    GROUP_1: getLocalSheetRecords<WorkTimeGroup1Record>('GROUP_1'),
    GROUP_2: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_2'),
    GROUP_3: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_3'),
  };

  const localData: AllSheetsData = lanResponse?.data
    ? {
        REQUESTS: mergeRows(lanResponse.data.REQUESTS || [], browserData.REQUESTS),
        GROUP_1: mergeRows(lanResponse.data.GROUP_1 || [], browserData.GROUP_1),
        GROUP_2: mergeRows(lanResponse.data.GROUP_2 || [], browserData.GROUP_2),
        GROUP_3: mergeRows(lanResponse.data.GROUP_3 || [], browserData.GROUP_3),
      }
    : browserData;

  saveLocalSheetRecords('REQUESTS', localData.REQUESTS);
  saveLocalSheetRecords('GROUP_1', localData.GROUP_1);
  saveLocalSheetRecords('GROUP_2', localData.GROUP_2);
  saveLocalSheetRecords('GROUP_3', localData.GROUP_3);

  const url = getConfiguredGasUrl();
  if (!url) {
    if (lanResponse?.success) {
      void fetchLanBackend('/api/sheets', {
        method: 'PUT',
        body: JSON.stringify({ data: localData }),
      });
    }
    return { data: localData, fromCloud: false };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}action=getAll`, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || !json.success || !json.data) {
      throw new Error(json?.error || 'ข้อมูลที่ได้รับจาก Google Sheets API ไม่ถูกต้อง');
    }

    const markSynced = <T extends { RecordID: string }>(
      cloudRows: T[],
      localRows: T[]
    ): T[] => {
      const cloudIds = new Set(cloudRows.map((r) => r.RecordID));
      const unsyncedLocals = localRows.filter(
        (r) => !cloudIds.has(r.RecordID) && (r as { SyncStatus?: string }).SyncStatus === 'pending_sync'
      );
      return [
        ...cloudRows.map((r) => ({ ...r, SyncStatus: 'synced' as const })),
        ...unsyncedLocals,
      ];
    };

    const updatedData: AllSheetsData = {
      REQUESTS: markSynced(json.data.REQUESTS || [], localData.REQUESTS),
      GROUP_1: markSynced(json.data.GROUP_1 || [], localData.GROUP_1),
      GROUP_2: markSynced(json.data.GROUP_2 || [], localData.GROUP_2),
      GROUP_3: markSynced(json.data.GROUP_3 || [], localData.GROUP_3),
    };

    saveLocalSheetRecords('REQUESTS', updatedData.REQUESTS);
    saveLocalSheetRecords('GROUP_1', updatedData.GROUP_1);
    saveLocalSheetRecords('GROUP_2', updatedData.GROUP_2);
    saveLocalSheetRecords('GROUP_3', updatedData.GROUP_3);

    void fetchLanBackend('/api/sheets', {
      method: 'PUT',
      body: JSON.stringify({ data: updatedData }),
    });

    return { data: updatedData, fromCloud: true };
  } catch (err) {
    return {
      data: localData,
      fromCloud: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets',
    };
  }
}

/**
 * สร้างและบันทึกรายการใหม่ไปยังแผ่นงาน Google Sheets และ LAN Backend
 */
export async function createSheetRecord<
  T extends ServiceRequestRecord | AnyWorkTimeRecord
>(sheetKey: SheetKey, recordInput: T): Promise<ApiActionResult<T>> {
  const sheetName = WORKSHEET_NAMES[sheetKey];
  const existing = getLocalSheetRecords<T>(sheetKey);

  // ป้องกันการบันทึกข้อมูลซ้ำซ้อน
  const isDuplicateId = existing.some((r) => r.RecordID === recordInput.RecordID);
  if (isDuplicateId) {
    return {
      success: false,
      syncedToCloud: false,
      sheetName,
      error: 'ข้อมูลรายการนี้ถูกบันทึกไว้เรียบร้อยแล้ว ไม่จำเป็นต้องกดส่งซ้ำ',
    };
  }

  if (sheetKey === 'REQUESTS') {
    const reqInput = recordInput as ServiceRequestRecord;
    const isDuplicateReceipt = (existing as ServiceRequestRecord[]).some(
      (r) => r.ReceiptNumber === reqInput.ReceiptNumber
    );
    if (isDuplicateReceipt) {
      return {
        success: false,
        syncedToCloud: false,
        sheetName,
        error: `เลขที่ใบรับบริการ ${reqInput.ReceiptNumber} มีอยู่ในระบบแล้ว กรุณากดปุ่ม "เปลี่ยนเลขใบรับบริการใหม่" ด้านบนแล้วลองบันทึกอีกครั้ง`,
      };
    }
  }

  const nowIso = new Date().toISOString();
  const finalizedRecord: T = {
    ...recordInput,
    RecordID: recordInput.RecordID || generateRecordId(),
    CreatedAt: recordInput.CreatedAt || nowIso,
    UpdatedAt: nowIso,
  };

  if (sheetKey !== 'REQUESTS') {
    (finalizedRecord as AnyWorkTimeRecord).SequenceNo = String(existing.length + 1);
  }

  const url = getConfiguredGasUrl();
  if (!url) {
    const localRecord = { ...finalizedRecord, SyncStatus: 'pending_sync' as const };
    saveLocalSheetRecords(sheetKey, [...existing, localRecord]);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        sheetKey,
        record: localRecord,
      }),
    });
    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: localRecord,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'create',
        sheetKey,
        record: finalizedRecord,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || !json.success) {
      throw new Error(json?.error || 'Google Apps Script ตอบกลับข้อผิดพลาด');
    }

    const syncedRecord: T = {
      ...(json.record || finalizedRecord),
      SyncStatus: 'synced' as const,
    };
    saveLocalSheetRecords(sheetKey, [...existing, syncedRecord]);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        sheetKey,
        record: syncedRecord,
      }),
    });

    return {
      success: true,
      syncedToCloud: true,
      sheetName,
      data: syncedRecord,
    };
  } catch (err) {
    const fallbackRecord: T = { ...finalizedRecord, SyncStatus: 'pending_sync' as const };
    saveLocalSheetRecords(sheetKey, [...existing, fallbackRecord]);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        sheetKey,
        record: fallbackRecord,
      }),
    });

    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: fallbackRecord,
      error:
        err instanceof Error
          ? `สำรองข้อมูลไว้ในเครื่องแล้ว (รอซิงก์ขึ้น Google Sheets: ${err.message})`
          : 'สำรองข้อมูลไว้ในเครื่องแล้ว (ไม่สามารถเชื่อมต่อ Google Sheets ได้ชั่วคราว)',
    };
  }
}

/**
 * อัปเดตข้อมูลรายการที่มีอยู่แล้วในแผ่นงาน Google Sheets และ LAN Backend
 */
export async function updateSheetRecord<
  T extends ServiceRequestRecord | AnyWorkTimeRecord
>(sheetKey: SheetKey, updatedRecord: T): Promise<ApiActionResult<T>> {
  const sheetName = WORKSHEET_NAMES[sheetKey];
  const existing = getLocalSheetRecords<T>(sheetKey);
  const index = existing.findIndex((r) => r.RecordID === updatedRecord.RecordID);
  if (index === -1) {
    return {
      success: false,
      syncedToCloud: false,
      sheetName,
      error: 'ไม่พบข้อมูลรายการที่ต้องการแก้ไข',
    };
  }

  const nowIso = new Date().toISOString();
  const recordWithTimestamp: T = {
    ...updatedRecord,
    UpdatedAt: nowIso,
  };

  const url = getConfiguredGasUrl();
  if (!url) {
    const localUpdated: T = { ...recordWithTimestamp, SyncStatus: 'pending_sync' as const };
    const nextList = [...existing];
    nextList[index] = localUpdated;
    saveLocalSheetRecords(sheetKey, nextList);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        sheetKey,
        record: localUpdated,
      }),
    });
    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: localUpdated,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'update',
        sheetKey,
        record: recordWithTimestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || !json.success) {
      throw new Error(json?.error || 'ไม่สามารถอัปเดตข้อมูลใน Google Sheets ได้');
    }

    const syncedRecord: T = {
      ...recordWithTimestamp,
      SyncStatus: 'synced' as const,
    };
    const nextList = [...existing];
    nextList[index] = syncedRecord;
    saveLocalSheetRecords(sheetKey, nextList);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        sheetKey,
        record: syncedRecord,
      }),
    });

    return {
      success: true,
      syncedToCloud: true,
      sheetName,
      data: syncedRecord,
    };
  } catch (err) {
    const fallbackRecord: T = { ...recordWithTimestamp, SyncStatus: 'pending_sync' as const };
    const nextList = [...existing];
    nextList[index] = fallbackRecord;
    saveLocalSheetRecords(sheetKey, nextList);
    await fetchLanBackend('/api/sheets/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update',
        sheetKey,
        record: fallbackRecord,
      }),
    });

    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: fallbackRecord,
      error:
        err instanceof Error
          ? `บันทึกการแก้ไขในเครื่องแล้ว (รอซิงก์ Google Sheets: ${err.message})`
          : 'บันทึกการแก้ไขในเครื่องแล้ว',
    };
  }
}

/**
 * ลบข้อมูลออกจากแผ่นงาน Google Sheets และจัดลำดับเลขที่ (No.) ใหม่อัตโนมัติ
 */
export async function deleteSheetRecord(
  sheetKey: SheetKey,
  recordId: string
): Promise<ApiActionResult<{ deletedId: string }>> {
  const sheetName = WORKSHEET_NAMES[sheetKey];
  const existing = getLocalSheetRecords<ServiceRequestRecord | AnyWorkTimeRecord>(sheetKey);
  const filtered = existing.filter((r) => r.RecordID !== recordId);

  const resequenced =
    sheetKey === 'REQUESTS'
      ? filtered
      : filtered.map((item, idx) => ({
          ...item,
          SequenceNo: String(idx + 1),
        }));

  saveLocalSheetRecords(sheetKey, resequenced);
  await fetchLanBackend('/api/sheets/action', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      sheetKey,
      recordId,
    }),
  });

  const url = getConfiguredGasUrl();
  if (!url) {
    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: { deletedId: recordId },
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'delete',
        sheetKey,
        recordId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json || !json.success) {
      throw new Error(json?.error || 'ไม่สามารถลบข้อมูลใน Google Sheets ได้');
    }

    return {
      success: true,
      syncedToCloud: true,
      sheetName,
      data: { deletedId: recordId },
    };
  } catch (err) {
    return {
      success: true,
      syncedToCloud: false,
      sheetName,
      data: { deletedId: recordId },
      error:
        err instanceof Error
          ? `ลบข้อมูลในเครื่องแล้ว (ข้อผิดพลาด Google Sheets: ${err.message})`
          : 'ลบข้อมูลในเครื่องแล้ว',
    };
  }
}

/**
 * ซิงก์ข้อมูลที่ค้างอยู่ในเครื่องทั้งหมดขึ้นไปยัง Google Sheets
 */
export async function syncPendingRecordsToCloud(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const url = getConfiguredGasUrl();
  if (!url) return { syncedCount: 0, failedCount: 0 };

  const sheetKeys: SheetKey[] = ['REQUESTS', 'GROUP_1', 'GROUP_2', 'GROUP_3'];
  let syncedCount = 0;
  let failedCount = 0;

  for (const key of sheetKeys) {
    const records = getLocalSheetRecords<ServiceRequestRecord | AnyWorkTimeRecord>(key);
    const updatedList: (ServiceRequestRecord | AnyWorkTimeRecord)[] = [];

    for (const rec of records) {
      if (rec.SyncStatus === 'pending_sync' || !rec.SyncStatus) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'create',
              sheetKey: key,
              record: rec,
            }),
          });
          const json = await response.json();
          if (json && json.success) {
            updatedList.push({ ...rec, SyncStatus: 'synced' });
            syncedCount++;
          } else if (json?.error && String(json.error).includes('Duplicate')) {
            updatedList.push({ ...rec, SyncStatus: 'synced' });
          } else {
            updatedList.push(rec);
            failedCount++;
          }
        } catch {
          updatedList.push(rec);
          failedCount++;
        }
      } else {
        updatedList.push(rec);
      }
    }

    saveLocalSheetRecords(key, updatedList);
  }

  const allUpdated: AllSheetsData = {
    REQUESTS: getLocalSheetRecords<ServiceRequestRecord>('REQUESTS'),
    GROUP_1: getLocalSheetRecords<WorkTimeGroup1Record>('GROUP_1'),
    GROUP_2: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_2'),
    GROUP_3: getLocalSheetRecords<WorkTimeGroup2Or3Record>('GROUP_3'),
  };
  await fetchLanBackend('/api/sheets', {
    method: 'PUT',
    body: JSON.stringify({ data: allUpdated }),
  });

  return { syncedCount, failedCount };
}
