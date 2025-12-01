import { useState, useCallback } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [mode, setMode] = useState('ai')        // DEFAULT = AI MODE
  const [aiLevel, setAiLevel] = useState('extreme') // default = unbeatable
  const [isThinking, setIsThinking] = useState(false)

  const checkWinner = useCallback((b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (let [a,b,c] of lines) if (b[a] && b[a] === b[b] && b[a] === b[c]) return b[a]
    return b.every(c => c) ? 'Tie!' : null
  }, [])

  const getRandomMove = () => {
    const empty = board.map((v,i) => v==='' ? i : null).filter(v=>v!==null)
    return empty[Math.floor(Math.random()*empty.length)]
  }

  const minimax = (testBoard, isMaximizing) => {
    const r = checkWinner(testBoard)
    if (r === 'O') return 10
    if (r === 'X') return -10
    if (r === 'Tie!') return 0

    if (isMaximizing) {
      let best = -Infinity
      for (let i=0;i<9;i++) if (testBoard[i]==='') { testBoard[i]='O'; best=Math.max(best,minimax(testBoard,false)); testBoard[i]='' }
      return best
    } else {
      let best = Infinity
      for (let i=0;i<9;i++) if (testBoard[i]==='') { testBoard[i]='X'; best=Math.min(best,minimax(testBoard,true)); testBoard[i]='' }
      return best
    }
  }

  const getBestMove = () => {
    let bestScore = -Infinity, move
    for (let i=0;i<9;i++) {
      if (board[i]==='') {
        board[i]='O'
        let score = minimax(board, false)
        board[i]=''
        if (score > bestScore) { bestScore=score; move=i }
      }
    }
    return move
  }

  const handleClick = (i) => {
    if (board[i] || winner || isThinking) return
    if (mode==='ai' && currentPlayer==='O') return

    const newBoard = [...board]
    newBoard[i] = currentPlayer
    setBoard(newBoard)
    const result = checkWinner(newBoard)
    if (result) { setWinner(result); return }

    setCurrentPlayer(currentPlayer==='X'?'O':'X')

    if (mode==='ai' && currentPlayer==='X') { // AI's turn
      setIsThinking(true)
      setTimeout(() => {
        const move = aiLevel==='easy' ? getRandomMove() : getBestMove()
        if (move!==undefined) {
          const final = [...newBoard]
          final[move]='O'
          setBoard(final)
          setCurrentPlayer('X')
          setWinner(checkWinner(final)||'')
        }
        setIsThinking(false)
      }, aiLevel==='easy'?400 : aiLevel==='hard'?700 : 1100)
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
      <h1 style={{fontSize:'5rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:20}}>
        InstantTacToe
      </h1>
      <p style={{fontSize:'1.8rem',marginBottom:40}}>Real-time on-chain Tic-Tac-Toe • Linera microchains</p>

      {/* MODE SWITCHER */}
      <div style={{marginBottom:50}}>
        <button onClick={()=>{setMode(mode==='ai'?'pvp':'ai'); reset()}}
          style={{padding:'16px 36px',margin:'0 15px',background:mode==='ai'?'#00ffea':'#222',color:mode==='ai'?'#000':'#fff',border:'3px solid #00ffea',borderRadius:40,fontWeight:'bold',fontSize:'1.2rem'}}>
          {mode==='ai' ? 'Play vs AI' : 'PvP (Friends)'}
        </button>

        {mode==='ai' && (
          <select value={aiLevel} onChange={e=>setAiLevel(e.target.value)}
            style={{padding:'16px 28px',background:'#222',color:'#fff',border:'3px solid #ff00ea',borderRadius:40,fontSize:'1.2rem'}}>
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme (Unbeatable)</option>
          </select>
        )}
      </div>

      {/* BOARD */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,130px)',gap:16,margin:'0 auto 60px',width:'fit-content',padding:24,background:'rgba(0,255,234,0.08)',borderRadius:28,border:'2px solid #00ffea55'}}>
        {board.map((cell,i)=>(
          <div key={i} onClick={()=>handleClick(i)}
            style={{width:130,height:130,background:cell?'#000':'#111',border:`5px solid ${cell?'#fff':'#00ffea'}`,borderRadius:24,fontSize:'5.5rem',fontWeight:'bold',display:'grid',placeItems:'center',cursor:(cell||winner||isThinking)?'default':'pointer',boxShadow:cell?'0 0 40px rgba(255,255,255,0.6)':''}}>
            {cell}
          </div>
        ))}
      </div>

      {isThinking && <p style={{color:'#ff00ea',fontSize:'1.6rem',margin:30}}>AI {aiLevel.toUpperCase()} is thinking…</p>}
      {!winner && !isThinking && <p style={{fontSize:'1.6rem',color:currentPlayer==='X'?'#ff4757':'#3742fa'}}>Your turn: {currentPlayer}</p>}
      {winner && <h2 style={{fontSize:'4rem',margin:50,color:winner==='Tie!'?'#ffa502':winner==='X'?'#ff4757':'#3742fa'}}>{winner==='Tie!'?'Tie Game!':`${winner} Wins!`}</h2>}

      <button onClick={reset}
        style={{padding:'18px 60px',fontSize:'1.5rem',background:'linear-gradient(90deg,#00ffea,#ff00ea)',color:'#000',border:'none',borderRadius:60,cursor:'pointer',fontWeight:'bold'}}>
        New Game
      </button>

      <p style={{marginTop:100,opacity:0.7,fontSize:'1.1rem'}}>Built live for Linera Buildathon • Real-time gaming is here</p>
    </div>
  )
          }
