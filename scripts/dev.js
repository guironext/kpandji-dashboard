#!/usr/bin/env node

// Suppress HMR ping errors before starting Next.js
process.on('unhandledRejection', (reason) => {
  if (
    reason &&
    typeof reason === 'object' &&
    'message' in reason &&
    typeof reason.message === 'string' &&
    reason.message.includes('unrecognized HMR message')
  ) {
    // Silently ignore HMR ping errors
    return;
  }
  // Log other unhandled rejections
  console.error('Unhandled Rejection:', reason);
});

process.on('warning', (warning) => {
  if (
    warning &&
    warning.message &&
    typeof warning.message === 'string' &&
    warning.message.includes('unrecognized HMR message')
  ) {
    // Silently ignore HMR ping warnings
    return;
  }
  // Show other warnings
  console.warn(warning);
});

const { spawn } = require('child_process');

// Filter out HMR ping errors from stderr
const filterHMRErrors = (data) => {
  const text = data.toString();
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return !(
      lowerLine.includes('unrecognized hmr message') &&
      (lowerLine.includes('ping') || lowerLine.includes('{"event":"ping"}'))
    );
  });
  return filtered.join('\n');
};

const args = process.argv.slice(2);
const command = args[0] || 'next';
const commandArgs = args.slice(1);

const child = spawn('npx', [command, ...commandArgs], {
  stdio: ['inherit', 'inherit', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});

child.stderr.on('data', (data) => {
  const filtered = filterHMRErrors(data);
  if (filtered.trim()) {
    process.stderr.write(filtered);
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Error starting dev server:', error);
  process.exit(1);
});

