/**
 * ฟังก์ชันจัดการรูปแบบวันที่ เวลา เลขที่ใบรับบริการ และการส่งออกไฟล์ CSV/Excel (รองรับภาษาไทย)
 */

export function getCurrentDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime24(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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

export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '—';
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';
    }
  }
  return `${timeStr.slice(0, 5)} น.`;
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
