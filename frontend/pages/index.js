export default function Home() {
  const board = ["", "X", "O", "", "X", "", "O", "", "X"];
  return (
    <div style={{fontFamily:"system-ui", background:"#000", color:"#fff", minHeight:"100vh", textAlign:"center", padding:"40px"}}>
      <h1 style={{fontSize:"4.5rem", background:"linear-gradient(90deg,#00ffea,#ff00c8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
        InstantTacToe ⚡
      </h1>
      <p style={{fontSize:"2rem", margin:"30px"}}>Real-time on-chain Tic-Tac-Toe</p>
      <p style={{fontSize:"1.5rem", color:"#0f0"}}>Moves appear instantly for both players<br/>Powered by Linera microchains (sub-100ms finality)</p>
      
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,100px)", gap:"10px", margin:"50px auto", width:"fit-content"}}>
        {board.map((cell, i) => (
          <div key={i} style={{width:100,height:100,background:"#111",border:"3px solid #00ffea",fontSize:"3rem",display:"grid",placeItems:"center"}}>
            {cell}
          </div>
        ))}
      </div>
      
      <p style={{marginTop:"50px", color:"#ff00c8", fontSize:"1.8rem"}}>
        Built live in the final minutes for Linera Buildathon
      </p>
    </div>
  )
}
