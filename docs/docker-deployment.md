# MemoryDesk Docker Deployment Guide

MemoryDesk is fully containerized using multi-stage Docker builds and Docker Compose for production deployment.

---

## Architecture in Containers

```
User (Browser)
      ↓
Port 80 / 5173
      ↓
[ memorydesk-frontend (Nginx Alpine) ]
      ├── Static Assets (React 19 SPA with HTML5 routing fallback)
      └── Reverse Proxy /api/ & /health
            ↓
[ memorydesk-backend (Node 20 Alpine) ] (Port 3000)
      ├── Express API & Working Case State
      ├── Groq LLM Reasoning (openai/gpt-oss-120b)
      └── Hindsight Cloud Memory Engine
```

---

## Quickstart

### 1. Ensure `.env` is configured
Make sure your `.env` file exists in the repository root:
```env
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
PORT=3000
CORS_ORIGIN=*
```

### 2. Build and Launch Containers
```bash
docker compose up --build -d
```

### 3. Check Container Health
```bash
docker compose ps
```
The backend includes an automatic health check pinging `http://localhost:3000/health`. The frontend container waits for the backend to become healthy before accepting traffic.

### 4. Open Application
- **Frontend Workspace**: [http://localhost:80](http://localhost:80) or [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/health](http://localhost:3000/health)

---

## Stopping the Containers
```bash
docker compose down
```

---

## Cloud Container Deployment (VPS / Cloud)

For cloud deployment (e.g. AWS EC2, DigitalOcean Droplet, Hetzner, or Railway):
1. Clone the repository:
   ```bash
   git clone https://github.com/Jagarlapudiradhakrishna0/memorydesk_movesphere.git
   cd memorydesk_movesphere
   ```
2. Create your `.env` file with production keys.
3. Run `docker compose up --build -d`.
4. Point your domain name or DNS A record to your server's public IP address.
