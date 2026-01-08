use linera_sdk::abi::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

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
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Response {
    MoveResult(Option<char>),
    BoardState(BoardState),
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BoardState {
    pub board: [Option<char>; 9],
    pub current_player: char,
    pub winner: Option<char>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Query {
    GetBoard,
}