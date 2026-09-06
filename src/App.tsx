import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadBlob } from './crypto/bytes';
import { createVault, fromBackup, persistVault, rewrapPin, toBackup, unlockVault, type UnlockedVault } from './crypto/vault';
import { AddSheet } from './ui/AddSheet';
import { EditSheet } from './ui/EditSheet';
import { LockScreen } from './ui/LockScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { SetupScreen } from './ui/SetupScreen';
import { VaultScreen } from './ui/VaultScreen';
import { loadPersisted, savePersisted } from './vault/storage';
import type { Account, PersistedVault, VaultData } from './vault/types';

type Phase = 'loading' | 'setup' | 'locked' | 'ready';

function backupName(): string {
  const day = new Date().toISOString().slice(0, 10);
  return `owlthenticator-yedek-${day}.json`;
}

async function readBackupFile(file: File): Promise<PersistedVault> {
  const text = await file.text();
  return fromBackup(JSON.parse(text));
}

export function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [unlocked, setUnlocked] = useState<UnlockedVault | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsBackup, setNeedsBackup] = useState(() => localStorage.getItem('owl.backupOk') !== '1');
  const lastActive = useRef(Date.now());
  const unlockedRef = useRef<UnlockedVault | null>(null);
  unlockedRef.current = unlocked;

  useEffect(() => {
    let cancelled = false;
    loadPersisted()
      .then((stored) => {
        if (cancelled) return;
        setPhase(stored ? 'locked' : 'setup');
      })
      .catch(() => {
        if (!cancelled) setPhase('setup');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const lock = useCallback(() => {
    setUnlocked(null);
    setAdding(false);
    setEditing(null);
    setSettingsOpen(false);
    setError(null);
    setPhase((current) => (current === 'ready' ? 'locked' : current));
  }, []);

  useEffect(() => {
    if (phase !== 'ready' || !unlocked) return;

    const bump = () => {
      lastActive.current = Date.now();
    };
    const onHide = () => {
      if (unlocked.data.settings.lockOnHide && document.hidden) lock();
    };
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastActive.current >= unlocked.data.settings.lockTimeoutMs) lock();
    }, 1000);

    bump();
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(watchdog);
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [phase, unlocked, lock]);

  async function commit(next: VaultData, persisted = unlocked?.persisted, dek = unlocked?.dek) {
    if (!dek || !persisted) return;
    const stored = await persistVault(dek, persisted, next);
    await savePersisted(stored);
    setUnlocked({ dek, persisted: stored, data: next });
  }

  async function handleCreate(pin: string) {
    setBusy(true);
    setError(null);
    try {
      const vault = await createVault(pin);
      await savePersisted(vault.persisted);
      setUnlocked(vault);
      setPhase('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kasa oluşturulamadı');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(pin: string) {
    setBusy(true);
    setError(null);
    try {
      const stored = await loadPersisted();
      if (!stored) {
        setPhase('setup');
        return;
      }
      const vault = await unlockVault(pin, stored);
      setUnlocked(vault);
      setPhase('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Açılamadı');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(file: File, pin: string) {
    setBusy(true);
    setError(null);
    try {
      const persisted = await readBackupFile(file);
      const vault = await unlockVault(pin, persisted);
      await savePersisted(vault.persisted);
      setUnlocked(vault);
      setPhase('ready');
      localStorage.setItem('owl.backupOk', '1');
      setNeedsBackup(false);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Yedek açılamadı');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleExport() {
    const persisted = unlockedRef.current?.persisted;
    if (!persisted) return;
    downloadBlob(backupName(), JSON.stringify(toBackup(persisted), null, 2));
    localStorage.setItem('owl.backupOk', '1');
    setNeedsBackup(false);
    setToast('Yedek indirildi');
  }

  async function handleChangePin(currentPin: string, nextPin: string) {
    if (!unlocked) return false;
    setBusy(true);
    setError(null);
    try {
      const persisted = await rewrapPin(currentPin, nextPin, unlocked.persisted);
      await savePersisted(persisted);
      setUnlocked({ ...unlocked, persisted });
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'PIN değiştirilemedi');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleAdd(account: Account) {
    if (!unlocked) return;
    const exists = unlocked.data.accounts.some((item) => item.secret === account.secret && item.issuer === account.issuer);
    if (exists) {
      setToast('Bu hesap zaten kasada');
      return;
    }
    setAdding(false);
    void commit({
      ...unlocked.data,
      accounts: [...unlocked.data.accounts, account],
    });
    setNeedsBackup(true);
    localStorage.removeItem('owl.backupOk');
    setToast('Hesap eklendi');
  }

  function handleSaveAccount(account: Account) {
    if (!unlocked) return;
    setEditing(null);
    void commit({
      ...unlocked.data,
      accounts: unlocked.data.accounts.map((item) => (item.id === account.id ? account : item)),
    });
  }

  function handleDelete(account: Account) {
    if (!unlocked) return;
    const ok = window.confirm(`${account.issuer} hesabını silmek istiyor musunuz? Bu geri alınamaz.`);
    if (!ok) return;
    void commit({
      ...unlocked.data,
      accounts: unlocked.data.accounts.filter((item) => item.id !== account.id),
    });
    setToast('Hesap silindi');
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code.replace(/\s/g, ''));
    } catch {
      const field = document.createElement('textarea');
      field.value = code.replace(/\s/g, '');
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setToast('Kod kopyalandı');
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (phase === 'loading') {
    return (
      <main className="app">
        <p className="loading">Kasa kontrol ediliyor…</p>
      </main>
    );
  }

  if (phase === 'setup') {
    return (
      <main className="app">
        <SetupScreen busy={busy} error={error} onCreate={handleCreate} onRestore={handleRestore} />
      </main>
    );
  }

  if (phase === 'locked' || !unlocked) {
    return (
      <main className="app">
        <LockScreen busy={busy} error={error} onUnlock={handleUnlock} />
      </main>
    );
  }

  return (
    <main className="app">
      <VaultScreen
        accounts={unlocked.data.accounts}
        now={now}
        toast={toast}
        needsBackup={needsBackup}
        onAdd={() => setAdding(true)}
        onSettings={() => {
          setError(null);
          setSettingsOpen(true);
        }}
        onCopy={handleCopy}
        onEdit={setEditing}
        onDelete={handleDelete}
        onExport={handleExport}
        onDismissBackup={() => setNeedsBackup(false)}
      />
      {adding && <AddSheet onClose={() => setAdding(false)} onAdd={handleAdd} />}
      {editing && <EditSheet account={editing} onClose={() => setEditing(null)} onSave={handleSaveAccount} />}
      {settingsOpen && (
        <SettingsScreen
          settings={unlocked.data.settings}
          accountCount={unlocked.data.accounts.length}
          busy={busy}
          error={error}
          onClose={() => setSettingsOpen(false)}
          onSaveSettings={(settings) => void commit({ ...unlocked.data, settings })}
          onExport={handleExport}
          onImport={handleRestore}
          onChangePin={handleChangePin}
          onLock={lock}
        />
      )}
    </main>
  );
}
