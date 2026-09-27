import { lazy, Suspense, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Landmark,
  LogOut,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { CASES, CHARACTERS, SKILLS } from './game/content';
import { isAvailable } from './game/engine';
import InstallPWA from './components/InstallPWA';
import Dossier from './components/Dossier';
const OdessaMap = lazy(() => import('./components/OdessaMap'));
import { useGameState } from './hooks/useGameState';

function authMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/popup-closed-by-user': 'Окно входа закрыто. Можно попробовать ещё раз.',
    'auth/cancelled-popup-request': 'Вход уже открыт в другом окне.',
    'auth/popup-blocked':
      'Браузер заблокировал окно Google. Разрешите всплывающее окно для этого сайта.',
    'auth/network-request-failed': 'Нет соединения с Google. Проверьте интернет или откройте демо.',
    'auth/unauthorized-domain':
      'Этот адрес ещё не добавлен в разрешённые домены Firebase. Пока доступна демо-кампания.',
  };
  return messages[code] ?? 'Не удалось войти. Попробуйте ещё раз или откройте демо-кампанию.';
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [demo, setDemo] = useState(() => {
    try {
      return sessionStorage.getItem('odessa-demo') === 'yes';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    import('./firebase')
      .then(({ observeAuth }) => {
        if (!alive) return;
        unsubscribe = observeAuth((current) => {
          setUser(current);
          setLoading(false);
        });
      })
      .catch(() => {
        if (alive) {
          setLoading(false);
          setError('Не удалось подключить вход Google. Демо доступно без подключения.');
        }
      });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  async function login() {
    setSigningIn(true);
    setError(null);
    try {
      const { loginWithGoogle } = await import('./firebase');
      await loginWithGoogle();
    } catch (reason) {
      setError(authMessage(reason));
    } finally {
      setSigningIn(false);
    }
  }
  async function leave() {
    if (demo) {
      setDemo(false);
      try {
        sessionStorage.removeItem('odessa-demo');
      } catch {
        /* optional preference */
      }
      return;
    }
    try {
      const { logout } = await import('./firebase');
      await logout();
    } catch (reason) {
      setError(authMessage(reason));
    }
  }
  return (
    <>
      {user || demo ? (
        <Game key={demo ? 'demo' : user!.uid} demo={demo} onLeave={leave} />
      ) : (
        <div className="entry-shell">
          <header className="app-header">
            <Brand />
            <span className="eyebrow">СЮЖЕТНАЯ СТРАТЕГИЯ · РАННЯЯ ВЕРСИЯ</span>
          </header>
          <main className="entry-main">
            <section className="entry-story">
              <span className="eyebrow accent">ОДНО ДЕЛО. ТРИ ТОЧКИ ЗРЕНИЯ.</span>
              <h1>
                Город помнит
                <br />
                ваши решения.
              </h1>
              <p>
                В мэрии говорят: всё готово. В бюджете — другие цифры. В системе — другая история.
                Разберитесь, что связывает три версии одного отчёта.
              </p>
              <div className="entry-facts">
                <span>
                  <Clock3 size={17} /> 5–10 минут за заход
                </span>
                <span>
                  <Users size={17} /> Три игровых героя
                </span>
              </div>
              <span className="fiction-note">
                Альтернативная Одесса. События, диалоги и мотивы персонажей вымышлены.
              </span>
            </section>
            <section className="panel login-panel">
              <Landmark size={32} className="accent" />
              <span className="eyebrow">ЛИЧНОЕ ДЕЛО / ДОСТУП</span>
              <h2>Войти в штаб</h2>
              <p>Продолжите через Google или познакомьтесь с городом в отдельной демо-кампании.</p>
              <button
                className="btn-titp login-button"
                onClick={login}
                disabled={loading || signingIn}
              >
                {loading ? 'Подключение…' : signingIn ? 'Открываем Google…' : 'Войти через Google'}
                <ArrowRight size={17} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setDemo(true);
                  try {
                    sessionStorage.setItem('odessa-demo', 'yes');
                  } catch {
                    /* optional preference */
                  }
                }}
              >
                Попробовать демо
              </button>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <small>
                Сейчас прогресс хранится в этом браузере. Совместная игра ещё в разработке.
              </small>
            </section>
          </main>
          <footer className="entry-footer">
            <span>ОДЕССА: КОНТУР</span>
            <span>Рабочее название · Глава 01</span>
          </footer>
        </div>
      )}
      {error && (user || demo) && (
        <div role="alert" className="toast">
          {error}
          <button aria-label="Закрыть уведомление" onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}
      <InstallPWA />
    </>
  );
}

function Brand() {
  return (
    <div className="brand">
      <Landmark size={23} />
      <div>
        ОДЕССА: КОНТУР<span>ГОРОДСКОЕ ДЕЛО</span>
      </div>
    </div>
  );
}

function Game({ demo, onLeave }: { demo: boolean; onLeave: () => void }) {
  const {
    state,
    activeCases,
    availableStaff,
    selectRole,
    makeDecision,
    advanceTick,
    resetGame,
    storageWarning,
  } = useGameState(demo);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'story' | 'personal'>('all');
  const [mobileView, setMobileView] = useState<'cases' | 'map' | 'journal' | 'team'>('cases');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const activeCharacter = CHARACTERS.find((character) => character.id === state.selectedRole);
  const activeCase = activeCases.find((file) => file.id === selectedCaseId);
  const visibleCases = activeCases.filter((file) => filter === 'all' || file.kind === filter);
  const journal = state.journal
    .filter((entry) => entry.audience === state.selectedRole || entry.audience === 'all')
    .slice()
    .reverse();
  const totalCases = CASES.filter((file) => file.role === state.selectedRole).length;
  const completedCases = state.decisions.filter(
    (decision) => CASES.find((file) => file.id === decision.caseId)?.role === state.selectedRole,
  ).length;

  function shift() {
    setSelectedCaseId(null);
    advanceTick();
    setNotice('Смена завершена. Команда отдохнула, ответы добавлены в журнал.');
  }

  if (!activeCharacter)
    return (
      <div className="entry-shell">
        <header className="app-header">
          <Brand />
          <button className="text-button" onClick={onLeave}>
            <LogOut size={16} /> Выйти
          </button>
        </header>
        <main className="role-page">
          <span className="eyebrow accent">
            {demo ? 'ДЕМО-КАМПАНИЯ' : 'ЛОКАЛЬНАЯ КАМПАНИЯ'} / ВЫБОР ГЕРОЯ
          </span>
          <h1>У каждого своя правда.</h1>
          <p className="page-intro">
            Выберите, с чьей стороны начать. У каждого — свои люди, обязательства и часть общего
            дела.
          </p>
          <div className="role-grid">
            {CHARACTERS.map((character) => (
              <article
                key={character.id}
                className="panel role-card"
                style={{ borderTopColor: character.color }}
              >
                <div className="role-top">
                  <span className="role-number">0{CHARACTERS.indexOf(character) + 1}</span>
                  <span className="role-initial" style={{ color: character.color }}>
                    {character.initials}
                  </span>
                  <Landmark size={26} />
                </div>
                <span className="eyebrow" style={{ color: character.color }}>
                  {character.area}
                </span>
                <h2>{character.name}</h2>
                <strong>{character.title}</strong>
                <p>{character.description}</p>
                <div className="personal-goal">
                  <span className="eyebrow">ЛИЧНЫЙ ИНТЕРЕС</span>
                  {character.personalGoal}
                </div>
                <button className="btn-titp" onClick={() => selectRole(character.id)}>
                  Выбрать: {character.name}
                  <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
          <p className="fiction-note">
            В этой версии можно переключаться между героями одной локальной кампании. Выбор не
            занимает место другого игрока.
          </p>
        </main>
      </div>
    );

  return (
    <div className={`game-shell view-${mobileView}`}>
      <header className="app-header game-header">
        <Brand />
        <div className="metrics">
          {(
            [
              ['trust', 'Доверие'],
              ['stability', 'Стабильность'],
              ['evidence', 'Факты'],
            ] as const
          ).map(([key, title]) => (
            <div key={key} className={`metric metric-${key}`}>
              <span>{title}</span>
              <strong>
                {state.metrics[key]}
                <small>/100</small>
              </strong>
              <div className="meter">
                <i style={{ width: `${state.metrics[key]}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="shift-controls">
          <div>
            <strong>
              День {Math.floor(state.tick / 2) + 1} · {state.tick % 2 === 0 ? 'Утро' : 'Вечер'}
            </strong>
            <span>
              Смена {state.tick + 1} · {demo ? 'демо' : 'локально'}
            </span>
          </div>
          <button className="btn-titp" onClick={shift}>
            Завершить смену
            <ArrowRight size={16} />
          </button>
        </div>
      </header>
      <div className="status-bar">
        <span>
          <span className="status-dot" /> {activeCharacter.name} / {activeCharacter.area}
        </span>
        <span>
          Ресурс ведомства <strong>{state.resources[activeCharacter.id]}</strong>
        </span>
        <div>
          <button
            onClick={() => {
              selectRole(null);
              setSelectedCaseId(null);
            }}
            className="text-button"
          >
            <Users size={14} /> Сменить героя
          </button>
          <span className="mobile-shift-label">
            День {Math.floor(state.tick / 2) + 1} · {state.tick % 2 === 0 ? 'Утро' : 'Вечер'}
          </span>
          <button className="icon-button" aria-label="Выйти из кампании" onClick={onLeave}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {storageWarning && (
        <p role="alert" className="storage-warning">
          {storageWarning}
        </p>
      )}
      <nav className="mobile-tabs" aria-label="Разделы штаба">
        {(
          [
            ['cases', 'Входящие', Briefcase],
            ['map', 'Карта', MapPin],
            ['journal', 'Журнал', BookOpen],
            ['team', 'Команда', Users],
          ] as const
        ).map(([id, title, Icon]) => (
          <button key={id} aria-pressed={mobileView === id} onClick={() => setMobileView(id)}>
            <Icon size={16} />
            {title}
          </button>
        ))}
      </nav>
      <main className={`desk mobile-${mobileView}`}>
        <section className="case-inbox" aria-label="Входящие дела">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                День {Math.floor(state.tick / 2) + 1} · {state.tick % 2 === 0 ? 'Утро' : 'Вечер'}
              </span>
              <h2>Входящие</h2>
            </div>
            <span className="count-badge">{activeCases.length}</span>
          </div>
          <div className="case-filters" aria-label="Фильтр дел">
            {(
              [
                ['all', 'Все'],
                ['story', 'Сюжет'],
                ['personal', 'Личные'],
              ] as const
            ).map(([id, title]) => (
              <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {title}
              </button>
            ))}
          </div>
          <div className="case-list">
            {visibleCases.map((file) => (
              <button
                className={`case-card ${file.kind}`}
                key={file.id}
                onClick={() => setSelectedCaseId(file.id)}
              >
                <span className="case-type">
                  {file.kind === 'story' ? <AlertTriangle size={14} /> : <Briefcase size={14} />}
                  {file.kind === 'story' ? 'Общее дело' : 'Личное поручение'}
                </span>
                <h3>{file.title}</h3>
                <p>{file.summary}</p>
                <span className="case-location">
                  <MapPin size={12} />
                  {file.location}
                  <ChevronRight size={16} />
                </span>
              </button>
            ))}
            {visibleCases.length === 0 && (
              <div className="empty-state">
                <CheckCircle2 size={28} />
                <h3>{completedCases === totalCases ? 'Глава пройдена' : 'Папка разобрана'}</h3>
                <p>
                  {completedCases === totalCases
                    ? 'Все дела этого героя закрыты. Можно изучить другую сторону истории или дождаться следующей главы.'
                    : activeCases.length
                      ? 'В этом разделе пока нет дел. Попробуйте другой фильтр.'
                      : 'Команда ещё работает. Завершите смену — сотрудники вернутся, а история продолжится.'}
                </p>
              </div>
            )}
          </div>
          <div className="inbox-footer">
            <span>Закрыто дел</span>
            <strong>
              {completedCases} / {totalCases}
            </strong>
          </div>
        </section>
        <section className="map-panel" aria-label="Карта Одессы">
          <div className="map-heading">
            <span className="eyebrow">ОПЕРАТИВНАЯ КАРТА</span>
            <h2>Одесса</h2>
            <span>Программа «Контур»</span>
          </div>
          <TransformWrapper
            initialScale={1}
            minScale={0.8}
            maxScale={4}
            centerOnInit
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperClass="map-transform"
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%', height: '100%' }}
                >
                  <div className="map-content">
                    <Suspense fallback={<span className="map-loading">Загрузка карты…</span>}>
                      <OdessaMap />
                    </Suspense>
                    {visibleCases.map((file) => (
                      <button
                        key={file.id}
                        className={`map-pin ${file.kind}`}
                        style={{ left: `${file.coordinates[0]}%`, top: `${file.coordinates[1]}%` }}
                        aria-label={`Открыть дело: ${file.title}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCaseId(file.id);
                        }}
                      >
                        {file.kind === 'story' ? (
                          <AlertTriangle size={20} />
                        ) : (
                          <Briefcase size={20} />
                        )}
                        <span>{file.location}</span>
                      </button>
                    ))}
                  </div>
                </TransformComponent>
                <div className="map-tools">
                  <button aria-label="Приблизить карту" onClick={() => zoomIn()}>
                    <Plus size={19} />
                  </button>
                  <button aria-label="Отдалить карту" onClick={() => zoomOut()}>
                    <Minus size={19} />
                  </button>
                  <button aria-label="Вернуть масштаб карты" onClick={() => resetTransform()}>
                    <RotateCcw size={17} />
                  </button>
                </div>
              </>
            )}
          </TransformWrapper>
          <div className="map-legend">
            <span>
              <i className="story-dot" />
              Общее дело
            </span>
            <span>
              <i />
              Личное поручение
            </span>
            <small>Расположение событий схематическое</small>
          </div>
        </section>
        <aside className="journal-panel" aria-label="Журнал событий">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ПАМЯТЬ ГОРОДА</span>
              <h2>Журнал</h2>
            </div>
            <BookOpen size={20} />
          </div>
          <div className="journal-list">
            {journal.map((entry) => (
              <article className="journal-entry" key={entry.id}>
                <span className="eyebrow">
                  СМЕНА {entry.tick + 1} · {entry.audience === 'all' ? 'ОБЩЕЕ' : 'ЛИЧНОЕ'}
                </span>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </article>
            ))}
          </div>
          <div className="journal-footer">
            <Clock3 size={14} />
            <span>
              Следующая смена автоматически
              <br />
              <strong>
                {new Date(state.nextTickAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>
        </aside>
      </main>
      <section className="roster-strip" aria-label="Сотрудники ведомства">
        <div className="roster-heading">
          <span className="eyebrow">ВАША КОМАНДА</span>
          <strong>
            {availableStaff.length}
            <small> / 3 свободны</small>
          </strong>
        </div>
        <div className="roster-cards">
          {state.staff
            .filter((staff) => staff.role === state.selectedRole)
            .map((staff) => (
              <div
                className={`roster-person ${isAvailable(staff, state.tick) ? '' : 'busy'}`}
                key={staff.id}
              >
                <span className="staff-monogram">
                  {staff.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')}
                </span>
                <div>
                  <strong>{staff.name}</strong>
                  <span>{SKILLS[staff.skill]}</span>
                  <small>
                    {isAvailable(staff, state.tick)
                      ? `Готов к работе · энергия ${100 - staff.fatigue}%`
                      : staff.busyUntilTick > state.tick
                        ? 'На поручении до следующей смены'
                        : 'Нужен отдых'}
                  </small>
                  <div className="energy-bar">
                    <i style={{ width: `${100 - staff.fatigue}%` }} />
                  </div>
                </div>
              </div>
            ))}
        </div>
        <button
          className="text-button reset-button"
          onClick={() => {
            if (
              window.confirm(
                'Начать эту локальную кампанию заново? Текущий прогресс будет сброшен.',
              )
            ) {
              resetGame();
              setSelectedCaseId(null);
            }
          }}
        >
          <RotateCcw size={13} />
          Новая кампания
        </button>
        <div className="phone-team-actions">
          <button className="btn-secondary" onClick={() => selectRole(null)}>
            <Users size={18} />
            Сменить героя
          </button>
          <button className="btn-secondary" onClick={onLeave}>
            <LogOut size={18} />
            Выйти из кампании
          </button>
          <p>Прогресс сохранён в этом браузере. Онлайн-синхронизация ещё не подключена.</p>
        </div>
      </section>
      <p className="game-disclaimer">
        Вымышленная история · {demo ? 'Демо сохраняется отдельно' : 'Сохранено в этом браузере'} ·
        Онлайн-синхронизация ещё не подключена
      </p>
      {activeCase && (
        <Dossier
          key={activeCase.id}
          file={activeCase}
          state={state}
          onClose={() => setSelectedCaseId(null)}
          onSubmit={(choice, staff) => {
            makeDecision(activeCase.id, choice, staff);
            setSelectedCaseId(null);
            setNotice('Поручение отправлено. Ответ сохранён в журнале.');
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button aria-label="Закрыть уведомление" onClick={() => setNotice('')}>
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
