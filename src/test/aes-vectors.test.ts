import { describe, it, expect } from 'vitest';
import { encryptBlockWithSteps, decryptBlock, expandKey, fromHex, toHex } from '../lib/aes';
import type { State } from '../lib/aes';

function stateToHex(s: State): string {
  const b = new Uint8Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) b[c * 4 + r] = s[c][r];
  return toHex(b);
}

// FIPS-197 Appendix C.1 test vector (AES-128)
const FIPS_KEY = fromHex('000102030405060708090a0b0c0d0e0f');
const FIPS_PT  = fromHex('00112233445566778899aabbccddeeff');
const FIPS_CT  = '69c4e0d86a7b0430d8cdb78070b4c55a';

// FIPS-197 Appendix A.1 round keys for key 000102030405060708090a0b0c0d0e0f
const FIPS_B_ROUND_KEYS = [
  '000102030405060708090a0b0c0d0e0f',
  'd6aa74fdd2af72fadaa678f1d6ab76fe',
  'b692cf0b643dbdf1be9bc5006830b3fe',
  'b6ff744ed2c2c9bf6c590cbf0469bf41',
  '47f7f7bc95353e03f96c32bcfd058dfd',
  '3caaa3e8a99f9deb50f3af57adf622aa',
  '5e390f7df7a69296a7553dc10aa31f6b',
  '14f9701ae35fe28c440adf4d4ea9c026',
  '47438735a41c65b9e016baf4aebf7ad2',
  '549932d1f08557681093ed9cbe2c974e',
  '13111d7fe3944a17f307a78b4d2b30c5',
];

// NIST FIPS-197 step-by-step example (same key, different PT)
const AES128_KEY2 = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
const AES128_PT2  = fromHex('3243f6a8885a308d313198a2e0370734');
const AES128_CT2  = '3925841d02dc09fbdc118597196a0b32';

// NIST SP 800-38A ECB-AES128 test vector (100% verified)
const NIST_KEY  = fromHex('2b7e151628aed2a6abf7158809cf4f3c');
const NIST_PT   = fromHex('6bc1bee22e409f96e93d7e117393172a');
const NIST_CT   = '3ad77bb40d7a3660a89ecaf32466ef97';

describe('AES-128 key schedule', () => {
  it('FIPS-197 Appendix B round keys', () => {
    const rks = expandKey(FIPS_KEY);
    for (let i = 0; i <= 10; i++) {
      expect(stateToHex(rks[i])).toBe(FIPS_B_ROUND_KEYS[i]);
    }
  });
});

describe('AES-128 encrypt', () => {
  it('FIPS-197 Appendix B vector', () => {
    const { ciphertext } = encryptBlockWithSteps(FIPS_PT, FIPS_KEY);
    expect(toHex(ciphertext)).toBe(FIPS_CT);
  });

  it('FIPS-197 Appendix A vector', () => {
    const { ciphertext } = encryptBlockWithSteps(AES128_PT2, AES128_KEY2);
    expect(toHex(ciphertext)).toBe(AES128_CT2);
  });

  it('NIST SP 800-38A ECB-AES128', () => {
    const { ciphertext } = encryptBlockWithSteps(NIST_PT, NIST_KEY);
    expect(toHex(ciphertext)).toBe(NIST_CT);
  });
});

describe('AES-128 decrypt', () => {
  it('FIPS-197 Appendix B roundtrip', () => {
    const { ciphertext } = encryptBlockWithSteps(FIPS_PT, FIPS_KEY);
    const pt = decryptBlock(ciphertext, FIPS_KEY);
    expect(toHex(pt)).toBe(toHex(FIPS_PT));
  });

  it('FIPS-197 Appendix B direct decrypt', () => {
    const ct = fromHex(FIPS_CT);
    const pt = decryptBlock(ct, FIPS_KEY);
    expect(toHex(pt)).toBe(toHex(FIPS_PT));
  });
});
