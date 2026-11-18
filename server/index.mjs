/**
 * ============================================================================
 * LOCAL NETWORK (LAN) BACKEND API SERVER (PORT 4100, HOST 0.0.0.0)
 * ============================================================================
 * Provides a shared LAN database (`server/lan-db.json`) so smartphones, tablets,
 * iPads, and computers connected to the same Wi-Fi/router share all records,
 * Google Sheets Web App URL configuration, and Admin PIN in real time.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.BACKEND_PORT || 4100);
const HOST = '0.0.0.0';
const DB_FILE_PATH = path.join(__dirname, 'lan-db.json');

const SHEET_NAMES = {
  REQUESTS: 'IT Support Requests',
  GROUP_1: 'Work Time - Monday Technician',
  GROUP_2: 'Work Time - Tuesday Technician',
  GROUP_3: 'Work Time - Friday Technician',
};

function createDefaultDb() {
  return {
    config: {
      gasUrl: process.env.VITE_GAS_WEB_APP_URL || '',
      adminPin: '1234',
    },
    sheets: {
      REQUESTS: [],
      GROUP_1: [],
      GROUP_2: [],
      GROUP_3: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial = createDefaultDb();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      config: {
        gasUrl: parsed?.config?.gasUrl ?? '',
        adminPin: parsed?.config?.adminPin || '1234',
      },
      sheets: {
        REQUESTS: Array.isArray(parsed?.sheets?.REQUESTS) ? parsed.sheets.REQUESTS : [],
        GROUP_1: Array.isArray(parsed?.sheets?.GROUP_1) ? parsed.sheets.GROUP_1 : [],
        GROUP_2: Array.isArray(parsed?.sheets?.GROUP_2) ? parsed.sheets.GROUP_2 : [],
        GROUP_3: Array.isArray(parsed?.sheets?.GROUP_3) ? parsed.sheets.GROUP_3 : [],
      },
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
    };
  } catch {
    return createDefaultDb();
  }
}

function writeDb(db) {
  try {
    db.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[LAN Backend] Failed to write database file:', err);
  }
}

function getLanIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // Health & LAN Network Info endpoint
    if (req.method === 'GET' && (pathname === '/api/health' || pathname === '/health')) {
      const db = readDb();
      sendJson(req, res, 200, {
        success: true,
        status: 'ok',
        frontendPort: 3100,
        backendPort: PORT,
        lanAddresses: getLanIpAddresses(),
        sheets: Object.values(SHEET_NAMES),
        hasGasUrl: Boolean(db.config.gasUrl),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get shared configuration (GAS URL & Admin PIN)
    if (req.method === 'GET' && pathname === '/api/config') {
      const db = readDb();
      sendJson(req, res, 200, {
        success: true,
        config: db.config,
      });
      return;
    }

    // Update shared configuration
    if (req.method === 'POST' && pathname === '/api/config') {
      const body = await parseJsonBody(req);
      const db = readDb();
      if (typeof body.gasUrl === 'string') {
        db.config.gasUrl = body.gasUrl.trim();
      }
      if (typeof body.adminPin === 'string' && body.adminPin.trim().length >= 4) {
        db.config.adminPin = body.adminPin.trim();
      }
      writeDb(db);
      sendJson(req, res, 200, {
        success: true,
        config: db.config,
      });
      return;
    }

    // Get all 4 worksheets
    if (req.method === 'GET' && pathname === '/api/sheets') {
      const db = readDb();
      sendJson(req, res, 200, {
        success: true,
        data: db.sheets,
        config: db.config,
        timestamp: db.updatedAt,
      });
      return;
    }

    // Bulk replace / sync all worksheets from cloud or client
    if (req.method === 'PUT' && pathname === '/api/sheets') {
      const body = await parseJsonBody(req);
      const db = readDb();
      if (body.data && typeof body.data === 'object') {
        for (const key of ['REQUESTS', 'GROUP_1', 'GROUP_2', 'GROUP_3']) {
          if (Array.isArray(body.data[key])) {
            db.sheets[key] = body.data[key];
          }
        }
        writeDb(db);
      }
      sendJson(req, res, 200, {
        success: true,
        data: db.sheets,
      });
      return;
    }

    // CRUD operations on a specific sheet (create, update, delete)
    if (req.method === 'POST' && pathname === '/api/sheets/action') {
      const body = await parseJsonBody(req);
      const { action, sheetKey, record, recordId } = body;

      if (!sheetKey || !(sheetKey in SHEET_NAMES)) {
        sendJson(req, res, 400, {
          success: false,
          error: `Invalid sheetKey: ${sheetKey}`,
        });
        return;
      }

      const db = readDb();
      const list = db.sheets[sheetKey] || [];

      if (action === 'create') {
        if (!record || typeof record !== 'object') {
          sendJson(req, res, 400, { success: false, error: 'Missing record payload' });
          return;
        }
        const exists = list.some((r) => r.RecordID === record.RecordID);
        if (!exists) {
          if (sheetKey !== 'REQUESTS') {
            record.SequenceNo = String(list.length + 1);
          }
          list.push(record);
          db.sheets[sheetKey] = list;
          writeDb(db);
        }
        sendJson(req, res, 200, {
          success: true,
          action: 'create',
          sheetKey,
          record,
          records: db.sheets[sheetKey],
        });
        return;
      }

      if (action === 'update') {
        if (!record || !record.RecordID) {
          sendJson(req, res, 400, { success: false, error: 'Missing RecordID for update' });
          return;
        }
        const idx = list.findIndex((r) => r.RecordID === record.RecordID);
        if (idx === -1) {
          list.push(record);
        } else {
          list[idx] = { ...list[idx], ...record };
        }
        db.sheets[sheetKey] = list;
        writeDb(db);
        sendJson(req, res, 200, {
          success: true,
          action: 'update',
          sheetKey,
          record,
          records: db.sheets[sheetKey],
        });
        return;
      }

      if (action === 'delete') {
        const targetId = recordId || record?.RecordID;
        const filtered = list.filter((r) => r.RecordID !== targetId);
        const resequenced =
          sheetKey === 'REQUESTS'
            ? filtered
            : filtered.map((item, idx) => ({
                ...item,
                SequenceNo: String(idx + 1),
              }));
        db.sheets[sheetKey] = resequenced;
        writeDb(db);
        sendJson(req, res, 200, {
          success: true,
          action: 'delete',
          sheetKey,
          deletedId: targetId,
          records: db.sheets[sheetKey],
        });
        return;
      }

      sendJson(req, res, 400, {
        success: false,
        error: `Unsupported action: ${action}`,
      });
      return;
    }

    sendJson(req, res, 404, {
      success: false,
      error: `Endpoint not found: ${req.method} ${pathname}`,
    });
  } catch (err) {
    sendJson(req, res, 500, {
      success: false,
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
});

server.listen(PORT, HOST, () => {
  const lanIps = getLanIpAddresses();
  console.log('');
  console.log('======================================================================');
  console.log('  IT SUPPORT BACKEND API SERVER (LAN ENABLED)');
  console.log(`  Listening on:   http://${HOST}:${PORT}`);
  console.log(`  Localhost API:  http://localhost:${PORT}/api/health`);
  for (const ip of lanIps) {
    console.log(`  Network API:    http://${ip}:${PORT}/api/health`);
  }
  console.log('======================================================================');
});

