const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function normalizeSecret(secret: string): string {
  return secret.toUpperCase().replace(/[\s-]/g, '');
}

export function decodeBase32(secret: string): Uint8Array {
  const clean = normalizeSecret(secret).replace(/=+$/g, '');
  if (!clean || /[^A-Z2-7]/.test(clean)) {
    throw new Error('Geçersiz gizli anahtar');
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function isValidBase32(secret: string): boolean {
  try {
    return decodeBase32(secret).length > 0;
  } catch {
    return false;
  }
}
