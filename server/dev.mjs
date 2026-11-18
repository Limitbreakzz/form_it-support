/**
 * Unified Development Runner (`npm run dev`)
 * Starts both:
 *   1. Backend API Server on 0.0.0.0:4100
 *   2. Frontend Vite Dev Server on 0.0.0.0:3100
 */

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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

const lanIps = getLanIpAddresses();

console.log('======================================================================');
console.log('  STARTING IT SUPPORT SYSTEM (FRONTEND + BACKEND FOR LAN ACCESS)');
console.log('----------------------------------------------------------------------');
console.log('  Frontend (Local):   http://localhost:3100');
for (const ip of lanIps) {
  console.log(`  Frontend (LAN):     http://${ip}:3100`);
}
console.log('  Backend API (Local): http://localhost:4100/api/health');
for (const ip of lanIps) {
  console.log(`  Backend API (LAN):   http://${ip}:4100/api/health`);
}
console.log('======================================================================');

const backendProc = spawn(process.execPath, [path.join(__dirname, 'index.mjs')], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, BACKEND_PORT: '4100' },
});

const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const frontendProc = spawn(process.execPath, [viteBin, '--host', '0.0.0.0', '--port', '3100'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env },
});

function shutdown() {
  if (!backendProc.killed) backendProc.kill();
  if (!frontendProc.killed) frontendProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

frontendProc.on('exit', (code) => {
  if (!backendProc.killed) backendProc.kill();
  process.exit(code ?? 0);
});

