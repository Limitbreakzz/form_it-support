/**
 * ฟังก์ชันจัดการรูปแบบวันที่ เวลา เลขที่ใบรับบริการ และการส่งออกไฟล์ CSV/Excel (รองรับภาษาไทย)
 */

/** ดึงส่วนประกอบวันเวลาปัจจุบันตามเวลาประเทศไทย (Asia/Bangkok) ไม่ขึ้นกับเขตเวลาของเครื่อง */
function getBangkokParts(): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

export function getCurrentDateISO(): string {
  const p = getBangkokParts();
  return `${p.year}-${p.month}-${p.day}`;
}

/** เวลาปัจจุบันแบบ 24 ชม. "HH:mm" (Asia/Bangkok) */
export function getCurrentTime24(): string {
  const p = getBangkokParts();
  return `${p.hour}:${p.minute}`;
}

export function generateUniqueReceiptNumber(existingReceipts: string[] = []): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;

  let candidate = '';
  let attempts = 0;
  do {
    const rand = Math.floor(1000 + Math.random() * 9000);
    candidate = `ITS-${datePart}-${rand}`;
    attempts++;
  } while (existingReceipts.includes(candidate) && attempts < 50);

  return candidate;
}

export function generateRecordId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * จัดรูปแบบเบอร์โทรศัพท์สำหรับแสดงผล:
 * - ตัดเครื่องหมาย ' นำหน้า (ถ้ามีจากการเก็บ plain text ใน Google Sheets)
 * - เติมเลข 0 นำหน้าอัตโนมัติหากมี 9 หลัก (เช่น 615929399 -> 0615929399)
 * - หากเป็นค่าว่างให้คืนค่า '-'
 */
export function formatDisplayPhoneNumber(phoneStr?: string | null): string {
  if (!phoneStr) return '-';
  let clean = String(phoneStr).trim().replace(/^'+/, '');
  if (!clean || clean === '-') return '-';
  if (/^[689]\d{8}$/.test(clean)) {
    clean = `0${clean}`;
  }
  return clean;
}

/**
 * แสดงผลวันที่ในรูปแบบภาษาไทยที่อ่านง่าย เช่น "18 พ.ย. 2569"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const cleaned = dateStr.split('T')[0];
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }
  return cleaned;
}

/**
 * แสดงผลเวลาในรูปแบบ 24 ชั่วโมง (24-Hour Clock HH:mm น.) ตามมาตรฐานไทย (Asia/Bangkok)
 * ป้องกันการแสดงผลแบบ AM/PM อย่างสิ้นเชิง
 */
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '—';
  const trimmed = timeStr.trim();

  // กรณีเป็น ISO string หรือมีวันที่ติดมาด้วย เช่น "2026-11-18T19:26:00.000Z"
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleTimeString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' น.'
      );
    }
  }

  // กรณีเป็นรูปแบบข้อความเวลา เช่น "19:26", "19:26:00", หรือมี AM/PM หลงมา
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2];
    const meridian = match12[3].toUpperCase();
    if (meridian === 'PM' && hour < 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute} น.`;
  }

  // รูปแบบ "HH:mm" ปกติ
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, '0').slice(-2);
    const m = parts[1].slice(0, 2).padStart(2, '0');
    return `${h}:${m} น.`;
  }

  return `${trimmed} น.`;
}

/**
 * แปลงสตริงเวลาใดๆ ให้เป็นรูปแบบ HH:mm มาตรฐาน (24 ชม.)
 */
export function formatTimeTo24Hours(timeStr: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2];
    const meridian = match12[3].toUpperCase();
    if (meridian === 'PM' && hour < 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, '0').slice(-2);
    const m = parts[1].slice(0, 2).padStart(2, '0');
    return `${h}:${m}`;
  }
  return trimmed.slice(0, 5);
}

export function calculateDurationHours(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '—';
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '—';

  let diffMinutes = eh * 60 + em - (sh * 60 + sm);
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hrs} ชั่วโมง`;
  return `${hrs} ชั่วโมง ${mins} นาที`;
}

export function parseServicesList(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Fallback to comma-separated string
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function exportToExcelCSV(filename: string, headers: string[], rows: string[][]): void {
  const escapeCell = (val: string) => {
    const str = String(val ?? '');
    const sanitized = str.startsWith('data:image/') ? '[ลงลายมือชื่อดิจิทัลแล้ว]' : str;
    if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ];

  // Add UTF-8 BOM for Microsoft Excel Thai font compatibility
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
