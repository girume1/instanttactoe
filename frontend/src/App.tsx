// src/App.tsx
import React, { useState, Suspense } from 'react';
import Lobby from './components/Lobby';
import TicTacToe from './components/TicTacToe';
import AuthWrapper from './components/AuthWrapper';
import './styles/cyber-theme.css';

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  return (
    <AuthWrapper>
      <Suspense fallback={<div className="neon-text-pulse">LOADING MICROCHAIN...</div>}>
        <div className="app-layout">
          <header className="cyber-header">
            <h1 className="logo">INSTANT-TAC-TOE</h1>
          </header>

          <main>
            {activeRoomId === null ? (
              <Lobby onJoin={setActiveRoomId} />
            ) : (
              <div className="game-view">
                <button className="back-btn" onClick={() => setActiveRoomId(null)}>
                  ← LEAVE ROOM
                </button>
                <TicTacToe roomId={activeRoomId} />
              </div>
            )}
          </main>
        </div>
      </Suspense>
    </AuthWrapper>
  );
}