import { useState, useCallback, useEffect } from 'react'

// ────────────────────── HELPER COMPONENTS ──────────────────────
const StatBox = ({ label, value, color }) => (
  <div style={{ padding: '8px', border: `1px solid ${color}80`, borderRadius: '8px', backgroundColor: `${color}10` }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{label}</div>
  </div>
)

const LeaderboardCard = ({ player, stats, color }) => (
  <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxWidth: '400px', background: 'rgba(0,0,0,0.5)' }}>
    <h3 style={{ margin: '0 0 15px', fontSize: '1.8rem', color: color }}>🏆 Leaderboard (Player {player})</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      <StatBox label="Wins" value={stats.wins} color={color} />
      <StatBox label="Losses" value={stats.losses} color={color === '#ff4757' ? '#3742fa' : '#ff4757'} />
      <StatBox label="Ties" value={stats.ties} color="#ffa502" />
      <StatBox label="Win Rate" value={stats.winRate} color="#00ffea" />
    </div>
  </div>
)

const initialStats = { wins: 0, losses: 0, ties: 0, totalGames: 0, winRate: '0%' };

// ────────────────────── MAIN COMPONENT ──────────────────────
export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Leaderboard States
  const [leaderboardX, setLeaderboardX] = useState(initialStats)
  const [leaderboardO, setLeaderboardO] = useState(initialStats)

  // 1. EXTRACT APP ID FROM URL
  // This extracts the ID from the node URL (e.g., http://localhost:8080/applications/YOUR_ID)
  const appId = process.env.NEXT_PUBLIC_LINERA_NODE_URL?.split('/').pop() || "Not Connected";

  const copyAppId = () => {
    navigator.clipboard.writeText(appId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 2. REAL ON-CHAIN SYNC (Enables Online Multiplayer)
  const syncWithChain = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Match your field names in state.rs
          query: `{ board, current_player, winner }` 
        }),
      });
      const result = await response.json();
      if (result.data) {
        setBoard(result.data.board.map(cell => cell === null ? '' : cell));
        setCurrentPlayer(result.data.current_player);
        setWinner(result.data.winner);
      }
    } catch (e) { /* Quiet polling */ }
  };

  // 3. MAKE A MOVE
  const play = useCallback(async (index) => {
    if (board[index] || winner || isLoading) return;
    setIsLoading(true);
    try {
      // Matches Operation::MakeMove { position: u8 } in lib.rs
      await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { makeMove(position: ${index}) }`
        }),
      });
      await syncWithChain(); 
    } catch (err) {
      console.error("On-chain move failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [board, winner, isLoading]);

  // 4. AUTO-REFRESH (Every 1 second for live play)
  useEffect(() => {
    syncWithChain();
    const interval = setInterval(syncWithChain, 1000); 
    return () => clearInterval(interval);
  }, []);

  // 5. RESET On-CHAIN GAME
  const resetOnChain = async () => {
  setIsLoading(true);
  try {
    await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation { resetGame }` // Matches the new Operation
      }),
    });
    await syncWithChain(); 
  } catch (err) {
    console.error("Reset failed:", err);
  } finally {
    setIsLoading(false);
  }
};

  // Leaderboard Persistence
  useEffect(() => {
    if (winner) {
      const update = (prev, isWin, isLoss) => {
        const total = prev.totalGames + 1;
        const wins = isWin ? prev.wins + 1 : prev.wins;
        const losses = isLoss ? prev.losses + 1 : prev.losses;
        const ties = (!isWin && !isLoss) ? prev.ties + 1 : prev.ties;
        return { wins, losses, ties, totalGames: total, winRate: ((wins/total)*100).toFixed(1)+'%' };
      };
      setLeaderboardX(p => update(p, winner === 'X', winner === 'O'));
      setLeaderboardO(p => update(p, winner === 'O', winner === 'X'));
    }
  }, [winner]);

  return (
    <div style={{ fontFamily: 'system-ui', background: '#000', color: '#fff', minHeight: '100vh', padding: '40px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4.5rem', background: 'linear-gradient(90deg, #00ffea, #ff00ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
        ⚡ InstantTacToe
      </h1>
      <p style={{ color: '#00ffea', fontSize: '1.2rem', marginBottom: '20px' }}>
        Real-time Online Multiplayer via Linera Microchains
      </p>
      
      {/* ROOM CONTROLS */}
      <div style={{ margin: '20px auto', padding: '15px', borderRadius: '12px', background: '#111', border: '1px solid #333', maxWidth: '500px' }}>
        <p style={{ margin: '0 0 10px', color: '#888', fontSize: '0.9rem' }}>SHARE THIS ROOM ID TO PLAY ONLINE:</p>
        <code style={{ color: '#00ffea', fontSize: '0.8rem', wordBreak: 'break-all', display: 'block', marginBottom: '10px' }}>{appId}</code>
        <button onClick={copyAppId} style={{ 
          padding: '10px 20px', borderRadius: '25px', border: '1px solid #00ffea', 
          background: copySuccess ? '#00ffea' : 'transparent', 
          color: copySuccess ? '#000' : '#00ffea', 
          cursor: 'pointer', transition: '0.3s', fontWeight: 'bold' 
        }}>
          {copySuccess ? '✅ ID Copied!' : '📋 Copy Room ID'}
        </button>
      </div>

      {/* THE BOARD */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: '12px', 
        margin: '30px auto', width: 'fit-content', padding: '20px', 
        background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(0,255,234,0.3)' 
      }}>
        {board.map((cell, i) => (
          <div key={i} onClick={() => play(i)} style={{
            width: 120, height: 120, border: '3px solid ' + (cell ? '#fff' : '#00ffea'), 
            borderRadius: '12px', fontSize: '4rem', fontWeight: 'bold',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            transition: 'all 0.2s ease', opacity: isLoading ? 0.5 : 1,
            background: cell === 'X' ? '#ff4757' : cell === 'O' ? '#3742fa' : 'rgba(255,255,255,0.1)'
          }}>
            {cell || (isLoading ? '⚡' : '')}
          </div>
        ))}
      </div>

      {winner ? (
        <h2 style={{ fontSize: '3rem', color: '#ffa502', textShadow: '0 0 20px rgba(255,165,2,0.5)' }}>
          {winner === 'Tie!' ? 'It\'s a Tie!' : `${winner} Wins!`}
        </h2>
      ) : (
        <h3 style={{ fontSize: '1.8rem', color: currentPlayer === 'X' ? '#ff4757' : '#3742fa' }}>
          Current Turn: {currentPlayer}
        </h3>
      )}

      {/* LEADERBOARD UI */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '50px' }}>
        <LeaderboardCard player="X" stats={leaderboardX} color="#ff4757" />
        <LeaderboardCard player="O" stats={leaderboardO} color="#3742fa" />
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
  <button 
    onClick={resetOnChain} 
    style={{ 
      background: '#00ffea', color: '#000', padding: '12px 30px', 
      borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' 
    }}>
    🎮 New Game (On-Chain)
  </button>
  
  <button 
    onClick={resetLeaderboards} 
    style={{ background: 'none', border: '1px solid #ff4757', color: '#ff4757', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>
    Reset My Stats
  </button>
</div>

      <p style={{
        marginTop: '60px',
        fontSize: '1.1rem',
        opacity: 0.7,
        fontStyle: 'italic'
      }}>
        Built live for Linera Buildathon ⚡<br />
        Play vs friend (share screen or on-chain)
      </p>

      <p style={{
        marginTop: '40px',
        fontSize: '1rem',
        opacity: 0.6
      }}>
        Built by <strong>Girum</strong> • 
        <a 
          href="https://discord.com/users/1220659612580184164" 
          target="_blank" 
          style={{ color: '#00ffea', textDecoration: 'none', marginLeft: '6px' }}
        >
          Contact on Discord
        </a>
      </p>
    </div>
  )
}
