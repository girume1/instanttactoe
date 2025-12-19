use async_trait::async_trait;
use linera_sdk::{
    base::WithContractRuntime,
    views::{RootView, View, ViewStorageContext},
    Contract, RuntimeEndpoint,
};
use tic_tac_toe::{state::TicTacToeState, TicTacToeAbi};

#[async_trait]
impl Contract for TicTacToeState {
    type Error = String;
    type Storage = ViewStorageContext;

    async fn instantiate(&mut self, _argument: ()) -> Result<(), Self::Error> {
        self.board.set([None; 9]);
        self.next_player.set('X');
        self.winner.set(None);
        Ok(())
    }

    async fn execute_operation(&mut self, move_idx: u32) -> Result<Option<char>, Self::Error> {
        if self.winner.get().is_some() {
            return Err("Game already finished".into());
        }

        let mut board = self.board.get().clone();
        if move_idx > 8 || board[move_idx as usize].is_some() {
            return Err("Invalid move".into());
        }

        let current_player = *self.next_player.get();
        board[move_idx as usize] = Some(current_player);
        self.board.set(board);

        if let Some(winner) = check_winner(&board) {
            self.winner.set(Some(winner));
            return Ok(Some(winner));
        }

        let next = if current_player == 'X' { 'O' } else { 'X' };
        self.next_player.set(next);
        Ok(None)
    }
}

fn check_winner(board: &[Option<char>; 9]) -> Option<char> {
    let lines = [(0,1,2), (3,4,5), (6,7,8), (0,3,6), (1,4,7), (2,5,8), (0,4,8), (2,4,6)];
    for (a, b, c) in lines {
        if board[a].is_some() && board[a] == board[b] && board[a] == board[c] {
            return board[a];
        }
    }
    None
}
