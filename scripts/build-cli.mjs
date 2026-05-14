#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;

// Inject current version into src/version.ts before compiling
writeFileSync('src/version.ts', `export const VERSION = "${version}";\n`);
console.log(`Building chat-cli v${version}...`);

// Compile TypeScript
execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });

// Bundle into standalone exe
execSync(
  'npx pkg dist/presentation/cli/index.js --targets node22-win-x64 --output dist/chat-cli.exe',
  { stdio: 'inherit' }
);

console.log(`\nDone: dist/chat-cli.exe (v${version})`);
