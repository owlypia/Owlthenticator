import { useEffect, useRef, useState, type FormEvent } from 'react';
import QrScanner from 'qr-scanner';
import type { Account, TotpAlgorithm } from '../vault/types';
import { accountFromManual, parseOtpauth } from '../vault/otpauth';

type AddSheetProps = {
  onClose: () => void;
  onAdd: (account: Account) => void;
};

export function AddSheet({ onClose, onAdd }: AddSheetProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const [tab, setTab] = useState<'qr' | 'manual'>('qr');
  const [error, setError] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<TotpAlgorithm>('SHA1');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (tab !== 'qr' || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          onAddRef.current(parseOtpauth(result.data));
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'QR okunamadı');
        }
      },
      { highlightScanRegion: true, highlightCodeOutline: true },
    );
    scannerRef.current = scanner;
    scanner.start().catch(() => {
      setError('Kameraya erişilemedi. Secret’ı elle girebilirsiniz.');
    });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [tab]);

  function handleManual(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      onAdd(accountFromManual({ issuer, label, secret, algorithm, digits, period }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Hesap eklenemedi');
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="sheet" role="dialog" aria-labelledby="add-title" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2 id="add-title">Hesap ekle</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="segmented">
          <button type="button" className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>
            QR tara
          </button>
          <button type="button" className={tab === 'manual' ? 'active' : ''} onClick={() => setTab('manual')}>
            Elle gir
          </button>
        </div>

        {tab === 'qr' ? (
          <div className="scanner">
            <video ref={videoRef} playsInline />
            <p className="hint">Sitenin gösterdiği authenticator QR kodunu çerçeveye alın.</p>
          </div>
        ) : (
          <form className="form" onSubmit={handleManual}>
            <label>
              <span>Servis (issuer)</span>
              <input value={issuer} onChange={(event) => setIssuer(event.target.value)} placeholder="GitHub" />
            </label>
            <label>
              <span>Hesap adı</span>
              <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="ekip@sirket.com" />
            </label>
            <label>
              <span>Gizli anahtar</span>
              <input
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="Base32 secret"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <div className="row">
              <label>
                <span>Algoritma</span>
                <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as TotpAlgorithm)}>
                  <option value="SHA1">SHA1</option>
                  <option value="SHA256">SHA256</option>
                  <option value="SHA512">SHA512</option>
                </select>
              </label>
              <label>
                <span>Hane</span>
                <select value={digits} onChange={(event) => setDigits(Number(event.target.value) as 6 | 8)}>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </label>
              <label>
                <span>Süre</span>
                <select value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
                  <option value={30}>30 sn</option>
                  <option value={60}>60 sn</option>
                </select>
              </label>
            </div>
            <button className="primary" type="submit">
              Hesabı kaydet
            </button>
          </form>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}
