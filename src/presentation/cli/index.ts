import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ChatSocketClient } from './socket-client.js';
import { cliConfig } from './cli-config.js';
import { checkAndUpdate } from './updater.js';
import { VERSION } from '../../version.js';

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
  // After readline echoes the input and adds \n, cursor is on next line.
  // Move up + clear the typed line so it doesn't appear in output.
  process.stdout.write('\x1b[1A\x1b[2K\r');
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
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body as T;
}

async function requestGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${cliConfig.serverUrl}/api/${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body as T;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output, terminal: true });

  console.log('');
  console.log('  ┌─────────────────────────────┐');
  console.log(`  │   Terminal Chat  v${VERSION.padEnd(9)}│`);
  console.log(`  │   ${cliConfig.serverUrl.replace('https://', '')}   │`);
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
        console.log('\n  Registered! Please login.\n');
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
        const result = await requestJson<{ token: string; userId: string; username: string }>('auth/login', { username, password });
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
  auth: { token: string; userId: string; username: string },
  rl: readline.Interface
): Promise<void> {
  const client = new ChatSocketClient(auth.token);
  client.connect();

  let currentRoomId: string | null = null;
  let currentRoomName: string | null = null;
  let currentRoomPassword: string | undefined = undefined;
  let isFirstConnect = true;

  client.onConnect(() => {
    if (isFirstConnect) {
      isFirstConnect = false;
      return;
    }
    // Reconnected — rejoin the room if we were in one
    process.stdout.write('\r\x1b[K  [reconnected]\n> ');
    if (currentRoomName) {
      client.joinRoom(currentRoomName, currentRoomPassword)
        .then(({ roomId }) => {
          currentRoomId = roomId;
          process.stdout.write(`\r\x1b[K  [back in room: ${currentRoomName}]\n> `);
        })
        .catch(() => {
          process.stdout.write(`\r\x1b[K  [could not rejoin ${currentRoomName}]\n> `);
        });
    }
  });

  client.onDisconnect((reason) => {
    process.stdout.write(`\r\x1b[K  [disconnected: ${reason} — reconnecting...]\n> `);
  });

  client.onNewMessage((payload) => {
    const msg = payload.message as { content: string; createdAt: string };
    const sender = (payload as unknown as { senderUsername: string }).senderUsername;
    process.stdout.write(`\r\x1b[K  [${formatDate(msg.createdAt)}] ${sender}: ${msg.content}\n> `);
  });

  client.onUserJoined((payload) => {
    const p = payload as unknown as { username: string; roomId: string };
    process.stdout.write(`\r\x1b[K  ${p.username} joined the room\n> `);
  });

  client.onUserLeft((payload) => {
    const p = payload as unknown as { username: string; roomId: string };
    process.stdout.write(`\r\x1b[K  ${p.username} left the room\n> `);
  });

  printHelp();

  while (true) {
    const command = (await rl.question('> ')).trim();
    clearInputLine();
    if (!command) continue;

    try {
      const done = await handleCommand(
        command, auth.token, client, currentRoomId,
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
  client: ChatSocketClient,
  currentRoomId: string | null,
  setRoom: (id: string | null, name: string | null, password?: string) => void
): Promise<boolean> {
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
      console.log(`  Joined: ${roomName}\n`);
      (messages as { senderUsername: string; content: string; createdAt: string }[]).forEach((m) => {
        console.log(`  [${formatDate(m.createdAt)}] ${m.senderUsername}: ${m.content}`);
      });
      if (messages.length > 0) console.log('');
      return false;
    }

    case 'leave': {
      const roomName = args.join(' ');
      if (!roomName) {
        console.log('  Usage: leave <room-name>');
        return false;
      }
      await client.leaveRoom(roomName);
      setRoom(null, null);
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

    case 'msg': {
      // explicit msg command still works
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

    case 'help':
      printHelp();
      return false;

    case 'exit':
    case 'quit':
      console.log('  Goodbye!');
      return true;

    default:
      // If inside a room, treat any unrecognized input as a message
      if (currentRoomId) {
        await client.sendMessage(currentRoomId, command);
      } else {
        console.log(`  Unknown command: "${action}". Type help for commands.`);
      }
      return false;
  }
}

function printHelp(): void {
  console.log('');
  console.log('  Command                         Description');
  console.log('  ──────────────────────────────────────────────────');
  console.log('  rooms                           List all rooms');
  console.log('  create <name> [-p <password>]   Create a room');
  console.log('  join   <name> [-p <password>]   Join a room');
  console.log('  <message>                       Send a message (when in room)');
  console.log('  users                           List online users');
  console.log('  leave  <name>                   Leave a room');
  console.log('  exit                            Quit');
  console.log('  ──────────────────────────────────────────────────');
  console.log('');
}

checkAndUpdate()
  .then(() => main())
  .catch((error) => {
    console.error('Fatal error:', (error as Error).message);
    process.stdin.pause();
    setTimeout(() => process.exit(1), 3000);
  });
