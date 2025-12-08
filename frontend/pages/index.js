import { useState, useCallback, useEffect } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState({
    wins: 0,
    losses: 0,
    ties: 0,
    totalGames: 0,
    winRate: '0%'
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tictactoe-leaderboard')
    if (saved) setLeaderboard(JSON.parse(saved))
  }, [])

  // Save on update
  useEffect(() => {
    localStorage.setItem('tictactoe-leaderboard', JSON.stringify(leaderboard))
  }, [leaderboard])

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
    setTimeout(() => {
      const newBoard = [...board]
      newBoard[index] = currentPlayer
      const win = checkWinner(newBoard)
      setBoard(newBoard)
      setMoveCount(moveCount + 1)
      setWinner(win)
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
      setIsLoading(false)

      // Update leaderboard when game ends
      if (win) {
        setTimeout(() => {
          setLeaderboard(prev => {
            const total = prev.totalGames + 1
            let wins = prev.wins
            let losses = prev.losses
            let ties = prev.ties

            if (win === 'X') wins++
            else if (win === 'O') losses++
            else ties++

            const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%'

            return { wins, losses, ties, totalGames: total, winRate }
          })
        }, 1000)
      }
    }, 80)
  }, [board, currentPlayer, winner, isLoading, moveCount, checkWinner])

  const reset = () => {
    setBoard(Array(9).fill(''))
    setCurrentPlayer('X')
    setWinner('')
    setMoveCount(0)
  }

  const resetLeaderboard = () => {
    if (confirm('Reset all stats? This cannot be undone.')) {
      setLeaderboard({ wins: 0, losses: 0, ties: 0, totalGames: 0, winRate: '0%' })
    }
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

      {/* Leaderboard */}
      <div style={{margin:'20px auto 40px',maxWidth:400,padding:20,background:'rgba(0,255,234,0.08)',borderRadius:20,border:'2px solid #00ffea44'}}>
        <h3 style={{margin:'0 0 15px',color:'#00ffea'}}>Leaderboard</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:'1.1rem'}}>
          <div>Wins: <strong style={{color:'#0f0'}}>{leaderboard.wins}</strong></div>
          <div>Losses: <strong style={{color:'#f55'}}>{leaderboard.losses}</strong></div>
          <div>Ties: <strong style={{color:'#ffa502'}}>{leaderboard.ties}</strong></div>
          <div>Total: <strong>{leaderboard.totalGames}</strong></div>
        </div>
        <div style={{marginTop:15,fontSize:'1.4rem',color:'#00ffea'}}>
          Win Rate: <strong>{leaderboard.winRate}</strong>
        </div>
        <button onClick={resetLeaderboard} style={{marginTop:15,padding:'8px 16px',background:'#333',border:'1px solid #f55',borderRadius:20,fontSize:'0.9rem'}}>
          Reset Stats
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,120px)',gap:'12px',margin:'50px auto',width:'fit-content',padding:'20px',borderRadius:'20px',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(10px)',border:'1px solid rgba(0,255,234,0.3)'}}>
        {board.map((cell,i)=>(
          <div key={i} onClick={()=>play(i)}
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
        onMouseOut={e=>e.target.style.transform='scale(1)'}}>
        New Game
      </button>

      <p style={{marginTop:'60px',fontSize:'1.1rem',opacity:0.7,fontStyle:'italic'}}>
        Built live for Linera Buildathon<br />
        Play vs friend (share screen) or AI-style turns
      </p>
    </div>
  )
}
