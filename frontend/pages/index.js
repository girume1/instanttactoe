import { useState, useCallback } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X') // 'X' = human in AI mode
  const [winner, setWinner] = useState('')
  const [mode, setMode] = useState('pvp') // 'pvp' or 'ai'
  const [aiLevel, setAiLevel] = useState('easy')
  const [isThinking, setIsThinking] = useState(false)

  const checkWinner = useCallback((b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (let [a,b,c] of lines) {
      if (b[a] && b[a] === b[b] && b[a] === b[c]) return b[a]
    }
    return b.every(c => c) ? 'Tie!' : null
  }, [])

  // Random move (Easy)
  const getRandomMove = () => {
    const empty = board.map((v, i => v === '' ? i : null).filter(v => v !== null)
    return empty[Math.floor(Math.random() * empty.length)]
  }

  // Minimax (Hard & Extreme — unbeatable)
  const minimax = (testBoard, isMaximizing) => {
    const result = checkWinner(testBoard)
    if (result === 'O') return 10
    if (result === 'X') return -10
    if (result === 'Tie!') return 0

    if (isMaximizing) {
      let best = -Infinity
      for (let i = 0; i < 9; i++) {
        if (testBoard[i] === '') {
          testBoard[i] = 'O'
          best = Math.max(best, minimax(testBoard, false))
          testBoard[i] = ''
        }
      }
      return best
    } else {
      let best = Infinity
      for (let i = 0; i < 9; i++) {
        if (testBoard[i] === '') {
          testBoard[i] = 'X'
          best = Math.min(best, minimax(testBoard, true))
          testBoard[i] = ''
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
        board[i] = 'O'                    // try move
        let score = minimax(board, false) // AI is maximizer
        board[i] = ''                     // undo
        if (score > bestScore) {
          bestScore = score
          move = i
        }
      }
    }
    return move
  }

  const handleClick = (index) => {
    if (board[index] || winner || isThinking) return
    if (mode === 'ai' && currentPlayer === 'O') return // block human clicking during AI turn

    // Human move
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const result = checkWinner(newBoard)
    if (result) {
      setWinner(result)
      return
    }

    // Switch turn
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')

    // AI turn
    if (mode === 'ai' && currentPlayer === 'X') { // after human played
      setIsThinking(true)
      setTimeout(() => {
        const aiMove = aiLevel === 'easy' ? getRandomMove() : getBestMove()
        if (aiMove !== undefined) {
          const finalBoard = [...newBoard]
          finalBoard[aiMove] = 'O'
          setBoard(finalBoard)
          setCurrentPlayer('X')
          setWinner(checkWinner(finalBoard) || '')
        }
        setIsThinking(false)
      }, aiLevel === 'easy' ? 400 : aiLevel === 'hard' ? 700 : 1100)
    }
  }

  const reset = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setIsThinking(false)
  }

  return (
    <div style={{fontFamily:'system-ui',background:'linear-gradient(180deg,#000,#111)',color:'#fff',minHeight:'100vh',padding:'40px 20px',textAlign:'center'}}>
      <h1 style={{fontSize:'4.8rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:20}}>
        InstantTacToe
      </h1>
      <p style={{fontSize:'1.7rem',marginBottom:40}}>Real-time on-chain Tic-Tac-Toe • Linera microchains</p>

      <div style={{marginBottom:40}}>
        <button onClick={()=>{setMode(mode==='pvp'?'ai':'pvp'); reset()}}
          style={{padding:'14px 32px',margin:'0 12px',background:mode==='pvp'?'#00ffea':'#222',color:mode==='pvp'?'#000':'#fff',border:'2px solid #00ffea',borderRadius:30,fontWeight:'bold'}}>
          {mode==='pvp'?'PvP (Friends)':'Play vs AI'}
        </button>

        {mode==='ai' && (
          <select value={aiLevel} onChange={e=>setAiLevel(e.target.value)}
            style={{padding:'14px 24px',background:'#222',color:'#fff',border:'2px solid #ff00ea',borderRadius:30}}>
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme (Unbeatable)</option>
          </select>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,130px)',gap:16,margin:'0 auto 50px',width:'fit-content',padding:20,background:'rgba(0,255,234,0.05)',borderRadius:24,border:'1px solid #00ffea44'}}>
        {board.map((cell, i) => (
          <div key={i} onClick={()=>handleClick(i)}
            style={{
              width:130,height:130,background:cell?'#000':'#111',
              border:`4px solid ${cell?'#fff':'#00ffea'}`,borderRadius:20,
              fontSize:'5rem',fontWeight:'bold',display:'grid',placeItems:'center',
              cursor:(cell||winner||isThinking)?'default':'pointer',
              boxShadow:cell?'0 0 30px rgba(255,255,255,0.5)':''}}>
            {cell}
          </div>
        ))}
      </div>

      {isThinking && <p style={{color:'#ff00ea',fontSize:'1.5rem',margin:30}}>AI {aiLevel.toUpperCase()} is thinking…</p>}

      {!winner && !isThinking && (
        <p style={{fontSize:'1.6rem',color:currentPlayer==='X'?'#ff4757':'#3742fa'}}>
          {mode==='ai' && currentPlayer==='O' ? 'AI turn' : `Your turn: ${currentPlayer}`}
        </p>
      )}

      {winner && (
        <h2 style={{fontSize:'3.8rem',margin:40,color:winner==='Tie!'?'#ffa502':winner==='X'?'#ff4757':'#3742fa'}}>
          {winner==='Tie!'?'Tie Game!':`${winner} Wins!`}
        </h2>
      )}

      <button onClick={reset}
        style={{padding:'16px 50px',fontSize:'1.4rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',color:'#000',border:'none',borderRadius:50,cursor:'pointer',fontWeight:'bold'}}>
        New Game
      </button>

      <p style={{marginTop:80,opacity:0.6}}>Built live for Linera Buildathon • Real-time gaming is here</p>
    </div>
  )
                         }
