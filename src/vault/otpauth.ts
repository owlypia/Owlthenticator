import type { Account, TotpAlgorithm } from './types';
import { isValidBase32, normalizeSecret } from '../crypto/base32';
import { newId } from '../crypto/bytes';

function asAlgorithm(value: string | null): TotpAlgorithm {
  const upper = (value ?? 'SHA1').toUpperCase().replace('SHA-', 'SHA');
  if (upper === 'SHA256' || upper === 'SHA512' || upper === 'SHA1') return upper;
  return 'SHA1';
}

function asDigits(value: string | null): 6 | 8 {
  return value === '8' ? 8 : 6;
}

export function parseOtpauth(uri: string): Account {
  let url: URL;
  try {
    url = new URL(uri.trim());
  } catch {
    throw new Error('Geçersiz QR / bağlantı');
  }

  if (url.protocol !== 'otpauth:' || url.hostname.toLowerCase() !== 'totp') {
    throw new Error('Yalnızca TOTP (zaman tabanlı) hesaplar desteklenir');
  }

  const secret = normalizeSecret(url.searchParams.get('secret') ?? '');
  if (!isValidBase32(secret)) throw new Error('QR içinde geçerli bir gizli anahtar yok');

  const path = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  const [issuerFromPath, labelFromPath] = path.includes(':') ? path.split(/:(.*)/) : ['', path];
  const issuer = url.searchParams.get('issuer') || issuerFromPath || 'Hesap';
  const label = (labelFromPath || path || 'Adsız').trim();
  const period = Number(url.searchParams.get('period') ?? 30);

  return {
    id: newId(),
    issuer: issuer.trim(),
    label,
    secret,
    algorithm: asAlgorithm(url.searchParams.get('algorithm')),
    digits: asDigits(url.searchParams.get('digits')),
    period: period === 60 ? 60 : 30,
    createdAt: Date.now(),
  };
}

export function accountFromManual(input: {
  issuer: string;
  label: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: number;
}): Account {
  const secret = normalizeSecret(input.secret);
  if (!isValidBase32(secret)) throw new Error('Gizli anahtar Base32 olmalı (A–Z ve 2–7)');
  return {
    id: newId(),
    issuer: input.issuer.trim() || 'Hesap',
    label: input.label.trim() || 'Adsız',
    secret,
    algorithm: input.algorithm,
    digits: input.digits,
    period: input.period === 60 ? 60 : 30,
    createdAt: Date.now(),
  };
}
