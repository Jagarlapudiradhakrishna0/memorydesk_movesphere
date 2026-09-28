# MemoryDesk

> **Support that remembers.**

MemoryDesk is an AI-powered customer support workspace with persistent cross-session memory and adaptive troubleshooting reasoning.

---

## Architecture Overview

```
Frontend (React 19 Workspace)
       ↓
Backend API (Node.js / Express)
       ↓
Agent Orchestration (Short-Term Case State)
       ↓
Groq (Reasoning) + Hindsight Cloud (Long-Term Memory)
```

- **Hindsight Cloud**: Long-term cross-session memory engine. Remembers historical customer issues, tried solutions, environmental updates, and recurrence patterns over days, weeks, and months.
- **Working Case State**: Short-term conversational working memory. Locks confirmed facts (device, OS, version), prevents repeating questions, and logs chronological action attempts.
- **Groq Reasoning**: Fast, high-throughput LLM reasoning powered by `openai/gpt-oss-120b` for domain-agnostic diagnosis and solution formulation.
- **MemoryDesk**: Orchestration layer uniting state, memory, guardrails, and user experience.

---

## Project Structure

```
MemoryDesk/
├── frontend/                     # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # UI workspace components
│   │   ├── pages/                # Workspace views (Support, Customers, Memory, Analytics, etc.)
│   │   ├── services/             # API client & communication layer
│   │   ├── types/                # Frontend data types & schemas
│   │   ├── assets/               # Static assets & icons
│   │   ├── App.tsx               # Main application layout & router
│   │   └── App.css               # Design system & responsive styles
│   ├── public/                   # Public assets
│   ├── package.json              # Frontend package configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite build configuration
│   └── README.md                 # Frontend documentation
│
├── backend/                      # Express + TypeScript API server
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # Agent, Case, Hindsight, and Groq reasoning services
│   │   ├── types/                # Domain models & interaction types
│   │   └── server.ts             # Express server entry point
│   ├── package.json              # Backend package configuration
│   ├── tsconfig.json             # TypeScript build configuration
│   └── README.md                 # Backend documentation
│
├── docs/                         # Architecture and design documentation
│   ├── architecture.md           # System architecture & component flow
│   ├── memory-design.md          # Bi-level memory hierarchy specification
│   └── demo-flow.md              # 10-step adaptive support walkthrough
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git exclusions
├── README.md                     # Root project documentation
└── LICENSE                       # MIT License
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```
Fill in your `GROQ_API_KEY` and `HINDSIGHT_API_KEY`.

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Run Development Servers
```bash
# In one terminal: run backend (port 3000)
cd backend && npm run dev

# In second terminal: run frontend (port 5173)
cd frontend && npm run dev
```

Visit `http://localhost:5173` to open the MemoryDesk support workspace.

---

## Building for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd ../frontend && npm run build
```

---

## License

[MIT](LICENSE)
