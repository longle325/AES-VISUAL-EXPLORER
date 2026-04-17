/**
 * Educational AES (Rijndael) implementation with step capture.
 * NOT for production cryptography. Designed to expose intermediate states.
 */

// S-box
export const SBOX = new Uint8Array([
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
]);

export const INV_SBOX = new Uint8Array(256);
for (let i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i;

const RCON = new Uint8Array([0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d,0x9a]);

// Galois field multiply
function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p & 0xff;
}

export type State = number[][]; // 4x4, column-major: state[col][row]

export function bytesToState(bytes: Uint8Array): State {
  const s: State = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (let i = 0; i < 16; i++) s[Math.floor(i/4)][i%4] = bytes[i];
  return s;
}

export function stateToBytes(s: State): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = s[Math.floor(i/4)][i%4];
  return out;
}

export function cloneState(s: State): State {
  return s.map(c => [...c]);
}

export function subBytes(s: State, inv = false): State {
  const box = inv ? INV_SBOX : SBOX;
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[c][r] = box[s[c][r]];
  return out;
}

export function shiftRows(s: State, inv = false): State {
  const out: State = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const src = inv ? (c - r + 4) % 4 : (c + r) % 4;
      out[c][r] = s[src][r];
    }
  }
  return out;
}

export function mixColumns(s: State, inv = false): State {
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) {
    const a0 = s[c][0], a1 = s[c][1], a2 = s[c][2], a3 = s[c][3];
    if (!inv) {
      out[c][0] = gmul(a0,2) ^ gmul(a1,3) ^ a2 ^ a3;
      out[c][1] = a0 ^ gmul(a1,2) ^ gmul(a2,3) ^ a3;
      out[c][2] = a0 ^ a1 ^ gmul(a2,2) ^ gmul(a3,3);
      out[c][3] = gmul(a0,3) ^ a1 ^ a2 ^ gmul(a3,2);
    } else {
      out[c][0] = gmul(a0,14) ^ gmul(a1,11) ^ gmul(a2,13) ^ gmul(a3,9);
      out[c][1] = gmul(a0,9)  ^ gmul(a1,14) ^ gmul(a2,11) ^ gmul(a3,13);
      out[c][2] = gmul(a0,13) ^ gmul(a1,9)  ^ gmul(a2,14) ^ gmul(a3,11);
      out[c][3] = gmul(a0,11) ^ gmul(a1,13) ^ gmul(a2,9)  ^ gmul(a3,14);
    }
  }
  return out;
}

export function addRoundKey(s: State, key: State): State {
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[c][r] = s[c][r] ^ key[c][r];
  return out;
}

// Key expansion. Returns array of round keys (each a State).
export function expandKey(key: Uint8Array): State[] {
  const Nk = key.length / 4; // 4, 6, 8
  const Nr = Nk + 6;         // 10, 12, 14
  const totalWords = 4 * (Nr + 1);
  const w: number[][] = []; // each word = 4 bytes
  for (let i = 0; i < Nk; i++) w.push([key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]]);
  for (let i = Nk; i < totalWords; i++) {
    let temp = [...w[i-1]];
    if (i % Nk === 0) {
      // RotWord
      temp = [temp[1], temp[2], temp[3], temp[0]];
      // SubWord
      temp = temp.map(b => SBOX[b]);
      temp[0] ^= RCON[i / Nk];
    } else if (Nk > 6 && i % Nk === 4) {
      temp = temp.map(b => SBOX[b]);
    }
    w.push(temp.map((b, j) => b ^ w[i-Nk][j]));
  }
  // Group into round keys (4 words each = 16 bytes = State)
  const keys: State[] = [];
  for (let r = 0; r <= Nr; r++) {
    const rk: State = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) rk[c][row] = w[4*r + c][row];
    keys.push(rk);
  }
  return keys;
}

export type StepKind =
  | 'init' | 'addRoundKey' | 'subBytes' | 'shiftRows' | 'mixColumns' | 'output'
  | 'invSubBytes' | 'invShiftRows' | 'invMixColumns';

export interface Step {
  kind: StepKind;
  round: number;       // 0 = pre-rounds, 1..Nr
  totalRounds: number;
  title: string;
  description: string;
  before: State;
  after: State;
  roundKey?: State;
  isFinalRound?: boolean;
}

export interface CipherRun {
  steps: Step[];
  roundKeys: State[];
  ciphertext: Uint8Array;
  Nr: number;
}

export interface DecipherRun {
  steps: Step[];
  roundKeys: State[];
  plaintext: Uint8Array;
  Nr: number;
}

export function encryptBlockWithSteps(block: Uint8Array, key: Uint8Array): CipherRun {
  const roundKeys = expandKey(key);
  const Nr = roundKeys.length - 1;
  const steps: Step[] = [];

  let state = bytesToState(block);
  const initial = cloneState(state);

  steps.push({
    kind: 'init',
    round: 0,
    totalRounds: Nr,
    title: 'State Initialization',
    description: 'The 16-byte input block is mapped column-by-column into a 4×4 matrix of bytes called the State. Byte 0 goes to row 0 column 0, byte 1 to row 1 column 0, and so on.',
    before: initial,
    after: initial,
  });

  let next = addRoundKey(state, roundKeys[0]);
  steps.push({
    kind: 'addRoundKey',
    round: 0,
    totalRounds: Nr,
    title: 'Initial AddRoundKey',
    description: 'Each byte of the State is XORed with the corresponding byte of the original key (round key 0). This is the only operation before the main rounds begin.',
    before: state,
    after: next,
    roundKey: roundKeys[0],
  });
  state = next;

  for (let r = 1; r <= Nr; r++) {
    const isFinal = r === Nr;

    next = subBytes(state);
    steps.push({
      kind: 'subBytes',
      round: r,
      totalRounds: Nr,
      title: `Round ${r} — SubBytes`,
      description: 'Each byte is replaced via the non-linear S-box: b → S[b]. This substitution provides confusion and breaks linear relationships.',
      before: state, after: next, isFinalRound: isFinal,
    });
    state = next;

    next = shiftRows(state);
    steps.push({
      kind: 'shiftRows',
      round: r,
      totalRounds: Nr,
      title: `Round ${r} — ShiftRows`,
      description: 'Row 0 is unchanged. Rows 1, 2, and 3 are cyclically shifted left by 1, 2, and 3 positions respectively. This provides diffusion across columns.',
      before: state, after: next, isFinalRound: isFinal,
    });
    state = next;

    if (!isFinal) {
      next = mixColumns(state);
      steps.push({
        kind: 'mixColumns',
        round: r,
        totalRounds: Nr,
        title: `Round ${r} — MixColumns`,
        description: 'Each column is treated as a polynomial over GF(2⁸) and multiplied by a fixed matrix. This mixes bytes within each column for full diffusion.',
        before: state, after: next, isFinalRound: false,
      });
      state = next;
    }

    next = addRoundKey(state, roundKeys[r]);
    steps.push({
      kind: 'addRoundKey',
      round: r,
      totalRounds: Nr,
      title: `Round ${r} — AddRoundKey${isFinal ? ' (Final Round)' : ''}`,
      description: isFinal
        ? 'Final round: XOR with the last round key. Notice MixColumns was skipped — this asymmetry makes encryption and decryption easier to invert.'
        : 'XOR the State with this round\'s expanded key. After this, the next round begins.',
      before: state, after: next, roundKey: roundKeys[r], isFinalRound: isFinal,
    });
    state = next;
  }

  steps.push({
    kind: 'output',
    round: Nr,
    totalRounds: Nr,
    title: 'Ciphertext Output',
    description: 'The final State matrix is read out column-by-column to produce the 16-byte ciphertext block.',
    before: state, after: state,
  });

  return { steps, roundKeys, ciphertext: stateToBytes(state), Nr };
}

export function decryptBlock(block: Uint8Array, key: Uint8Array): Uint8Array {
  const roundKeys = expandKey(key);
  const Nr = roundKeys.length - 1;
  let state = bytesToState(block);
  state = addRoundKey(state, roundKeys[Nr]);
  for (let r = Nr - 1; r >= 1; r--) {
    state = shiftRows(state, true);
    state = subBytes(state, true);
    state = addRoundKey(state, roundKeys[r]);
    state = mixColumns(state, true);
  }
  state = shiftRows(state, true);
  state = subBytes(state, true);
  state = addRoundKey(state, roundKeys[0]);
  return stateToBytes(state);
}

export function decryptBlockWithSteps(block: Uint8Array, key: Uint8Array): DecipherRun {
  const roundKeys = expandKey(key);
  const Nr = roundKeys.length - 1;
  const steps: Step[] = [];

  let state = bytesToState(block);
  const initial = cloneState(state);

  steps.push({
    kind: 'init', round: Nr, totalRounds: Nr,
    title: 'State Initialization (Ciphertext)',
    description: 'The 16-byte ciphertext block is loaded into the 4×4 State matrix column-by-column. Decryption will peel back each transformation in reverse order.',
    before: initial, after: initial,
  });

  let next = addRoundKey(state, roundKeys[Nr]);
  steps.push({
    kind: 'addRoundKey', round: Nr, totalRounds: Nr,
    title: `Initial AddRoundKey (Key ${Nr})`,
    description: `XOR the State with the last round key (K${Nr}). Since AES key schedule is the same for encryption and decryption, we simply consume round keys in reverse order.`,
    before: state, after: next, roundKey: roundKeys[Nr],
  });
  state = next;

  for (let r = Nr - 1; r >= 1; r--) {
    const isFinal = r === 1;

    next = shiftRows(state, true);
    steps.push({
      kind: 'invShiftRows', round: r, totalRounds: Nr,
      title: `Round ${r} — InvShiftRows`,
      description: 'Reverse of ShiftRows: row 1 shifted right by 1, row 2 by 2, row 3 by 3. Restores bytes to their pre-ShiftRows column positions.',
      before: state, after: next, isFinalRound: isFinal,
    });
    state = next;

    next = subBytes(state, true);
    steps.push({
      kind: 'invSubBytes', round: r, totalRounds: Nr,
      title: `Round ${r} — InvSubBytes`,
      description: 'Each byte is substituted using the inverse S-box: b → S⁻¹[b]. Reverses the non-linear confusion layer applied during encryption.',
      before: state, after: next, isFinalRound: isFinal,
    });
    state = next;

    next = addRoundKey(state, roundKeys[r]);
    steps.push({
      kind: 'addRoundKey', round: r, totalRounds: Nr,
      title: `Round ${r} — AddRoundKey`,
      description: `XOR with round key K${r}. XOR is its own inverse, so this directly undoes the AddRoundKey applied during encryption round ${r}.`,
      before: state, after: next, roundKey: roundKeys[r], isFinalRound: isFinal,
    });
    state = next;

    next = mixColumns(state, true);
    steps.push({
      kind: 'invMixColumns', round: r, totalRounds: Nr,
      title: `Round ${r} — InvMixColumns`,
      description: 'Each column is multiplied by the inverse MixColumns matrix over GF(2⁸). Reverses the linear diffusion step from encryption.',
      before: state, after: next, isFinalRound: isFinal,
    });
    state = next;
  }

  // Final decryption round — no InvMixColumns
  next = shiftRows(state, true);
  steps.push({
    kind: 'invShiftRows', round: 0, totalRounds: Nr,
    title: 'Final Round — InvShiftRows',
    description: "Undo the first encryption round's ShiftRows by shifting each row rightward.",
    before: state, after: next, isFinalRound: true,
  });
  state = next;

  next = subBytes(state, true);
  steps.push({
    kind: 'invSubBytes', round: 0, totalRounds: Nr,
    title: 'Final Round — InvSubBytes',
    description: 'Apply the inverse S-box to every byte. After this only the original AddRoundKey remains to undo.',
    before: state, after: next, isFinalRound: true,
  });
  state = next;

  next = addRoundKey(state, roundKeys[0]);
  steps.push({
    kind: 'addRoundKey', round: 0, totalRounds: Nr,
    title: 'Final Round — AddRoundKey (Key 0)',
    description: 'XOR with the original key (K0). This is the last step — the State now holds the original plaintext bytes.',
    before: state, after: next, roundKey: roundKeys[0], isFinalRound: true,
  });
  state = next;

  steps.push({
    kind: 'output', round: 0, totalRounds: Nr,
    title: 'Plaintext Output',
    description: 'The recovered State matrix is read out column-by-column to produce the original 16-byte plaintext block.',
    before: state, after: state,
  });

  return { steps, roundKeys, plaintext: stateToBytes(state), Nr };
}

// ---------- Helpers ----------

export function toHex(bytes: Uint8Array | number[], sep = ''): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(sep);
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i*2, 2), 16);
  return out;
}

// PKCS#7-pad text into 16-byte blocks
export function padPlaintext(text: string): Uint8Array[] {
  const enc = new TextEncoder().encode(text);
  const padLen = 16 - (enc.length % 16);
  const padded = new Uint8Array(enc.length + padLen);
  padded.set(enc);
  for (let i = enc.length; i < padded.length; i++) padded[i] = padLen;
  const blocks: Uint8Array[] = [];
  for (let i = 0; i < padded.length; i += 16) blocks.push(padded.slice(i, i + 16));
  return blocks;
}

export function unpadPlaintext(blocks: Uint8Array[]): string {
  const total = new Uint8Array(blocks.length * 16);
  blocks.forEach((b, i) => total.set(b, i * 16));
  const padLen = total[total.length - 1];
  const trimmed = total.slice(0, total.length - padLen);
  return new TextDecoder().decode(trimmed);
}

// Normalize a key string to required byte length (truncate or zero-pad)
export function normalizeKey(input: string, bits: 128 | 192 | 256): Uint8Array {
  const target = bits / 8;
  const enc = new TextEncoder().encode(input);
  const out = new Uint8Array(target);
  out.set(enc.slice(0, target));
  return out;
}

// Encrypt a full message (ECB for educational purposes)
export function encryptMessage(text: string, key: Uint8Array): { ciphertext: Uint8Array; firstRun: CipherRun; blocks: Uint8Array[] } {
  const blocks = padPlaintext(text);
  const firstRun = encryptBlockWithSteps(blocks[0], key);
  const cipherBlocks: Uint8Array[] = [firstRun.ciphertext];
  for (let i = 1; i < blocks.length; i++) {
    cipherBlocks.push(encryptBlockWithSteps(blocks[i], key).ciphertext);
  }
  const ciphertext = new Uint8Array(cipherBlocks.length * 16);
  cipherBlocks.forEach((b, i) => ciphertext.set(b, i * 16));
  return { ciphertext, firstRun, blocks };
}

export function decryptMessage(ciphertext: Uint8Array, key: Uint8Array): string {
  const blocks: Uint8Array[] = [];
  for (let i = 0; i < ciphertext.length; i += 16) {
    blocks.push(decryptBlock(ciphertext.slice(i, i + 16), key));
  }
  return unpadPlaintext(blocks);
}

// Decrypt the full message and return the step-by-step run for block #1.
export function decryptMessageWithSteps(
  ciphertext: Uint8Array,
  key: Uint8Array,
): { plaintext: string; firstRun: DecipherRun; blockCount: number } {
  const blockCount = ciphertext.length / 16;
  const firstRun = decryptBlockWithSteps(ciphertext.slice(0, 16), key);
  const blocks: Uint8Array[] = [firstRun.plaintext];
  for (let i = 1; i < blockCount; i++) {
    blocks.push(decryptBlock(ciphertext.slice(i * 16, (i + 1) * 16), key));
  }
  return { plaintext: unpadPlaintext(blocks), firstRun, blockCount };
}
