const pin = 'ekip-pin-123';
const salt = crypto.getRandomValues(new Uint8Array(16));
const dekRaw = crypto.getRandomValues(new Uint8Array(32));
const iterations = 10_000;

const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
const kek = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
  material,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);

const iv = crypto.getRandomValues(new Uint8Array(12));
const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, dekRaw);
const opened = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, wrapped));

const same = opened.length === dekRaw.length && opened.every((byte, index) => byte === dekRaw[index]);
if (!same) {
  console.error('FAIL vault wrap/unwrap');
  process.exit(1);
}
console.log('OK vault wrap/unwrap');
