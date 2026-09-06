import type { BackupFile, PersistedVault, VaultData, WrappedBlob } from '../vault/types';
import { EMPTY_VAULT, PBKDF2_ITERATIONS } from '../vault/types';
import { asBuffer, encodeText, fromBase64, randomBytes, toBase64 } from './bytes';

export type UnlockedVault = {
  dek: CryptoKey;
  persisted: PersistedVault;
  data: VaultData;
};

async function deriveKek(pin: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', asBuffer(encodeText(pin)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBuffer(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptBytes(key: CryptoKey, plain: BufferSource): Promise<WrappedBlob> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: asBuffer(iv) }, key, plain);
  return { iv: toBase64(iv), data: toBase64(data) };
}

async function decryptBytes(key: CryptoKey, blob: WrappedBlob): Promise<Uint8Array> {
  const iv = fromBase64(blob.iv);
  const data = fromBase64(blob.data);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBuffer(iv) },
    key,
    asBuffer(data),
  );
  return new Uint8Array(plain);
}

async function importDek(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function createVault(pin: string): Promise<UnlockedVault> {
  const salt = randomBytes(16);
  const dekRaw = randomBytes(32);
  const kek = await deriveKek(pin, salt, PBKDF2_ITERATIONS);
  const wrappedDek = await encryptBytes(kek, asBuffer(dekRaw));
  const dek = await importDek(asBuffer(dekRaw));
  const vault = await encryptBytes(dek, asBuffer(encodeText(JSON.stringify(EMPTY_VAULT))));

  return {
    dek,
    data: structuredClone(EMPTY_VAULT),
    persisted: {
      version: 1,
      salt: toBase64(salt),
      iterations: PBKDF2_ITERATIONS,
      wrappedDek,
      vault,
    },
  };
}

export async function unlockVault(pin: string, persisted: PersistedVault): Promise<UnlockedVault> {
  const salt = fromBase64(persisted.salt);
  const kek = await deriveKek(pin, salt, persisted.iterations);
  let dekRaw: Uint8Array;
  try {
    dekRaw = await decryptBytes(kek, persisted.wrappedDek);
  } catch {
    throw new Error('PIN hatalı');
  }

  const dek = await importDek(asBuffer(dekRaw));
  const vaultBytes = await decryptBytes(dek, persisted.vault);
  const data = JSON.parse(new TextDecoder().decode(vaultBytes)) as VaultData;
  return { dek, persisted, data };
}

export async function persistVault(dek: CryptoKey, persisted: PersistedVault, data: VaultData): Promise<PersistedVault> {
  const vault = await encryptBytes(dek, asBuffer(encodeText(JSON.stringify(data))));
  return { ...persisted, vault };
}

export async function rewrapPin(currentPin: string, nextPin: string, persisted: PersistedVault): Promise<PersistedVault> {
  const salt = fromBase64(persisted.salt);
  const currentKek = await deriveKek(currentPin, salt, persisted.iterations);
  let dekRaw: Uint8Array;
  try {
    dekRaw = await decryptBytes(currentKek, persisted.wrappedDek);
  } catch {
    throw new Error('Mevcut PIN hatalı');
  }

  const nextSalt = randomBytes(16);
  const nextKek = await deriveKek(nextPin, nextSalt, PBKDF2_ITERATIONS);
  const wrappedDek = await encryptBytes(nextKek, asBuffer(dekRaw));

  return {
    ...persisted,
    salt: toBase64(nextSalt),
    iterations: PBKDF2_ITERATIONS,
    wrappedDek,
  };
}

export function toBackup(persisted: PersistedVault): BackupFile {
  return {
    kind: 'owlthenticator.backup',
    version: 1,
    exportedAt: Date.now(),
    salt: persisted.salt,
    iterations: persisted.iterations,
    wrappedDek: persisted.wrappedDek,
    vault: persisted.vault,
  };
}

export function fromBackup(value: unknown): PersistedVault {
  const file = value as BackupFile;
  if (file?.kind !== 'owlthenticator.backup' || file.version !== 1 || !file.salt || !file.wrappedDek || !file.vault) {
    throw new Error('Geçersiz yedek dosyası');
  }
  return {
    version: 1,
    salt: file.salt,
    iterations: file.iterations,
    wrappedDek: file.wrappedDek,
    vault: file.vault,
  };
}
