#!/usr/bin/env node
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;

// Inject current version into src/version.ts before compiling
writeFileSync('src/version.ts', `export const VERSION = "${version}";\n`);
console.log(`Building chat-cli v${version}...`);

// Remove existing exe before build — Windows locks running executables
const outPath = 'dist/chat-cli.exe';
if (existsSync(outPath)) {
  try {
    rmSync(outPath);
  } catch {
    console.error(`\nError: Cannot delete ${outPath}`);
    console.error('Close chat-cli.exe before building.\n');
    process.exit(1);
  }
}

// Compile TypeScript
execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });

// Bundle into standalone exe
execSync(
  `npx pkg dist/presentation/cli/index.js --targets node22-win-x64 --output ${outPath}`,
  { stdio: 'inherit' }
);

console.log(`\nDone: ${outPath} (v${version})`);
