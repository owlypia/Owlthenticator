import { useState, type FormEvent } from 'react';
import { MIN_PIN_LENGTH, type VaultSettings } from '../vault/types';

type SettingsScreenProps = {
  settings: VaultSettings;
  accountCount: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSaveSettings: (settings: VaultSettings) => void;
  onExport: () => void;
  onImport: (file: File, pin: string) => Promise<boolean>;
  onChangePin: (currentPin: string, nextPin: string) => Promise<boolean>;
  onLock: () => void;
};

export function SettingsScreen({
  settings,
  accountCount,
  busy,
  error,
  onClose,
  onSaveSettings,
  onExport,
  onImport,
  onChangePin,
  onLock,
}: SettingsScreenProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [importPin, setImportPin] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function flash(message: string) {
    setOk(message);
    setLocalError(null);
  }

  async function handleChangePin(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    if (nextPin.length < MIN_PIN_LENGTH) {
      setLocalError(`Yeni PIN en az ${MIN_PIN_LENGTH} karakter olmalı`);
      return;
    }
    if (nextPin !== confirmPin) {
      setLocalError('Yeni PIN’ler eşleşmiyor');
      return;
    }
    const changed = await onChangePin(currentPin, nextPin);
    if (!changed) return;
    setCurrentPin('');
    setNextPin('');
    setConfirmPin('');
    flash('PIN güncellendi');
  }

  async function handleImport(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    if (!importFile) {
      setLocalError('Yedek dosyası seçin');
      return;
    }
    const restored = await onImport(importFile, importPin);
    if (!restored) return;
    setImportPin('');
    flash('Yedek yüklendi');
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section className="sheet settings" role="dialog" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2 id="settings-title">Ayarlar</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="setting-block">
          <h3>Kilit</h3>
          <label>
            <span>Boşta kilit süresi</span>
            <select
              value={settings.lockTimeoutMs}
              onChange={(event) => onSaveSettings({ ...settings, lockTimeoutMs: Number(event.target.value) })}
            >
              <option value={30_000}>30 saniye</option>
              <option value={60_000}>1 dakika</option>
              <option value={120_000}>2 dakika</option>
              <option value={300_000}>5 dakika</option>
              <option value={900_000}>15 dakika</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.lockOnHide}
              onChange={(event) => onSaveSettings({ ...settings, lockOnHide: event.target.checked })}
            />
            Uygulama gizlenince kilitle
          </label>
        </div>

        <div className="setting-block">
          <h3>Şifreli yedek</h3>
          <p className="hint">
            {accountCount} hesap bu cihazda. Telefon değişince veya uygulama silinince geri getirmek için yedeği indirin.
            Aynı PIN ile açılır.
          </p>
          <button type="button" className="primary" onClick={onExport}>
            Yedeği indir
          </button>
          <form className="form tight" onSubmit={handleImport}>
            <label className="file-field">
              <span>Yedekten geri yükle (mevcut kasanın yerine geçer)</span>
              <input type="file" accept="application/json,.json" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
            </label>
            <label>
              <span>Yedek PIN’i</span>
              <input type="password" value={importPin} onChange={(event) => setImportPin(event.target.value)} />
            </label>
            <button className="ghost" type="submit" disabled={busy}>
              Yedeği yükle
            </button>
          </form>
        </div>

        <form className="setting-block form" onSubmit={handleChangePin}>
          <h3>PIN değiştir</h3>
          <label>
            <span>Mevcut PIN</span>
            <input type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} />
          </label>
          <label>
            <span>Yeni PIN</span>
            <input type="password" value={nextPin} onChange={(event) => setNextPin(event.target.value)} />
          </label>
          <label>
            <span>Yeni PIN tekrar</span>
            <input type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} />
          </label>
          <button className="ghost" type="submit" disabled={busy}>
            PIN’i güncelle
          </button>
        </form>

        {(localError || error) && <p className="error">{localError || error}</p>}
        {ok && !error && !localError && <p className="ok">{ok}</p>}

        <button type="button" className="ghost" onClick={onLock}>
          Şimdi kilitle
        </button>
      </section>
    </div>
  );
}
