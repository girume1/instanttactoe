use async_graphql::{Response as GraphQLResponse, Value};
use linera_sdk::{
    abi::{WithContractAbi, WithServiceAbi},
    linera_base_types::AccountOwner,
    views::View,
    Contract, ContractRuntime, Service, ServiceRuntime,
};
use serde_json::json;

pub mod state;
use self::state::InstantTacToeState;
use abi::{ChatMessage, Operation, Query, Response, RoomInfo};

pub struct InstantTacToeContract {
    state: InstantTacToeState,
    runtime: ContractRuntime<Self>,
}

impl WithContractAbi for InstantTacToeContract {
    type Abi = abi::InstantTacToeAbi;
}

impl Contract for InstantTacToeContract {
    type Message = ();
    type InstantiationArgument = ();
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = InstantTacToeState::load(runtime.root_view_storage_context()).await
            .expect("Failed to load contract state");
        InstantTacToeContract { state, runtime }
    }

    async fn instantiate(&mut self, _arg: ()) {
        self.state.next_room_id.set(0);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Response {
        let Some(owner) = self.runtime.authenticated_signer() else {
            return Response::Error("Action must be authenticated".to_string());
        };

        match operation {
            Operation::SetNickname { name } => self.set_nickname(owner, name).await,
            Operation::CreateMatch { room_name, password } => self.create_match(owner, room_name, password).await,
            Operation::JoinGame { room_id, password } => self.join_game(owner, room_id, password).await,
            Operation::MakeMove { room_id, position } => self.make_move(owner, room_id, position).await,
            Operation::PostMessage { text, room_id } => self.post_message(owner, text, room_id).await,
            Operation::ResetGame { room_id } => self.reset_game(owner, room_id).await,
        }
    }

    async fn execute_message(&mut self, _message: ()) {}
    async fn store(self) {}
}

impl InstantTacToeContract {
    async fn set_nickname(&mut self, owner: AccountOwner, name: String) -> Response {
        let _ = self.state.nicknames.insert(&owner, name);
        Response::Ok
    }

    async fn create_match(&mut self, owner: AccountOwner, room_name: String, password: Option<String>) -> Response {
        let room_id = *self.state.next_room_id.get();
        let _ = self.state.next_room_id.set(room_id + 1);

        let _ = self.state.room_names.insert(&room_id, room_name);
        let _ = self.state.room_creators.insert(&room_id, owner);
        let _ = self.state.room_passwords.insert(&room_id, password);
        let _ = self.state.room_is_full.insert(&room_id, false);
        
        let _ = self.state.game_boards.insert(&room_id, [None; 9]);
        let _ = self.state.game_current_players.insert(&room_id, 0);
        let _ = self.state.game_players.insert(&room_id, [Some(owner), None]);
        let _ = self.state.chat_counts.insert(&room_id, 0);

        Response::Ok
    }

    async fn join_game(&mut self, owner: AccountOwner, room_id: u32, password: Option<String>) -> Response {
        let Some(is_full) = self.state.room_is_full.get(&room_id).await.unwrap() else { 
            return Response::Error("Room not found".to_string()); 
        };
        if is_full { return Response::Error("Room is full".to_string()); }

        let room_password = self.state.room_passwords.get(&room_id).await.unwrap();
        if room_password != Some(password) { return Response::Error("Invalid password".to_string()); }

        let creator = self.state.room_creators.get(&room_id).await.unwrap();
        if creator == Some(owner) { return Response::Error("Creator cannot join their own game".to_string()); }
        
        let _ = self.state.room_is_full.insert(&room_id, true);
        let Some(mut players) = self.state.game_players.get(&room_id).await.unwrap() else { 
            return Response::Error("Game state missing".to_string()); 
        };
        players[1] = Some(owner);
        let _ = self.state.game_players.insert(&room_id, players);
        
        Response::Ok
    }
    
    async fn make_move(&mut self, owner: AccountOwner, room_id: u32, position: u32) -> Response {
        let pos = position as usize;
        if pos >= 9 { return Response::Error("Position out of bounds".to_string()); }

        let Some(mut board) = self.state.game_boards.get(&room_id).await.unwrap() else { 
            return Response::Error("Game not found".to_string()); 
        };
        if self.state.game_winners.get(&room_id).await.unwrap().flatten().is_some() { 
            return Response::Error("Game has finished".to_string()); 
        }

        let Some(players) = self.state.game_players.get(&room_id).await.unwrap() else { 
            return Response::Error("Game players missing".to_string()); 
        };
        let Some(current_player_index) = self.state.game_current_players.get(&room_id).await.unwrap() else { 
            return Response::Error("Turn state missing".to_string()); 
        };

        if players[current_player_index as usize] != Some(owner) { 
            return Response::Error("Not your turn".to_string()); 
        }
        if board[pos].is_some() { return Response::Error("Position already taken".to_string()); }

        let player_char = if current_player_index == 0 { 'X' } else { 'O' };
        board[pos] = Some(player_char);
        let _ = self.state.game_boards.insert(&room_id, board);

        if let Some(winner) = Self::check_winner(&board) {
            let _ = self.state.game_winners.insert(&room_id, Some(winner));
        } else if board.iter().all(Option::is_some) {
            let _ = self.state.game_winners.insert(&room_id, Some('T')); // Tie
        } else {
            let _ = self.state.game_current_players.insert(&room_id, 1 - current_player_index);
        }

        Response::Ok
    }

    async fn reset_game(&mut self, _owner: AccountOwner, room_id: u32) -> Response {
        if self.state.room_names.get(&room_id).await.unwrap().is_none() {
            return Response::Error("Room not found".to_string());
        }

        let _ = self.state.game_boards.insert(&room_id, [None; 9]);
        let _ = self.state.game_current_players.insert(&room_id, 0);
        let _ = self.state.game_winners.insert(&room_id, None);
        
        self.post_system_message(room_id, "SYSTEM: Board reset. Round 2 - Ready?").await;

        Response::Ok
    }

    async fn post_message(&mut self, owner: AccountOwner, text: String, room_id: u32) -> Response {
        let sender = self.state.nicknames.get(&owner).await.unwrap().unwrap_or_else(|| "Anonymous".to_string());
        let current_count = self.state.chat_counts.get(&room_id).await.unwrap().unwrap_or(0);
        let message = ChatMessage { sender, text, timestamp: self.runtime.system_time().micros() };

        let _ = self.state.chat_messages.insert(&(room_id, current_count), message);
        let _ = self.state.chat_counts.insert(&room_id, current_count + 1);
        Response::Ok
    }

    async fn post_system_message(&mut self, room_id: u32, text: &str) {
        let current_count = self.state.chat_counts.get(&room_id).await.unwrap().unwrap_or(0);
        let message = ChatMessage { 
            sender: "🛠️ SYSTEM".to_string(), 
            text: text.to_string(), 
            timestamp: self.runtime.system_time().micros() 
        };

        let _ = self.state.chat_messages.insert(&(room_id, current_count), message);
        let _ = self.state.chat_counts.insert(&room_id, current_count + 1);
    }

    fn check_winner(board: &[Option<char>; 9]) -> Option<char> {
        let lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for &[a, b, c] in &lines {
            if board[a].is_some() && board[a] == board[b] && board[a] == board[c] { return board[a]; }
        }
        None
    }
}

// SERVICE IMPLEMENTATION
pub struct InstantTacToeService {
    state: InstantTacToeState,
    runtime: ServiceRuntime<Self>,
}

impl WithServiceAbi for InstantTacToeService {
    type Abi = abi::InstantTacToeAbi;
}

impl Service for InstantTacToeService {
    type Parameters = ();
    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = InstantTacToeState::load(runtime.root_view_storage_context()).await.expect("Failed to load service state");
        InstantTacToeService { state, runtime }
    }
    async fn handle_query(&self, query: Query) -> GraphQLResponse {
        match query {
            Query::GetLobby => self.get_lobby().await,
            Query::GetBoard { room_id } => self.get_board(room_id).await,
            Query::GetChat { room_id } => self.get_chat(room_id).await,
        }
    }
}

impl InstantTacToeService {
    async fn get_lobby(&self) -> GraphQLResponse {
        let mut rooms_info = vec![];
        let Ok(room_ids) = self.state.room_names.indices().await else {
            return GraphQLResponse::new(Value::from_json(json!({"errors": [{"message": "Failed to get room indices"}]})).unwrap_or_default());
        };

        for room_id in room_ids {
            let Some(name) = self.state.room_names.get(&room_id).await.unwrap() else { continue; };
            let Some(creator) = self.state.room_creators.get(&room_id).await.unwrap() else { continue; };
            let Some(is_full) = self.state.room_is_full.get(&room_id).await.unwrap() else { continue; };
            let Some(password) = self.state.room_passwords.get(&room_id).await.unwrap() else { continue; };
            
            rooms_info.push(RoomInfo { room_id, name, creator, is_full, has_password: password.is_some() });
        }
        GraphQLResponse::new(Value::from_json(json!(rooms_info)).unwrap_or_default())
    }

    async fn get_board(&self, room_id: u32) -> GraphQLResponse {
        let Some(board) = self.state.game_boards.get(&room_id).await.unwrap() else { 
            return GraphQLResponse::new(Value::from_json(json!({"errors": [{"message": "Game not found"}]})).unwrap_or_default());
        };
        let players = self.state.game_players.get(&room_id).await.unwrap().unwrap_or_default();
        let current_player_idx = self.state.game_current_players.get(&room_id).await.unwrap().unwrap_or_default();
        let winner = self.state.game_winners.get(&room_id).await.unwrap().flatten();

        let response = json!({ 
            "board": board, 
            "players": players, 
            "current_player": players.get(current_player_idx as usize).and_then(|p| *p), 
            "winner": winner 
        });
        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_chat(&self, room_id: u32) -> GraphQLResponse {
        let Some(count) = self.state.chat_counts.get(&room_id).await.unwrap() else {
            return GraphQLResponse::new(Value::from_json(json!([])).unwrap_or_default());
        };
        
        let mut messages = Vec::with_capacity(count as usize);
        for i in 0..count {
            if let Some(message) = self.state.chat_messages.get(&(room_id, i)).await.unwrap() {
                messages.push(message);
            }
        }
        GraphQLResponse::new(Value::from_json(json!(messages)).unwrap_or_default())
    }
}
