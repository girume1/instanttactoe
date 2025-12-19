use async_trait::async_trait;
use linera_sdk::{base::WithServiceRuntime, Service, ViewStorageContext};
use tic_tac_toe::{state::TicTacToeState, Query};

#[async_trait]
impl Service for TicTacToeState {
    type Error = String;
    type Storage = ViewStorageContext;

    async fn handle_query(&self, _query: Query) -> Result<TicTacToeState, Self::Error> {
        // Returns the entire state (board, next player, winner) to the frontend
        Ok(self.clone())
    }
}
