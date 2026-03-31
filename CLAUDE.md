# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Turbopack, with node-compat shim)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Apply new migrations
npx prisma migrate dev
```

The `NODE_OPTIONS='--require ./node-compat.cjs'` shim is applied automatically by all npm scripts — it patches Node.js built-ins for Next.js/Turbopack compatibility.

## Architecture

UIGen is a Next.js 15 App Router application that lets users describe React components in a chat interface; Claude generates and edits them in a **virtual file system** with a live preview.

### Request flow

1. User submits a prompt → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `/api/chat` via Vercel AI SDK's `useChat`.
2. `POST /api/chat` (`src/app/api/chat/route.ts`) streams a response from Claude (or `MockLanguageModel` when no API key is set). The model is given two tools: `str_replace_editor` and `file_manager`.
3. As tool calls stream back, `onToolCall` in `ChatContext` dispatches them to `FileSystemContext` which applies them to the in-memory `VirtualFileSystem`.
4. The preview panel re-renders whenever the VFS changes (via `refreshTrigger`).
5. On completion, if a `projectId` is present and the user is authenticated, the full message history and serialized VFS are persisted to SQLite via Prisma.

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory tree of `FileNode` objects (files and directories). It is the core shared state of the app — never written to disk during generation. It supports full CRUD, rename, serialize/deserialize (for sending to the API and saving to the DB), and text-editor operations (`viewFile`, `replaceInFile`, `insertInFile`) that mirror the Claude tool API.

A module-level singleton `fileSystem` is exported but the app primarily uses the instance managed by `FileSystemContext`.

### AI Tools (`src/lib/tools/`)

- `str_replace_editor` — exposes view/create/str_replace/insert commands that operate on the VFS.
- `file_manager` — file management operations (delete, rename, list) on the VFS.

Both tools are constructed with a `VirtualFileSystem` instance and passed to `streamText`.

### State management (React contexts)

- `FileSystemContext` — owns the `VirtualFileSystem` instance, exposes CRUD helpers, and processes tool calls from the AI.
- `ChatContext` — wraps Vercel AI SDK's `useChat`, wires tool calls to `FileSystemContext`, and tracks anonymous work via `src/lib/anon-work-tracker.ts`.

Both providers are set up in the project page (`src/app/[projectId]/page.tsx`).

### Auth & sessions

JWT-based auth (`src/lib/auth.ts`) using `jose`. Sessions are stored as `httpOnly` cookies (`auth-token`). `JWT_SECRET` defaults to a dev-only string. Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`.

### Database (Prisma + SQLite)

Schema is defined in `prisma/schema.prisma` — always refer to it for the authoritative structure of DB models and fields. `User` (email/password) and `Project` (messages and VFS data stored as JSON strings). The Prisma client is generated to `src/generated/prisma/`.

### Provider / mock mode

`src/lib/provider.ts` returns `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel` that returns static component code. This lets the app run fully without an API key.
