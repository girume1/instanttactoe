use linera_sdk::views::{RootView, RegisterView, ViewStorageContext};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct TicTacToeState {
    pub board: RegisterView<[Option<char>; 9]>,
    pub current_player: RegisterView<char>,
    pub winner: RegisterView<Option<char>>,
    pub initialized: RegisterView<bool>,
}