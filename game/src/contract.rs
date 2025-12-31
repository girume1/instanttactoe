use async_trait::async_trait;
use linera_sdk::{Contract, ContractRuntime};
use abi::{Operation, Response};
use crate::state::TicTacToeState;

#[async_trait]
impl Contract for TicTacToeState {
    type Error = String;

    async fn instantiate(&mut self, _runtime: &mut ContractRuntime<Self>, _argument: ()) -> Result<(), Self::Error> {
        self.board.set([None; 9]);
        self.current_player.set('X');
        self.winner.set(None);
        Ok(())
    }

   async fn execute_operation(&mut self, _runtime: &mut ContractRuntime<Self>, operation: Operation) -> Result<Response, Self::Error> {
    match operation {
        Operation::MakeMove { position } => {
                let pos = position as usize;
                let board = self.board.get();
                let winner = self.winner.get();

                if pos >= 9 || board[pos].is_some() || winner.is_some() {
                    return Err("Invalid move".to_string());
                }

                let player = *self.current_player.get();
                let mut new_board = *board;
                new_board[pos] = Some(player);
                self.board.set(new_board);

                if let Some(w) = self.check_winner(&new_board) {
                    self.winner.set(Some(w));
                    return Ok(Response::MoveResult(Some(w)));
                }

                let next_player = if player == 'X' { 'O' } else { 'X' };
                self.current_player.set(next_player);

                }
                Operation::ResetGame => {
                self.board.set([None; 9]);
                self.current_player.set('X');
                self.winner.set(None);
                Ok(Response::MoveResult(None))
                
                
            }
        }
    }
}

impl TicTacToeState {
    fn check_winner(&self, board: &[Option<char>; 9]) -> Option<char> {
        let lines = [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Cols
            [0,4,8], [2,4,6]           // Diagonals
        ];
        for [a, b, c] in lines {
            if board[a].is_some() && board[a] == board[b] && board[a] == board[c] {
                return board[a];
            }
        }
        None
    }
}