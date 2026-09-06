export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export type Account = {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: number;
  createdAt: number;
};

export type VaultSettings = {
  lockTimeoutMs: number;
  lockOnHide: boolean;
};

export type VaultData = {
  accounts: Account[];
  settings: VaultSettings;
};

export type WrappedBlob = {
  iv: string;
  data: string;
};

export type PersistedVault = {
  version: 1;
  salt: string;
  iterations: number;
  wrappedDek: WrappedBlob;
  vault: WrappedBlob;
};

export type BackupFile = {
  kind: 'owlthenticator.backup';
  version: 1;
  exportedAt: number;
  salt: string;
  iterations: number;
  wrappedDek: WrappedBlob;
  vault: WrappedBlob;
};

export const DEFAULT_SETTINGS: VaultSettings = {
  lockTimeoutMs: 2 * 60 * 1000,
  lockOnHide: true,
};

export const EMPTY_VAULT: VaultData = {
  accounts: [],
  settings: DEFAULT_SETTINGS,
};

export const PBKDF2_ITERATIONS = 320_000;
export const MIN_PIN_LENGTH = 6;
