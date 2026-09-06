import { useMemo, useState } from 'react';
import type { Account } from '../vault/types';
import { AccountCard } from './AccountCard';
import { InstallHint } from './InstallHint';
import { Logo } from './Logo';

type VaultScreenProps = {
  accounts: Account[];
  now: number;
  toast: string | null;
  needsBackup: boolean;
  onAdd: () => void;
  onSettings: () => void;
  onCopy: (code: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onExport: () => void;
  onDismissBackup: () => void;
};

export function VaultScreen({
  accounts,
  now,
  toast,
  needsBackup,
  onAdd,
  onSettings,
  onCopy,
  onEdit,
  onDelete,
  onExport,
  onDismissBackup,
}: VaultScreenProps) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? accounts.filter((account) => `${account.issuer} ${account.label}`.toLowerCase().includes(needle))
      : accounts;
    return [...list].sort((a, b) => a.issuer.localeCompare(b.issuer, 'tr') || a.label.localeCompare(b.label, 'tr'));
  }, [accounts, query]);

  return (
    <section className="screen vault">
      <header className="vault-head">
        <div className="brand-inline">
          <Logo size={40} />
          <div>
            <p className="eyebrow">Owlthenticator</p>
            <h1>Kasa</h1>
          </div>
        </div>
        <div className="head-actions">
          <button type="button" className="ghost compact" onClick={onSettings}>
            Ayarlar
          </button>
          <button type="button" className="primary compact" onClick={onAdd}>
            Ekle
          </button>
        </div>
      </header>

      <InstallHint />

      {needsBackup && accounts.length > 0 && (
        <aside className="backup-nudge">
          <div>
            <strong>Şifreli yedeği alın</strong>
            <p>Bu uygulama silinirse kodlar gider. Yedeği güvenli bir yere koyun.</p>
          </div>
          <div className="install-actions">
            <button type="button" className="ghost compact" onClick={onExport}>
              İndir
            </button>
            <button type="button" className="text-btn" onClick={onDismissBackup}>
              Sonra
            </button>
          </div>
        </aside>
      )}

      {accounts.length > 0 && (
        <label className="search">
          <span className="sr-only">Ara</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Servis veya hesap ara" />
        </label>
      )}

      {visible.length === 0 ? (
        <div className="empty">
          <Logo size={72} />
          <h2>{accounts.length === 0 ? 'Henüz hesap yok' : 'Sonuç yok'}</h2>
          <p>
            {accounts.length === 0
              ? 'Bir sitede 2FA açınca QR kodu buraya taratın. Kodlar yalnızca bu cihazda üretilir.'
              : 'Aramayı daraltın veya temizleyin.'}
          </p>
          {accounts.length === 0 && (
            <button type="button" className="primary" onClick={onAdd}>
              İlk hesabı ekle
            </button>
          )}
        </div>
      ) : (
        <div className="account-list">
          {visible.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              now={now}
              onCopy={onCopy}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
