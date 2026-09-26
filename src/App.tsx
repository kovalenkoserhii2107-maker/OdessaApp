import React, { useState } from 'react';
import { User, MapPin, Clock, Briefcase, FileText } from 'lucide-react';
import { CHARACTERS, SKILLS } from './game/content';
import type { RoleId } from './game/types';
import InstallPWA from './components/InstallPWA';
import { useGameState } from './hooks/useGameState';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Screen = 'login' | 'select' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<RoleId | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
      await loginWithGoogle();
    } catch (e) {
      console.log('Login failed', e);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRadius: 0 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>ОДЕССА. ТРИ ПОДПИСИ</h1>
        {screen === 'game' && activeCharacter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeCharacter.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeCharacter.title}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activeCharacter.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
              {activeCharacter.initials}
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        
        {/* LOGIN SCREEN */}
        {screen === 'login' && (
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Доступ в штаб</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
              Войдите для синхронизации решений с вашими партнерами. Обновление обстановки происходит дважды в день.
            </p>
            {isAuthLoading ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)' }}>Проверка доступа...</div>
            ) : (
              <button className="btn-google" onClick={handleLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Войти через Google
              </button>
            )}
          </div>
        )}

        {/* CHARACTER SELECT SCREEN */}
        {screen === 'select' && (
          <div style={{ maxWidth: '800px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '1.8rem' }}>Выберите вашу зону ответственности</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              {CHARACTERS.map(char => (
                <div key={char.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `4px solid ${char.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: char.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#fff' }}>
                      {char.initials}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem' }}>{char.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{char.title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#ccc', flex: 1 }}>{char.description}</p>
                  <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', borderLeft: `2px solid ${char.color}` }}>
                    <strong>Цель:</strong> {char.personalGoal}
                  </div>
                  <button className="btn-primary" style={{ backgroundColor: char.color, marginTop: '8px' }} onClick={() => handleSelectRole(char.id)}>
                    Выбрать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GAME SCREEN (DASHBOARD) */}
        {screen === 'game' && activeCharacter && (
          <div style={{ maxWidth: '1000px', width: '100%', display: 'flex', gap: '24px', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Доверие: <strong style={{color:'var(--accent-blue)'}}>{state.metrics.trust}</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Стабильность: <strong style={{color:'var(--accent-gold)'}}>{state.metrics.stability}</strong></span>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Факты: <strong style={{color:'var(--accent-red)'}}>{state.metrics.evidence}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={advanceTick}>
                  Завершить смену (+1 Тик)
                </button>
                <button onClick={handleLogout} style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textDecoration: 'underline' }}>Выйти ({user?.displayName || 'Игрок'})</button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Clock size={32} color="var(--accent-gold)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Текущая смена</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>День {Math.floor(state.tick / 2) + 1}. {state.tick % 2 === 0 ? 'Утро' : 'Вечер'}</div>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <MapPin size={32} color="var(--accent-blue)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Область</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeCharacter.area}</div>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <User size={32} color="#858c68" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Сотрудники</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{availableStaff.length} / {state.staff.filter(s => s.role === role).length} свободны</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {/* Cases List */}
              <div className="glass-panel" style={{ flex: '2 1 400px', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} />
                  Входящие дела ({activeCases.length})
                </h3>
                
                {activeCases.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Новых писем и обращений нет. Дождитесь следующей смены.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeCases.map(c => (
                    <div key={c.id} style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', borderLeft: `3px solid ${c.kind === 'story' ? 'var(--accent-red)' : 'var(--accent-blue)'}` }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {c.kind === 'story' ? 'Сюжетный эпизод' : 'Личное сообщение'} • От: {c.sender} • {c.location}
                      </div>
                      <h4 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{c.title}</h4>
                      <p style={{ fontSize: '0.95rem', color: '#ccc', marginBottom: '20px' }}>{c.body}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Варианты решений:</div>
                        {c.choices.map(choice => (
                          <div key={choice.id} style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '1rem' }}>{choice.title}</div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '12px' }}>{choice.description}</div>
                            
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {availableStaff.map(staff => (
                                <button 
                                  key={staff.id} 
                                  onClick={() => makeDecision(c.id, choice.id, staff.id)}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                  Поручить: {staff.name} ({SKILLS[staff.skill]})
                                </button>
                              ))}
                              {availableStaff.length === 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>Нет свободных сотрудников для поручения</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff / Log */}
              <div className="glass-panel" style={{ flex: '1 1 300px', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} />
                  Журнал решений
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {state.journal.filter(j => j.audience === role || j.audience === 'all').length === 0 && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '32px' }}>
                      Пока тихо.
                    </div>
                  )}
                  {state.journal.filter(j => j.audience === role || j.audience === 'all').reverse().map(j => (
                    <div key={j.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>Смена {j.tick}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>{j.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{j.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <InstallPWA />
    </div>
  );
}
