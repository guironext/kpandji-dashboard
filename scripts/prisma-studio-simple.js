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
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmedLine.substring('DATABASE_URL='.length).trim();
      // Remove quotes if present
      databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('✗ Error: DATABASE_URL not found in .env file');
  process.exit(1);
}

console.log('✓ DATABASE_URL loaded from .env');
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
