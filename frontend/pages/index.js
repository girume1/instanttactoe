import { useState } from 'react'

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(""))
  const [player, setPlayer] = useState("X")

  const play = (i) => {
    if (board[i]) return
    const newBoard = [...board]
    newBoard[i] = player
    setBoard(newBoard)
    setPlayer(player === "X" ? "O" : "X")
  }

  return (
    // same styling as before, but now:
    <div onClick={() => {}} style={{cursor:"pointer", ...}}>
      {board.map((cell, i) => (
        <div key={i} onClick={() => play(i)} style={{...same box style...}}>
          {cell}
        </div>
      ))}
    </div>
  )
}
