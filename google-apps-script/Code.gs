/**
 * ============================================================================
 * IT SUPPORT RECORD MANAGEMENT SYSTEM — GOOGLE APPS SCRIPT BACKEND API
 * ============================================================================
 *
 * Worksheets automatically managed by this script:
 *   1. "IT Support Requests"
 *   2. "Work Time - Monday Technician"
 *   3. "Work Time - Tuesday Technician"
 *   4. "Work Time - Friday Technician"
 *
 * Deployment Instructions:
 *   1. Open your Google Sheet -> Extensions -> Apps Script.
 *   2. Paste this entire file into Code.gs (replacing existing code).
 *   3. Click Save (Ctrl+S).
 *   4. Click "Deploy" -> "New deployment".
 *   5. Select type: "Web app".
 *   6. Set "Execute as": "Me".
 *   7. Set "Who has access": "Anyone".
 *   8. Click "Deploy", authorize access, and copy the Web App URL.
 *   9. Paste the Web App URL into the Web Application's Google Sheets Connection Settings
 *      or set VITE_GAS_WEB_APP_URL in your .env file.
 */

var SHEET_CONFIG = {
  REQUESTS: {
    name: 'IT Support Requests',
    headers: [
      'RecordID',
      'ReceiptNumber',
      'Date',
      'Time',
      'FullName',
      'PhoneNumber',
      'Department',
      'DeviceType',
      'DeviceBrandModel',
      'DeviceSerialNumber',
      'ProblemDescription',
      'AdditionalDetails',
      'RequestedServices',
      'OtherServiceText',
      'OtherDeviceText',
      'ReceiverName',
      'CreatedAt',
      'UpdatedAt'
    ],
    thaiHeaders: [
      'รหัสรายการ (RecordID)',
      'เลขที่ใบรับบริการ',
      'วันที่',
      'เวลา',
      'ชื่อ-นามสกุล',
      'เบอร์โทรศัพท์',
      'แผนก/สาขาวิชา',
      'ชนิดอุปกรณ์',
      'ยี่ห้อและรุ่น',
      'หมายเลขเครื่อง (S/N)',
      'อาการเสีย/ปัญหาที่พบ',
      'ประเมินค่าบริการ',
      'บริการที่เลือก',
      'บริการอื่น ๆ',
      'อุปกรณ์อื่น ๆ',
      'ช่างผู้รับเรื่อง',
      'เวลาบันทึกระบบ',
      'เวลาอัปเดตล่าสุด'
    ]
  },
  GROUP_1: {
    name: 'Work Time - Monday Technician',
    headers: [
      'RecordID',
      'SequenceNo',
      'Date',
      'WorkStartTime',
      'WorkEndTime',
      'Member1Name',
      'Member1Signature',
      'Member2Name',
      'Member2Signature',
      'Remarks',
      'CreatedAt',
      'UpdatedAt'
    ],
    thaiHeaders: [
      'รหัสรายการ',
      'ลำดับที่',
      'วันที่ปฏิบัติงาน',
      'เวลาเข้างาน',
      'เวลาออกงาน',
      'ชื่อช่างคนที่ 1',
      'ลายเซ็นช่างคนที่ 1',
      'ชื่อช่างคนที่ 2',
      'ลายเซ็นช่างคนที่ 2',
      'หมายเหตุ',
      'เวลาบันทึกระบบ',
      'เวลาอัปเดตล่าสุด'
    ]
  },
  GROUP_2: {
    name: 'Work Time - Tuesday Technician',
    headers: [
      'RecordID',
      'SequenceNo',
      'Date',
      'WorkStartTime',
      'WorkEndTime',
      'Member1Name',
      'Member1Signature',
      'Member2Name',
      'Member2Signature',
      'Member3Name',
      'Member3Signature',
      'Remarks',
      'CreatedAt',
      'UpdatedAt'
    ],
    thaiHeaders: [
      'รหัสรายการ',
      'ลำดับที่',
      'วันที่ปฏิบัติงาน',
      'เวลาเข้างาน',
      'เวลาออกงาน',
      'ชื่อช่างคนที่ 1',
      'ลายเซ็นช่างคนที่ 1',
      'ชื่อช่างคนที่ 2',
      'ลายเซ็นช่างคนที่ 2',
      'ชื่อช่างคนที่ 3',
      'ลายเซ็นช่างคนที่ 3',
      'หมายเหตุ',
      'เวลาบันทึกระบบ',
      'เวลาอัปเดตล่าสุด'
    ]
  },
  GROUP_3: {
    name: 'Work Time - Friday Technician',
    headers: [
      'RecordID',
      'SequenceNo',
      'Date',
      'WorkStartTime',
      'WorkEndTime',
      'Member1Name',
      'Member1Signature',
      'Member2Name',
      'Member2Signature',
      'Member3Name',
      'Member3Signature',
      'Remarks',
      'CreatedAt',
      'UpdatedAt'
    ],
    thaiHeaders: [
      'รหัสรายการ',
      'ลำดับที่',
      'วันที่ปฏิบัติงาน',
      'เวลาเข้างาน',
      'เวลาออกงาน',
      'ชื่อช่างคนที่ 1',
      'ลายเซ็นช่างคนที่ 1',
      'ชื่อช่างคนที่ 2',
      'ลายเซ็นช่างคนที่ 2',
      'ชื่อช่างคนที่ 3',
      'ลายเซ็นช่างคนที่ 3',
      'หมายเหตุ',
      'เวลาบันทึกระบบ',
      'เวลาอัปเดตล่าสุด'
    ]
  }
};

/**
 * ============================================================================
 * ฟังก์ชันสร้างและตั้งค่า Google Sheet ใหม่ทั้งหมดแบบ 100% (กด "เรียกใช้" / Run เพียงครั้งเดียว)
 * ============================================================================
 * สิ่งที่ฟังก์ชันนี้ทำให้คุณโดยอัตโนมัติ:
 * 1. สร้างครบทั้ง 4 แผ่นงานตามชื่อที่ระบบต้องการ
 * 2. ตั้งหัวตาราง (Row 1) ด้วยสีน้ำเงินเข้ม ตัวหนา ล็อกแถวบนสุด (Freeze 1 Row)
 * 3. คอลัมน์เบอร์โทรศัพท์ (F: PhoneNumber) จะถูกล็อกเป็น Plain Text (@) ทั้งคอลัมน์ทันที
 *    -> ทำให้เลข 0 นำหน้า (เช่น 0615929399) ไม่หายแน่นอน 100%
 * 4. ลบแผ่นงานเปล่าเริ่มต้น ("แผ่นงาน1" หรือ "Sheet1") ออกให้อัตโนมัติ
 */
function setupNewSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var keys = ['REQUESTS', 'GROUP_1', 'GROUP_2', 'GROUP_3'];
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var config = SHEET_CONFIG[key];
    var sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    }

    var displayHeaders = config.thaiHeaders || config.headers;
    sheet.getRange(1, 1, 1, displayHeaders.length).setValues([displayHeaders]);
    var headerRange = sheet.getRange(1, 1, 1, displayHeaders.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    if (key === 'REQUESTS') {
      var phoneIdx = config.headers.indexOf('PhoneNumber');
      if (phoneIdx !== -1) {
        sheet.getRange(1, phoneIdx + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
      }
    }
  }

  // ลบแผ่นงานตั้งต้นที่ว่างเปล่า (Sheet1 หรือ แผ่นงาน1) ถ้ามี
  var defaultSheets = ['Sheet1', 'แผ่นงาน1', 'Sheet 1'];
  for (var d = 0; d < defaultSheets.length; d++) {
    var s = ss.getSheetByName(defaultSheets[d]);
    if (s && ss.getSheets().length > 1) {
      try {
        ss.deleteSheet(s);
      } catch (e) {}
    }
  }

  Logger.log('สร้างและตั้งค่าชีตทั้งหมดพร้อมหัวข้อภาษาไทยเสร็จสมบูรณ์เรียบร้อยแล้ว!');
}

/**
 * ฟังก์ชันช่วยตั้งค่าและปรับปรุงชีตอัตโนมัติ (สามารถเลือกกดปุ่ม "เรียกใช้" / Run ใน Apps Script ได้เลย)
 * - เปลี่ยนหัวตารางแถวที่ 1 ของทั้ง 4 แผ่นงานให้เป็น "ภาษาไทย" สวยงามและเข้าใจง่าย
 * - จัดรูปแบบคอลัมน์เบอร์โทรศัพท์ (F) ทั้งคอลัมน์ให้เป็น Plain Text (@) เพื่อให้เลข 0 ไม่หาย
 * - เติมเลข 0 ให้เบอร์เก่าในชีตที่เลข 0 หายไป (เช่น 615929399 -> 0615929399)
 * - ใส่เครื่องหมาย '-' ให้กับเซลล์ที่ว่างทั้งหมด
 */
function setupAndFormatSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = ['REQUESTS', 'GROUP_1', 'GROUP_2', 'GROUP_3'];

  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var config = SHEET_CONFIG[key];
    var sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    }

    var displayHeaders = config.thaiHeaders || config.headers;
    sheet.getRange(1, 1, 1, displayHeaders.length).setValues([displayHeaders]);
    var headerRange = sheet.getRange(1, 1, 1, displayHeaders.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = range.getValues();
      for (var r = 0; r < values.length; r++) {
        for (var c = 0; c < values[r].length; c++) {
          var val = values[r][c];
          if (val instanceof Date) {
            values[r][c] = Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyy-MM-dd');
            continue;
          }
          var str = (val !== undefined && val !== null) ? String(val).trim() : '';
          
          // ตัดเวลา ISO ทิ้ง ให้เหลือเฉพาะวันที่ (เช่น 2026-11-19T03:40:23.079Z -> 2026-11-19)
          if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
            str = str.split('T')[0];
            values[r][c] = str;
          }

          if (key === 'REQUESTS' && c === 5) {
            // คอลัมน์เบอร์โทรศัพท์ (PhoneNumber)
            if (str && /^[689]\d{8}$/.test(str)) {
              values[r][c] = '0' + str;
            }
          } else {
            if (!str || str === '') {
              values[r][c] = '-';
            }
          }
        }
      }
      range.setValues(values);
    }

    if (key === 'REQUESTS') {
      var phoneIdx = config.headers.indexOf('PhoneNumber');
      if (phoneIdx !== -1) {
        sheet.getRange(1, phoneIdx + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
      }
    }
  }

  Logger.log('อัปเดตหัวข้อภาษาไทย ตัดเวลา T ให้เหลือแค่วันที่ และจัดรูปแบบตารางทั้ง 4 ชีตเรียบร้อยแล้ว!');
}

/**
 * Formats a value for writing into Google Sheets:
 * - Empty / blank / null / undefined values become '-'
 * - PhoneNumber is stored as plain text with leading zeros intact
 * - CreatedAt / UpdatedAt are stored as date only (YYYY-MM-DD), no ISO time (T03:40:23.079Z)
 */
function formatCellForSheet(header, rawVal) {
  var str = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';
  if (!str || str === '') {
    return '-';
  }
  if (header === 'PhoneNumber') {
    if (str === '-') return '-';
    var cleanPhone = str.replace(/^'+/, '').trim();
    if (/^[689]\d{8}$/.test(cleanPhone)) {
      cleanPhone = '0' + cleanPhone;
    }
    return cleanPhone.startsWith("'") ? cleanPhone : "'" + cleanPhone;
  }
  if (header === 'CreatedAt' || header === 'UpdatedAt') {
    if (str === '-') return '-';
    if (str.indexOf('T') !== -1) {
      return str.split('T')[0];
    }
    return str;
  }
  return str;
}

/**
 * Ensures a worksheet exists and has the required header row.
 */
function ensureSheet(sheetKey) {
  var config = SHEET_CONFIG[sheetKey];
  if (!config) {
    throw new Error('Invalid worksheet key: ' + sheetKey);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(config.name);
  if (!sheet) {
    sheet = ss.insertSheet(config.name);
  }

  var displayHeaders = config.thaiHeaders || config.headers;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0 || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, displayHeaders.length).setValues([displayHeaders]);
    var headerRange = sheet.getRange(1, 1, 1, displayHeaders.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    var maxCols = Math.max(lastCol, displayHeaders.length);
    var existingHeaders = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    var isThai = true;
    for (var i = 0; i < displayHeaders.length; i++) {
      if (String(existingHeaders[i] || '').trim() !== String(displayHeaders[i]).trim()) {
        isThai = false;
        break;
      }
    }
    if (!isThai) {
      if (lastCol > displayHeaders.length) {
        sheet.getRange(1, displayHeaders.length + 1, 1, lastCol - displayHeaders.length).clearContent();
      }
      sheet.getRange(1, 1, 1, displayHeaders.length).setValues([displayHeaders]);
      var updatedHeaderRange = sheet.getRange(1, 1, 1, displayHeaders.length);
      updatedHeaderRange.setFontWeight('bold');
      updatedHeaderRange.setBackground('#1e293b');
      updatedHeaderRange.setFontColor('#ffffff');
    }
  }

  // Format PhoneNumber column as plain text '@' in Google Sheets
  if (sheetKey === 'REQUESTS') {
    var phoneIdx = config.headers.indexOf('PhoneNumber');
    if (phoneIdx !== -1) {
      sheet.getRange(2, phoneIdx + 1, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');
    }
  }

  return { sheet: sheet, headers: config.headers, thaiHeaders: displayHeaders, name: config.name };
}

/**
 * Initializes all 4 required worksheets at once.
 */
function initializeAllSheets() {
  ensureSheet('REQUESTS');
  ensureSheet('GROUP_1');
  ensureSheet('GROUP_2');
  ensureSheet('GROUP_3');
}

/**
 * Reads all rows from a worksheet as an array of objects keyed by header name.
 */
function readSheetRecords(sheetKey) {
  var info = ensureSheet(sheetKey);
  var sheet = info.sheet;
  var headers = info.headers;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var records = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    var hasContent = false;
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Bangkok', "yyyy-MM-dd");
      }
      var strVal = (val !== undefined && val !== null) ? String(val).trim() : '';
      if (headers[c] === 'PhoneNumber') {
        if (strVal.startsWith("'")) {
          strVal = strVal.substring(1);
        } else if (/^[689]\d{8}$/.test(strVal)) {
          strVal = '0' + strVal;
        }
      }
      if ((headers[c] === 'CreatedAt' || headers[c] === 'UpdatedAt') && strVal.indexOf('T') !== -1) {
        strVal = strVal.split('T')[0];
      }
      obj[headers[c]] = strVal;
      if (strVal !== '' && strVal !== '-') {
        hasContent = true;
      }
    }
    if (hasContent) {
      records.push(obj);
    }
  }
  return records;
}

/**
 * Handles HTTP GET requests.
 * Supports ?action=ping, ?action=getAll, or ?action=getSheet&sheetKey=REQUESTS
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
    initializeAllSheets();

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Connected to Google Sheets IT Support Backend',
        sheets: [
          SHEET_CONFIG.REQUESTS.name,
          SHEET_CONFIG.GROUP_1.name,
          SHEET_CONFIG.GROUP_2.name,
          SHEET_CONFIG.GROUP_3.name
        ],
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getSheet') {
      var sheetKey = e.parameter.sheetKey;
      var records = readSheetRecords(sheetKey);
      return jsonResponse({
        success: true,
        sheetKey: sheetKey,
        sheetName: SHEET_CONFIG[sheetKey].name,
        records: records
      });
    }

    return jsonResponse({
      success: true,
      data: {
        REQUESTS: readSheetRecords('REQUESTS'),
        GROUP_1: readSheetRecords('GROUP_1'),
        GROUP_2: readSheetRecords('GROUP_2'),
        GROUP_3: readSheetRecords('GROUP_3')
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || String(err)
    });
  }
}

/**
 * Handles HTTP POST requests.
 * Uses text/plain JSON payload to avoid CORS preflight issues in browsers.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    initializeAllSheets();

    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var action = payload.action;
    var sheetKey = payload.sheetKey;
    var record = payload.record || {};
    var nowDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyy-MM-dd');

    if (action === 'initSheets') {
      return jsonResponse({
        success: true,
        message: 'All 4 worksheets initialized with headers.'
      });
    }

    var info = ensureSheet(sheetKey);
    var sheet = info.sheet;
    var headers = info.headers;

    if (action === 'create') {
      // Prevent duplicate submission by RecordID or ReceiptNumber
      var existing = readSheetRecords(sheetKey);
      for (var i = 0; i < existing.length; i++) {
        if (record.RecordID && existing[i].RecordID === String(record.RecordID)) {
          return jsonResponse({
            success: false,
            error: 'Duplicate submission prevented: RecordID ' + record.RecordID + ' already exists.'
          });
        }
        if (sheetKey === 'REQUESTS' && record.ReceiptNumber && existing[i].ReceiptNumber === String(record.ReceiptNumber)) {
          return jsonResponse({
            success: false,
            error: 'Duplicate Receipt Number prevented: ' + record.ReceiptNumber + ' already exists.'
          });
        }
      }

      if (!record.RecordID) {
        record.RecordID = Utilities.getUuid();
      }
      var createdRaw = record.CreatedAt ? String(record.CreatedAt) : nowDate;
      record.CreatedAt = (createdRaw.indexOf('T') !== -1) ? createdRaw.split('T')[0] : createdRaw;
      record.UpdatedAt = nowDate;

      // Auto-calculate SequenceNo for work time sheets if not provided
      if (sheetKey !== 'REQUESTS') {
        record.SequenceNo = String(existing.length + 1);
      }

      var newRow = headers.map(function(h) {
        return formatCellForSheet(h, record[h]);
      });

      sheet.appendRow(newRow);

      // Force format PhoneNumber cell as Plain Text with leading zero
      if (sheetKey === 'REQUESTS') {
        var phoneIdx = headers.indexOf('PhoneNumber');
        if (phoneIdx !== -1) {
          var lastRowIdx = sheet.getLastRow();
          var rawPhone = record.PhoneNumber ? String(record.PhoneNumber).replace(/^'+/, '').trim() : '';
          if (/^[689]\d{8}$/.test(rawPhone)) {
            rawPhone = '0' + rawPhone;
          }
          var cell = sheet.getRange(lastRowIdx, phoneIdx + 1);
          cell.setNumberFormat('@');
          cell.setValue(rawPhone || '-');
        }
      }

      return jsonResponse({
        success: true,
        action: 'create',
        sheetKey: sheetKey,
        sheetName: info.name,
        record: record
      });
    }

    if (action === 'update') {
      var targetId = String(record.RecordID || '');
      if (!targetId) {
        throw new Error('RecordID is required for updating a record.');
      }
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        throw new Error('Worksheet is empty.');
      }
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      var foundRowIndex = -1;
      for (var r = 0; r < idValues.length; r++) {
        if (String(idValues[r][0]) === targetId) {
          foundRowIndex = r + 2;
          break;
        }
      }
      if (foundRowIndex === -1) {
        throw new Error('Record not found with RecordID: ' + targetId);
      }

      record.UpdatedAt = nowDate;
      var updatedRow = headers.map(function(h) {
        return formatCellForSheet(h, record[h]);
      });
      sheet.getRange(foundRowIndex, 1, 1, headers.length).setValues([updatedRow]);

      // Force format PhoneNumber cell as Plain Text with leading zero
      if (sheetKey === 'REQUESTS') {
        var phoneIdx = headers.indexOf('PhoneNumber');
        if (phoneIdx !== -1) {
          var rawPhone = record.PhoneNumber ? String(record.PhoneNumber).replace(/^'+/, '').trim() : '';
          if (/^[689]\d{8}$/.test(rawPhone)) {
            rawPhone = '0' + rawPhone;
          }
          var cell = sheet.getRange(foundRowIndex, phoneIdx + 1);
          cell.setNumberFormat('@');
          cell.setValue(rawPhone || '-');
        }
      }

      return jsonResponse({
        success: true,
        action: 'update',
        sheetKey: sheetKey,
        sheetName: info.name,
        record: record
      });
    }

    if (action === 'delete') {
      var deleteId = String(payload.recordId || (record && record.RecordID) || '');
      if (!deleteId) {
        throw new Error('recordId is required for deletion.');
      }
      var totalRows = sheet.getLastRow();
      if (totalRows <= 1) {
        throw new Error('Worksheet has no data rows.');
      }
      var ids = sheet.getRange(2, 1, totalRows - 1, 1).getValues();
      var rowToDelete = -1;
      for (var d = 0; d < ids.length; d++) {
        if (String(ids[d][0]) === deleteId) {
          rowToDelete = d + 2;
          break;
        }
      }
      if (rowToDelete === -1) {
        throw new Error('Record not found for deletion: ' + deleteId);
      }

      sheet.deleteRow(rowToDelete);

      // Re-sequence SequenceNo for Work Time sheets after deletion
      if (sheetKey !== 'REQUESTS') {
        var newLastRow = sheet.getLastRow();
        if (newLastRow > 1) {
          var seqNumbers = [];
          for (var s = 1; s <= newLastRow - 1; s++) {
            seqNumbers.push([String(s)]);
          }
          sheet.getRange(2, 2, newLastRow - 1, 1).setValues(seqNumbers);
        }
      }

      return jsonResponse({
        success: true,
        action: 'delete',
        sheetKey: sheetKey,
        deletedRecordId: deleteId
      });
    }

    throw new Error('Unsupported action: ' + action);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || String(err)
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper to return JSON response with proper MIME type.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

