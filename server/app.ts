import express from 'express';
import cors from 'cors';
import aesRouter from './routes/aes.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', aesRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

export default app;
