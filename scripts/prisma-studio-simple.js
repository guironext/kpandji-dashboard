#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Read .env file and get DATABASE_URL
const envPath = path.join(__dirname, '..', '.env');
let databaseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split(/\r?\n/);
  let directUrl = '';
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmedLine.substring('DATABASE_URL='.length).trim();
      databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
    }
    if (trimmedLine.startsWith('DIRECT_URL=')) {
      directUrl = trimmedLine.substring('DIRECT_URL='.length).trim();
      directUrl = directUrl.replace(/^["']|["']$/g, '');
    }
  }
  // Use direct URL for Studio when available (fixes "Response from Engine was empty" with Neon pooled)
  if (directUrl) {
    databaseUrl = directUrl;
    console.log('✓ Using DIRECT_URL for Prisma Studio (Neon direct connection)');
  } else {
    console.log('✓ DATABASE_URL loaded from .env');
  }
}

if (!databaseUrl) {
  console.error('✗ Error: DATABASE_URL not found in .env file');
  process.exit(1);
}
console.log('Starting Prisma Studio...');

// Run Prisma Studio with explicit --url flag (required for Prisma 7.x)
const child = spawn('npx', ['prisma', 'studio', '--url', databaseUrl], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Error starting Prisma Studio:', error);
  process.exit(1);
});
