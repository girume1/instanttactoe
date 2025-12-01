import { useState, useCallback } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X') // 'X' or 'O'
  const [winner, setWinner] = useState('')
  const [mode, setMode] = useState('pvp') // 'pvp' or 'ai'
  const [aiLevel, setAiLevel] = useState('easy') // easy, hard, extreme
  const [isThinking, setIsThinking] = useState(false)

  const checkWinner = useCallback((board) => {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ]
    for (let [a,b,c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return board.every(c => c) ? 'Tie!' : null
  }, [])

  // AI: Easy = random
  const getEasyMove = () => {
    const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null)
    return empty[Math.floor(Math.random() * empty.length)]
  }

  // AI: Hard/Extreme = Minimax (unbeatable)
  const minimax = (newBoard, isMaximizing) => {
    const result = checkWinner(newBoard)
    if (result === 'O') return 10
    if (result === 'X') return -10
    if (result === 'Tie!') return 0

    if (isMaximizing) {
      let best = -Infinity
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'O'
          best = Math.max(best, minimax(newBoard, false))
          newBoard[i] = ''
        }
      }
      return best
    } else {
      let best = Infinity
      for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') {
          newBoard[i] = 'X'
          best = Math.min(best, minimax(newBoard, true))
          newBoard[i] = ''
        }
      }
      return best
    }
  }

  const getBestMove = () => {
    let bestScore = -Infinity
    let move
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O'
        let score = minimax(board, false)
        board[i] = ''
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
  }

  const makeMove = (index) => {
    if (board[index] || winner || isThinking) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const gameResult = checkWinner(newBoard)
    if (gameResult) {
      setWinner(gameResult)
      return
    }

    // Switch turn
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X'
    setCurrentPlayer(nextPlayer)

    // If AI's turn
    if (mode === 'ai' && nextPlayer === 'O' && !gameResult) {
      setIsThinking(true)
      setTimeout(() => {
        const aiMove = aiLevel === 'easy' ? getEasyMove() : getBestMove()
        if (aiMove !== undefined) {
          const finalBoard = [...newBoard]
          finalBoard[aiMove] = 'O'
          setBoard(finalBoard)
          setCurrentPlayer('X')
          const finalResult = checkWinner(finalBoard)
          setWinner(finalResult || '')
        }
        setIsThinking(false)
      }, aiLevel === 'easy' ? 400 : aiLevel === 'hard' ? 700 : 1100)
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setIsThinking(false)
  }

  return (
    <div style={{fontFamily:'system-ui',background:'linear-gradient(180deg,#000,#111)',color:'#fff',minHeight:'100vh',padding:'40px 20px',textAlign:'center'}}>
      <h1 style={{fontSize:'4.8rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:'0 0 20px'}}>
        InstantTacToe
      </h1>
      <p style={{fontSize:'1.8rem',marginBottom:'30px'}}>
        Real-time on-chain Tic-Tac-Toe • Linera microchains
      </p>

      {/* Mode Selector */}
      <div style={{margin:'20px 0 40px'}}>
        <button
          onClick={() => { setMode(mode === 'pvp' ? 'ai' : 'pvp'); resetGame() }}
          style={{padding:'14px 30px',margin:'0 15px',background: mode==='pvp'?'#00ffea':'#222',color: mode==='pvp'?'#000':'#fff',border:'2px solid #00ffea',borderRadius:'30px',fontWeight:'bold',cursor:'pointer'}}
        >
          {mode === 'pvp' ? 'PvP (Friends)' : 'Play vs AI'}
        </button>

        {mode === 'ai' && (
          <select value={aiLevel} onChange={e=>setAiLevel(e.target.value)} style={{padding:'14px 24px',background:'#222',color:'#fff',border:'2px solid #ff00ea',borderRadius:'30px',fontSize:'1.1rem'}}>
            <option value="easy">Easy (Random)</option>
            <option value="hard">Hard (Smart)</option>
            <option value="extreme">Extreme (Unbeatable)</option>
          </select>
        )}
      </div>

      {/* Board */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,120px)',gap:'14px',margin:'40px auto',width:'fit-content',padding:'20px',background:'rgba(0,255,234,0.05)',borderRadius:'20px',border:'1px solid #00ffea33'}}>
        {board.map((cell, i) => (
          <div
            key={i}
            onClick={() => makeMove(i)}
            style={{
              width:120,height:120,background:cell?'#000':'#111',
              border: `4px solid ${cell?'#fff':'#00ffea'}`,
              borderRadius:'16px',fontSize:'4.5rem',fontWeight:'bold',
              display:'grid',placeItems:'center',
              cursor: (cell || winner || isThinking) ? 'default' : 'pointer',
              transition:'0.2s',
              boxShadow: cell ? '0 0 30px rgba(255,255,255,0.4)' : 'none'
            }}
          >
            {cell || (isThinking ? '' : '')}
          </div>
        ))}
      </div>

      {isThinking && <p style={{color:'#ff00ea',fontSize:'1.4rem'}}>AI {aiLevel.toUpperCase()} is thinking...</p>}

      {!winner && !isThinking && (
        <p style={{fontSize:'1.6rem',margin:'30px',color: currentPlayer==='X'?'#ff4757':'#3742fa'}}>
          {mode === 'ai' && currentPlayer === 'O' ? 'AI is playing...' : `Your turn: ${currentPlayer}`}
        </p>
      )}

      {winner && (
        <div style={{margin:'40px 0'}}>
          <h2 style={{fontSize:'3.5rem',color: winner==='Tie!'?'#ffa502': winner==='X'?'#ff4757':'#3742fa',textShadow:'0 0 40px currentColor'}}>
            {winner === 'Tie!' ? 'Tie Game!' : `${winner} Wins!`}
          </h2>
        </div>
      )}

      <button
        onClick={resetGame}
        style={{padding:'16px 50px',fontSize:'1.4rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',color:'#000',border:'none',borderRadius:'50px',cursor:'pointer',fontWeight:'bold'}}
      >
        New Game
      </button>

      <p style={{marginTop:'80px',opacity:0.6,fontSize:'1rem'}}>
        Built live for Linera Buildathon • Real-time gaming is here
      </p>
    </div>
  )
            }
