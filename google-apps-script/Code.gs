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
    ]
  }
};

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

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0 || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    var headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, config.headers.length).getValues()[0];
    var mismatch = false;
    for (var i = 0; i < config.headers.length; i++) {
      if (String(existingHeaders[i]).trim() !== config.headers[i]) {
        mismatch = true;
        break;
      }
    }
    if (mismatch) {
      sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    }
  }
  return { sheet: sheet, headers: config.headers, name: config.name };
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
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
      }
      obj[headers[c]] = val !== undefined && val !== null ? String(val) : '';
      if (obj[headers[c]] !== '') {
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
    var nowIso = new Date().toISOString();

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
      record.CreatedAt = record.CreatedAt || nowIso;
      record.UpdatedAt = nowIso;

      // Auto-calculate SequenceNo for work time sheets if not provided
      if (sheetKey !== 'REQUESTS') {
        record.SequenceNo = String(existing.length + 1);
      }

      var newRow = headers.map(function(h) {
        return record[h] !== undefined && record[h] !== null ? String(record[h]) : '';
      });

      sheet.appendRow(newRow);

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

      record.UpdatedAt = nowIso;
      var updatedRow = headers.map(function(h) {
        return record[h] !== undefined && record[h] !== null ? String(record[h]) : '';
      });
      sheet.getRange(foundRowIndex, 1, 1, headers.length).setValues([updatedRow]);

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

