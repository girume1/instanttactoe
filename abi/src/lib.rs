use linera_sdk::abi::ContractAbi;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum Operation {
    MakeMove { position: u8 },
    ResetGame,
}

// Since the Frontend uses GraphQL to query the state directly through 
// the RootView, you technically don't need a Query enum here anymore.
// However, keeping it doesn't hurt as long as the types match.
#[derive(Serialize, Deserialize, Debug)]
pub enum Query {
    GetBoard,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Response {
    MoveResult(Option<char>),
    // We update this to match the structure expected by the service
    BoardState(BoardState),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BoardState {
    pub board: [Option<char>; 9],
    pub current_player: char,
    pub winner: Option<char>,
}

pub struct InstantTacToeAbi;

impl ContractAbi for InstantTacToeAbi {
    type Operation = Operation;
    type Response = Response;
}
