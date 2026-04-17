import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  normalizeKey,
  encryptMessage,
  decryptMessage,
  decryptBlockWithSteps,
  fromHex,
  toHex,
  toBase64,
} from '../lib/aes.js';

const router = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const KeyBitsSchema = z.union([z.literal(128), z.literal(192), z.literal(256)]);

const EncryptBody = z.object({
  plaintext: z.string().min(1, 'plaintext is required'),
  key: z.string().min(1, 'key is required'),
  keyBits: KeyBitsSchema.default(128),
});

const DecryptBody = z.object({
  ciphertext: z.string().min(1, 'ciphertext hex is required'),
  key: z.string().min(1, 'key is required'),
  keyBits: KeyBitsSchema.default(128),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCipherHex(hex: string): Uint8Array | { error: string } {
  const bytes = fromHex(hex);
  if (bytes.length === 0 || bytes.length % 16 !== 0) {
    return { error: `Ciphertext must decode to a non-zero multiple of 16 bytes (got ${bytes.length}).` };
  }
  return bytes;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/health */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), service: 'aes-visual-explorer' });
});

/**
 * POST /api/encrypt
 *
 * Body: { plaintext: string, key: string, keyBits?: 128|192|256 }
 *
 * Returns the full cipher run for the first block (steps, roundKeys, Nr)
 * plus the complete ciphertext in hex and base64.
 */
router.post('/encrypt', (req: Request, res: Response) => {
  const parsed = EncryptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { plaintext, key, keyBits } = parsed.data;
  const normKey = normalizeKey(key, keyBits);
  const { ciphertext, firstRun, blocks } = encryptMessage(plaintext, normKey);

  res.json({
    ok: true,
    keyBits,
    Nr: firstRun.Nr,
    blockCount: blocks.length,
    ciphertext: {
      hex: toHex(ciphertext),
      base64: toBase64(ciphertext),
    },
    // Full step-by-step walk for the first block
    steps: firstRun.steps,
    roundKeys: firstRun.roundKeys,
  });
});

/**
 * POST /api/decrypt
 *
 * Body: { ciphertext: string (hex), key: string, keyBits?: 128|192|256 }
 *
 * Returns recovered plaintext (all blocks).
 */
router.post('/decrypt', (req: Request, res: Response) => {
  const parsed = DecryptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { ciphertext: hexInput, key, keyBits } = parsed.data;
  const bytes = parseCipherHex(hexInput);
  if ('error' in bytes) {
    res.status(400).json({ ok: false, error: bytes.error });
    return;
  }

  try {
    const normKey = normalizeKey(key, keyBits);
    const plaintext = decryptMessage(bytes, normKey);
    res.json({ ok: true, keyBits, plaintext });
  } catch (e) {
    res.status(400).json({ ok: false, error: e instanceof Error ? e.message : 'Decryption failed' });
  }
});

/**
 * POST /api/decrypt/steps
 *
 * Same body as /api/decrypt. Returns the step-by-step decryption walk
 * for the first 16-byte block, mirroring /api/encrypt.
 */
router.post('/decrypt/steps', (req: Request, res: Response) => {
  const parsed = DecryptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { ciphertext: hexInput, key, keyBits } = parsed.data;
  const bytes = parseCipherHex(hexInput);
  if ('error' in bytes) {
    res.status(400).json({ ok: false, error: bytes.error });
    return;
  }

  try {
    const normKey = normalizeKey(key, keyBits);
    const blockCount = bytes.length / 16;
    const run = decryptBlockWithSteps(bytes.slice(0, 16), normKey);

    res.json({
      ok: true,
      keyBits,
      Nr: run.Nr,
      blockCount,
      plaintext: {
        hex: toHex(run.plaintext),
        text: new TextDecoder().decode(run.plaintext),
      },
      steps: run.steps,
      roundKeys: run.roundKeys,
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: e instanceof Error ? e.message : 'Decryption failed' });
  }
});

export default router;
