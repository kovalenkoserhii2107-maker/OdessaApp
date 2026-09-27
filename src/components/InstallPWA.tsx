import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const DISMISS_KEY = 'odessa-install-dismissed';

export default function InstallPWA() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < 7 * 86400000;
    } catch {
      return false;
    }
  });
  const [message, setMessage] = useState('');
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setIos(
      !standalone &&
        (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)),
    );
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      if (!standalone) setDeferred(event as InstallEvent);
    };
    const installed = () => {
      setDeferred(null);
      setIos(false);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  function dismiss() {
    if (needRefresh) {
      setNeedRefresh(false);
      return;
    }
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* Session dismissal still works. */
    }
  }
  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === 'dismissed') dismiss();
    } catch {
      setMessage('Установку можно открыть из меню браузера: «Установить приложение».');
      setDeferred(null);
    }
  }
  if (!needRefresh && (dismissed || (!ios && !deferred && !message))) return null;
  return (
    <aside
      className="install-prompt"
      aria-label={needRefresh ? 'Обновление приложения' : 'Установка приложения'}
    >
      <div className="install-heading">
        <Download size={19} />
        <h2>{needRefresh ? 'Доступно обновление' : 'Город всегда под рукой'}</h2>
        <button className="icon-button" onClick={dismiss} aria-label="Закрыть предложение">
          <X size={19} />
        </button>
      </div>
      {needRefresh ? (
        <>
          <p>Новая версия готова. Текущие решения сохранены в этом браузере.</p>
          <button
            className="btn-titp"
            onClick={() => {
              void updateServiceWorker(true).catch(() =>
                setMessage('Не удалось обновить приложение. Попробуйте перезагрузить страницу.'),
              );
            }}
          >
            Обновить приложение
          </button>
        </>
      ) : (
        <>
          <p>Добавьте «Одесса: Контур» на экран «Домой», чтобы открывать штаб одним касанием.</p>
          {ios ? (
            <ol>
              <li>Откройте эту страницу в Safari и нажмите «Поделиться» в меню браузера.</li>
              <li>Выберите «На экран Домой», затем «Добавить».</li>
            </ol>
          ) : (
            deferred && (
              <button className="btn-titp" onClick={install}>
                Установить приложение
              </button>
            )
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </aside>
  );
}
