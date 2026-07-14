#!/usr/bin/env node
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;

// Inject current version into src/version.ts before compiling
writeFileSync('src/version.ts', `export const VERSION = "${version}";\n`);
console.log(`Building chat-cli v${version}...`);

// Inject server URL/socket path from .env into src/presentation/cli/cli-config.ts before compiling.
// The compiled exe ships to end users without .env, so this must be baked in at build time.
const serverUrl = process.env.SERVER_URL;
if (!serverUrl) {
  console.error('Error: SERVER_URL is not set in .env');
  process.exit(1);
}
const socketPath = process.env.SOCKET_PATH ?? '/socket.io';
writeFileSync(
  'src/presentation/cli/cli-config.ts',
  `export const cliConfig = {\n  serverUrl: '${serverUrl}',\n  socketPath: '${socketPath}',\n};\n`
);
console.log(`Using server URL: ${serverUrl}`);

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
