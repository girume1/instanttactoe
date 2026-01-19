use abi::ChatMessage;
use linera_sdk::{
    linera_base_types::AccountOwner,
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct InstantTacToeState {
    // --- LOBBY MANAGEMENT ---
    pub next_room_id: RegisterView<u32>,
    pub room_names: MapView<u32, String>,
    pub room_creators: MapView<u32, AccountOwner>,
    pub room_passwords: MapView<u32, Option<String>>,
    pub room_is_full: MapView<u32, bool>,
    
    // --- GAME STATE (Keyed by room_id) ---
    pub game_boards: MapView<u32, [Option<char>; 9]>,
    pub game_current_players: MapView<u32, u8>, // 0 for 'X', 1 for 'O'
    pub game_players: MapView<u32, [Option<AccountOwner>; 2]>,
    
    // Stores Some('X'), Some('O'), Some('T') for tie, or None for ongoing
    pub game_winners: MapView<u32, Option<char>>,

    // --- CHAT STATE ---
    // Composite key (room_id, message_index) allows efficient range scanning
    pub chat_messages: MapView<(u32, u64), ChatMessage>,
    // Tracks total message count per room for the index above
    pub chat_counts: MapView<u32, u64>,

    // --- USER DATA ---
    pub nicknames: MapView<AccountOwner, String>,
}
