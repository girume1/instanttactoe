use linera_sdk::{
    abi::{WithContractAbi, WithServiceAbi},
    Contract, ContractRuntime, Service, ServiceRuntime,
    views::{View, RootView},
};
use async_graphql::{Object, SimpleObject};

pub mod state;
use crate::state::TicTacToeState;
use abi::{Operation, Response, Query};

// Contract Implementation
impl WithContractAbi for InstantTacToeContract {
    type Abi = abi::InstantTacToeAbi;
}

pub struct InstantTacToeContract {
    pub state: TicTacToeState,
    pub runtime: ContractRuntime<Self>,
}

impl Contract for InstantTacToeContract {
    type Message = ();
    type InstantiationArgument = ();
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = TicTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn instantiate(&mut self, _arg: ()) {
        // Initialize if not already initialized
        if !*self.state.initialized.get() {
            self.state.board.set([None; 9]);
            self.state.current_player.set('X');
            self.state.winner.set(None);
            self.state.game_status.set("WAITING".to_string());
            self.state.initialized.set(true);
        }
    }

    async fn execute_operation(&mut self, operation: Operation) -> Response {
        match operation {
            Operation::MakeMove { position } => self.make_move(position).await,
            Operation::ResetGame => self.reset_game().await,
            Operation::JoinGame => self.join_game().await,
        }
    }

    async fn execute_message(&mut self, _message: ()) {}

    async fn store(mut self) {
        let _ = self.state.save().await;
    }
}

impl InstantTacToeContract {
    async fn make_move(&mut self, position: u32) -> Response {
        // Validate position
        if position >= 9 {
            return Response::MoveRejected {
                reason: "Invalid position".to_string(),
            };
        }

        let pos = position as usize;
        let board = *self.state.board.get();

        // Get game status
        let status = self.state.game_status.get().clone();
        if status != "IN_PROGRESS" {
            return Response::MoveRejected {
                reason: format!("Game not in progress (status: {})", status),
            };
        }

        // Check if position is empty
        if board[pos].is_some() {
            return Response::MoveRejected {
                reason: "Position already taken".to_string(),
            };
        }

        // Get current player
        let current_player = *self.state.current_player.get();

        // Make move
        let mut new_board = board;
        new_board[pos] = Some(current_player);
        self.state.board.set(new_board);

        // Switch player
        let next_player = if current_player == 'X' { 'O' } else { 'X' };
        self.state.current_player.set(next_player);

        Response::MoveAccepted {
            position,
            winner: None, // Simple version - no win checking
        }
    }

    async fn reset_game(&mut self) -> Response {
        self.state.board.set([None; 9]);
        self.state.current_player.set('X');
        self.state.winner.set(None);
        self.state.game_status.set("WAITING".to_string());

        Response::MoveAccepted {
            position: 0,
            winner: None,
        }
    }

    async fn join_game(&mut self) -> Response {
        let status = self.state.game_status.get().clone();
        if status == "WAITING" {
            self.state.game_status.set("IN_PROGRESS".to_string());
            Response::GameJoined
        } else {
            Response::Error("Game already started".to_string())
        }
    }
}

// GraphQL Types
#[derive(SimpleObject)]
pub struct BoardStateGraphQL {
    pub board: [Option<char>; 9],
    #[graphql(name = "currentPlayer")]
    pub current_player: char,
    pub winner: Option<char>,
    #[graphql(name = "gameStatus")]
    pub game_status: String,
}

// Service Implementation
impl WithServiceAbi for InstantTacToeService {
    type Abi = abi::InstantTacToeAbi;
}

pub struct InstantTacToeService {
    pub state: TicTacToeState,
    pub runtime: ServiceRuntime<Self>,
}

impl Service for InstantTacToeService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let mut state = TicTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state in service");
        
        // Initialize if needed
        if !*state.initialized.get() {
            state.board.set([None; 9]);
            state.current_player.set('X');
            state.winner.set(None);
            state.game_status.set("WAITING".to_string());
            state.initialized.set(true);
        }
        
        Self { state, runtime }
    }

    async fn handle_query(&self, query: Query) -> Response {
        match query {
            Query::GetBoard => {
                let board = *self.state.board.get();
                let current_player = *self.state.current_player.get();
                let winner = *self.state.winner.get();
                let game_status = self.state.game_status.get().clone();
                
                Response::BoardState {
                    board,
                    current_player,
                    winner,
                    game_status,
                }
            }
        }
    }
}

// GraphQL Implementation
#[Object]
impl InstantTacToeService {
    async fn board(&self) -> async_graphql::Result<BoardStateGraphQL> {
        let board = *self.state.board.get();
        let current_player = *self.state.current_player.get();
        let winner = *self.state.winner.get();
        let game_status = self.state.game_status.get().clone();
        
        Ok(BoardStateGraphQL {
            board,
            current_player,
            winner,
            game_status,
        })
    }

    async fn make_move(&self, position: u32) -> async_graphql::Result<String> {
        Ok(format!("Use operation 'MakeMove {{ position: {} }}' via contract", position))
    }

    async fn reset_game(&self) -> async_graphql::Result<String> {
        Ok("Use operation 'ResetGame' via contract".to_string())
    }

    async fn join_game(&self) -> async_graphql::Result<String> {
        Ok("Use operation 'JoinGame' via contract".to_string())
    }
}