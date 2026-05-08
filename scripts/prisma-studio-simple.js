#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.substring(0, eq).trim();
    let value = line.substring(eq + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

// .env.local takes precedence (Next.js convention), then .env.
const envFromFile = { ...parseEnvFile(envPath), ...parseEnvFile(envLocalPath) };

const DATABASE_URL = envFromFile.DATABASE_URL || process.env.DATABASE_URL || '';
const DIRECT_URL = envFromFile.DIRECT_URL || process.env.DIRECT_URL || '';
const DATABASE_URL_UNPOOLED =
  envFromFile.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED || '';

function enhanceNeonUrl(raw) {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.includes('neon.tech')) {
      if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
      if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '60');
      if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '30');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

// Derive a direct (unpooled) URL by stripping `-pooler` from the Neon hostname.
function derivedDirectFromPooled(raw) {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.hostname.includes('-pooler.') && url.hostname.includes('neon.tech')) {
      url.hostname = url.hostname.replace(/-pooler\./, '.');
      return url.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

let studioUrl = '';
let source = '';
if (DIRECT_URL) {
  studioUrl = DIRECT_URL;
  source = 'DIRECT_URL';
} else if (DATABASE_URL_UNPOOLED) {
  studioUrl = DATABASE_URL_UNPOOLED;
  source = 'DATABASE_URL_UNPOOLED';
} else if (DATABASE_URL) {
  const derived = derivedDirectFromPooled(DATABASE_URL);
  if (derived !== DATABASE_URL) {
    studioUrl = derived;
    source = 'DATABASE_URL (auto-stripped `-pooler`)';
  } else {
    studioUrl = DATABASE_URL;
    source = 'DATABASE_URL (no unpooled variant found)';
  }
}

if (!studioUrl) {
  console.error('✗ Error: no DATABASE_URL / DIRECT_URL / DATABASE_URL_UNPOOLED found in .env');
  process.exit(1);
}

studioUrl = enhanceNeonUrl(studioUrl);

console.log(`✓ Prisma Studio will connect via ${source}`);
console.log('  ', studioUrl.replace(/:\/\/[^@]+@/, '://***:***@'));
console.log('Starting Prisma Studio...');

const child = spawn('npx', ['prisma', 'studio', '--url', studioUrl], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: studioUrl,
    DIRECT_URL: studioUrl,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Error starting Prisma Studio:', error);
  process.exit(1);
});
