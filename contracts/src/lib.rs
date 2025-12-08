use linera_sdk::{Contract, ContractRuntime, View};

pub struct BoardView {
    board: [char; 9],
    player: char,
}

impl View for BoardView {
    type Error = String;
}

#[derive(linera_sdk::ContractState)]
pub struct Game {
    board: BoardView,
}

impl Contract for Game {
    type Event = Event;
    type Parameters = ();

    fn load(runtime: &ContractRuntime<Self>) -> Self {
        Self { board: BoardView::load(runtime) }
    }

    fn handle_event(&mut self, runtime: &ContractRuntime<Self>, event: Event) -> Result<(), Self::Error> {
        match event {
            Event::Move(pos) => {
                let b = self.board.board.get_mut();
                if b[pos as usize] != '\0' { return Err("Taken".to_string()); }
                b[pos as usize] = self.board.player.get();
                self.board.player.set(if self.board.player.get() == 'X' { 'O' } else { 'X' });
                Ok(())
            }
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum Event {
    Move(u8),
}
