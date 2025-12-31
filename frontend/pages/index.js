import { useState, useCallback, useEffect } from 'react'

// ────────────────────── HELPER COMPONENTS ──────────────────────
const StatBox = ({ label, value, color }) => (
  <div style={{
    padding: '8px',
    border: `1px solid ${color}80`,
    borderRadius: '8px',
    backgroundColor: `${color}10`
  }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{label}</div>
  </div>
)

const LeaderboardCard = ({ player, stats, color }) => (
  <div style={{
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    maxWidth: '400px',
    background: 'rgba(0,0,0,0.5)'
  }}>
    <h3 style={{ margin: '0 0 15px', fontSize: '1.8rem', color: color }}>
      🏆 Leaderboard (Player {player})
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      <StatBox label="Wins" value={stats.wins} color={color} />
      <StatBox label="Losses" value={stats.losses} color={color === '#ff4757' ? '#3742fa' : '#ff4757'} />
      <StatBox label="Ties" value={stats.ties} color="#ffa502" />
      <StatBox label="Win Rate" value={stats.winRate} color="#00ffea" />
    </div>
    <p style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.8 }}>
      Total Games: {stats.totalGames}
    </p>
  </div>
);

const initialStats = { wins: 0, losses: 0, ties: 0, totalGames: 0, winRate: '0%' };

// ────────────────────── MAIN COMPONENT ──────────────────────
export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Leaderboard States
  const [leaderboardX, setLeaderboardX] = useState(initialStats)
  const [leaderboardO, setLeaderboardO] = useState(initialStats)

  // 1. REAL ON-CHAIN SYNC (Enables Online Multiplayer)
  const syncWithChain = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Matches your Rust state.rs field names
          query: `{ board, current_player, winner }` 
        }),
      });
      const result = await response.json();
      if (result.data) {
        setBoard(result.data.board.map(cell => cell === null ? '' : cell));
        setCurrentPlayer(result.data.current_player);
        setWinner(result.data.winner);
      }
    } catch (e) {
      // Quietly fail during polling to keep UI smooth
    }
  };

  // 2. REAL ON-CHAIN MOVE (Replaces setTimeout)
  const play = useCallback(async (index) => {
    if (board[index] || winner || isLoading) return;
    setIsLoading(true);

    try {
      // Matches Operation::MakeMove { position: u8 } in your lib.rs
      await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { makeMove(position: ${index}) }`
        }),
      });
      // Refresh state immediately after move
      await syncWithChain(); 
    } catch (err) {
      console.error("Blockchain move failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [board, winner, isLoading]);

  // 3. AUTO-POLLING (The "Room" effect)
  useEffect(() => {
    syncWithChain();
    // Check for moves from the other player every 1 second
    const interval = setInterval(syncWithChain, 1000); 
    return () => clearInterval(interval);
  }, []);

  // 4. LEADERBOARD PERSISTENCE (LocalStorage)
  useEffect(() => {
    const savedX = localStorage.getItem('tictactoe-leaderboard-X')
    const savedO = localStorage.getItem('tictactoe-leaderboard-O') 
    if (savedX) setLeaderboardX(JSON.parse(savedX))
    if (savedO) setLeaderboardO(JSON.parse(savedO)) 
  }, [])

  useEffect(() => {
    if (winner) {
      const update = (prev, isWin, isLoss) => {
        const total = prev.totalGames + 1;
        const wins = isWin ? prev.wins + 1 : prev.wins;
        const losses = isLoss ? prev.losses + 1 : prev.losses;
        const ties = (!isWin && !isLoss) ? prev.ties + 1 : prev.ties;
        const winRate = ((wins / total) * 100).toFixed(1) + '%';
        return { wins, losses, ties, totalGames: total, winRate };
      };
      setLeaderboardX(p => update(p, winner === 'X', winner === 'O'));
      setLeaderboardO(p => update(p, winner === 'O', winner === 'X'));
    }
  }, [winner]);

  const resetLeaderboards = () => {
    if (confirm('Reset all stats for both players?')) {
      setLeaderboardX(initialStats);
      setLeaderboardO(initialStats);
    }
  };

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(180deg, #000 0%, #111 100%)',
      color: '#fff',
      minHeight: '100vh',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '4.5rem', 
        background: 'linear-gradient(90deg, #00ffea, #ff00ea)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent', 
        margin: '0 0 20px' 
      }}>
        ⚡ InstantTacToe
      </h1>

      <p style={{ color: '#00ffea', fontSize: '1.2rem', marginBottom: '30px' }}>
        Real-time Online Multiplayer via Linera Microchains
      </p>

      {/* Board UI */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: '12px', 
        margin: '50px auto 30px', width: 'fit-content', padding: '20px', 
        borderRadius: '20px', background: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(0,255,234,0.3)' 
      }}>
        {board.map((cell, i) => (
          <div key={i} onClick={() => play(i)} style={{
              width: 120, height: 120, 
              background: cell ? (cell === 'X' ? '#ff4757' : '#3742fa') : (isLoading ? '#333' : 'rgba(255,255,255,0.1)'),
              border: '3px solid ' + (cell ? '#fff' : '#00ffea'),
              borderRadius: '12px', fontSize: '4rem', fontWeight: 'bold', 
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all 0.2s ease', opacity: isLoading ? 0.5 : 1
          }}>
            {cell || (isLoading ? '⚡' : '')}
          </div>
        ))}
      </div>

      {winner ? (
        <h2 style={{ fontSize: '3rem', color: '#ffa502' }}>{winner === 'Tie!' ? 'Tie!' : `${winner} Wins`}</h2>
      ) : (
        <p style={{ fontSize: '1.5rem', color: currentPlayer === 'X' ? '#ff4757' : '#3742fa' }}>
          Your turn: {currentPlayer}
        </p>
      )}

      {/* Leaderboards */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '40px auto' }}>
        <LeaderboardCard player="X" stats={leaderboardX} color="#ff4757" />
        <LeaderboardCard player="O" stats={leaderboardO} color="#3742fa" />
      </div>

      <button onClick={resetLeaderboards} style={{ background: 'none', border: '1px solid #ff4757', color: '#ff4757', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>
        Reset Stats
      </button>

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
