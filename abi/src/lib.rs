use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::AccountOwner,
};
use serde::{Deserialize, Serialize};

pub struct InstantTacToeAbi;

impl ContractAbi for InstantTacToeAbi {
    type Operation = Operation;
    type Response = Response;
}

impl ServiceAbi for InstantTacToeAbi {
    type Query = Query;
    type QueryResponse = async_graphql::Response;
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub enum Response {
    #[default]
    Ok,
    Error(String),
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RoomInfo {
    pub room_id: u32,
    pub name: String,
    pub creator: AccountOwner,
    pub is_full: bool,
    pub has_password: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatMessage {
    pub sender: String,
    pub text: String,
    pub timestamp: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    SetNickname { name: String },
    CreateMatch { room_name: String, password: Option<String> },
    JoinGame { room_id: u32, password: Option<String> },
    MakeMove { room_id: u32, position: u32 },
    PostMessage { text: String, room_id: u32 },
    ResetGame { room_id: u32 },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Query {
    GetLobby,
    GetBoard { room_id: u32 },
    GetChat { room_id: u32 },
}