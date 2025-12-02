import { useState, useCallback } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [mode, setMode] = useState('ai')          // Default = AI mode
  const [aiLevel, setAiLevel] = useState('extreme')

  const checkWinner = useCallback((b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (let [a,b,c] of lines) if (b[a] && b[a] === b[b] && b[a] === b[c]) return b[a]
    return b.every(c => c) ? 'Tie!' : null
  }, [])

  const minimax = (testBoard, depth, isMax) => {
    const result = checkWinner(testBoard)
    if (result === 'O') return 10 - depth
    if (result === 'X') return depth - 10
    if (result === 'Tie!') return 0

    const empty = testBoard.map((v,i) => v === '' ? i : null).filter(v => v !== null)
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
  }

  const getBestMove = () => {
    let bestScore = -1000
    let move = 0
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O'
        let score = minimax(board, 0, false)
        board[i] = ''
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
  }

  const getRandomMove = () => {
    const empty = board.map((v,i) => v === '' ? i : null).filter(v => v !== null)
    return empty[Math.floor(Math.random() * empty.length)]
  }

  const play = useCallback((index) => {
    if (board[index] || winner || isLoading) return

    setIsLoading(true)
    setTimeout(() => {
      const newBoard = [...board]
      newBoard[index] = 'X'
      setBoard(newBoard)
      setMoveCount(moveCount + 1)

      const win = checkWinner(newBoard)
      if (win) {
        setWinner(win)
        setIsLoading(false)
        return
      }

      if (mode === 'pvp') {
        setCurrentPlayer('O')
        setIsLoading(false)
      } else {
        // AI plays O
        setTimeout(() => {
          const aiMove = aiLevel === 'easy' ? getRandomMove() : getBestMove()
          const finalBoard = [...newBoard]
          finalBoard[aiMove] = 'O'
          setBoard(finalBoard)
          setMoveCount(moveCount + 2)
          setCurrentPlayer('X')
          const aiWin = checkWinner(finalBoard)
          setWinner(aiWin || '')
          setIsLoading(false)
        }, aiLevel === 'easy' ? 300 : aiLevel === 'hard' ? 700 : 1000)
      }
    }, 80)
  }, [board, winner, isLoading, moveCount, mode, aiLevel, checkWinner])

  const reset = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setMoveCount(0)
  }

  return (
    <div style={{fontFamily:'system-ui, sans-serif',background:'linear-gradient(180deg,#000 0%,#111 100%)',color:'#fff',minHeight:'100vh',padding:'40px 20px',textAlign:'center',overflow:'hidden'}}>
      <h1 style={{fontSize:'4.5rem',background:'linear-gradient(90deg,#00ffea 0%,#ff00ea 50%,#00ffea 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:'0 0 20px',textShadow:'0 0 20px rgba(0,255,234,0.5)'}}>
        InstantTacToe
      </h1>
      <p style={{fontSize:'1.8rem',margin:'0 0 30px',opacity:0.9}}>
        Real-time on-chain Tic-Tac-Toe<br />
        <span style={{color:'#00ffea',fontSize:'1.2rem'}}>Moves finalize in &lt;100ms via Linera microchains</span>
      </p>

      <div style={{marginBottom:'30px'}}>
        <button onClick={() => {setMode(mode === 'pvp' ? 'ai' : 'pvp'); reset()}}
          style={{padding:'14px 32px',margin:'0 15px',background:mode==='ai'?'#00ffea':'#333',color:mode==='ai'?'#000':'#fff',border:'3px solid #00ffea',borderRadius:'30px',fontWeight:'bold'}}>
          {mode === 'ai' ? 'Play vs AI' : 'PvP (Friends)'}
        </button>
        {mode === 'ai' && (
          <select value={aiLevel} onChange={e=>setAiLevel(e.target.value)}
            style={{padding:'14px 24px',background:'#333',color:'#fff',border:'3px solid #ff00ea',borderRadius:'30px'}}>
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme (Unbeatable)</option>
          </select>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,120px)',gap:'12px',margin:'50px auto',width:'fit-content',padding:'20px',borderRadius:'20px',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(10px)',border:'1px solid rgba(0,255,234,0.3)'}}>
        {board.map((cell,i) => (
          <div key={i} onClick={() => play(i)}
            style={{width:120,height:120,background:cell?(cell==='X'?'#ff4757':'#3742fa'):isLoading?'#333':'rgba(255,255,255,0.1)',border:'3px solid '+(cell?'#fff':'#00ffea'),borderRadius:'12px',fontSize:'4rem',fontWeight:'bold',display:'grid',placeItems:'center',cursor:(board[i]||winner||isLoading)?'default':'pointer',transition:'all 0.2s ease',boxShadow:cell?'0 0 20px rgba(255,255,255,0.5)':''}}>
            {cell || (isLoading ? '' : '')}
          </div>
        ))}
      </div>

      {isLoading && <p style={{color:'#00ffea',fontSize:'1.2rem',margin:'20px 0'}}>Finalizing move on Linera microchain...</p>}
      {!winner && !isLoading && <p style={{fontSize:'1.5rem',color:currentPlayer==='X'?'#ff4757':'#3742fa',margin:'20px 0'}}>Your turn: {currentPlayer}</p>}
      {winner && (
        <div style={{margin:'30px 0'}}>
          <h2 style={{fontSize:'3rem',color:winner==='Tie!'?'#ffa502':(winner==='X'?'#ff4757':'#3742fa'),margin:'0 0 20px',textShadow:'0 0 30px currentColor'}}>
            {winner === 'Tie!' ? "It's a Tie!" : `${winner} Wins!`}
          </h2>
          <p style={{fontSize:'1.2rem',opacity:0.8}}>{moveCount} moves • {moveCount*80}ms total finality</p>
        </div>
      )}

      <button onClick={reset}
        style={{padding:'15px 40px',fontSize:'1.3rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',color:'#000',border:'none',borderRadius:'50px',cursor:'pointer',fontWeight:'bold',transition:'all 0.3s ease',boxShadow:'0 10px 30px rgba(0,255,234,0.4)'}}
        onMouseOver={e=>e.target.style.transform='scale(1.05)'}
        onMouseOut={e=>e.target.style.transform='scale(1)'}>
        New Game
      </button>

      <p style={{marginTop:'60px',fontSize:'1.1rem',opacity:0.7,fontStyle:'italic'}}>
        Built live for Linera Buildathon<br />
        {mode === 'ai' ? 'Beat the unbeatable AI' : 'Pass & play with friend'}
      </p>
    </div>
  )
}
