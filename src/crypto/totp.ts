import type { TotpAlgorithm } from '../vault/types';
import { decodeBase32 } from './base32';
import { asBuffer } from './bytes';

const HASH: Record<TotpAlgorithm, string> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
};

function counterBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let value = BigInt(counter);
  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
}

export async function generateTotp(
  secret: string,
  timestamp = Date.now(),
  algorithm: TotpAlgorithm = 'SHA1',
  digits: 6 | 8 = 6,
  period = 30,
): Promise<string> {
  const keyBytes = decodeBase32(secret);
  const counter = Math.floor(timestamp / 1000 / period);
  const key = await crypto.subtle.importKey('raw', asBuffer(keyBytes), { name: 'HMAC', hash: HASH[algorithm] }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, asBuffer(counterBytes(counter))));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, '0');
}

export function remainingSeconds(period = 30, timestamp = Date.now()): number {
  const elapsed = Math.floor(timestamp / 1000) % period;
  return period - elapsed;
}

export function formatCode(code: string): string {
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}
