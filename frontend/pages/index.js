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
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [appId, setAppId] = useState('loading...')
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')

  // Leaderboard States
  const [leaderboardX, setLeaderboardX] = useState(initialStats)
  const [leaderboardO, setLeaderboardO] = useState(initialStats)

  // GraphQL helper
  const graphqlRequest = async (query, variables = {}) => {
    const response = await fetch(process.env.NEXT_PUBLIC_LINERA_NODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Linera Node Error: ${response.status} - ${errorBody}`);
  }
  
    return response.json()
  }

  // Sync game state from chain
  const syncWithChain = async () => {
    try {
      const query = `
        query {
          getBoard {
            ... on BoardState {
              board
              currentPlayer
              winner
            }
          }
        }
      `
      
      const result = await graphqlRequest(query)
      
      if (result.data?.getBoard) {
        const data = result.data.getBoard
        setBoard(data.board.map(cell => cell === null ? '' : cell))
        setCurrentPlayer(data.currentPlayer || 'X')
        setWinner(data.winner || '')
        setConnectionStatus('Connected')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setConnectionStatus('Disconnected')
    }
  }

  // Make a move
  const play = useCallback(async (index) => {
    if (board[index] || winner || isLoading) return
    setIsLoading(true)
    
    try {
      const mutation = `
        mutation MakeMove($position: Int!) {
          makeMove(position: $position) {
            ... on MoveResult {
              result
            }
          }
        }
      `
      
      await graphqlRequest(mutation, { position: index })
      await syncWithChain()
    } catch (error) {
      console.error('Move failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [board, winner, isLoading])

  // Reset game
  const resetOnChain = async () => {
    setIsLoading(true)
    try {
      const mutation = `
        mutation {
          resetGame {
            ... on MoveResult {
              result
            }
          }
        }
      `
      
      await graphqlRequest(mutation)
      await syncWithChain()
    } catch (error) {
      console.error('Reset failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset leaderboards
  const resetLeaderboards = () => {
    setLeaderboardX(initialStats)
    setLeaderboardO(initialStats)
  }

  // Poll for updates
  useEffect(() => {
    const pollInterval = setInterval(syncWithChain, 1000)
    syncWithChain() // Initial sync
    
    // Try to extract app ID from URL
    const url = process.env.NEXT_PUBLIC_LINERA_NODE_URL || ''
    const match = url.match(/applications\/([^/]+)/)
    if (match) {
      setAppId(match[1])
    }
    
    return () => clearInterval(pollInterval)
  }, [])

  // Update leaderboards when winner changes
  useEffect(() => {
    if (winner && winner !== 'T') {
      const update = (prev, isWin, isLoss) => {
        const total = prev.totalGames + 1
        const wins = isWin ? prev.wins + 1 : prev.wins
        const losses = isLoss ? prev.losses + 1 : prev.losses
        const ties = (!isWin && !isLoss) ? prev.ties + 1 : prev.ties
        return { 
          wins, 
          losses, 
          ties, 
          totalGames: total, 
          winRate: total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%' 
        }
      }
      
      setLeaderboardX(p => update(p, winner === 'X', winner === 'O'))
      setLeaderboardO(p => update(p, winner === 'O', winner === 'X'))
    }
  }, [winner])

  const copyAppId = () => {
    navigator.clipboard.writeText(appId)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div style={{ fontFamily: 'system-ui', background: '#000', color: '#fff', minHeight: '100vh', padding: '40px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4.5rem', background: 'linear-gradient(90deg, #00ffea, #ff00ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
        ⚡ InstantTacToe
      </h1>
      <p style={{ color: '#00ffea', fontSize: '1.2rem', marginBottom: '20px' }}>
        Real-time Online Multiplayer via Linera Microchains
      </p>
      
      {/* Connection Status */}
      <div style={{ margin: '10px auto', padding: '10px', borderRadius: '8px', background: connectionStatus === 'Connected' ? '#00ffea20' : '#ff475720', border: `1px solid ${connectionStatus === 'Connected' ? '#00ffea' : '#ff4757'}`, maxWidth: '300px' }}>
        <span style={{ color: connectionStatus === 'Connected' ? '#00ffea' : '#ff4757' }}>
          ● {connectionStatus}
        </span>
      </div>
      
      {/* Room Controls */}
      <div style={{ margin: '20px auto', padding: '15px', borderRadius: '12px', background: '#111', border: '1px solid #333', maxWidth: '500px' }}>
        <p style={{ margin: '0 0 10px', color: '#888', fontSize: '0.9rem' }}>SHARE THIS ROOM ID TO PLAY ONLINE:</p>
        <code style={{ color: '#00ffea', fontSize: '0.8rem', wordBreak: 'break-all', display: 'block', marginBottom: '10px' }}>{appId}</code>
        <button onClick={copyAppId} style={{ 
          padding: '10px 20px', borderRadius: '25px', border: '1px solid #00ffea', 
          background: copySuccess ? '#00ffea' : 'transparent', 
          color: copySuccess ? '#000' : '#00ffea', 
          cursor: 'pointer', transition: '0.3s', fontWeight: 'bold' 
        }}>
          {copySuccess ? '✅ ID Copied!' : '📋 Copy Room ID'}
        </button>
      </div>

      {/* Game Board */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: '12px', 
        margin: '30px auto', width: 'fit-content', padding: '20px', 
        background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(0,255,234,0.3)' 
      }}>
        {board.map((cell, i) => (
          <div key={i} onClick={() => play(i)} style={{
            width: 120, height: 120, border: '3px solid ' + (cell ? '#fff' : '#00ffea'), 
            borderRadius: '12px', fontSize: '4rem', fontWeight: 'bold',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            transition: 'all 0.2s ease', opacity: isLoading ? 0.5 : 1,
            background: cell === 'X' ? '#ff4757' : cell === 'O' ? '#3742fa' : 'rgba(255,255,255,0.1)'
          }}>
            {cell || (isLoading ? '⚡' : '')}
          </div>
        ))}
      </div>

      {winner ? (
        <h2 style={{ fontSize: '3rem', color: '#ffa502', textShadow: '0 0 20px rgba(255,165,2,0.5)' }}>
          {winner === 'T' ? 'It\'s a Tie!' : `${winner} Wins!`}
        </h2>
      ) : (
        <h3 style={{ fontSize: '1.8rem', color: currentPlayer === 'X' ? '#ff4757' : '#3742fa' }}>
          Current Turn: {currentPlayer}
        </h3>
      )}

      {/* Leaderboards */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '50px', flexWrap: 'wrap' }}>
        <LeaderboardCard player="X" stats={leaderboardX} color="#ff4757" />
        <LeaderboardCard player="O" stats={leaderboardO} color="#3742fa" />
      </div>

      {/* Controls */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button 
          onClick={resetOnChain} 
          disabled={isLoading}
          style={{ 
            background: '#00ffea', color: '#000', padding: '12px 30px', 
            borderRadius: '25px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', opacity: isLoading ? 0.7 : 1 
          }}>
          {isLoading ? '⚡ Processing...' : '🎮 New Game (On-Chain)'}
        </button>
        
        <button 
          onClick={resetLeaderboards} 
          style={{ background: 'none', border: '1px solid #ff4757', color: '#ff4757', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>
          Reset My Stats
        </button>
      </div>

      <p style={{ marginTop: '60px', fontSize: '1.1rem', opacity: 0.7, fontStyle: 'italic' }}>
        Built live for Linera Buildathon ⚡<br />
        Play vs friend (share screen or on-chain)
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