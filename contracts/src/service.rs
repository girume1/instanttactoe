use async_trait::async_trait;
use linera_sdk::{base::WithServiceRuntime, Service, ViewStorageContext};

#[async_trait]
impl Service for TicTacToeState {
    type Error = String;
    type Storage = ViewStorageContext;

    async fn handle_query(&self, _query: ()) -> Result<[Option<char>; 9], Self::Error> {
        Ok(*self.board.get())
    }
}
