#!/usr/bin/env node
import { spawnSync } from 'child_process';

// Runs both test suites unconditionally (unlike `a && b`, a failing backend suite must
// not prevent the frontend suite from running) and reports the combined result.
const suites = [
  ['test', 'backend (Jest)'],
  ['test:frontend', 'frontend (Vitest)']
];

let failed = false;

for (const [script, label] of suites) {
  console.log(`\n> Running ${label}...\n`);
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: true });
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error('\nOne or more test suites failed.\n');
  process.exit(1);
}
