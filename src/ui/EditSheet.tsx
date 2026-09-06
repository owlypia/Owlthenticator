import { useState, type FormEvent } from 'react';
import type { Account } from '../vault/types';

type EditSheetProps = {
  account: Account;
  onClose: () => void;
  onSave: (account: Account) => void;
};

export function EditSheet({ account, onClose, onSave }: EditSheetProps) {
  const [issuer, setIssuer] = useState(account.issuer);
  const [label, setLabel] = useState(account.label);
  const [reveal, setReveal] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({
      ...account,
      issuer: issuer.trim() || account.issuer,
      label: label.trim() || account.label,
    });
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section className="sheet" role="dialog" aria-labelledby="edit-title" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2 id="edit-title">Hesabı düzenle</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span>Servis</span>
            <input value={issuer} onChange={(event) => setIssuer(event.target.value)} />
          </label>
          <label>
            <span>Hesap adı</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <div className="secret-box">
            <div>
              <span>Gizli anahtar</span>
              <p className="mono">{reveal ? account.secret : '••••••••••••'}</p>
            </div>
            <button type="button" className="ghost compact" onClick={() => setReveal((value) => !value)}>
              {reveal ? 'Gizle' : 'Göster'}
            </button>
          </div>
          <button className="primary" type="submit">
            Kaydet
          </button>
        </form>
      </section>
    </div>
  );
}
