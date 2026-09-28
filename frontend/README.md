# MemoryDesk Frontend

The enterprise AI customer support workspace for **MemoryDesk**.

## Overview

A modern, fast, and responsive support interface inspired by Linear and Intercom, providing customer context, real-time reasoning dialogue, and deep memory visibility powered by Hindsight Cloud and Groq.

---

## Features

- **Three-Column Workspace Layout**: Customer Profile & Context on the left, primary Support Conversation in the center, AI Context & Next Recommended Action hero card on the right.
- **Persistent Memory Visualization**: Natural, human-friendly memory drawers (`↳ Using X relevant memories`) explaining recalled context without technical jargon.
- **Dedicated Application Pages**:
  - `/support` — Primary interactive customer support workspace.
  - `/customers` — Customer directory with single-click profile switching.
  - `/memory` — Memory Bank explorer with search and type filters (`experience`, `world`, `observation`).
  - `/analytics` — Operational analytics derived strictly from active case state and action history.
  - `/automation` — Support automation preview and workflow monitors.
  - `/settings` — Workspace interaction and display preferences.

---

## Configuration

The frontend connects to the MemoryDesk backend API.

Create an `.env` or `.env.local` inside `frontend/` (or use default proxy in dev):

```env
# Optional: Set backend API base URL (defaults to '' using Vite reverse proxy in development)
VITE_API_BASE_URL=http://localhost:3000
```

> **Security Note**: Never put API keys (`GROQ_API_KEY`, `HINDSIGHT_API_KEY`) in frontend `.env` files. Secrets are isolated server-side.

---

## Setup & Development

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
Runs locally on `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
Builds optimized production assets to `frontend/dist/`.
