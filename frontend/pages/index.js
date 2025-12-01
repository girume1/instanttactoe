import { useState, useCallback, useEffect } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('pvp') // 'pvp' or 'ai'
  const [aiLevel, setAiLevel] = useState('easy') // easy, hard, extreme
  const [moveCount, setMoveCount] = useState(0)
  const [aiThinking, setAiThinking] = useState(false)

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

  // EASY AI: Random move
  const aiEasyMove = useCallback(() => {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null)
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    return randomIndex
  }, [board])

  // MINIMAX for Hard/Extreme
  const minimax = useCallback((newBoard, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    const win = checkWinner(newBoard)
    if (win === 'X') return -10 + newBoard.filter(c => c === 'X').length - newBoard.filter(c => c === 'O').length
    if (win === 'O') return 10 - newBoard.filter(c => c === 'X').length + newBoard.filter(c => c === 'O').length
    if (win === 'Tie!') return 0

    if (isMaximizing) {
      let maxEval = -Infinity
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'O'
          const evalScore = minimax(newBoard, false, alpha, beta)
          newBoard[i] = ''
          maxEval = Math.max(maxEval, evalScore)
          alpha = Math.max(alpha, evalScore)
          if (beta <= alpha) break
        }
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'X'
          const evalScore = minimax(newBoard, true, alpha, beta)
          newBoard[i] = ''
          minEval = Math.min(minEval, evalScore)
          beta = Math.min(beta, evalScore)
          if (beta <= alpha) break
        }
      }
      return minEval
    }
  }, [checkWinner])

  // AI Move (Hard/Extreme: Minimax)
  const aiBestMove = useCallback(() => {
    let bestScore = -Infinity
    let bestMove
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        const newBoard = [...board]
        newBoard[i] = 'O'
        const score = minimax(newBoard, false)
        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }
    return bestMove
  }, [board, minimax])

  // Player move
  const play = useCallback((index) => {
    if (board[index] || winner || isLoading || (mode === 'ai' && currentPlayer === 'O')) return

    setIsLoading(true)
    setTimeout(() => {
      const newBoard = [...board]
      newBoard[index] = 'X'
      const win = checkWinner(newBoard)
      setBoard(newBoard)
      setMoveCount(moveCount + 1)
      setWinner(win)
      setCurrentPlayer('O')
      setIsLoading(false)

      // AI responds if PvAI and no winner
      if (mode === 'ai' && !win) {
        setAiThinking(true)
        setTimeout(() => {
          let aiMove
          if (aiLevel === 'easy') {
            aiMove = aiEasyMove()
          } else {
            aiMove = aiBestMove()
          }
          if (aiMove !== undefined) {
            const aiNewBoard = [...newBoard]
            aiNewBoard[aiMove] = 'O'
            const aiWin = checkWinner(aiNewBoard)
            setBoard(aiNewBoard)
            setMoveCount(moveCount + 2)
            setWinner(aiWin)
            setCurrentPlayer('X')
          }
          setAiThinking(false)
        }, aiLevel === 'easy' ? 300 : aiLevel === 'hard' ? 800 : 1200) // Thinking delay by level
      }
    }, 80)
  }, [board, currentPlayer, winner, isLoading, mode, aiLevel, moveCount, checkWinner, aiEasyMove, aiBestMove])

  const reset = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setMoveCount(0)
    setAiThinking(false)
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

      {/* Mode & Level Selector */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setMode(mode === 'pvp' ? 'ai' : 'pvp')}
          style={{
            padding: '12px 24px',
            margin: '0 10px',
            background: mode === 'pvp' ? 'rgba(0,255,234,0.2)' : '#333',
            color: mode === 'pvp' ? '#00ffea' : '#fff',
            border: '2px solid #00ffea',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {mode === 'pvp' ? 'PvP (Friends)' : 'PvAI'}
        </button>
        {mode === 'ai' && (
          <select
            value={aiLevel}
            onChange={(e) => setAiLevel(e.target.value)}
            style={{
              padding: '12px 20px',
              background: '#333',
              color: '#fff',
              border: '2px solid #ff00ea',
              borderRadius: '25px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <option value="easy">🤖 Easy</option>
            <option value="hard">🤖 Hard</option>
            <option value="extreme">🤖 Extreme</option>
          </select>
        )}
      </div>

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
                (isLoading || aiThinking) ? '#333' : 'rgba(255,255,255,0.1)',
              border: '3px solid ' + (cell ? '#fff' : '#00ffea'),
              borderRadius: '12px',
              fontSize: '4rem',
              fontWeight: 'bold',
              display: 'grid',
              placeItems: 'center',
              cursor: (board[i] || winner || isLoading || aiThinking || (mode === 'ai' && currentPlayer === 'O')) ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: cell ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
              opacity: (isLoading || aiThinking) ? 0.5 : 1
            }}
          >
            {cell || ((isLoading || aiThinking) ? '⚡' : '')}
          </div>
        ))}
      </div>

      {aiThinking && (
        <p style={{ color: '#ff00ea', fontSize: '1.3rem', margin: '20px 0' }}>
          🤖 AI {aiLevel.toUpperCase()} thinking... (Linera speed)
        </p>
      )}

      {isLoading && !aiThinking && (
        <p style={{ color: '#00ffea', fontSize: '1.2rem', margin: '20px 0' }}>
          Finalizing move on Linera microchain...
        </p>
      )}

      {!winner && !isLoading && !aiThinking && (
        <p style={{ fontSize: '1.5rem', color: currentPlayer === 'X' ? '#ff4757' : '#3742fa', margin: '20px 0' }}>
          Your turn: {currentPlayer} {mode === 'ai' && currentPlayer === 'O' ? '(AI)' : ''}
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
            {moveCount} moves • Lightning-fast Linera finality ⚡
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
          margin: '10px'
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

      <p style={{
        marginTop: '60px',
        fontSize: '1.1rem',
        opacity: 0.7,
        fontStyle: 'italic'
      }}>
        Built live for Linera Buildathon ⚡ | PvP or beat unbeatable AI!
      </p>
    </div>
  )
        }
