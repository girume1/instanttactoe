use linera_sdk::base::ContractAbi;
use serde::{Deserialize, Serialize};

pub mod state;

pub struct TicTacToeAbi;

impl ContractAbi for TicTacToeAbi {
    type Operation = u32; // Index 0-8 for the move
    type Response = Result<Option<char>, String>;
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Query {
    GetBoard,
}
