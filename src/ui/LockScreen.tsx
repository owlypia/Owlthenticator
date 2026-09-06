import { useState, type FormEvent } from 'react';
import { Logo } from './Logo';

type LockScreenProps = {
  busy: boolean;
  error: string | null;
  onUnlock: (pin: string) => Promise<void>;
};

export function LockScreen({ busy, error, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onUnlock(pin);
  }

  return (
    <section className="screen lock">
      <header className="brand-block">
        <Logo />
        <p className="eyebrow">Kilitli</p>
        <h1>Owlthenticator</h1>
        <p className="lede">Kasayı açmak için PIN’inizi girin.</p>
      </header>

      <form className="panel form" onSubmit={handleSubmit}>
        <label>
          <span>PIN</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={busy || pin.length < 1}>
          {busy ? 'Açılıyor…' : 'Kasayı aç'}
        </button>
      </form>
    </section>
  );
}
