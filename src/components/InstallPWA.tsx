import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Basic iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    // If it's iOS and not already installed/running in standalone mode
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Show prompt after a short delay so it doesn't immediately block UI
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt || !isIOS) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      padding: '24px',
      background: 'rgba(18, 22, 25, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Установить приложение</h3>
        <button onClick={() => setShowPrompt(false)} style={{ color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
        Установите <strong>Одесса. Три Подписи</strong> на ваш экран «Домой» для быстрого доступа и игры на полном экране.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-blue)', padding: '8px', borderRadius: '4px' }}>
            <Share size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '0.9rem' }}>1. Нажмите иконку <strong>Поделиться</strong> внизу экрана Safari.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-blue)', padding: '8px', borderRadius: '4px' }}>
            <PlusSquare size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '0.9rem' }}>2. Выберите <strong>«На экран Домой»</strong>.</span>
        </div>
      </div>
    </div>
  );
}
