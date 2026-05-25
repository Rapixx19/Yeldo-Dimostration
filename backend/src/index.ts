import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import { errorHandler } from './middleware/error.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'yeldo-backend', ts: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
  console.log(`[backend] CORS origins: ${corsOrigins.join(', ')}`);
});
