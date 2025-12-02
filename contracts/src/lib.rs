use linera_sdk::{Contract, ContractRuntime, View};

// Board state as a 9-cell array
pub struct TicTacToeView {
    board: [char; 9],
    current_player: char, // 'X' or 'O'
}

impl View for TicTacToeView {
    type Error = String;
}

#[derive(linera_sdk::ContractState)]
pub struct TicTacToeContract {
    board: TicTacToeView,
}

impl Contract for TicTacToeContract {
    type Event = Event;
    type Parameters = ();

    fn load(runtime: &ContractRuntime<Self>) -> Self {
        Self {
            board: TicTacToeView::load(runtime),
        }
    }

    fn ready(&self) -> bool {
        true
    }

    fn handle_event(runtime: &ContractRuntime<Self>, event: Event) -> Result<(), Self::Error> {
        match event {
            Event::MakeMove(pos) => {
                let board_state = self.board.board.get();
                if board_state[pos as usize] != '\0' {
                    return Err("Cell already taken".to_string());
                }
                let player = self.board.current_player.get();
                self.board.board.set([/* update array with player at pos */]);
                self.board.current_player.set(if player == 'X' { 'O' } else { 'X' });
                // Check winner logic here (simplified)
                Ok(())
            }
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum Event {
    MakeMove(u8), // Position 0-8
}
