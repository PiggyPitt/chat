import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFileSync } from 'node:child_process';
import { ChatSocketClient } from './socket-client.js';
import { cliConfig } from './cli-config.js';
import { checkAndUpdate } from './updater.js';
import { VERSION } from '../../version.js';
import { AnsiHyperlink } from '../../shared/terminal/AnsiHyperlink.js';
import { detectDragDropPath, uploadImageFile, captureAndUploadClipboard } from './commands/image.command.js';
import { ManagementNotificationService } from './notifications/ManagementNotificationService.js';
import { InstallerBootstrapService } from './installer/InstallerBootstrapService.js';

// Switch Windows console to UTF-8 so Thai and other Unicode characters render correctly.
// chcp.com is the codepage utility; 65001 = UTF-8.
if (process.platform === 'win32') {
  try {
    execFileSync('chcp.com', ['65001'], { stdio: 'ignore', windowsHide: true });
  } catch { /* non-critical — falls back to whatever the user's active code page is */ }
}

function formatDate(value: string | Date): string {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${MM}/${yyyy} ${HH}:${mm}`;
}

function clearInputLine(): void {
  process.stdout.write('\x1b[1A\x1b[2K\r');
}

function printAbovePrompt(text: string, rl: readline.Interface): void {
  const currentInput = (rl as any).line as string ?? '';
  const cursorOffset = (rl as any)._cursor as number ?? currentInput.length;
  process.stdout.write(`\r\x1b[K${text}\n> ${currentInput}`);
  if (cursorOffset < currentInput.length) {
    process.stdout.write(`\x1b[${currentInput.length - cursorOffset}D`);
  }
}

function renderMessageContent(type: string | undefined, content: string): string {
  if (type === 'image') {
    return `${AnsiHyperlink.imageLink(content)}  ${AnsiHyperlink.downloadLink(content)}`;
  }
  return AnsiHyperlink.autoLink(content);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: { error?: string };
  try {
    body = JSON.parse(text) as { error?: string };
  } catch {
    if (!response.ok) throw new Error(`Server error (${response.status})`);
    throw new Error('Invalid response from server');
  }
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body as T;
}

async function requestJson<T>(path: string, payload: unknown, token?: string): Promise<T> {
  const response = await fetch(`${cliConfig.serverUrl}/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return parseJsonResponse<T>(response);
}

async function requestGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${cliConfig.serverUrl}/api/${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseJsonResponse<T>(response);
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output, terminal: true });

  console.log('');
  console.log('  ┌─────────────────────────────┐');
  console.log(`  │   Terminal Chat  v${VERSION.padEnd(9)}│`);
  console.log('  └─────────────────────────────┘');
  console.log('');

  while (true) {
    console.log('  1. Register');
    console.log('  2. Login');
    console.log('  3. Exit');
    console.log('');

    const choice = (await rl.question('  Select [1-3]: ')).trim();
    clearInputLine();
    console.log('');

    if (choice === '3' || choice.toLowerCase() === 'exit') {
      console.log('  Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (choice === '1') {
      try {
        const username = await rl.question('  Username: ');
        clearInputLine();
        const password = await rl.question('  Password: ');
        clearInputLine();
        await requestJson<{ userId: string; username: string }>('auth/register', { username, password });
        console.log('\n  Registered! Your account is pending admin approval.\n');
      } catch (error) {
        console.error(`\n  Error: ${(error as Error).message}\n`);
      }
      continue;
    }

    if (choice === '2') {
      try {
        const username = await rl.question('  Username: ');
        clearInputLine();
        const password = await rl.question('  Password: ');
        clearInputLine();
        const result = await requestJson<{ token: string; userId: string; username: string; role: string }>('auth/login', { username, password });
        console.log(`\n  Welcome, ${result.username}!\n`);
        await startSession(result, rl);
        return;
      } catch (error) {
        console.error(`\n  Error: ${(error as Error).message}\n`);
      }
      continue;
    }

    console.log('  Invalid choice. Please enter 1, 2, or 3.\n');
  }
}

async function startSession(
  auth: { token: string; userId: string; username: string; role: string },
  rl: readline.Interface
): Promise<void> {
  const client = new ChatSocketClient(auth.token);
  client.connect();

  const notificationService = new ManagementNotificationService();
  notificationService.setCurrentUserId(auth.userId);

  let currentRoomId: string | null = null;
  let currentRoomName: string | null = null;
  let currentRoomPassword: string | undefined = undefined;
  let isFirstConnect = true;

  client.onConnect(() => {
    if (isFirstConnect) {
      isFirstConnect = false;
      return;
    }
    printAbovePrompt('  [reconnected]', rl);
    if (currentRoomName) {
      client.joinRoom(currentRoomName, currentRoomPassword)
        .then(({ roomId }) => {
          currentRoomId = roomId;
          printAbovePrompt(`  [back in room: ${currentRoomName}]`, rl);
        })
        .catch(() => {
          printAbovePrompt(`  [could not rejoin ${currentRoomName}]`, rl);
        });
    }
  });

  client.onDisconnect((reason) => {
    printAbovePrompt(`  [disconnected: ${reason} — reconnecting...]`, rl);
  });

  client.onNewMessage((payload) => {
    notificationService.handleIncomingMessage(payload);
    const rendered = renderMessageContent(payload.message.type, payload.message.content);
    printAbovePrompt(`  [${formatDate(payload.message.createdAt)}] ${payload.senderUsername}: ${rendered}`, rl);
  });

  client.onUserJoined((payload) => {
    printAbovePrompt(`  ${payload.username} joined the room`, rl);
  });

  client.onUserLeft((payload) => {
    printAbovePrompt(`  ${payload.username} left the room`, rl);
  });

  printHelp(auth.role);

  while (true) {
    const command = (await rl.question('> ')).trim();
    clearInputLine();

    if (!command) continue;

    try {
      const done = await handleCommand(
        command, auth.token, auth.role, client, currentRoomId, currentRoomName, notificationService,
        (id, name, password) => {
          currentRoomId = id;
          currentRoomName = name;
          currentRoomPassword = password;
        }
      );
      if (done) {
        client.disconnect();
        rl.close();
        process.exit(0);
      }
    } catch (error) {
      console.error(`  Error: ${(error as Error).message}`);
    }
  }
}

async function handleCommand(
  command: string,
  token: string,
  role: string,
  client: ChatSocketClient,
  currentRoomId: string | null,
  currentRoomName: string | null,
  notificationService: ManagementNotificationService,
  setRoom: (id: string | null, name: string | null, password?: string) => void
): Promise<boolean> {
  // Detect drag-and-drop: Windows Terminal pastes the file path when a file is dragged in
  const dragDropPath = detectDragDropPath(command);
  if (dragDropPath) {
    if (!currentRoomId) {
      console.log('  Join a room first to send an image.');
      return false;
    }
    console.log('  Detected image file, uploading...');
    const result = await uploadImageFile(dragDropPath, cliConfig.serverUrl, token);
    await client.sendImage(currentRoomId, result.publicUrl);
    console.log('  Image sent.');
    return false;
  }

  const [action, ...args] = command.split(' ');

  switch (action) {
    case 'rooms': {
      const data = await requestGet<{ rooms: { id: string; name: string; hasPassword?: boolean }[] }>('rooms', token);
      console.log('');
      data.rooms.forEach((room, i) => {
        console.log(`  ${i + 1}. ${room.name}${room.hasPassword ? ' [P]' : ''}`);
      });
      console.log('');
      return false;
    }

    case 'create': {
      const pIdx = args.indexOf('-p');
      const roomName = (pIdx !== -1 ? args.slice(0, pIdx) : args).join(' ');
      const password = pIdx !== -1 ? args.slice(pIdx + 1).join(' ') : undefined;
      if (!roomName) {
        console.log('  Usage: create <room-name> [-p <password>]');
        return false;
      }
      await requestJson('rooms', { name: roomName, password }, token);
      console.log(`  Room created: ${roomName}${password ? ' (password protected)' : ''}`);
      return false;
    }

    case 'join': {
      const pIdx = args.indexOf('-p');
      const roomName = (pIdx !== -1 ? args.slice(0, pIdx) : args).join(' ');
      const password = pIdx !== -1 ? args.slice(pIdx + 1).join(' ') : undefined;
      if (!roomName) {
        console.log('  Usage: join <room-name> [-p <password>]');
        return false;
      }
      const { roomId, messages } = await client.joinRoom(roomName, password);
      setRoom(roomId, roomName, password);
      notificationService.setCurrentRoom(roomName);
      console.log(`  Joined: ${roomName}\n`);
      (messages as { senderUsername: string; type?: string; content: string; createdAt: string }[]).forEach((m) => {
        const rendered = renderMessageContent(m.type, m.content);
        console.log(`  [${formatDate(m.createdAt)}] ${m.senderUsername}: ${rendered}`);
      });
      if (messages.length > 0) console.log('');
      return false;
    }

    case 'leave': {
      const roomName = args.join(' ') || currentRoomName;
      if (!roomName) {
        console.log('  Not in any room.');
        return false;
      }
      await client.leaveRoom(roomName);
      setRoom(null, null);
      notificationService.setCurrentRoom(null);
      console.log(`  Left room: ${roomName}`);
      return false;
    }

    case 'users': {
      if (!currentRoomId) {
        console.log('  Join a room first.');
        return false;
      }
      const users = await client.listUsers(currentRoomId);
      console.log(`  Online: ${users.join(', ')}`);
      return false;
    }

    case '/upload': {
      if (!currentRoomId) {
        console.log('  Join a room first.');
        return false;
      }
      const filePath = args.join(' ');
      if (!filePath) {
        console.log('  Usage: /upload <path-to-image>');
        return false;
      }
      console.log('  Uploading...');
      const result = await uploadImageFile(filePath, cliConfig.serverUrl, token);
      await client.sendImage(currentRoomId, result.publicUrl);
      console.log('  Image sent.');
      return false;
    }

    case '/paste-image': {
      if (!currentRoomId) {
        console.log('  Join a room first.');
        return false;
      }
      console.log('  Reading clipboard...');
      const result = await captureAndUploadClipboard(cliConfig.serverUrl, token);
      if (!result) {
        console.log('  No image found in clipboard.');
        return false;
      }
      await client.sendImage(currentRoomId, result.publicUrl);
      console.log('  Image sent.');
      return false;
    }

    case 'msg': {
      if (!currentRoomId) {
        console.log('  Join a room first.');
        return false;
      }
      const content = args.join(' ');
      if (!content) {
        console.log('  Usage: msg <message>');
        return false;
      }
      await client.sendMessage(currentRoomId, content);
      return false;
    }

    case '/requestedregister': {
      if (role !== 'admin') {
        console.log('  Unknown command. Type help for commands.');
        return false;
      }
      const data = await requestGet<{ users: { id: string; username: string; createdAt: string }[] }>('admin/pending', token);
      console.log('');
      if (data.users.length === 0) {
        console.log('  No pending registrations.');
      } else {
        console.log('  Pending registrations:');
        data.users.forEach((u, i) => {
          console.log(`  ${i + 1}. ${u.username}  (id: ${u.id})  registered: ${formatDate(u.createdAt)}`);
        });
      }
      console.log('');
      return false;
    }

    case '/approve': {
      if (role !== 'admin') {
        console.log('  Unknown command. Type help for commands.');
        return false;
      }
      const target = args.join(' ').trim();
      if (!target) {
        console.log('  Usage: /approve <username or userId>');
        return false;
      }
      await requestJson(`admin/approve/${encodeURIComponent(target)}`, {}, token);
      console.log(`  Approved: ${target}`);
      return false;
    }

    case '/reject': {
      if (role !== 'admin') {
        console.log('  Unknown command. Type help for commands.');
        return false;
      }
      const target = args.join(' ').trim();
      if (!target) {
        console.log('  Usage: /reject <username or userId>');
        return false;
      }
      await requestJson(`admin/reject/${encodeURIComponent(target)}`, {}, token);
      console.log(`  Rejected: ${target}`);
      return false;
    }

    case '/mute': {
      if (!currentRoomName) {
        console.log('  Join a room first.');
        return false;
      }
      const nowMuted = notificationService.toggleMute(currentRoomName);
      console.log(`  Notifications for "${currentRoomName}": ${nowMuted ? 'muted' : 'enabled'}`);
      return false;
    }

    case 'help':
      printHelp(role);
      return false;

    case 'exit':
    case 'quit':
      console.log('  Goodbye!');
      return true;

    default:
      if (currentRoomId) {
        await client.sendMessage(currentRoomId, command);
      } else {
        console.log(`  Unknown command: "${action}". Type help for commands.`);
      }
      return false;
  }
}

function printHelp(role: string): void {
  console.log('');
  console.log('  Command                         Description');
  console.log('  ──────────────────────────────────────────────────────────');
  console.log('  rooms                           List all rooms');
  console.log('  create <name> [-p <password>]   Create a room');
  console.log('  join   <name> [-p <password>]   Join a room');
  console.log('  <message>                       Send a message (when in room)');
  console.log('  /upload <path>                  Upload and send an image file');
  console.log('  /paste-image                    Win+Shift+S then type this to send');
  console.log('  <drag or paste image path>      Drag & drop image file into terminal');
  console.log('  users                           List online users');
  console.log('  leave  <name>                   Leave a room');
  console.log('  /mute                           Toggle notifications for current room');
  if (role === 'admin') {
    console.log('  ──────────────────────────────────────────────────────────');
    console.log('  /requestedregister              List pending registrations');
    console.log('  /approve <username or userId>   Approve a pending user');
    console.log('  /reject  <username or userId>   Reject a pending user');
  }
  console.log('  exit                            Quit');
  console.log('  ──────────────────────────────────────────────────────────');
  console.log('');
}

try {
  InstallerBootstrapService.runIfNeeded();
} catch (error) {
  console.error(`  [installer] ${(error as Error).message}`);
  // non-fatal — continue with normal startup
}

checkAndUpdate()
  .then(() => main())
  .catch((error) => {
    console.error('Fatal error:', (error as Error).message);
    process.stdin.pause();
    setTimeout(() => process.exit(1), 3000);
  });
