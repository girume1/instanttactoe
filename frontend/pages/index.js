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
  // Game state
  const [board, setBoard] = useState(Array(9).fill(''))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState('')
  const [gameStatus, setGameStatus] = useState('WAITING')
  const [isLoading, setIsLoading] = useState(false)
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [copySuccess, setCopySuccess] = useState(false)
  const [appId, setAppId] = useState('')
  
  // Leaderboard States
  const [leaderboardX, setLeaderboardX] = useState(initialStats)
  const [leaderboardO, setLeaderboardO] = useState(initialStats)

  // Configuration
  const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || ""
  const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ""
  const NODE_URL = process.env.NEXT_PUBLIC_LINERA_NODE_URL || "http://localhost:8080"
  const GRAPHQL_URL = `${NODE_URL}/chains/${CHAIN_ID}/applications/${APP_ID}`

  // GraphQL helper
  const graphqlRequest = async (query, variables = {}) => {
    console.log('📡 GraphQL Request to:', GRAPHQL_URL)
    console.log('Query:', query)
    
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables }),
      })

      console.log('📡 Response status:', response.status)
      
      // First get response as text for debugging
      const responseText = await response.text()
      console.log('📡 Raw response:', responseText.substring(0, 500))
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 100)}`)
      }

      // Try to parse JSON
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        console.error('Raw response was:', responseText)
        throw new Error(`Invalid JSON: ${responseText.substring(0, 100)}`)
      }
      
      // Check for GraphQL errors
      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors)
        throw new Error(`GraphQL: ${result.errors[0].message}`)
      }
      
      setConnectionStatus('Connected')
      console.log('✅ GraphQL success:', result.data ? 'Has data' : 'No data')
      return result

    } catch (error) {
      console.error('❌ GraphQL request failed:', error)
      setConnectionStatus(`Error: ${error.message.substring(0, 50)}...`)
      throw error
    }
  }

  // Sync game state from chain
  const syncWithChain = async () => {
    console.log('🔄 Syncing with chain...')
    
    try {
      const query = `
        query {
          board {
            board
            currentPlayer
            winner
            gameStatus
          }
        }
      `
      
      const result = await graphqlRequest(query)
      console.log('🔄 Sync result:', result)
      
      if (result.data?.board) {
        const data = result.data.board
        console.log('🎮 Board data:', data)
        
        // Convert null to empty string for display
        const displayBoard = data.board.map(cell => cell === null ? '' : cell)
        setBoard(displayBoard)
        setCurrentPlayer(data.currentPlayer || 'X')
        setWinner(data.winner || '')
        setGameStatus(data.gameStatus || 'WAITING')
        setConnectionStatus('Connected ✅')
        
        console.log('✅ Sync successful')
      } else {
        console.warn('⚠️ No board data in response:', result)
        setConnectionStatus('Connected (no board data)')
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
      setConnectionStatus('Disconnected ❌')
    }
  }

  // Make a move
  const play = useCallback(async (index) => {
    if (board[index] || winner || isLoading || gameStatus !== 'IN_PROGRESS') {
      console.log('🚫 Cannot play:', { hasPiece: board[index], winner, isLoading, gameStatus })
      return
    }
    
    console.log(`🎮 Playing move at position ${index}`)
    setIsLoading(true)
    
    try {
      const mutation = `
        mutation MakeMove($position: Int!) {
          makeMove(position: $position)
        }
      `
      
      console.log('📤 Sending move mutation...')
      await graphqlRequest(mutation, { position: index })
      
      console.log('✅ Move sent, syncing...')
      await syncWithChain()
    } catch (error) {
      console.error('❌ Move failed:', error)
      alert(`Move failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [board, winner, isLoading, gameStatus])

  // Reset game
  const resetOnChain = async () => {
    console.log('🔄 Resetting game...')
    setIsLoading(true)
    
    try {
      const mutation = `
        mutation {
          resetGame
        }
      `
      
      await graphqlRequest(mutation)
      await syncWithChain()
      console.log('✅ Game reset')
    } catch (error) {
      console.error('❌ Reset failed:', error)
      alert(`Reset failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Join game
  const joinGame = async () => {
    console.log('🎮 Joining game...')
    setIsLoading(true)
    
    try {
      const mutation = `
        mutation {
          joinGame
        }
      `
      
      await graphqlRequest(mutation)
      await syncWithChain()
      console.log('✅ Joined game')
    } catch (error) {
      console.error('❌ Join failed:', error)
      alert(`Join failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset leaderboards
  const resetLeaderboards = () => {
    setLeaderboardX(initialStats)
    setLeaderboardO(initialStats)
  }

  // Update leaderboards when winner changes
  useEffect(() => {
    if (winner && winner !== 'T') {
      console.log(`🏆 Winner detected: ${winner}`)
      
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

  // Initialize
  useEffect(() => {
    console.log('🚀 Initializing InstantTacToe...')
    console.log('🔗 GraphQL URL:', GRAPHQL_URL)
    console.log('🔗 Chain ID:', CHAIN_ID)
    console.log('📱 App ID:', APP_ID)
    
    // Set app ID for display
    setAppId(APP_ID.substring(0, 16) + '...')
    
    // Initial sync
    syncWithChain()
    
    // Poll for updates every 2 seconds
    const pollInterval = setInterval(syncWithChain, 2000)
    
    return () => clearInterval(pollInterval)
  }, [])

  const copyAppId = () => {
    navigator.clipboard.writeText(APP_ID)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Button styles
  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '25px',
    border: '1px solid #00ffea',
    background: 'transparent',
    color: '#00ffea',
    cursor: 'pointer',
    transition: '0.3s',
    fontWeight: 'bold',
    fontSize: '1rem',
    margin: '5px'
  }

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#00ffea',
    color: '#000'
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui', 
      background: '#000', 
      color: '#fff', 
      minHeight: '100vh', 
      padding: '40px 20px', 
      textAlign: 'center' 
    }}>
      <h1 style={{ 
        fontSize: '4.5rem', 
        background: 'linear-gradient(90deg, #00ffea, #ff00ea)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent', 
        margin: 0 
      }}>
        ⚡ InstantTacToe
      </h1>
      
      <p style={{ color: '#00ffea', fontSize: '1.2rem', marginBottom: '20px' }}>
        Real-time Online Multiplayer via Linera Microchains
      </p>
      
      {/* Connection Status */}
      <div style={{ 
        margin: '10px auto', 
        padding: '10px', 
        borderRadius: '8px', 
        background: connectionStatus.includes('Connected') ? '#00ffea20' : '#ff475720', 
        border: `1px solid ${connectionStatus.includes('Connected') ? '#00ffea' : '#ff4757'}`,
        maxWidth: '500px'
      }}>
        <span style={{ color: connectionStatus.includes('Connected') ? '#00ffea' : '#ff4757' }}>
          ● {connectionStatus}
        </span>
      </div>
      
      {/* App Info */}
      <div style={{ 
        margin: '20px auto', 
        padding: '15px', 
        borderRadius: '12px', 
        background: '#111', 
        border: '1px solid #333', 
        maxWidth: '600px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0', color: '#888', fontSize: '0.9rem' }}>CHAIN ID:</p>
            <code style={{ color: '#00ffea', fontSize: '0.7rem', wordBreak: 'break-all' }}>
              {CHAIN_ID.substring(0, 16)}...
            </code>
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0', color: '#888', fontSize: '0.9rem' }}>APP ID:</p>
            <code style={{ color: '#00ffea', fontSize: '0.7rem' }}>
              {appId}
            </code>
          </div>
          
          <button onClick={copyAppId} style={{ ...buttonStyle, padding: '8px 15px' }}>
            {copySuccess ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
        
        <div style={{ marginTop: '10px', padding: '10px', background: '#222', borderRadius: '8px' }}>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            GraphQL Endpoint: <code style={{ color: '#ff00ea' }}>{NODE_URL}/chains/{CHAIN_ID.substring(0, 8)}.../applications/{APP_ID.substring(0, 8)}...</code>
          </p>
        </div>
      </div>
      
      {/* Game Status */}
      <div style={{ 
        margin: '20px auto', 
        padding: '15px', 
        borderRadius: '12px', 
        background: '#111', 
        border: '1px solid #333', 
        maxWidth: '400px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0', color: '#888', fontSize: '0.9rem' }}>STATUS:</p>
            <strong style={{ 
              fontSize: '1.2rem', 
              color: gameStatus === 'IN_PROGRESS' ? '#00ffea' : 
                     gameStatus === 'WAITING' ? '#ffa502' : '#ff4757'
            }}>
              {gameStatus}
            </strong>
          </div>
          
          <div>
            <p style={{ margin: '0', color: '#888', fontSize: '0.9rem' }}>TURN:</p>
            <strong style={{ 
              fontSize: '1.2rem', 
              color: currentPlayer === 'X' ? '#ff4757' : '#3742fa'
            }}>
              {currentPlayer}
            </strong>
          </div>
        </div>
      </div>
      
      {/* Game Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 120px)', 
        gap: '12px', 
        margin: '30px auto', 
        width: 'fit-content', 
        padding: '20px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '20px', 
        border: '1px solid rgba(0,255,234,0.3)' 
      }}>
        {board.map((cell, i) => (
          <div 
            key={i} 
            onClick={() => play(i)}
            style={{
              width: 120, 
              height: 120, 
              border: '3px solid ' + (cell ? '#fff' : (gameStatus === 'IN_PROGRESS' ? '#00ffea' : '#555')), 
              borderRadius: '12px', 
              fontSize: '4rem', 
              fontWeight: 'bold',
              display: 'grid', 
              placeItems: 'center', 
              cursor: (gameStatus === 'IN_PROGRESS' && !cell) ? 'pointer' : 'default',
              transition: 'all 0.2s ease', 
              opacity: isLoading ? 0.5 : 1,
              background: cell === 'X' ? '#ff4757' : cell === 'O' ? '#3742fa' : 'rgba(255,255,255,0.1)',
              transform: (gameStatus === 'IN_PROGRESS' && !cell) ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {cell || (isLoading && gameStatus === 'IN_PROGRESS' ? '⚡' : '')}
          </div>
        ))}
      </div>
      
      {/* Winner Display */}
      {winner ? (
        <h2 style={{ fontSize: '3rem', color: '#ffa502', textShadow: '0 0 20px rgba(255,165,2,0.5)' }}>
          {winner === 'T' ? "It's a Tie! 🤝" : `🎉 ${winner} Wins!`}
        </h2>
      ) : null}
      
      {/* Game Controls */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {gameStatus === 'WAITING' ? (
          <button 
            onClick={joinGame}
            disabled={isLoading}
            style={primaryButtonStyle}
          >
            {isLoading ? '⚡ Joining...' : '🎮 Join Game'}
          </button>
        ) : null}
        
        <button 
          onClick={resetOnChain}
          disabled={isLoading}
          style={primaryButtonStyle}
        >
          {isLoading ? '⚡ Processing...' : '🔄 New Game'}
        </button>
        
        <button 
          onClick={resetLeaderboards}
          style={buttonStyle}
        >
          📊 Reset Stats
        </button>
      </div>
      
      {/* Debug Info (remove in production) */}
      <div style={{ 
        marginTop: '40px', 
        padding: '15px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '10px', 
        maxWidth: '800px', 
        marginLeft: 'auto', 
        marginRight: 'auto',
        fontSize: '0.8rem',
        textAlign: 'left'
      }}>
        <p style={{ margin: '0 0 10px', color: '#888' }}>Debug Info:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <span style={{ color: '#00ffea' }}>Board: </span>
            <code>{JSON.stringify(board)}</code>
          </div>
          <div>
            <span style={{ color: '#00ffea' }}>Status: </span>
            <code>{gameStatus}</code>
          </div>
          <div>
            <span style={{ color: '#00ffea' }}>Current Player: </span>
            <code>{currentPlayer}</code>
          </div>
          <div>
            <span style={{ color: '#00ffea' }}>Winner: </span>
            <code>{winner || 'None'}</code>
          </div>
        </div>
      </div>
      
      {/* Leaderboards */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '50px', flexWrap: 'wrap' }}>
        <LeaderboardCard player="X" stats={leaderboardX} color="#ff4757" />
        <LeaderboardCard player="O" stats={leaderboardO} color="#3742fa" />
      </div>
      
      {/* Footer */}
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
