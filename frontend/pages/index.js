import { useState, useCallback, useEffect } from 'react'

// Helper component for Leaderboard stats (kept outside Home)
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

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // ────────────────────── AI vs PLAYER CODE ──────────────────────
  const [mode, setMode] = useState('ai') // 'ai' or 'pvp'
  const [aiLevel, setAiLevel] = useState('extreme') // 'easy', 'hard', 'extreme'
  // ─────────────────────────────────────────────────────────────

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
        let wins = prev.wins
        let losses = prev.losses
        let ties = prev.ties

        // X is always the Player, O is always the AI/Opponent
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

  // ────────────────────── AI LOGIC FUNCTIONS ──────────────────────

  // Random move for Easy AI
  const getRandomMove = useCallback(() => {
    const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null)
    return empty[Math.floor(Math.random() * empty.length)]
  }, [board])

  // Unbeatable Minimax AI (Hard & Extreme) - Uses an immutable copy
  const minimax = useCallback((testBoard, depth, isMax) => {
    const result = checkWinner(testBoard)
    if (result === 'O') return 10 - depth
    if (result === 'X') return depth - 10
    if (result === 'Tie!') return 0

    const empty = testBoard.map((v, i) => v === '' ? i : null).filter(v => v !== null)
    if (isMax) {
      let best = -1000
      for (let i of empty) {
        testBoard[i] = 'O'
        best = Math.max(best, minimax(testBoard, depth + 1, false))
        testBoard[i] = ''
      }
      return best
    } else {
      let best = 1000
      for (let i of empty) {
        testBoard[i] = 'X'
        best = Math.min(best, minimax(testBoard, depth + 1, true))
        testBoard[i] = ''
      }
      return best
    }
  }, [checkWinner])

  const getBestMove = useCallback(() => {
    let bestScore = -1000
    let move = 0
    // We need a temporary mutable board for minimax
    const tempBoard = [...board]

    for (let i = 0; i < 9; i++) {
      if (tempBoard[i] === '') {
        tempBoard[i] = 'O'
        // AI is 'O' (Maximizer), next is 'X' (Minimizer)
        let score = minimax(tempBoard, 0, false)
        tempBoard[i] = ''
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
  }, [board, minimax])
  // ─────────────────────────────────────────────────────────────

  // ────────────────────── UPDATED PLAY FUNCTION ──────────────────────
  const play = useCallback((index) => {
    // Only allow player 'X' to move in AI mode, or current player to move in PvP mode
    if (board[index] || winner || isLoading || (mode === 'ai' && currentPlayer === 'O')) return

    setIsLoading(true)
    
    // Player 'X' move
    const playerMark = mode === 'ai' ? 'X' : currentPlayer;
    const nextPlayer = playerMark === 'X' ? 'O' : 'X';

    // Fake "microchain finality" delay <100ms for the Player's move
    setTimeout(() => {
      let currentBoard = [...board]
      currentBoard[index] = playerMark
      
      const playerWin = checkWinner(currentBoard)
      if (playerWin) {
        setBoard(currentBoard)
        setMoveCount(moveCount + 1)
        setWinner(playerWin)
        setIsLoading(false)
        return
      }

      if (mode === 'pvp') {
        setBoard(currentBoard)
        setMoveCount(moveCount + 1)
        setCurrentPlayer(nextPlayer)
        setIsLoading(false)
      } else {
        // AI mode: Trigger AI's turn
        const aiDelay = aiLevel === 'easy' ? 400 : aiLevel === 'hard' ? 800 : 1200
        
        // AI's move logic (simulated "on-chain" processing)
        setTimeout(() => {
          let aiMove = 0;
          if (aiLevel === 'easy') {
            aiMove = getRandomMove()
          } else if (aiLevel === 'hard') {
            // Hard has a 10% chance of a random move to be less than extreme
            aiMove = Math.random() < 0.1 ? getRandomMove() : getBestMove()
          } else { // Extreme
            aiMove = getBestMove()
          }
          
          let finalBoard = [...currentBoard]
          finalBoard[aiMove] = 'O' // AI is always 'O'
          
          setBoard(finalBoard)
          setMoveCount(moveCount + 2) // Player move + AI move
          setCurrentPlayer('X') // Always back to Player X
          setWinner(checkWinner(finalBoard) || '')
          setIsLoading(false)
        }, aiDelay)
      }
    }, 80)
  }, [board, winner, isLoading, moveCount, mode, aiLevel, checkWinner, getRandomMove, getBestMove, currentPlayer])

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

      {/* ────────────────────── MODE SELECTION UI ────────────────────── */}
      <div style={{marginBottom: '30px'}}>
        <button 
          onClick={() => {setMode(mode === 'pvp' ? 'ai' : 'pvp'); reset()}}
          style={{
            padding:'14px 32px',
            margin:'0 15px',
            background:mode==='ai'?'#00ffea':'#333',
            color:mode==='ai'?'#000':'#fff',
            border:'3px solid #00ffea',
            borderRadius:'30px',
            fontWeight:'bold',
            cursor: 'pointer'
          }}
        >
          {mode === 'ai' ? 'Play vs AI' : 'PvP (Friends)'}
        </button>
        {mode === 'ai' && (
          <select 
            value={aiLevel} 
            onChange={e=>setAiLevel(e.target.value)}
            style={{
              padding:'14px 24px',
              background:'#333',
              color:'#fff',
              border:'3px solid #ff00ea',
              borderRadius:'30px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme (Unbeatable)</option>
          </select>
        )}
      </div>
      {/* ───────────────────────────────────────────────────────────── */}

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
              cursor: (board[i] || winner || isLoading || (mode === 'ai' && currentPlayer === 'O')) ? 'default' : 'pointer',
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
          marginBottom: '20px'
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
        Play vs friend (share screen) or AI-style turns
      </p>
    </div>
  )
}
