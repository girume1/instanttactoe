use linera_sdk::{
    Contract, ContractRuntime, Service, ServiceRuntime,
    abi::{WithContractAbi, WithServiceAbi},
    views::{View, RootView},
};
use linera_sdk::views::RootView as _;

pub mod state;
use crate::state::TicTacToeState;
use abi::{Operation, Response, Query, BoardState};

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
        let context = runtime.root_view_storage_context();
        let mut state = TicTacToeState::load(context).await.unwrap();
        
        // Initialize if needed
        if !*state.initialized.get() {
            state.board.set([None; 9]);
            state.current_player.set('X');
            state.winner.set(None);
            state.initialized.set(true);
        }
        
        Self { state, runtime }
    }

    async fn instantiate(&mut self, _arg: ()) {
        self.state.board.set([None; 9]);
        self.state.current_player.set('X');
        self.state.winner.set(None);
        self.state.initialized.set(true);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Response {
        match operation {
            Operation::MakeMove { position } => self.make_move(position).await,
            Operation::ResetGame => self.reset_game().await,
        }
    }

    async fn execute_message(&mut self, _message: ()) {}

    async fn store(mut self) {
        let _ = self.state.save().await; // Don't panic on save
    }
}

impl InstantTacToeContract {
    async fn make_move(&mut self, position: u32) -> Response {
        let pos = position as usize;
        let board = *self.state.board.get();

        // Validate move
        if pos >= 9 || board[pos].is_some() || self.state.winner.get().is_some() {
            return Response::MoveResult(None);
        }

        // Make move
        let player = *self.state.current_player.get();
        let mut new_board = board;
        new_board[pos] = Some(player);
        self.state.board.set(new_board);

        // Check for winner
        let winner = if let Some(w) = Self::check_winner(&new_board) {
            self.state.winner.set(Some(w));
            Some(w)
        } else if new_board.iter().all(|&c| c.is_some()) {
            self.state.winner.set(Some('T'));
            Some('T')
        } else {
            None
        };

        // Switch player
        let next_player = if player == 'X' { 'O' } else { 'X' };
        self.state.current_player.set(next_player);

        Response::MoveResult(winner)
    }

    async fn reset_game(&mut self) -> Response {
        self.state.board.set([None; 9]);
        self.state.current_player.set('X');
        self.state.winner.set(None);
        Response::MoveResult(None)
    }

    fn check_winner(board: &[Option<char>; 9]) -> Option<char> {
        let lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6], // diagonals
        ];

        for [a, b, c] in lines.iter() {
            if board[*a].is_some() && board[*a] == board[*b] && board[*a] == board[*c] {
                return board[*a];
            }
        }
        None
    }
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
        let context = runtime.root_view_storage_context();
        let mut state = TicTacToeState::load(context).await.unwrap();
        
        // Initialize if needed
        if !*state.initialized.get() {
            state.board.set([None; 9]);
            state.current_player.set('X');
            state.winner.set(None);
            state.initialized.set(true);
            let _ = state.save().await;
        }
        
        Self { state, runtime }
    }

    async fn handle_query(&self, query: Query) -> Response {
        match query {
            Query::GetBoard => {
                let board = *self.state.board.get();
                let current_player = *self.state.current_player.get();
                let winner = *self.state.winner.get();
                
                Response::BoardState(BoardState {
                    board,
                    current_player,
                    winner,
                })
            }
        }
    }
}