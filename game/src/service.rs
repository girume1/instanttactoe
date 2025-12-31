use async_trait::async_trait;
use linera_sdk::{Service, ServiceRuntime};
use crate::state::TicTacToeState;

#[async_trait]
impl Service for TicTacToeState {
    type Error = String;

    // By implementing Service for a RootView without custom logic, 
    // Linera automatically generates the GraphQL schema based on your state.rs fields.
    async fn handle_query(&self, _runtime: &mut ServiceRuntime<Self>, _request: ()) -> Result<(), Self::Error> {
        Err("This application uses GraphQL queries. Please use the GraphQL endpoint.".to_string())
    }
}