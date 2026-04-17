/**
 * Vercel serverless entry point.
 * Vercel routes all /api/* requests here; Express handles routing internally.
 */
import app from '../server/app.js';

export default app;
