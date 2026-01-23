use async_graphql::Response as GraphQLResponse;
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
    // NOTE: This keeps your "enum query" approach:
    // Service::handle_query takes Query and returns GraphQLResponse (JSON-packed).
    type Query = Query;
    type QueryResponse = GraphQLResponse;
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Response {
    Ok,
    OkWithData(String),
    GameState(GameStateResponse),
    TournamentCreated { id: u64, name: String },
    TournamentJoined { id: u64, position: u32 },
    Error(String),
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RoomInfo {
    pub room_id: u32,
    pub name: String,
    pub creator: AccountOwner,
    pub is_full: bool,
    pub has_password: bool,
    pub player_count: u8,
    pub mode: GameMode,
    pub stake: Option<u64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatMessage {
    pub sender: String,
    pub text: String,
    pub timestamp: u64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum GameMode {
    Classic,
    Speed(u64),      // Time limit in seconds
    Tournament(u64), // Tournament ID
    Ultimate,        // 9x9 board (not implemented yet)
    PowerUp,         // With special abilities
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq)]
pub enum TournamentFormat {
    SingleElimination,
    Swiss(u32), // Number of rounds
    RoundRobin,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    // Basic Operations
    SetNickname { name: String },
    CreateMatch {
        room_name: String,
        password: Option<String>,
        mode: GameMode,
        stake: Option<u64>,
    },
    JoinGame { room_id: u32, password: Option<String> },
    MakeMove { room_id: u32, position: u32 },
    PostMessage { text: String, room_id: u32 },
    ResetGame { room_id: u32 },
    LeaveRoom { room_id: u32 },
    Surrender { room_id: u32 },

    // Tournament Operations
    CreateTournament {
        name: String,
        format: TournamentFormat,
        entry_fee: Option<u64>,
        max_players: u32,
        prize_distribution: Vec<u32>, // Percentages
    },
    JoinTournament { tournament_id: u64 },
    StartTournament { tournament_id: u64 },
    ReportMatchResult {
        tournament_id: u64,
        match_id: u64,
        result: MatchResult,
    },

    // Staking & Economy
    DepositTokens { amount: u64 },
    WithdrawTokens { amount: u64 },
    ClaimRewards,

    // Social Features
    CreateGuild { name: String, tag: String },
    JoinGuild { guild_id: u64 },
    InviteToGuild { player: AccountOwner, guild_id: u64 },

    // Advanced Features
    UsePowerUp { room_id: u32, power_up: PowerUpType },
    SaveReplay { room_id: u32 },
    ChallengePlayer { player: AccountOwner, stake: Option<u64> },
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum PowerUpType {
    DoubleMove,
    Block,
    Swap,
    Bomb,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum MatchResult {
    Win(AccountOwner),
    Loss(AccountOwner),
    Draw,
    Forfeit(AccountOwner),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GameStateResponse {
    pub board: [Option<char>; 9],
    pub players: [Option<AccountOwner>; 2],
    pub current_player: Option<AccountOwner>,
    pub winner: Option<char>,
    pub time_remaining: Option<u64>,
    pub player_stats: [(u32, u32, u32); 2], // wins, losses, draws
    pub moves_history: Vec<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Query {
    GetLobby,
    GetBoard { room_id: u32 },
    GetChat { room_id: u32 },
    GetPlayerStats { player: AccountOwner },
    GetTournaments { status: Option<TournamentStatus> },
    GetTournamentDetails { tournament_id: u64 },
    GetPlayerBalance { player: AccountOwner },
    GetGuilds,
    GetGuildDetails { guild_id: u64 },
    GetReplays { player: AccountOwner },
    GetLeaderboard { mode: GameMode, limit: u32 },
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq)]
pub enum TournamentStatus {
    Registration,
    InProgress,
    Completed,
    Cancelled,
}
