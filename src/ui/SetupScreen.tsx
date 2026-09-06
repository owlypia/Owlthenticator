import { useState, type FormEvent } from 'react';
import { MIN_PIN_LENGTH } from '../vault/types';
import { Logo } from './Logo';

type SetupScreenProps = {
  busy: boolean;
  error: string | null;
  onCreate: (pin: string) => Promise<void>;
  onRestore: (file: File, pin: string) => Promise<boolean>;
};

export function SetupScreen({ busy, error, onCreate, onRestore }: SetupScreenProps) {
  const [mode, setMode] = useState<'create' | 'restore'>('create');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (pin.length < MIN_PIN_LENGTH) {
      setLocalError(`PIN en az ${MIN_PIN_LENGTH} karakter olmalı`);
      return;
    }

    if (mode === 'create') {
      if (pin !== confirm) {
        setLocalError('PIN’ler eşleşmiyor');
        return;
      }
      await onCreate(pin);
      return;
    }

    if (!file) {
      setLocalError('Bir yedek dosyası seçin');
      return;
    }
    await onRestore(file, pin);
  }

  return (
    <section className="screen setup">
      <header className="brand-block">
        <Logo size={64} />
        <p className="eyebrow">Ekip kasası</p>
        <h1>Owlthenticator</h1>
        <p className="lede">
          Kodlar bu cihazda üretilir. Gizli anahtarlar PIN ile şifrelenir; bir sunucuya gitmez.
        </p>
      </header>

      <div className="segmented" role="tablist">
        <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
          Yeni kasa
        </button>
        <button type="button" className={mode === 'restore' ? 'active' : ''} onClick={() => setMode('restore')}>
          Yedekten yükle
        </button>
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        {mode === 'restore' && (
          <label className="file-field">
            <span>Yedek dosyası</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <label>
          <span>{mode === 'create' ? 'PIN veya parola' : 'Yedek PIN’i'}</span>
          <input
            type="password"
            inputMode="text"
            autoComplete="new-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder={`${MIN_PIN_LENGTH}+ karakter`}
          />
        </label>

        {mode === 'create' && (
          <label>
            <span>PIN’i doğrula</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
        )}

        {(localError || error) && <p className="error">{localError || error}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Hazırlanıyor…' : mode === 'create' ? 'Kasayı oluştur' : 'Yedeği aç'}
        </button>
      </form>

      <ul className="notes">
        <li>Bu PIN’i unutursanız kasayı açamazsınız.</li>
        <li>İlk hesaptan sonra şifreli yedeği indirin.</li>
        <li>iPhone’da ana ekrana ekleyin; aksi halde Safari veriyi silebilir.</li>
      </ul>
    </section>
  );
}
