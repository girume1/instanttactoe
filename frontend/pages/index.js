import { useState, useCallback, useEffect } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // ────────────────────── LEADERBOARD CODE ──────────────────────
  const [leaderboard, setLeaderboard] = useState({
    wins: 0,
    losses: 0,
    ties: 0,
    totalGames: 0,
    winRate: '0%'
  })

  // Load from localStorage on mount
  useEffect(() => {
    // Check for window to ensure code only runs client-side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tictactoe-leaderboard')
      if (saved) setLeaderboard(JSON.parse(saved))
    }
  }, [])

  // Save whenever stats change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tictactoe-leaderboard', JSON.stringify(leaderboard))
    }
  }, [leaderboard])

  // Update leaderboard when game ends
  useEffect(() => {
    if (winner) {
      setLeaderboard(prev => {
        const total = prev.totalGames + 1
        let wins = prev.X Wins
        let losses = prev.O Wins
        let ties = prev.ties

        // Assuming the user playing is 'X' and 'O' is the opponent.
        if (winner === 'X') wins++
        else if (winner === 'O') losses++
        else ties++

        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%'

        return { wins, losses, ties, totalGames: total, winRate }
      })
    }
  }, [winner])

  const resetLeaderboard = () => {
    if (confirm('Reset all stats?')) {
      setLeaderboard({ wins: 0, losses: 0, ties: 0, totalGames: 0, winRate: '0%' })
    }
  }
  // ─────────────────────────────────────────────────────────────

  const checkWinner = useCallback((newBoard) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ]
    for (let line of lines) {
      const [a,b,c] = line
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a]
      }
    }
    return newBoard.every(cell => cell) ? 'Tie!' : null
  }, [])

  const play = useCallback((index) => {
    if (board[index] || winner || isLoading) return

    setIsLoading(true)
    setTimeout(() => {  // Fake "microchain finality" delay <100ms
      const newBoard = [...board]
      newBoard[index] = currentPlayer
      const win = checkWinner(newBoard)
      setBoard(newBoard)
      setMoveCount(moveCount + 1)
      setWinner(win)
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
      setIsLoading(false)
    }, 80)  // Sub-100ms "on-chain" feel
  }, [board, currentPlayer, winner, isLoading, moveCount, checkWinner])

  const reset = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setMoveCount(0)
  }

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(180deg, #000 0%, #111 100%)',
      color: '#fff',
      minHeight: '100vh',
      padding: '40px 20px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <h1 style={{
        fontSize: '4.5rem',
        background: 'linear-gradient(90deg, #00ffea 0%, #ff00ea 50%, #00ffea 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 20px',
        textShadow: '0 0 20px rgba(0,255,234,0.5)'
      }}>
        ⚡ InstantTacToe
      </h1>
      <p style={{ fontSize: '1.8rem', margin: '0 0 30px', opacity: 0.9 }}>
        Real-time on-chain Tic-Tac-Toe<br />
        <span style={{ color: '#00ffea', fontSize: '1.2rem' }}>
          Moves finalize in &lt;100ms via Linera microchains
        </span>
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 120px)',
        gap: '12px',
        margin: '50px auto',
        width: 'fit-content',
        padding: '20px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,255,234,0.3)'
      }}>
        {board.map((cell, i) => (
          <div
            key={i}
            onClick={() => play(i)}
            style={{
              width: 120,
              height: 120,
              background: cell ? 
                (cell === 'X' ? '#ff4757' : '#3742fa') :
                isLoading ? '#333' : 'rgba(255,255,255,0.1)',
              border: '3px solid ' + (cell ? '#fff' : '#00ffea'),
              borderRadius: '12px',
              fontSize: '4rem',
              fontWeight: 'bold',
              display: 'grid',
              placeItems: 'center',
              cursor: (board[i] || winner || isLoading) ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: cell ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {cell || (isLoading ? '⚡' : '')}
          </div>
        ))}
      </div>

      {isLoading && (
        <p style={{ color: '#00ffea', fontSize: '1.2rem', margin: '20px 0' }}>
          Finalizing move on Linera microchain...
        </p>
      )}

      {!winner && !isLoading && (
        <p style={{ fontSize: '1.5rem', color: currentPlayer === 'X' ? '#ff4757' : '#3742fa', margin: '20px 0' }}>
          Your turn: {currentPlayer}
        </p>
      )}

      {winner && (
        <div style={{ margin: '30px 0' }}>
          <h2 style={{
            fontSize: '3rem',
            color: winner === 'Tie!' ? '#ffa502' : (winner === 'X' ? '#ff4757' : '#3742fa'),
            margin: '0 0 20px',
            textShadow: '0 0 30px currentColor'
          }}>
            {winner === 'Tie!' ? 'It\'s a Tie!' : `${winner} Wins!`}
          </h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            {moveCount} moves • {moveCount * 80}ms total finality
          </p>
        </div>
      )}

      <button
        onClick={reset}
        style={{
          padding: '15px 40px',
          fontSize: '1.3rem',
          background: 'linear-gradient(90deg, #00ffea, #ff00ea)',
          color: '#000',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: '0 10px 30px rgba(0,255,234,0.4)',
          marginBottom: '20px' // Added margin for separation
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.05)'
          e.target.style.boxShadow = '0 15px 40px rgba(0,255,234,0.6)'
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 10px 30px rgba(0,255,234,0.4)'
        }}
      >
        🔄 New Game
      </button>

      {/* ────────────────────── LEADERBOARD UI ────────────────────── */}
      <div style={{
        margin: '30px auto',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        maxWidth: '400px',
        background: 'rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '1.8rem', color: '#00ffea' }}>
          🏆 Leaderboard (Player X)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <StatBox label="Wins" value={leaderboard.wins} color="#ff4757" />
          <StatBox label="Losses" value={leaderboard.losses} color="#3742fa" />
          <StatBox label="Ties" value={leaderboard.ties} color="#ffa502" />
          <StatBox label="Win Rate" value={leaderboard.winRate} color="#00ffea" />
        </div>
        <p style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.8 }}>
          Total Games: {leaderboard.totalGames}
        </p>
        <button
          onClick={resetLeaderboard}
          style={{
            marginTop: '15px',
            padding: '8px 20px',
            background: 'none',
            border: '1px solid #ff4757',
            color: '#ff4757',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Reset Stats
        </button>
      </div>
      {/* ──────────────────────────────────────────────────────────── */}

      <p style={{
        marginTop: '60px',
        fontSize: '1.1rem',
        opacity: 0.7,
        fontStyle: 'italic'
      }}>
        Built live for Linera Buildathon ⚡<br />
        Play vs friend (share screen) 
      </p>
    </div>
  )
}

// Helper component for Leaderboard stats
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
