use linera_sdk::abi::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InstantTacToeAbi;

impl ContractAbi for InstantTacToeAbi {
    type Operation = Operation;
    type Response = Response;
}

impl ServiceAbi for InstantTacToeAbi {
    type Query = Query;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Operation {
    MakeMove { position: u32 },
    ResetGame,
    JoinGame,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Query {
    GetBoard,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Response {
    MoveAccepted {
        position: u32,
        winner: Option<char>,
    },
    MoveRejected {
        reason: String,
    },
    GameJoined,
    BoardState {
        board: [Option<char>; 9],
        current_player: char,
        winner: Option<char>,
        game_status: String,
    },
    Error(String),
}