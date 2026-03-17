# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Setup (first time)
npm run setup          # Install deps, generate Prisma client, run migrations

# Development
npm run dev            # Start dev server with Turbopack at localhost:3000
npm run dev:daemon     # Start dev server in background

# Build & production
npm run build
npm run start

# Testing
npm run test           # Run Vitest

# Linting
npm run lint           # ESLint

# Database
npm run db:reset       # Reset SQLite database (destructive)
```

To run a single test file: `npx vitest run src/lib/transform/__tests__/jsx-transformer.test.ts`

## Environment

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it, the app falls back to a `MockLanguageModel` in `src/lib/provider.ts` that returns static demo code.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat interface; Claude generates/edits code using tools; the result renders live in an iframe preview.

### Request flow

1. User sends message → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) → `POST /api/chat`
2. `src/app/api/chat/route.ts` calls Claude via Vercel AI SDK (`streamText`) with two tools: `str_replace_editor` and `file_manager`
3. Claude calls tools to create/modify files in the **VirtualFileSystem** (in-memory, never written to disk)
4. Tool results stream back; `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) updates state
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) detects changes, uses Babel standalone to transpile JSX in the browser, and injects it into a sandboxed iframe
6. On finish, if the user is authenticated, messages + serialized VirtualFileSystem are saved to Prisma (SQLite)

### Key modules

| Path | Purpose |
|------|---------|
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory file tree with CRUD, serialize/deserialize |
| `src/lib/tools/str-replace.ts` | `str_replace_editor` tool: create, view, str_replace, insert, undo |
| `src/lib/tools/file-manager.ts` | `file_manager` tool: rename/move and delete files |
| `src/lib/transform/jsx-transformer.ts` | Babel-based JSX→JS transform that runs in the browser for the preview iframe |
| `src/lib/provider.ts` | `getLanguageModel()` — returns Anthropic Claude or `MockLanguageModel` |
| `src/lib/prompts/generation.tsx` | System prompt injected into every chat request |
| `src/lib/auth.ts` | JWT session management (7-day expiry, httpOnly cookies) |
| `src/actions/` | Server actions for auth (`signUp`, `signIn`, `signOut`, `getUser`) and project CRUD |
| `src/middleware.ts` | Protects `/api/projects` and `/api/filesystem` routes |

### Database

Prisma with SQLite (`prisma/dev.db`). Two models: `User` (email + hashed password) and `Project` (name, messages as JSON string, VirtualFileSystem data as JSON, belongs to User). Anonymous users work locally with no persistence.

### Testing

Tests live in `__tests__` folders co-located with source. Vitest with jsdom + React Testing Library. Path alias `@/*` maps to `src/*`.

### Important runtime detail

`package.json` scripts inject `NODE_OPTIONS='--require ./node-compat.cjs'` — this wrapper is required for Babel/Prisma compatibility and must not be removed.
