# Terminal Realtime Chat — CLAUDE.md

## Project Overview

Terminal-based real-time group chat. Users register (pending admin approval), log in, and chat inside named rooms via a CLI client. The server exposes REST + Socket.IO; the CLI client is distributed as a standalone binary.

- **Stack:** Node.js ≥22, TypeScript, Express, Socket.IO, MongoDB/Mongoose, JWT, bcrypt
- **Version file:** `src/version.ts` — bump here for releases
- **Build output:** `dist/` (tsc), standalone CLI binary via `@yao-pkg/pkg`

## Architecture — Clean Architecture

```
src/
  domain/               # Pure entities, no framework deps
    entities/           # User, Room, Message
  application/
    interfaces/
      repositories/     # IUserRepository, IRoomRepository, IMessageRepository, ISessionRepository
      services/         # IAuthService, IRoomService, IMessageService, IJwtService, IPasswordHashingService
    usecases/
      auth/             # RegisterUserUseCase, LoginUserUseCase
      room/             # CreateRoomUseCase, JoinRoomUseCase, LeaveRoomUseCase, ListRoomsUseCase
      message/          # SendMessageUseCase, GetRoomHistoryUseCase
      admin/            # ListPendingUsersUseCase, ApproveUserUseCase, RejectUserUseCase
      image/            # UploadImageUseCase
    dtos/               # auth.dto, room.dto, message.dto
    di/container.ts     # Manual DI — instantiates all deps, single Container class
  infrastructure/
    repositories/       # MongoUserRepository, MongoRoomRepository, MongoMessageRepository, MongoSessionRepository
    services/           # AuthService, RoomService, MessageService
    security/           # BcryptService, JwtService
    db/mongo/           # MongoClientProvider, schemas/
    socket/SocketServer.ts
  presentation/
    server/             # Express app, routes, controllers, middlewares
    cli/                # Terminal client (readline, socket-client, commands, notifications)
  shared/
    config/index.ts     # All env vars in one place
    errors/             # AppError, HttpError
    logger/logger.ts
    validation/         # Zod schemas + validators
    terminal/           # AnsiHyperlink, UrlValidator
```

## Dependency Injection

`src/application/di/container.ts` — single `Container` class that wires everything manually (no framework). `app.ts` creates one `Container` instance and distributes it to controllers. Do NOT scatter `new` calls outside `Container`.

## REST API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register (pending approval) |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/rooms` | JWT | List rooms |
| POST | `/api/rooms` | JWT | Create room |
| POST | `/api/rooms/:name/join` | JWT | Join room |
| POST | `/api/rooms/:name/leave` | JWT | Leave room |
| POST | `/api/upload` | JWT | Upload image → public URL |
| GET | `/api/admin/pending` | JWT+admin | List pending users |
| POST | `/api/admin/approve/:target` | JWT+admin | Approve user (id or username) |
| POST | `/api/admin/reject/:target` | JWT+admin | Reject user |

Static files: `/uploads/*` served from `config.uploadDir`.

## Socket.IO Events

**Client → Server:**
- `join-room(roomName, password|null, cb)` → `cb(null, { roomId, messages[] })`
- `leave-room(roomName, cb)` → `cb(null)`
- `send-message(roomId, content, cb)` → `cb(null)`
- `send-image(roomId, imageUrl, cb)` → `cb(null)`
- `list-users(roomId, cb)` → `cb(null, string[])`

**Server → Client:**
- `new-message` → `{ message, senderId, senderUsername }`
- `user-joined` → `{ userId, username, roomId }`
- `user-left` → `{ userId, username, roomId }`

Socket auth: JWT in `socket.handshake.auth.token`.

## CLI Commands (in-session)

```
rooms                           List all rooms
create <name> [-p <password>]   Create room (optional password)
join   <name> [-p <password>]   Join room + load history
leave  [name]                   Leave room
users                           List online users in current room
msg <text>                      Send message explicitly
<any text>                      Send message if in room (implicit)
/upload <path>                  Upload image file
/paste-image                    Send clipboard image (Win+Shift+S → type this)
<drag image path>               Drag & drop file path into terminal
/mute                           Toggle notifications for current room
help                            Show commands
exit / quit                     Quit

Admin only:
/requestedregister              List pending registrations
/approve <username|userId>      Approve user
/reject  <username|userId>      Reject user
```

## CLI Architecture

`src/presentation/cli/index.ts` — main entry, readline loop, command dispatcher  
`src/presentation/cli/socket-client.ts` — `ChatSocketClient` wraps socket.io-client  
`src/presentation/cli/notifications/` — sound + OS notification system  
`src/presentation/cli/cli-config.ts` — server URL config  
`src/presentation/cli/updater.ts` — auto-update check on startup  
`src/presentation/cli/commands/image.command.ts` — upload/clipboard/drag-drop logic  

Windows quirks handled: UTF-8 codepage (`chcp.com 65001`), ANSI hyperlinks, drag-drop path detection.

## Key Patterns

- **Error handling:** throw `AppError` / `HttpError` in use cases/services; `errorMiddleware` converts to JSON response.
- **Validation:** Zod schemas in `shared/validation/schemas.ts`, called at controller layer.
- **Admin flow:** new users land in `pending` status; admin runs `/approve` or `/reject`.
- **Room passwords:** hashed with bcrypt via `RoomService`.
- **Image type:** messages have `type` field (`'text'` | `'image'`); CLI renders images as ANSI hyperlinks.
- **Reconnect:** CLI auto-rejoins last room on socket reconnect.

## Installer Bootstrap (Windows)

`src/presentation/cli/installer/InstallerBootstrapService.ts`

Self-installing bootstrap for the portable `.exe`. Called once at the very top of `index.ts` via `InstallerBootstrapService.runIfNeeded()` — before `checkAndUpdate()` and `main()`.

**Flow:**
1. Guard: skip if not `win32`, not pkg-bundled, or already installed
2. `createDirectories()` — creates `%LOCALAPPDATA%\chat-cli\{assets,logs}` and `%APPDATA%\chat-cli\`
3. `copyExecutable()` — copies `process.execPath` → `%LOCALAPPDATA%\chat-cli\chat-cli.exe`, then writes `.installed` marker
4. `addToUserPath()` — PowerShell 5.1 script modifies USER PATH registry key (no admin needed, idempotent)
5. `relaunch()` — `spawn(installedExePath, detached, stdio:'inherit')` + `process.exit(0)`

**"Already installed" detection:** marker file `%LOCALAPPDATA%\chat-cli\.installed` exists AND exe exists.  
**Dev guard:** `typeof process.pkg === 'undefined'` → skip when running via tsx/node  
**Platform guard:** `process.platform !== 'win32'` → skip on non-Windows

Install paths:
- Exe: `%LOCALAPPDATA%\chat-cli\chat-cli.exe`
- Marker: `%LOCALAPPDATA%\chat-cli\.installed` (content = ISO timestamp of install)
- Config dir: `%APPDATA%\chat-cli\`

### Bug history & decisions

**Bug: infinite install loop (fixed)**  
Original `isInstalled()` compared `normalize(process.execPath)` against `installedExePath`. In `@yao-pkg/pkg`, `process.execPath` may resolve to the embedded Node.js runtime path rather than the `.exe` string, so the comparison always returned `false` → every launch re-installed and re-launched forever.  
**Fix:** replaced path comparison with marker file check (`existsSync(markerPath) && existsSync(installedExePath)`). Marker is written only after a successful exe copy, so it is a reliable installation signal regardless of how pkg resolves `process.execPath`.

### Edge cases

| # | Scenario | Behaviour |
|---|---|---|
| EC-1 | `copyExecutable()` throws mid-install | Marker not yet written → next run retries install cleanly (no stale marker) |
| EC-2 | Marker present but exe deleted | `isInstalled()` = false → re-installs (copies + rewrites marker) |
| EC-3 | `process.execPath === installedExePath` (same path string) | `copyFileSync` skipped — guards against self-overwrite / file truncation |
| EC-4 | LOCALAPPDATA / APPDATA env vars missing | `runIfNeeded()` logs error and returns — app continues without installing |
| EC-5 | PowerShell unavailable or PATH write fails | Non-fatal — installer warns and continues; user sees manual instruction |
| EC-6 | User re-runs downloaded exe after install | Marker found → `isInstalled()` = true → skip install → app opens normally |
| EC-7 | New version downloaded (upgrade path) | Marker found → skip bootstrap installer; `checkAndUpdate()` (updater.ts) handles version upgrades separately |

## Dev Commands

```bash
npm run dev:server     # Run server (tsx, hot-ish)
npm run dev:cli        # Run CLI
npm run build          # tsc → dist/
npm run build:cli      # Compile CLI to standalone binary (pkg)
npm test               # Jest with coverage
npm run lint           # ESLint
npm run format         # Prettier check
```

## Conventions

- No comments unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- No extra abstractions beyond what the task requires.
- All new use cases go in `application/usecases/`, registered in `Container`.
- All new mongo schemas go in `infrastructure/db/mongo/schemas/`.
- Keep `shared/config/index.ts` as the single source for env vars — never read `process.env` elsewhere.
