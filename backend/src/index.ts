import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import activityRouter from './routes/activity.js';
import dealsRouter from './routes/deals.js';
import healthRouter from './routes/health.js';
import investmentsRouter, { portfolioRouter } from './routes/investments.js';
import recommendationsRouter from './routes/recommendations.js';
import searchRouter from './routes/search.js';
import { errorHandler } from './middleware/error.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/activity', activityRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/search', searchRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, '0.0.0.0', () => {
  console.log(`[backend] listening on 0.0.0.0:${port}`);
  console.log(`[backend] CORS origins: ${corsOrigins.join(', ')}`);
});
