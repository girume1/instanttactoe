// src/components/TicTacToe.tsx
import React, { useEffect } from 'react';
import { useLineraGame } from '../hooks/useLineraGame';

interface TicTacToeProps {
  roomId: number;
}

export default function TicTacToe({ roomId }: TicTacToeProps) {
  const {
    board,
    winner,
    battleLog,
    makeMove,
    fetchBoard,
    fetchChat,
    resetGame,
    loading,
    error,
  } = useLineraGame(roomId);

  // Poll for updates every 5 seconds (you can later replace with subscriptions)
  useEffect(() => {
    fetchBoard();
    fetchChat();

    const interval = setInterval(() => {
      fetchBoard();
      fetchChat();
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, fetchBoard, fetchChat]);

  if (loading) {
    return (
      <div className="game-screen">
        <div className="neon-text-pulse" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
          INITIALIZING BATTLE GRID...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-screen">
        <div style={{ color: '#ff0044', textAlign: 'center', padding: '8rem 2rem' }}>
          <h2>GRID ERROR</h2>
          <p>{error}</p>
          <button className="primary-btn" onClick={() => {
            fetchBoard();
            fetchChat();
          }}>
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Winner Modal */}
      {winner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="neon-text-pulse">
              {winner === 'Draw' ? "STALEMATE" : `WINNER: ${winner}`}
            </h2>
            <button className="primary-btn" onClick={resetGame}>
              REBOOT MATCH
            </button>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className={`grid-3x3 ${winner ? 'blur' : ''}`}>
        {board.map((cell, i) => (
          <div
            key={i}
            className={`cell ${cell || 'empty'}`}
            onClick={() => !winner && !cell && makeMove(i)}
          >
            {cell || ''}
          </div>
        ))}
      </div>

      {/* Battle Log */}
      <div className="battle-log">
        <div className="log-header">BATTLE LOG</div>
        <div className="log-scroll">
          {battleLog.length === 0 ? (
            <div className="log-line" style={{ color: '#0f0' }}>
              Waiting for moves...
            </div>
          ) : (
            battleLog.map((log, i) => (
              <div key={i} className="log-line">
                <span className="sender">[{log.sender}]</span> {log.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}