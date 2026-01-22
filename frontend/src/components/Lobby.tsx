// src/components/Lobby.tsx
import { useState } from 'react';
import { useLineraGame } from '../hooks/useLineraGame';

export default function Lobby({ onJoin }: { onJoin: (id: number) => void }) {
  const { lobby, createRoom, fetchLobby, loading, error } = useLineraGame();
  const [name, setName] = useState("");

  if (loading) return <div className="neon-text-pulse">LOADING SECTORS...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const handleCreate = () => {
    if (!name.trim()) return;
    createRoom(name);
    setName("");
    fetchLobby(); // Refresh after create
  };

  return (
    <div className="lobby-container">
      <div className="create-section">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="ENTER SECTOR NAME..." 
        />
        <button className="primary-btn" onClick={handleCreate}>CREATE ROOM</button>
      </div>
      <div className="room-grid">
        {lobby.map(room => (
          <div key={room.room_id} className="room-card">
            <h3>{room.name}</h3>
            <p>ACTIVE USERS: {room.player_count}/2</p>
            <button 
              disabled={room.player_count >= 2}
              onClick={() => onJoin(room.room_id)}
            >
              {room.player_count >= 2 ? "FULL" : "JOIN SECTOR"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}