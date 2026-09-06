import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function InstallHint() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem('owl.installHint') === '1' || isStandalone());

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden || isStandalone()) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      setHidden(true);
      return;
    }
    setHidden(true);
  }

  function dismiss() {
    localStorage.setItem('owl.installHint', '1');
    setHidden(true);
  }

  return (
    <aside className="install-hint">
      <div>
        <strong>Ana ekrana ekleyin</strong>
        <p>
          {isIos()
            ? 'Safari’de Paylaş → Ana Ekrana Ekle. Aksi halde iOS site verisini silebilir.'
            : 'Uygulamayı cihazınıza kurun; kodlar çevrimdışı da üretilir.'}
        </p>
      </div>
      <div className="install-actions">
        {!isIos() && promptEvent && (
          <button type="button" className="ghost compact" onClick={install}>
            Kur
          </button>
        )}
        <button type="button" className="text-btn" onClick={dismiss}>
          Tamam
        </button>
      </div>
    </aside>
  );
}
