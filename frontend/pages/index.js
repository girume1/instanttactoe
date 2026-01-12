import { useState, useCallback, useEffect } from 'react'

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

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [gameStatus, setGameStatus] = useState('WAITING')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [appIdDisplay, setAppIdDisplay] = useState('')
  const [leaderboardX, setLeaderboardX] = useState(initialStats)
  const [leaderboardO, setLeaderboardO] = useState(initialStats)

  // Configuration
  // Configuration
  const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || ""
  const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ""
  const NODE_URL = process.env.NEXT_PUBLIC_LINERA_NODE_URL || ""
  const GRAPHQL_URL = `${NODE_URL}/chains/${CHAIN_ID}/applications/${APP_ID}`


  const graphqlRequest = async (query, variables = {}) => {
    if (!CHAIN_ID || !APP_ID) {
      setConnectionStatus('Missing IDs ❌');
      return null;
    }

    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables }),
      })

      const responseText = await response.text()
      
      if (!response.ok) {
        console.error(`📡 HTTP ${response.status}: ${responseText}`)
        setConnectionStatus(`Offline (404/Error)`)
        return null 
      }

      const result = JSON.parse(responseText)
      if (result.errors) {
        console.error('❌ GraphQL Logic Error:', result.errors)
        return null
      }
      return result
    } catch (error) {
      console.error('❌ Fetch failed:', error)
      setConnectionStatus('Connection Failed ❌')
      return null
    }
  }

  const syncWithChain = async () => {
    try {
      const query = `query { board { board currentPlayer winner gameStatus } }`
      const result = await graphqlRequest(query)
      
      if (result?.data?.board) {
        const data = result.data.board
        setBoard(data.board.map(cell => cell === null ? '' : cell))
        setCurrentPlayer(data.currentPlayer || 'X')
        setWinner(data.winner || '')
        setGameStatus(data.gameStatus || 'WAITING')
        setConnectionStatus('Connected ✅')
      }
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  const play = useCallback(async (index) => {
    if (board[index] || winner || isLoading || gameStatus !== 'IN_PROGRESS') return
    
    setIsLoading(true)
    try {
      const mutation = `mutation MakeMove($position: Int!) { makeMove(position: $position) }`
      const result = await graphqlRequest(mutation, { position: index })
      if (result) await syncWithChain()
    } finally {
      setIsLoading(false)
    }
  }, [board, winner, isLoading, gameStatus])

  const resetOnChain = async () => {
    setIsLoading(true)
    try {
      const result = await graphqlRequest(`mutation { resetGame }`)
      if (result) await syncWithChain()
    } finally {
      setIsLoading(false)
    }
  }

  const joinGame = async () => {
    setIsLoading(true)
    try {
      const result = await graphqlRequest(`mutation { joinGame }`)
      if (result) await syncWithChain()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setAppIdDisplay(APP_ID.substring(0, 16) + '...')
    syncWithChain()
    const pollInterval = setInterval(syncWithChain, 3000)
    return () => clearInterval(pollInterval)
  }, [CHAIN_ID, APP_ID])

  useEffect(() => {
    if (winner && winner !== 'T') {
      const update = (prev, isWin, isLoss) => {
        const total = prev.totalGames + 1
        const wins = isWin ? prev.wins + 1 : prev.wins
        const losses = isLoss ? prev.losses + 1 : prev.losses
        const ties = (!isWin && !isLoss) ? prev.ties + 1 : prev.ties
        return { 
          wins, losses, ties, totalGames: total, 
          winRate: total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%' 
        }
      }
      setLeaderboardX(p => update(p, winner === 'X', winner === 'O'))
      setLeaderboardO(p => update(p, winner === 'O', winner === 'X'))
    }
  }, [winner])

  const buttonStyle = { padding: '12px 24px', borderRadius: '25px', border: '1px solid #00ffea', background: 'transparent', color: '#00ffea', cursor: 'pointer', fontWeight: 'bold' }

  return (
    <div style={{ fontFamily: 'system-ui', background: '#000', color: '#fff', minHeight: '100vh', padding: '40px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5rem', background: 'linear-gradient(90deg, #00ffea, #ff00ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>⚡ InstantTacToe</h1>
      
      <div style={{ margin: '20px auto', padding: '10px', borderRadius: '8px', background: '#111', border: '1px solid #333', maxWidth: '500px' }}>
        <span style={{ color: connectionStatus.includes('Connected') ? '#00ffea' : '#ff4757' }}>● {connectionStatus}</span>
        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px' }}>Chain: {CHAIN_ID.substring(0,10)}... | App: {appIdDisplay}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '10px', margin: '30px auto', width: 'fit-content' }}>
        {board.map((cell, i) => (
          <div key={i} onClick={() => play(i)} style={{ width: 100, height: 100, border: '2px solid #333', borderRadius: '10px', fontSize: '2.5rem', display: 'grid', placeItems: 'center', cursor: 'pointer', background: cell === 'X' ? '#ff475720' : cell === 'O' ? '#3742fa20' : '#111' }}>
            {cell}
          </div>
        ))}
      </div>

      {winner && <h2 style={{ color: '#ffa502' }}>{winner === 'T' ? "Tie! 🤝" : `🎉 ${winner} Wins!`}</h2>}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {gameStatus === 'WAITING' && <button onClick={joinGame} style={{...buttonStyle, background: '#00ffea', color: '#000'}}>Join Game</button>}
        <button onClick={resetOnChain} style={buttonStyle}>New Game</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px', flexWrap: 'wrap' }}>
        <LeaderboardCard player="X" stats={leaderboardX} color="#ff4757" />
        <LeaderboardCard player="O" stats={leaderboardO} color="#3742fa" />
      </div>

      {/* Integrated Footer Section */}
      <p style={{ marginTop: '60px', fontSize: '1.1rem', opacity: 0.7, fontStyle: 'italic' }}>
        Built live for Linera Buildathon ⚡<br />
        Real-time on-chain gaming with sub-100ms updates
      </p>
      
      <p style={{ marginTop: '40px', fontSize: '1rem', opacity: 0.6 }}>
        Built by <strong>Girum</strong> • 
        <a 
          href="https://discord.com/users/1220659612580184164" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#00ffea', textDecoration: 'none', marginLeft: '6px' }}
        >
          Contact on Discord
        </a>
      </p>
    </div>
  )
}
