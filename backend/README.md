# MemoryDesk Backend

The reasoning and persistent memory orchestration service for **MemoryDesk**.

## Overview

The backend acts as the secure intermediary between the customer-support frontend workspace, the **Groq** high-throughput LLM reasoning engine, and the **Hindsight Cloud** long-term cross-session memory bank.

At no point does the frontend directly interact with LLM providers or memory databases; all interactions are validated, contextualized, and state-tracked server-side.

---

## Architecture Flow

```
Customer Message
       ↓
Working Case State (Short-Term Memory)
       ↓
Targeted Hindsight Recall (Long-Term Memory)
       ↓
Groq LLM Reasoning (GPT-OSS-120B)
       ↓
Anti-Repetition Guardrails & Outcome Attribution
       ↓
Hindsight Memory Retention (Cross-Session)
       ↓
Client Response
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Sanitized system health status (provider, model state, hindsight status). |
| `POST` | `/api/support/message` | Main support dialogue pipeline. Processes customer message and returns reasoned agent response. |
| `GET` | `/api/support/memories/:customerId` | Retrieves stored long-term memories for a specific customer profile. |
| `POST` | `/api/support/reset/:customerId` | Clears active working case state to begin a fresh support interaction. |

---

## Environment Variables

Create a `.env` file in the project root or within `backend/`:

```env
# Hindsight Persistent Memory Cloud
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here

# Reasoning LLM Provider (Groq)
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile

# Server Settings
PORT=3000
CORS_ORIGIN=*
```

---

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Development Mode
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
npm start
```
