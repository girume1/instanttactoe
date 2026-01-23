use abi::{ChatMessage, GameMode, MatchResult, PowerUpType, TournamentFormat, TournamentStatus};
use linera_sdk::{
    linera_base_types::AccountOwner,
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct InstantTacToeState {
    // --- CORE GAME STATE ---
    pub next_room_id: RegisterView<u32>,
    pub next_tournament_id: RegisterView<u64>,
    pub next_guild_id: RegisterView<u64>,

    // Room Management
    pub room_names: MapView<u32, String>,
    pub room_creators: MapView<u32, AccountOwner>,
    pub room_passwords: MapView<u32, Option<String>>,
    pub room_is_full: MapView<u32, bool>,
    pub room_modes: MapView<u32, GameMode>,
    pub room_stakes: MapView<u32, Option<u64>>,

    // Game State
    pub game_boards: MapView<u32, [Option<char>; 9]>,
    pub game_current_players: MapView<u32, u8>,
    pub game_players: MapView<u32, [Option<AccountOwner>; 2]>,
    pub game_winners: MapView<u32, Option<char>>,
    pub game_move_times: MapView<u32, u64>,               // last move timestamp
    pub game_moves_history: MapView<(u32, u32), u32>,     // (room_id, move_number) -> position

    // --- TOURNAMENT SYSTEM ---
    pub tournament_names: MapView<u64, String>,
    pub tournament_formats: MapView<u64, TournamentFormat>,
    pub tournament_status: MapView<u64, TournamentStatus>,
    pub tournament_entry_fees: MapView<u64, Option<u64>>,
    pub tournament_players: MapView<u64, Vec<AccountOwner>>,
    pub tournament_brackets: MapView<u64, Vec<BracketMatch>>,
    pub tournament_winners: MapView<u64, Vec<AccountOwner>>, // 1st, 2nd, 3rd
    pub tournament_prize_pools: MapView<u64, u64>,

    // --- ECONOMY & STAKING ---
    pub player_balances: MapView<AccountOwner, u64>,
    pub player_elo: MapView<AccountOwner, u32>,
    pub player_stats: MapView<AccountOwner, (u32, u32, u32)>, // wins, losses, draws
    pub player_streaks: MapView<AccountOwner, i32>,
    pub player_achievements: MapView<(AccountOwner, u32), bool>,

    // Staking Pools
    pub staked_games: MapView<u32, StakedGame>,
    pub escrow_accounts: MapView<AccountOwner, u64>,

    // --- SOCIAL FEATURES ---
    pub guilds: MapView<u64, Guild>,
    pub guild_members: MapView<(u64, AccountOwner), GuildRole>,
    pub player_guilds: MapView<AccountOwner, u64>,

    // Chat System
    pub chat_messages: MapView<(u32, u64), ChatMessage>,
    pub chat_counts: MapView<u32, u64>,

    // --- ADVANCED FEATURES ---
    pub nicknames: MapView<AccountOwner, String>,
    pub player_powerups: MapView<(AccountOwner, PowerUpType), u32>,
    pub game_replays: MapView<u64, GameReplay>,

    // NOTE: leaderboard key with GameMode can be risky long-term; keep if you want,
    // but if it causes issues later, change to MapView<(u8, u32), AccountOwner>.
    pub leaderboard: MapView<(GameMode, u32), AccountOwner>,
}

// ===================== SUPPORTING TYPES =====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BracketMatch {
    pub match_id: u64,
    pub player1: Option<AccountOwner>,
    pub player2: Option<AccountOwner>,
    pub result: Option<MatchResult>,
    pub next_match: Option<u64>,
    pub round: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakedGame {
    pub room_id: u32,
    pub total_pot: u64,
    pub players_stake: [u64; 2],
    pub claimed: [bool; 2],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Guild {
    pub id: u64,
    pub name: String,
    pub tag: String,
    pub level: u32,
    pub experience: u64,
    pub treasury: u64,
    pub member_count: u32,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GuildRole {
    Leader,
    Officer,
    Member,
    Recruit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameReplay {
    pub room_id: u32,
    pub moves: Vec<u32>,
    pub players: [Option<AccountOwner>; 2],
    pub winner: Option<char>,
    pub duration: u64,
    pub timestamp: u64,
}
