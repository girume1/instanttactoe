use linera_sdk::views::{RootView, RegisterView, ViewStorageContext};
use serde::{Deserialize, Serialize};

#[derive(RootView, Serialize, Deserialize)]
#[view(context = ViewStorageContext)]
pub struct TicTacToeState {
    pub board: RegisterView<[Option<char>; 9]>,
    pub current_player: RegisterView<char>,
    pub winner: RegisterView<Option<char>>,
}

impl View for TicTacToeState {
    type Error = String;
    type Context = ViewStorageContext;

    fn context(&self) -> &Self::Context {
        panic!("Context not initialized");
    }

    fn load(_context: &Self::Context) -> Result<Self, Self::Error> {
        Ok(Self {
            board: [None; 9],
            current_player: 'X',
            winner: None,
        })
    }

    fn store(&self, _context: &mut Self::Context) -> Result<(), Self::Error> {
        Ok(())
    }

    fn pre_load(_context: &Self::Context) -> Result<Vec<Vec<u8>>, Self::Error> {
        Ok(vec![])
    }

    fn post_load(&mut self, _context: Self::Context, _bytes: &[Option<Vec<u8>>]) -> Result<(), Self::Error> {
        Ok(())
    }

    fn rollback(&mut self) {}

    fn has_pending_changes(&self) -> impl std::future::Future<Output = bool> + Send + Sync {
        async move { false }
    }

    fn clear(&mut self) {
        self.board = [None; 9];
        self.current_player = 'X';
        self.winner = None;
    }

    fn pre_save(&self, _batch: &mut linera_sdk::views::Batch) -> Result<bool, Self::Error> {
        Ok(false)
    }

    fn post_save(&mut self) {}
}