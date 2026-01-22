// src/components/AuthWrapper.tsx
import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { lineraAdapter } from '../lib/linera-adapter';
import { LINERA_RPC_URL, GAME_APP_ID } from '../constants';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext();
  const [isGuest, setIsGuest] = useState(!!localStorage.getItem('linera_burner_key'));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectLinera = async () => {
      console.log('Starting Linera connection...');
      setReady(false);
      setError(null);

      try {
        if (!primaryWallet && !isGuest) {
          console.log('No wallet or guest – skipping connect');
          return;
        }

        console.log('Calling lineraAdapter.connect...');
        await Promise.race([
          lineraAdapter.connect(primaryWallet as any, LINERA_RPC_URL),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout')), 15000))
        ]);

        console.log('Calling setApplication...');
        await lineraAdapter.setApplication(GAME_APP_ID);

        console.log('✅ Linera fully ready');
        setReady(true);
      } catch (e: any) {
        console.error('Linera connection failed:', e);
        setError(e.message || 'Linera connection failed - check console');
      }
    };

    connectLinera();
  }, [primaryWallet, isGuest]);

  // ---- AUTH SCREEN ----
  if (!user && !isGuest) {
    return (
      <div className="welcome-screen">
        <div className="auth-card">
          <h1 className="neon-text-pulse">CONNECT TO MICROCHAIN</h1>
          <p>Choose your authentication method to access the microchain.</p>
          <button className="primary-btn" onClick={() => setShowAuthFlow(true)}>
            CONNECT WALLET / SOCIAL MEDIA
          </button>
          <div className="divider">OR</div>
          <button className="secondary-btn" onClick={() => setIsGuest(true)}>
            GUEST ACCESS
          </button>
        </div>
      </div>
    );
  }

  // ---- LOADING ----
  if (!ready) {
    return (
      <div id="splash">
        <div className="loading-text">INITIALIZING MICROCHAIN...</div>
      </div>
    );
  }

  // ---- ERROR ----
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  return <>{children}</>;
}