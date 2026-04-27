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
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

process.on('warning', (warning) => {
  if (
    warning &&
    warning.message &&
    typeof warning.message === 'string' &&
    warning.message.includes('unrecognized HMR message')
  ) {
    return;
  }
  console.warn(warning);
});

const { spawn } = require('child_process');

// Matches every known shape of the Turbopack HMR ping noise, including the
// standalone `[Error: ...]` line, the `⨯ unhandledRejection:` line, and
// `client-file-logs` chatter coming from the dev overlay.
const HMR_NOISE_PATTERNS = [
  /unrecognized HMR message/i,
  /client-file-logs/i,
];

const isHMRNoise = (line) => {
  if (!line) return false;
  return HMR_NOISE_PATTERNS.some((re) => re.test(line));
};

// Rolling buffer handles chunk boundaries: a single console.error can be
// split across several `data` events, so we only emit complete lines.
const createStreamFilter = (writeStream) => {
  let buffer = '';
  return (chunk) => {
    buffer += chunk.toString();
    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';
    for (const line of parts) {
      if (!isHMRNoise(line)) {
        writeStream.write(line + '\n');
      }
    }
  };
};

const path = require('path');
// Use forward slashes so NODE_OPTIONS survives Windows cmd.exe + paths with spaces.
const silencePreloadPath = path
  .join(__dirname, 'silence-hmr.js')
  .replace(/\\/g, '/');

const args = process.argv.slice(2);
const command = args[0] || 'next';
const commandArgs = args.slice(1);

const existingNodeOptions = process.env.NODE_OPTIONS || '';
const requireFlag = `--require "${silencePreloadPath}"`;
const mergedNodeOptions = existingNodeOptions.includes('silence-hmr.js')
  ? existingNodeOptions
  : [existingNodeOptions, requireFlag].filter(Boolean).join(' ');

const child = spawn('npx', [command, ...commandArgs], {
  // Pipe BOTH stdout and stderr because Turbopack routes the HMR errors
  // through stdout (via console.error of the unhandledRejection handler),
  // not only stderr.
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    NODE_OPTIONS: mergedNodeOptions,
  },
});

const filterStdout = createStreamFilter(process.stdout);
const filterStderr = createStreamFilter(process.stderr);

child.stdout.on('data', filterStdout);
child.stderr.on('data', filterStderr);

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('Error starting dev server:', error);
  process.exit(1);
});

