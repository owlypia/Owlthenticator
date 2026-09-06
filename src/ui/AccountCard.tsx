import { useEffect, useState } from 'react';
import { formatCode, generateTotp, remainingSeconds } from '../crypto/totp';
import type { Account } from '../vault/types';

type AccountCardProps = {
  account: Account;
  now: number;
  onCopy: (code: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export function AccountCard({ account, now, onCopy, onEdit, onDelete }: AccountCardProps) {
  const [code, setCode] = useState('------');
  const remain = remainingSeconds(account.period, now);
  const progress = remain / account.period;
  const urgent = remain <= 5;
  const step = Math.floor(now / 1000 / account.period);

  useEffect(() => {
    let cancelled = false;
    generateTotp(account.secret, step * account.period * 1000, account.algorithm, account.digits, account.period)
      .then((value) => {
        if (!cancelled) setCode(value);
      })
      .catch(() => {
        if (!cancelled) setCode('Hata');
      });
    return () => {
      cancelled = true;
    };
  }, [account, step]);

  return (
    <article className={`account-card ${urgent ? 'urgent' : ''}`}>
      <button type="button" className="code-hit" onClick={() => onCopy(code)} aria-label={`${account.issuer} kodunu kopyala`}>
        <div className="account-meta">
          <strong>{account.issuer}</strong>
          <span>{account.label}</span>
        </div>
        <div className="code-row">
          <p className="code">{code === 'Hata' ? 'Hata' : formatCode(code)}</p>
          <svg className="ring" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" />
            <circle
              cx="18"
              cy="18"
              r="15"
              className="ring-value"
              strokeDasharray={`${progress * 94.2} 94.2`}
            />
            <text x="18" y="21">{remain}</text>
          </svg>
        </div>
      </button>
      <div className="account-actions">
        <button type="button" className="text-btn" onClick={() => onEdit(account)}>
          Düzenle
        </button>
        <button type="button" className="text-btn danger" onClick={() => onDelete(account)}>
          Sil
        </button>
      </div>
    </article>
  );
}
