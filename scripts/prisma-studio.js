#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Read .env file and set environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  // Handle both Unix and Windows line endings
  const envLines = envContent.split(/\r?\n/);
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (key && cleanValue) {
          process.env[key] = cleanValue;
        }
      }
    }
  });
  
  // Debug: Log if DATABASE_URL was loaded
  if (process.env.DATABASE_URL) {
    console.log('✓ Environment variables loaded from .env');
  } else {
    console.warn('⚠ Warning: DATABASE_URL not found in .env file');
  }
} else {
  console.error('✗ Error: .env file not found at', envPath);
  process.exit(1);
}

// Run Prisma Studio
console.log('Starting Prisma Studio...');
const child = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Ensure DATABASE_URL is explicitly passed
    DATABASE_URL: process.env.DATABASE_URL,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Error starting Prisma Studio:', error);
  process.exit(1);
});
