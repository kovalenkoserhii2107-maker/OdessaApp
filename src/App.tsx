import React, { useState } from 'react';
import { User, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import { CHARACTERS, SKILLS } from './game/content';
import type { RoleId } from './game/types';
import InstallPWA from './components/InstallPWA';
import OdessaMap from './components/OdessaMap';
import { useGameState } from './hooks/useGameState';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Screen = 'login' | 'select' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<RoleId | null>(null);
  const [, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // TitP UI States
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser && screen === 'login') {
        setScreen('select');
      }
    });
    return () => unsubscribe();
  }, [screen]);
  
  // Connect Game Engine
  const { state, activeCases, availableStaff, makeDecision, advanceTick } = useGameState(role);
  
  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (e: any) {
      console.log('Login failed', e);
      setAuthError(e.message || "Неизвестная ошибка при входе");
    }
  };

  const handleLogout = async () => {
    await logout();
    setRole(null);
    setScreen('login');
  };
  
  const handleSelectRole = (selectedRole: RoleId) => {
    setRole(selectedRole);
    setScreen('game');
  };

  const activeCharacter = CHARACTERS.find(c => c.id === role);

  const handleMakeDecision = () => {
    if (selectedCaseId && selectedChoiceId && selectedStaffId) {
      makeDecision(selectedCaseId, selectedChoiceId, selectedStaffId);
      setSelectedCaseId(null);
      setSelectedChoiceId(null);
      setSelectedStaffId(null);
    }
  };

  const activeCase = activeCases.find(c => c.id === selectedCaseId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER (TitP Style) */}
      <header className="panel" style={{ padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--titp-accent-yellow)' }}>ОДЕССА: КОНТУР</h1>
        
        {screen === 'game' && activeCharacter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--titp-text-muted)' }}>ДОВЕРИЕ</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--titp-accent-blue)' }}>{state.metrics.trust}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--titp-text-muted)' }}>СТАБИЛЬНОСТЬ</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--titp-accent-yellow)' }}>{state.metrics.stability}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--titp-text-muted)' }}>ФАКТЫ</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--titp-accent-red)' }}>{state.metrics.evidence}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid #444', paddingLeft: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>День {Math.floor(state.tick / 2) + 1}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--titp-text-muted)' }}>{state.tick % 2 === 0 ? 'УТРО (09:00)' : 'ВЕЧЕР (21:00)'}</span>
              </div>
              <button className="btn-titp" onClick={advanceTick} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                ЗАВЕРШИТЬ СМЕНУ 
              </button>
              <button onClick={handleLogout} style={{ color: 'var(--titp-text-muted)', fontSize: '0.8rem', textDecoration: 'underline' }}>ВЫХОД</button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        
        {/* LOGIN SCREEN */}
        {screen === 'login' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', color: 'var(--titp-accent-yellow)' }}>ДОСТУП В ШТАБ</h2>
              <p style={{ color: 'var(--titp-text-muted)', marginBottom: '32px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Синхронизация департаментов.<br/>Обновление данных каждые 12 часов.
              </p>
              {isAuthLoading ? (
                <div style={{ padding: '12px', color: 'var(--titp-text-muted)' }}>ПОДКЛЮЧЕНИЕ К СЕРВЕРУ...</div>
              ) : (
                <button className="btn-titp" style={{ width: '100%', display: 'flex', gap: '12px', justifyContent: 'center' }} onClick={handleLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  ВОЙТИ ЧЕРЕЗ GOOGLE
                </button>
              )}
              
              {authError && (
                <div style={{ marginTop: '16px', padding: '12px', border: '1px solid var(--titp-accent-red)', color: 'var(--titp-accent-red)', fontSize: '0.85rem' }}>
                  {authError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHARACTER SELECT SCREEN */}
        {screen === 'select' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ maxWidth: '900px', width: '100%' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', color: 'var(--titp-accent-yellow)' }}>ВЫБЕРИТЕ ВЕДОМСТВО</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {CHARACTERS.map(char => (
                  <div key={char.id} className="panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `4px solid ${char.color}` }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: char.color, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2rem', color: '#121212', boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                        {char.initials}
                      </div>
                      <h3 style={{ fontSize: '1.5rem', color: 'var(--titp-text-main)' }}>{char.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: char.color, fontWeight: 700 }}>{char.title}</div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--titp-text-muted)', flex: 1, textAlign: 'center' }}>{char.description}</p>
                    <button className="btn-titp" style={{ backgroundColor: char.color, color: '#121212', width: '100%', marginTop: '16px' }} onClick={() => handleSelectRole(char.id)}>
                      ПОДПИСАТЬ КОНТРАКТ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GAME SCREEN (TITP LAYOUT) */}
        {screen === 'game' && activeCharacter && (
          <>
            {/* The "Map" Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#16191b' }}>
              
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}>
                <OdessaMap>
                  {activeCases.map((c, index) => {
                    const coords = [
                      { x: 700, y: 900 }, // Приморский
                      { x: 450, y: 900 }, // Малиновский
                      { x: 600, y: 1400 }, // Киевский
                      { x: 650, y: 300 } // Суворовский
                    ][index % 4];
                    
                    return (
                      <foreignObject key={c.id} x={coords.x - 100} y={coords.y - 100} width="200" height="200" style={{ overflow: 'visible' }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="map-case-icon" style={{ position: 'relative' }} onClick={() => setSelectedCaseId(c.id)}>
                            {c.kind === 'story' ? <AlertTriangle size={24} /> : <Briefcase size={24} />}
                          </div>
                          <div style={{ marginTop: '12px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '4px 12px', fontSize: '1rem', whiteSpace: 'nowrap', border: '1px solid #444', color: '#fff', fontWeight: 700, textAlign: 'center', borderRadius: '4px' }}>
                            {c.title}
                          </div>
                        </div>
                      </foreignObject>
                    );
                  })}
                </OdessaMap>
              </div>

              {/* Event Journal (Right side overlay) */}
              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '300px', bottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--titp-text-muted)', marginBottom: '8px' }}>ЖУРНАЛ ИНЦИДЕНТОВ</h3>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' }}>
                  {state.journal.filter(j => j.audience === role || j.audience === 'all').reverse().map(j => (
                    <div key={j.id} className="panel" style={{ padding: '12px', borderLeft: '3px solid var(--titp-accent-blue)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--titp-text-muted)', marginBottom: '4px' }}>СМЕНА {j.tick}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px', lineHeight: 1.2 }}>{j.title}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: 1.4 }}>{j.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roster Strip (Bottom) */}
            <div className="panel" style={{ height: '140px', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', overflowX: 'auto', borderTop: '2px solid #111' }}>
              <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--titp-text-muted)', marginBottom: '8px' }}>ШТАТ</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--titp-accent-yellow)' }}>{availableStaff.length}/{state.staff.filter(s => s.role === role).length}</div>
              </div>
              
              <div style={{ width: '1px', height: '80%', backgroundColor: '#444', margin: '0 8px' }}></div>

              {state.staff.filter(s => s.role === role).map(staff => {
                const isAvailable = staff.busyUntilTick <= state.tick;
                const isSelected = selectedStaffId === staff.id;
                
                return (
                  <div 
                    key={staff.id} 
                    className={`staff-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'busy' : ''}`}
                    onClick={() => {
                      if (isAvailable) setSelectedStaffId(isSelected ? null : staff.id);
                    }}
                  >
                    <div className="staff-rating">{SKILLS[staff.skill].substring(0, 3)}</div>
                    <div className="staff-portrait">
                      <User size={40} color={isAvailable ? '#aaa' : '#444'} />
                    </div>
                    <div className="staff-name">{staff.name}</div>
                    <div className="energy-bar-container">
                      <div className="energy-bar" style={{ width: `${Math.max(0, 100 - staff.fatigue)}%`, backgroundColor: staff.fatigue > 70 ? 'var(--titp-accent-red)' : 'var(--titp-accent-blue)' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DOSSIER MODAL */}
            {activeCase && (
              <>
                <div className="dossier-overlay" onClick={() => setSelectedCaseId(null)}></div>
                <div className="dossier-modal">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2b2b2b', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8f342d' }}>Д Е Л О  № {activeCase.id.toUpperCase()}</div>
                      <h2 style={{ fontSize: '1.8rem', lineHeight: 1.1, marginTop: '4px' }}>{activeCase.title}</h2>
                    </div>
                    <button onClick={() => setSelectedCaseId(null)} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8f342d' }}>✕</button>
                  </div>
                  
                  <div className="mono" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '32px', color: '#1a1a1a', fontWeight: 500 }}>
                    {activeCase.body}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Варианты решений:</div>
                    {activeCase.choices.map(choice => (
                      <div 
                        key={choice.id} 
                        style={{ 
                          border: `2px solid ${selectedChoiceId === choice.id ? '#8f342d' : '#888'}`, 
                          padding: '12px', 
                          cursor: 'pointer',
                          backgroundColor: selectedChoiceId === choice.id ? 'rgba(143, 52, 45, 0.1)' : 'transparent'
                        }}
                        onClick={() => setSelectedChoiceId(choice.id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{choice.title}</div>
                        <div className="mono" style={{ fontSize: '0.8rem', color: '#444' }}>{choice.description}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '32px', borderTop: '2px dashed #888', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      {selectedStaffId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#2b2b2b', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px' }}>
                            <CheckCircle color="var(--titp-accent-yellow)" />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555' }}>ВЫБРАН СОТРУДНИК</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{state.staff.find(s => s.id === selectedStaffId)?.name}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8f342d' }}>
                          ⚠️ ВЫБЕРИТЕ СОТРУДНИКА ВНИЗУ ЭКРАНА
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="btn-titp" 
                      style={{ opacity: (selectedChoiceId && selectedStaffId) ? 1 : 0.5, pointerEvents: (selectedChoiceId && selectedStaffId) ? 'auto' : 'none' }}
                      onClick={handleMakeDecision}
                    >
                      ОТПРАВИТЬ
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </main>
      <InstallPWA />
    </div>
  );
}
