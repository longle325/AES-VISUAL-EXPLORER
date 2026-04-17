import app from './app.js';

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`\n  AES API server  →  http://localhost:${PORT}\n`);
  console.log('  GET  /api/health');
  console.log('  POST /api/encrypt');
  console.log('  POST /api/decrypt');
  console.log('  POST /api/decrypt/steps\n');
});
