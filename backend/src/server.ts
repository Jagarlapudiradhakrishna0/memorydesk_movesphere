import path from 'path';
import dotenv from 'dotenv';
// Load environment variables from cwd, backend root, or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import supportRouter from './routes/support';
import { getProviderConfig, getLLMHealthStatus } from './services/llmService';

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// Enable robust CORS across Vercel, localhost, and custom domains
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin ? (corsOrigin === '*' ? '*' : corsOrigin.split(',').map((s) => s.trim())) : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());

// Normalize duplicate slashes in URLs (e.g. //health or //api/support/message caused by base URLs with trailing slashes)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/+/g, '/');
  }
  next();
});

app.use(express.json());

// Root endpoint for platform health probes and service identification
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'MemoryDesk API',
    status: 'ok',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/support', supportRouter);

// Health check — exposes ONLY sanitized, non-secret operational state
app.get('/health', (_req: Request, res: Response) => {
  const llmHealth = getLLMHealthStatus();
  res.json({
    status: 'ok',
    service: 'MemoryDesk',
    timestamp: new Date().toISOString(),
    llm: {
      provider: llmHealth.provider,
      model: llmHealth.model,
      status: llmHealth.status,
      retryAfterSeconds: llmHealth.retryAfterSeconds,
    },
    hindsight: {
      configured: Boolean(process.env.HINDSIGHT_BASE_URL),
    },
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global sanitized error handler ──────────────────────────────────────────
// Never leaks credentials, stack traces, organization IDs, or provider internals
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode ?? 500;
  console.error(`[Server Error] ${status} — ${err.message}`);

  const rawMsg = err.message || '';
  const isRateLimit = status === 429 || rawMsg.toLowerCase().includes('rate limit') || rawMsg.includes('429');

  if (isRateLimit) {
    res.status(429).json({
      error: 'AI service temporarily unavailable',
      retryAfterSeconds: 45,
    });
    return;
  }

  // Sanitize message: never leak keys, organization IDs, tokens, or urls
  let sanitized = status < 500 ? rawMsg : 'Internal server error.';
  sanitized = sanitized
    .replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/hsk_[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/org_[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/https?:\/\/[^\s]+/g, '[URL]');

  res.status(status < 500 ? status : 500).json({ error: sanitized });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    const llmConfig = getProviderConfig();
    console.log(`\n🧠 MemoryDesk backend running on http://localhost:${PORT}`);
    console.log(`   LLM Provider:  ${llmConfig.provider.toUpperCase()} (${llmConfig.configured ? 'Configured' : 'Missing Key'})`);
    console.log(`   LLM Model:     ${llmConfig.model}`);
    console.log(`\n   POST http://localhost:${PORT}/api/support/message`);
    console.log(`   GET  http://localhost:${PORT}/health\n`);
  });
}

export default app;
