use async_graphql::{Response as GraphQLResponse, Value};
use linera_sdk::{
    abi::{WithContractAbi, WithServiceAbi},
    linera_base_types::AccountOwner,
    views::{View, RootView},
    Contract, ContractRuntime, Service, ServiceRuntime,
};
use serde_json::json;

pub mod state;
use crate::state::{
    BracketMatch, GameReplay, Guild, GuildRole, InstantTacToeState, StakedGame,
};

use abi::{
    ChatMessage, GameMode, GameStateResponse, MatchResult, Operation, PowerUpType, Query, Response,
    RoomInfo, TournamentFormat, TournamentStatus,
};

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
        let state = InstantTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load contract state");
        InstantTacToeContract { state, runtime }
    }

    async fn instantiate(&mut self, _arg: ()) {
        self.state.next_room_id.set(0);
        self.state.next_tournament_id.set(0);
        self.state.next_guild_id.set(0);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Response {
        let Some(owner) = self.runtime.authenticated_signer() else {
            return Response::Error("Action must be authenticated".to_string());
        };

        match operation {
            // Basic
            Operation::SetNickname { name } => self.set_nickname(owner, name).await,
            Operation::CreateMatch {
                room_name,
                password,
                mode,
                stake,
            } => self
                .create_match(owner, room_name, password, mode, stake)
                .await,
            Operation::JoinGame { room_id, password } => self.join_game(owner, room_id, password).await,
            Operation::MakeMove { room_id, position } => self.make_move(owner, room_id, position).await,
            Operation::PostMessage { text, room_id } => self.post_message(owner, text, room_id).await,
            Operation::ResetGame { room_id } => self.reset_game(owner, room_id).await,
            Operation::LeaveRoom { room_id } => self.leave_room(owner, room_id).await,
            Operation::Surrender { room_id } => self.surrender(owner, room_id).await,

            // Tournament
            Operation::CreateTournament {
                name,
                format,
                entry_fee,
                max_players,
                prize_distribution,
            } => self
                .create_tournament(owner, name, format, entry_fee, max_players, prize_distribution)
                .await,
            Operation::JoinTournament { tournament_id } => self.join_tournament(owner, tournament_id).await,
            Operation::StartTournament { tournament_id } => self.start_tournament(owner, tournament_id).await,
            Operation::ReportMatchResult {
                tournament_id,
                match_id,
                result,
            } => self
                .report_match_result(owner, tournament_id, match_id, result)
                .await,

            // Economy
            Operation::DepositTokens { amount } => self.deposit_tokens(owner, amount).await,
            Operation::WithdrawTokens { amount } => self.withdraw_tokens(owner, amount).await,
            Operation::ClaimRewards => self.claim_rewards(owner).await,

            // Social
            Operation::CreateGuild { name, tag } => self.create_guild(owner, name, tag).await,
            Operation::JoinGuild { guild_id } => self.join_guild(owner, guild_id).await,
            Operation::InviteToGuild { player, guild_id } => self.invite_to_guild(owner, player, guild_id).await,

            // Advanced
            Operation::UsePowerUp { room_id, power_up } => self.use_powerup(owner, room_id, power_up).await,
            Operation::SaveReplay { room_id } => self.save_replay(owner, room_id).await,
            Operation::ChallengePlayer { player, stake } => self.challenge_player(owner, player, stake).await,
        }
    }

    async fn execute_message(&mut self, _message: ()) {
        // no-op
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl InstantTacToeContract {
    // ===================== CORE GAME =====================

    async fn set_nickname(&mut self, owner: AccountOwner, name: String) -> Response {
        if name.trim().is_empty() || name.len() > 30 {
            return Response::Error("Nickname must be 1-30 characters".to_string());
        }
        let _ = self.state.nicknames.insert(&owner, name);
        Response::Ok
    }

    async fn create_match(
        &mut self,
        owner: AccountOwner,
        room_name: String,
        password: Option<String>,
        mode: GameMode,
        stake: Option<u64>,
    ) -> Response {
        if room_name.trim().is_empty() || room_name.len() > 50 {
            return Response::Error("Room name must be 1-50 characters".to_string());
        }

        // stake escrow
        if let Some(amount) = stake {
            let balance = self
                .state
                .player_balances
                .get(&owner)
                .await
                .unwrap()
                .unwrap_or(0);
            if balance < amount {
                return Response::Error("Insufficient balance for stake".to_string());
            }
            let _ = self.state.player_balances.insert(&owner, balance - amount);
            let _ = self.state.escrow_accounts.insert(&owner, amount);
        }

        let room_id = *self.state.next_room_id.get();
        let _ = self.state.next_room_id.set(room_id + 1);

        let _ = self.state.room_names.insert(&room_id, room_name);
        let _ = self.state.room_creators.insert(&room_id, owner);
        let _ = self.state.room_passwords.insert(&room_id, password);
        let _ = self.state.room_is_full.insert(&room_id, false);
        let _ = self.state.room_modes.insert(&room_id, mode);
        let _ = self.state.room_stakes.insert(&room_id, stake);

        let _ = self.state.game_boards.insert(&room_id, [None; 9]);
        let _ = self.state.game_current_players.insert(&room_id, 0);
        let _ = self.state.game_players.insert(&room_id, [Some(owner), None]);
        let _ = self.state.game_winners.insert(&room_id, None);
        let _ = self
            .state
            .game_move_times
            .insert(&room_id, self.runtime.system_time().micros());
        let _ = self.state.chat_counts.insert(&room_id, 0);

        if let Some(amount) = stake {
            let staked_game = StakedGame {
                room_id,
                total_pot: amount * 2,
                players_stake: [amount, 0],
                claimed: [false, false],
            };
            let _ = self.state.staked_games.insert(&room_id, staked_game);
        }

        self.post_system_message(room_id, "🛠️ Room created! Waiting for opponent...")
            .await;

        Response::OkWithData(format!("Room created with ID: {}", room_id))
    }

    async fn join_game(&mut self, owner: AccountOwner, room_id: u32, password: Option<String>) -> Response {
        if self.state.room_names.get(&room_id).await.unwrap().is_none() {
            return Response::Error("Room not found".to_string());
        }

        let is_full = self
            .state
            .room_is_full
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(true);
        if is_full {
            return Response::Error("Room is full".to_string());
        }

        let stored_password = self.state.room_passwords.get(&room_id).await.unwrap();
        if stored_password.as_ref() != Some(&password) {
            return Response::Error("Invalid password".to_string());
        }

        let creator = self.state.room_creators.get(&room_id).await.unwrap();
        if creator == Some(owner) {
            return Response::Error("Cannot join your own game".to_string());
        }

        let stake = self.state.room_stakes.get(&room_id).await.unwrap().flatten();
        if let Some(amount) = stake {
            let balance = self
                .state
                .player_balances
                .get(&owner)
                .await
                .unwrap()
                .unwrap_or(0);
            if balance < amount {
                return Response::Error("Insufficient balance for stake".to_string());
            }
            let _ = self.state.player_balances.insert(&owner, balance - amount);
            let _ = self.state.escrow_accounts.insert(&owner, amount);

            if let Some(mut staked_game) = self.state.staked_games.get(&room_id).await.unwrap() {
                staked_game.players_stake[1] = amount;
                staked_game.total_pot = staked_game.players_stake.iter().sum();
                let _ = self.state.staked_games.insert(&room_id, staked_game);
            }
        }

        let _ = self.state.room_is_full.insert(&room_id, true);

        let Some(mut players) = self.state.game_players.get(&room_id).await.unwrap() else {
            return Response::Error("Game state missing".to_string());
        };
        players[1] = Some(owner);
        let _ = self.state.game_players.insert(&room_id, players);

        let creator_owner = creator.unwrap_or(owner);
        let creator_nick = self
            .state
            .nicknames
            .get(&creator_owner)
            .await
            .unwrap()
            .unwrap_or_else(|| "Anonymous".to_string());
        let joiner_nick = self
            .state
            .nicknames
            .get(&owner)
            .await
            .unwrap()
            .unwrap_or_else(|| "Anonymous".to_string());

        let stake_msg = if stake.is_some() { "💰 Staked match! " } else { "" };
        self.post_system_message(
            room_id,
            &format!(
                "🎮 {}Game started! {} (X) vs {} (O)",
                stake_msg, creator_nick, joiner_nick
            ),
        )
        .await;

        Response::Ok
    }

    async fn make_move(&mut self, owner: AccountOwner, room_id: u32, position: u32) -> Response {
        let Some(mut board) = self.state.game_boards.get(&room_id).await.unwrap() else {
            return Response::Error("Game not found".to_string());
        };

        if self
            .state
            .game_winners
            .get(&room_id)
            .await
            .unwrap()
            .flatten()
            .is_some()
        {
            return Response::Error("Game has finished".to_string());
        }

        let pos = position as usize;
        if pos >= 9 {
            return Response::Error("Position must be 0-8".to_string());
        }
        if board[pos].is_some() {
            return Response::Error("Position already taken".to_string());
        }

        let Some(players) = self.state.game_players.get(&room_id).await.unwrap() else {
            return Response::Error("Game players missing".to_string());
        };

        let current_player_idx = self
            .state
            .game_current_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(0);

        if players[current_player_idx as usize] != Some(owner) {
            return Response::Error("Not your turn".to_string());
        }

        let mode = self
            .state
            .room_modes
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(GameMode::Classic);

        if let GameMode::Speed(time_limit) = mode {
            let last_move = self
                .state
                .game_move_times
                .get(&room_id)
                .await
                .unwrap()
                .unwrap_or(0);
            let now = self.runtime.system_time().micros();
            if now - last_move > time_limit * 1_000_000 {
                return Response::Error("Time limit exceeded".to_string());
            }
        }

        let player_char = if current_player_idx == 0 { 'X' } else { 'O' };
        board[pos] = Some(player_char);

        // move_count precompute
        let indices = self.state.game_moves_history.indices().await.unwrap_or_default();
        let move_count = indices
            .iter()
            .filter(|(r_id, _)| *r_id == room_id)
            .count() as u32;

        let _ = self.state.game_moves_history.insert(&(room_id, move_count), position);

        let _ = self.state.game_boards.insert(&room_id, board);
        let _ = self
            .state
            .game_move_times
            .insert(&room_id, self.runtime.system_time().micros());

        // winner?
        let Some(board_now) = self.state.game_boards.get(&room_id).await.unwrap() else {
            return Response::Error("Game state missing".to_string());
        };

        if let Some(winner) = Self::check_winner(&board_now) {
            self.handle_game_end(room_id, winner).await;
            return Response::GameState(self.get_game_state_response(room_id).await);
        }

        if board_now.iter().all(Option::is_some) {
            self.handle_game_end(room_id, 'T').await;
            return Response::GameState(self.get_game_state_response(room_id).await);
        }

        // switch turns
        let next_idx = 1 - current_player_idx;
        let _ = self.state.game_current_players.insert(&room_id, next_idx);

        let next_name = match players[next_idx as usize] {
            Some(p) => self
                .state
                .nicknames
                .get(&p)
                .await
                .unwrap()
                .unwrap_or_else(|| "Player".to_string()),
            None => "Player".to_string(),
        };

        self.post_system_message(
            room_id,
            &format!(
                "➡️ {}'s turn ({})",
                next_name,
                if next_idx == 0 { "X" } else { "O" }
            ),
        )
        .await;

        Response::GameState(self.get_game_state_response(room_id).await)
    }

    async fn handle_game_end(&mut self, room_id: u32, result: char) {
        let _ = self.state.game_winners.insert(&room_id, Some(result));
        let players = self
            .state
            .game_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or([None, None]);

        match result {
            'X' => {
                if let (Some(winner), Some(loser)) = (players[0], players[1]) {
                    self.update_player_stats(winner, true, false).await;
                    self.update_player_stats(loser, false, false).await;
                    self.update_elo(winner, loser, true).await;
                }
            }
            'O' => {
                if let (Some(winner), Some(loser)) = (players[1], players[0]) {
                    self.update_player_stats(winner, true, false).await;
                    self.update_player_stats(loser, false, false).await;
                    self.update_elo(winner, loser, true).await;
                }
            }
            'T' => {
                for p in players.iter().flatten() {
                    self.update_player_stats(*p, false, true).await;
                }
                if let (Some(p1), Some(p2)) = (players[0], players[1]) {
                    self.update_elo(p1, p2, false).await;
                }
            }
            _ => {}
        }

        // stake distribution (simple)
        if let Some(mut staked_game) = self.state.staked_games.get(&room_id).await.unwrap() {
            match result {
                'X' => {
                    if let Some(winner) = players[0] {
                        let cur = self.state.player_balances.get(&winner).await.unwrap().unwrap_or(0);
                        let _ = self.state.player_balances.insert(&winner, cur + staked_game.total_pot);
                        staked_game.claimed[0] = true;
                    }
                }
                'O' => {
                    if let Some(winner) = players[1] {
                        let cur = self.state.player_balances.get(&winner).await.unwrap().unwrap_or(0);
                        let _ = self.state.player_balances.insert(&winner, cur + staked_game.total_pot);
                        staked_game.claimed[1] = true;
                    }
                }
                'T' => {
                    let half = staked_game.total_pot / 2;
                    if let Some(p1) = players[0] {
                        let cur = self.state.player_balances.get(&p1).await.unwrap().unwrap_or(0);
                        let _ = self.state.player_balances.insert(&p1, cur + half);
                    }
                    if let Some(p2) = players[1] {
                        let cur = self.state.player_balances.get(&p2).await.unwrap().unwrap_or(0);
                        let _ = self.state.player_balances.insert(&p2, cur + half);
                    }
                }
                _ => {}
            }
            let _ = self.state.staked_games.insert(&room_id, staked_game);
        }

        let msg = match result {
            'X' => "Player X wins! 🏆",
            'O' => "Player O wins! 🏆",
            'T' => "It's a tie! 🤝",
            _ => "Game over!",
        };
        self.post_system_message(room_id, msg).await;
    }

    async fn reset_game(&mut self, owner: AccountOwner, room_id: u32) -> Response {
        if !self.is_player_in_room(owner, room_id).await {
            return Response::Error("You're not in this room".to_string());
        }
        if self.state.room_names.get(&room_id).await.unwrap().is_none() {
            return Response::Error("Room not found".to_string());
        }

        let _ = self.state.game_boards.insert(&room_id, [None; 9]);
        let _ = self.state.game_current_players.insert(&room_id, 0);
        let _ = self.state.game_winners.insert(&room_id, None);
        let _ = self
            .state
            .game_move_times
            .insert(&room_id, self.runtime.system_time().micros());

        // clear history
        let indices: Vec<(u32, u32)> = self
            .state
            .game_moves_history
            .indices()
            .await
            .unwrap_or_default()
            .into_iter()
            .filter(|(r_id, _)| *r_id == room_id)
            .collect();

        for (rid, move_num) in indices {
            let _ = self.state.game_moves_history.remove(&(rid, move_num));
        }

        self.post_system_message(room_id, "🔄 Board reset! First player's turn.")
            .await;
        Response::Ok
    }

    async fn leave_room(&mut self, owner: AccountOwner, room_id: u32) -> Response {
        if self.state.room_names.get(&room_id).await.unwrap().is_none() {
            return Response::Error("Room not found".to_string());
        }

        let Some(mut players) = self.state.game_players.get(&room_id).await.unwrap() else {
            return Response::Error("Game not found".to_string());
        };

        let player_nickname = self
            .state
            .nicknames
            .get(&owner)
            .await
            .unwrap()
            .unwrap_or_else(|| "Anonymous".to_string());

        let mut removed = false;
        for p in players.iter_mut() {
            if *p == Some(owner) {
                *p = None;
                removed = true;
            }
        }
        if !removed {
            return Response::Error("You're not in this room".to_string());
        }

        let _ = self.state.game_players.insert(&room_id, players);

        if players.iter().all(Option::is_none) {
            let _ = self.state.room_is_full.insert(&room_id, false);
        }

        self.post_system_message(room_id, &format!("👋 {} left the game", player_nickname))
            .await;
        Response::Ok
    }

    async fn surrender(&mut self, owner: AccountOwner, room_id: u32) -> Response {
        if !self.is_player_in_room(owner, room_id).await {
            return Response::Error("You're not in this game".to_string());
        }

        let Some(players) = self.state.game_players.get(&room_id).await.unwrap() else {
            return Response::Error("Game not found".to_string());
        };

        let winner_idx = if players[0] == Some(owner) { 1 } else { 0 };
        let winner_char = if winner_idx == 0 { 'X' } else { 'O' };

        let _ = self.state.game_winners.insert(&room_id, Some(winner_char));

        if let (Some(p0), Some(p1)) = (players[0], players[1]) {
            if winner_idx == 0 {
                self.update_player_stats(p0, true, false).await;
                self.update_player_stats(p1, false, false).await;
            } else {
                self.update_player_stats(p1, true, false).await;
                self.update_player_stats(p0, false, false).await;
            }
        }

        let loser_nick = self
            .state
            .nicknames
            .get(&owner)
            .await
            .unwrap()
            .unwrap_or_else(|| "Anonymous".to_string());
        self.post_system_message(room_id, &format!("🏳️ {} surrendered!", loser_nick))
            .await;

        Response::Ok
    }

    async fn post_message(&mut self, owner: AccountOwner, text: String, room_id: u32) -> Response {
        if !self.is_player_in_room(owner, room_id).await {
            return Response::Error("You're not in this room".to_string());
        }

        let trimmed = text.trim();
        if trimmed.is_empty() {
            return Response::Error("Message cannot be empty".to_string());
        }
        if trimmed.len() > 500 {
            return Response::Error("Message too long (max 500 chars)".to_string());
        }

        let sender = self
            .state
            .nicknames
            .get(&owner)
            .await
            .unwrap()
            .unwrap_or_else(|| "Anonymous".to_string());

        let current = self.state.chat_counts.get(&room_id).await.unwrap().unwrap_or(0);
        let msg = ChatMessage {
            sender,
            text: trimmed.to_string(),
            timestamp: self.runtime.system_time().micros(),
        };

        let _ = self.state.chat_messages.insert(&(room_id, current), msg);
        let _ = self.state.chat_counts.insert(&room_id, current + 1);

        Response::Ok
    }

    // ===================== TOURNAMENTS =====================

    async fn create_tournament(
        &mut self,
        owner: AccountOwner,
        name: String,
        format: TournamentFormat,
        entry_fee: Option<u64>,
        max_players: u32,
        prize_distribution: Vec<u32>,
    ) -> Response {
        if name.trim().is_empty() || name.len() > 50 {
            return Response::Error("Tournament name must be 1-50 characters".to_string());
        }
        if max_players < 2 || max_players > 256 {
            return Response::Error("Tournament must have 2-256 players".to_string());
        }
        if prize_distribution.iter().sum::<u32>() != 100 {
            return Response::Error("Prize distribution must sum to 100%".to_string());
        }

        if let Some(fee) = entry_fee {
            let bal = self.state.player_balances.get(&owner).await.unwrap().unwrap_or(0);
            if bal < fee {
                return Response::Error("Insufficient balance for entry fee".to_string());
            }
            let _ = self.state.player_balances.insert(&owner, bal - fee);
        }

        let tournament_id = *self.state.next_tournament_id.get();
        let _ = self.state.next_tournament_id.set(tournament_id + 1);

        let _ = self.state.tournament_names.insert(&tournament_id, name.clone());
        let _ = self.state.tournament_formats.insert(&tournament_id, format);
        let _ = self
            .state
            .tournament_status
            .insert(&tournament_id, TournamentStatus::Registration);
        let _ = self.state.tournament_entry_fees.insert(&tournament_id, entry_fee);
        let _ = self
            .state
            .tournament_players
            .insert(&tournament_id, vec![owner]);
        let _ = self
            .state
            .tournament_prize_pools
            .insert(&tournament_id, entry_fee.unwrap_or(0));

        Response::TournamentCreated { id: tournament_id, name }
    }

    async fn join_tournament(&mut self, owner: AccountOwner, tournament_id: u64) -> Response {
        let status = self.state.tournament_status.get(&tournament_id).await.unwrap();
        if status != Some(TournamentStatus::Registration) {
            return Response::Error("Tournament not accepting registrations".to_string());
        }

        let Some(mut players) = self.state.tournament_players.get(&tournament_id).await.unwrap() else {
            return Response::Error("Tournament not found".to_string());
        };

        if players.contains(&owner) {
            return Response::Error("Already registered".to_string());
        }

        let entry_fee = self.state.tournament_entry_fees.get(&tournament_id).await.unwrap().flatten();
        if let Some(fee) = entry_fee {
            let bal = self.state.player_balances.get(&owner).await.unwrap().unwrap_or(0);
            if bal < fee {
                return Response::Error("Insufficient balance for entry fee".to_string());
            }
            let _ = self.state.player_balances.insert(&owner, bal - fee);

            let pool = self.state.tournament_prize_pools.get(&tournament_id).await.unwrap().unwrap_or(0);
            let _ = self.state.tournament_prize_pools.insert(&tournament_id, pool + fee);
        }

        players.push(owner);
        let _ = self.state.tournament_players.insert(&tournament_id, players.clone());

        Response::TournamentJoined {
            id: tournament_id,
            position: players.len() as u32,
        }
    }

    async fn start_tournament(&mut self, owner: AccountOwner, tournament_id: u64) -> Response {
        let Some(players) = self.state.tournament_players.get(&tournament_id).await.unwrap() else {
            return Response::Error("Tournament not found".to_string());
        };

        if players.first() != Some(&owner) {
            return Response::Error("Only tournament creator can start".to_string());
        }
        if players.len() < 2 {
            return Response::Error("Need at least 2 players to start".to_string());
        }

        let Some(format) = self.state.tournament_formats.get(&tournament_id).await.unwrap() else {
            return Response::Error("Tournament format missing".to_string());
        };

        let bracket = match format {
            TournamentFormat::SingleElimination => self.generate_single_elimination_bracket(&players).await,
            TournamentFormat::Swiss(rounds) => self.generate_swiss_pairings(&players, rounds).await,
            TournamentFormat::RoundRobin => self.generate_round_robin_bracket(&players).await,
        };

        let _ = self.state.tournament_brackets.insert(&tournament_id, bracket);
        let _ = self
            .state
            .tournament_status
            .insert(&tournament_id, TournamentStatus::InProgress);

        Response::Ok
    }

    async fn report_match_result(
        &mut self,
        owner: AccountOwner,
        tournament_id: u64,
        match_id: u64,
        result: MatchResult,
    ) -> Response {
        let Some(mut bracket) = self.state.tournament_brackets.get(&tournament_id).await.unwrap() else {
            return Response::Error("Tournament bracket not found".to_string());
        };

        let Some(idx) = bracket.iter().position(|m| m.match_id == match_id) else {
            return Response::Error("Match not found".to_string());
        };

        let is_p1 = bracket[idx].player1 == Some(owner);
        let is_p2 = bracket[idx].player2 == Some(owner);
        if !is_p1 && !is_p2 {
            return Response::Error("Not authorized to report this match".to_string());
        }

        bracket[idx].result = Some(result);

        let _ = self.state.tournament_brackets.insert(&tournament_id, bracket);

        self.check_tournament_completion(tournament_id).await;
        Response::Ok
    }

    // ===================== ECONOMY =====================

    async fn deposit_tokens(&mut self, owner: AccountOwner, amount: u64) -> Response {
        let cur = self.state.player_balances.get(&owner).await.unwrap().unwrap_or(0);
        let _ = self.state.player_balances.insert(&owner, cur + amount);
        Response::OkWithData(format!("Deposited {} tokens", amount))
    }

    async fn withdraw_tokens(&mut self, owner: AccountOwner, amount: u64) -> Response {
        let cur = self.state.player_balances.get(&owner).await.unwrap().unwrap_or(0);
        if cur < amount {
            return Response::Error("Insufficient balance".to_string());
        }
        let _ = self.state.player_balances.insert(&owner, cur - amount);
        Response::OkWithData(format!("Withdrawn {} tokens", amount))
    }

    async fn claim_rewards(&mut self, owner: AccountOwner) -> Response {
        // simplified claim: if player is in winners list, give fixed shares
        let mut total_claimed = 0u64;
        let tournament_ids: Vec<u64> = self.state.tournament_names.indices().await.unwrap_or_default();

        for tid in tournament_ids {
            let Some(winners) = self.state.tournament_winners.get(&tid).await.unwrap() else { continue; };
            if !winners.contains(&owner) {
                continue;
            }
            let pool = self.state.tournament_prize_pools.get(&tid).await.unwrap().unwrap_or(0);
            let pos = winners.iter().position(|w| w == &owner).unwrap_or(999);
            let share = match pos {
                0 => pool * 50 / 100,
                1 => pool * 30 / 100,
                2 => pool * 20 / 100,
                _ => 0,
            };
            if share > 0 {
                let cur = self.state.player_balances.get(&owner).await.unwrap().unwrap_or(0);
                let _ = self.state.player_balances.insert(&owner, cur + share);
                total_claimed += share;
            }
        }

        if total_claimed > 0 {
            Response::OkWithData(format!("Claimed {} LIN in rewards", total_claimed))
        } else {
            Response::Error("No rewards to claim".to_string())
        }
    }

    // ===================== GUILDS =====================

    async fn create_guild(&mut self, owner: AccountOwner, name: String, tag: String) -> Response {
        if name.trim().is_empty() || name.len() > 30 {
            return Response::Error("Guild name must be 1-30 characters".to_string());
        }
        if tag.trim().is_empty() || tag.len() > 5 {
            return Response::Error("Guild tag must be 1-5 characters".to_string());
        }

        let guild_ids: Vec<u64> = self.state.guilds.indices().await.unwrap_or_default();
        for gid in guild_ids {
            if let Some(g) = self.state.guilds.get(&gid).await.unwrap() {
                if g.tag == tag {
                    return Response::Error("Guild tag already taken".to_string());
                }
            }
        }

        let guild_id = *self.state.next_guild_id.get();
        let _ = self.state.next_guild_id.set(guild_id + 1);

        let guild = Guild {
            id: guild_id,
            name: name.clone(),
            tag: tag.clone(),
            level: 1,
            experience: 0,
            treasury: 0,
            member_count: 1,
            created_at: self.runtime.system_time().micros(),
        };

        let _ = self.state.guilds.insert(&guild_id, guild);
        let _ = self
            .state
            .guild_members
            .insert(&(guild_id, owner), GuildRole::Leader);
        let _ = self.state.player_guilds.insert(&owner, guild_id);

        Response::OkWithData(format!("Guild {} [{}] created!", name, tag))
    }

    async fn join_guild(&mut self, owner: AccountOwner, guild_id: u64) -> Response {
        if self.state.player_guilds.get(&owner).await.unwrap().is_some() {
            return Response::Error("Already in a guild".to_string());
        }

        let Some(mut guild) = self.state.guilds.get(&guild_id).await.unwrap() else {
            return Response::Error("Guild not found".to_string());
        };

        let _ = self
            .state
            .guild_members
            .insert(&(guild_id, owner), GuildRole::Member);
        let _ = self.state.player_guilds.insert(&owner, guild_id);

        guild.member_count += 1;
        let _ = self.state.guilds.insert(&guild_id, guild);

        Response::Ok
    }

    async fn invite_to_guild(&mut self, inviter: AccountOwner, player: AccountOwner, guild_id: u64) -> Response {
        let Some(role) = self.state.guild_members.get(&(guild_id, inviter)).await.unwrap() else {
            return Response::Error("You're not in this guild".to_string());
        };

        match role {
            GuildRole::Leader | GuildRole::Officer => {}
            _ => return Response::Error("Insufficient permissions to invite".to_string()),
        }

        if self.state.player_guilds.get(&player).await.unwrap().is_some() {
            return Response::Error("Player is already in a guild".to_string());
        }

        self.join_guild(player, guild_id).await
    }

    // ===================== ADVANCED =====================

    async fn use_powerup(&mut self, owner: AccountOwner, room_id: u32, power_up: PowerUpType) -> Response {
        if !self.is_player_in_room(owner, room_id).await {
            return Response::Error("You're not in this game".to_string());
        }

        let mode = self
            .state
            .room_modes
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(GameMode::Classic);

        if !matches!(mode, GameMode::PowerUp) {
            return Response::Error("Power-ups not enabled in this game mode".to_string());
        }

        let powerup_count = self
            .state
            .player_powerups
            .get(&(owner, power_up.clone()))
            .await
            .unwrap()
            .unwrap_or(0);

        if powerup_count == 0 {
            return Response::Error("You don't have this power-up".to_string());
        }

        // minimal effect for compile; keep swap/bomb like you had
        let Some(mut board) = self.state.game_boards.get(&room_id).await.unwrap() else {
            return Response::Error("Game not found".to_string());
        };

        let players = self
            .state
            .game_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or([None, None]);
        let cur_idx = self
            .state
            .game_current_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(0);

        if players[cur_idx as usize] != Some(owner) {
            return Response::Error("Not your turn".to_string());
        }

        match power_up {
            PowerUpType::DoubleMove => {
                return Response::Error("Double move not yet implemented".to_string());
            }
            PowerUpType::Block => {
                return Response::Error("Block not yet implemented".to_string());
            }
            PowerUpType::Swap => {
                let me = if cur_idx == 0 { 'X' } else { 'O' };
                let opp = if cur_idx == 0 { 'O' } else { 'X' };
                for cell in board.iter_mut() {
                    if *cell == Some(me) {
                        *cell = Some(opp);
                    } else if *cell == Some(opp) {
                        *cell = Some(me);
                    }
                }
                let _ = self.state.game_boards.insert(&room_id, board);
            }
            PowerUpType::Bomb => {
                // simple clear center area in 3x3 (full board) -> just clear all for now
                for cell in board.iter_mut() {
                    *cell = None;
                }
                let _ = self.state.game_boards.insert(&room_id, board);
            }
        }

        let _ = self
            .state
            .player_powerups
            .insert(&(owner, power_up), powerup_count - 1);

        self.post_system_message(room_id, "⚡ Power-up used").await;
        Response::Ok
    }

    async fn save_replay(&mut self, owner: AccountOwner, room_id: u32) -> Response {
        if !self.is_player_in_room(owner, room_id).await {
            return Response::Error("You're not in this game".to_string());
        }

        if self
            .state
            .game_winners
            .get(&room_id)
            .await
            .unwrap()
            .flatten()
            .is_none()
        {
            return Response::Error("Game must be finished to save replay".to_string());
        }

        let board = self.state.game_boards.get(&room_id).await.unwrap().unwrap_or([None; 9]);
        let players = self
            .state
            .game_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or([None, None]);
        let winner = self.state.game_winners.get(&room_id).await.unwrap().flatten();

        let indices: Vec<(u32, u32)> = self
            .state
            .game_moves_history
            .indices()
            .await
            .unwrap_or_default()
            .into_iter()
            .filter(|(r_id, _)| *r_id == room_id)
            .collect();

        let mut moves = Vec::new();
        for (rid, move_num) in indices {
            if let Some(pos) = self.state.game_moves_history.get(&(rid, move_num)).await.unwrap() {
                moves.push(pos);
            }
        }

        let start_time = self
            .state
            .game_move_times
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(0);
        let end_time = self.runtime.system_time().micros();
        let duration = end_time.saturating_sub(start_time);

        let replay_id = self.state.game_replays.indices().await.unwrap_or_default().len() as u64 + 1;
        let replay = GameReplay {
            room_id,
            moves,
            players,
            winner,
            duration,
            timestamp: end_time,
        };

        let _ = self.state.game_replays.insert(&replay_id, replay);

        // avoid unused var warning: board
        let _ = board;

        Response::OkWithData(format!("Replay saved with ID: {}", replay_id))
    }

    async fn challenge_player(&mut self, challenger: AccountOwner, player: AccountOwner, stake: Option<u64>) -> Response {
        if challenger == player {
            return Response::Error("Cannot challenge yourself".to_string());
        }

        let player_exists = self.state.player_stats.get(&player).await.unwrap().is_some();
        if !player_exists {
            return Response::Error("Player not found".to_string());
        }

        let challenger_name = self
            .state
            .nicknames
            .get(&challenger)
            .await
            .unwrap()
            .unwrap_or_else(|| "Player1".to_string());
        let player_name = self
            .state
            .nicknames
            .get(&player)
            .await
            .unwrap()
            .unwrap_or_else(|| "Player2".to_string());

        let room_name = format!("Challenge: {} vs {}", challenger_name, player_name);

        self.create_match(challenger, room_name, None, GameMode::Classic, stake).await
    }

    // ===================== HELPERS =====================

    async fn is_player_in_room(&self, owner: AccountOwner, room_id: u32) -> bool {
        let Some(players) = self.state.game_players.get(&room_id).await.unwrap() else {
            return false;
        };
        players.contains(&Some(owner))
    }

    async fn update_player_stats(&mut self, player: AccountOwner, is_win: bool, is_draw: bool) {
        let (mut wins, mut losses, mut draws) = self
            .state
            .player_stats
            .get(&player)
            .await
            .unwrap()
            .unwrap_or((0, 0, 0));

        if is_win {
            wins += 1;
            let cur = self.state.player_streaks.get(&player).await.unwrap().unwrap_or(0);
            let new_streak = if cur > 0 { cur + 1 } else { 1 };
            let _ = self.state.player_streaks.insert(&player, new_streak);
        } else if is_draw {
            draws += 1;
        } else {
            losses += 1;
            let _ = self.state.player_streaks.insert(&player, 0);
        }

        let _ = self.state.player_stats.insert(&player, (wins, losses, draws));
    }

    async fn update_elo(&mut self, p1: AccountOwner, p2: AccountOwner, p1_won: bool) {
        let elo1 = self.state.player_elo.get(&p1).await.unwrap().unwrap_or(1500);
        let elo2 = self.state.player_elo.get(&p2).await.unwrap().unwrap_or(1500);

        let k = 32.0;
        let expected1 = 1.0 / (1.0 + 10.0_f64.powf((elo2 as f64 - elo1 as f64) / 400.0));
        let actual1 = if p1_won { 1.0 } else { 0.0 };

        let new1 = (elo1 as f64 + k * (actual1 - expected1)).round().max(0.0) as u32;
        let new2 = (elo2 as f64 + k * ((1.0 - actual1) - (1.0 - expected1))).round().max(0.0) as u32;

        let _ = self.state.player_elo.insert(&p1, new1);
        let _ = self.state.player_elo.insert(&p2, new2);
    }

    async fn post_system_message(&mut self, room_id: u32, text: &str) {
        let cur = self.state.chat_counts.get(&room_id).await.unwrap().unwrap_or(0);
        let msg = ChatMessage {
            sender: "🛠️ SYSTEM".to_string(),
            text: text.to_string(),
            timestamp: self.runtime.system_time().micros(),
        };
        let _ = self.state.chat_messages.insert(&(room_id, cur), msg);
        let _ = self.state.chat_counts.insert(&room_id, cur + 1);
    }

    async fn get_game_state_response(&self, room_id: u32) -> GameStateResponse {
        let board = self.state.game_boards.get(&room_id).await.unwrap().unwrap_or([None; 9]);
        let players = self
            .state
            .game_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or([None, None]);
        let current_idx = self
            .state
            .game_current_players
            .get(&room_id)
            .await
            .unwrap()
            .unwrap_or(0);
        let winner = self.state.game_winners.get(&room_id).await.unwrap().flatten();

        let indices = self.state.game_moves_history.indices().await.unwrap_or_default();
        let mut moves_history = Vec::new();
        for (rid, move_num) in indices {
            if rid != room_id {
                continue;
            }
            if let Some(pos) = self.state.game_moves_history.get(&(rid, move_num)).await.unwrap() {
                moves_history.push(pos);
            }
        }

        let stats0 = match players[0] {
            Some(p) => self.state.player_stats.get(&p).await.unwrap().unwrap_or((0, 0, 0)),
            None => (0, 0, 0),
        };
        let stats1 = match players[1] {
            Some(p) => self.state.player_stats.get(&p).await.unwrap().unwrap_or((0, 0, 0)),
            None => (0, 0, 0),
        };

        GameStateResponse {
            board,
            players,
            current_player: players[current_idx as usize],
            winner,
            time_remaining: None,
            player_stats: [stats0, stats1],
            moves_history,
        }
    }

    fn check_winner(board: &[Option<char>; 9]) -> Option<char> {
        let lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for [a, b, c] in lines {
            if board[a].is_some() && board[a] == board[b] && board[a] == board[c] {
                return board[a];
            }
        }
        None
    }

    // bracket helpers (type-safe u64 math)
    async fn generate_single_elimination_bracket(&self, players: &[AccountOwner]) -> Vec<BracketMatch> {
        let n = players.len() as u64;
        if n < 2 {
            return vec![];
        }

        let mut matches: Vec<BracketMatch> = Vec::new();
        let mut match_id: u64 = 1;

        // first round
        let mut i = 0usize;
        while i < players.len() {
            let p1 = Some(players[i]);
            let p2 = if i + 1 < players.len() { Some(players[i + 1]) } else { None };

            matches.push(BracketMatch {
                match_id,
                player1: p1,
                player2: p2,
                result: None,
                next_match: None,
                round: 1,
            });

            match_id += 1;
            i += 2;
        }

        // (simple: no full tree wiring, but compiles clean)
        let _ = n;
        matches
    }

    async fn generate_swiss_pairings(&self, players: &[AccountOwner], rounds: u32) -> Vec<BracketMatch> {
        let mut out = Vec::new();
        let mut match_id: u64 = 1;

        for round in 1..=rounds {
            let mut i = 0usize;
            while i + 1 < players.len() {
                out.push(BracketMatch {
                    match_id,
                    player1: Some(players[i]),
                    player2: Some(players[i + 1]),
                    result: None,
                    next_match: None,
                    round,
                });
                match_id += 1;
                i += 2;
            }
        }
        out
    }

    async fn generate_round_robin_bracket(&self, players: &[AccountOwner]) -> Vec<BracketMatch> {
        let mut out = Vec::new();
        let mut match_id: u64 = 1;

        for i in 0..players.len() {
            for j in (i + 1)..players.len() {
                out.push(BracketMatch {
                    match_id,
                    player1: Some(players[i]),
                    player2: Some(players[j]),
                    result: None,
                    next_match: None,
                    round: 1,
                });
                match_id += 1;
            }
        }
        out
    }

    async fn check_tournament_completion(&mut self, tournament_id: u64) {
        let Some(bracket) = self.state.tournament_brackets.get(&tournament_id).await.unwrap() else {
            return;
        };

        let all_done = bracket.iter().all(|m| m.result.is_some());
        if !all_done {
            return;
        }

        let players = self
            .state
            .tournament_players
            .get(&tournament_id)
            .await
            .unwrap()
            .unwrap_or_default();

        let winners = players.into_iter().take(3).collect::<Vec<_>>();

        let _ = self.state.tournament_winners.insert(&tournament_id, winners);
        let _ = self
            .state
            .tournament_status
            .insert(&tournament_id, TournamentStatus::Completed);
    }
}

// ===================== SERVICE =====================

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
        let state = InstantTacToeState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load service state");
        InstantTacToeService { state, runtime }
    }

    async fn handle_query(&self, query: Query) -> GraphQLResponse {
        match query {
            Query::GetLobby => self.get_lobby().await,
            Query::GetBoard { room_id } => self.get_board(room_id).await,
            Query::GetChat { room_id } => self.get_chat(room_id).await,
            Query::GetPlayerStats { player } => self.get_player_stats(player).await,
            Query::GetTournaments { status } => self.get_tournaments(status).await,
            Query::GetTournamentDetails { tournament_id } => self.get_tournament_details(tournament_id).await,
            Query::GetPlayerBalance { player } => self.get_player_balance(player).await,
            Query::GetGuilds => self.get_guilds().await,
            Query::GetGuildDetails { guild_id } => self.get_guild_details(guild_id).await,
            Query::GetReplays { player } => self.get_replays(player).await,
            Query::GetLeaderboard { mode, limit } => self.get_leaderboard(mode, limit).await,
        }
    }
}

impl InstantTacToeService {
    async fn get_lobby(&self) -> GraphQLResponse {
        let mut rooms = Vec::new();
        let room_ids: Vec<u32> = self.state.room_names.indices().await.unwrap_or_default();

        for room_id in room_ids {
            let Some(name) = self.state.room_names.get(&room_id).await.unwrap() else { continue; };
            let Some(creator) = self.state.room_creators.get(&room_id).await.unwrap() else { continue; };
            let is_full = self.state.room_is_full.get(&room_id).await.unwrap().unwrap_or(false);
            let password = self.state.room_passwords.get(&room_id).await.unwrap().unwrap_or(None);
            let mode = self.state.room_modes.get(&room_id).await.unwrap().unwrap_or(GameMode::Classic);
            let stake = self.state.room_stakes.get(&room_id).await.unwrap().flatten();

            let player_count = self
                .state
                .game_players
                .get(&room_id)
                .await
                .unwrap()
                .map(|p| p.iter().filter(|x| x.is_some()).count() as u8)
                .unwrap_or(0);

            rooms.push(RoomInfo {
                room_id,
                name,
                creator,
                is_full,
                has_password: password.is_some(),
                player_count,
                mode,
                stake,
            });
        }

        GraphQLResponse::new(Value::from_json(json!(rooms)).unwrap_or_default())
    }

    async fn get_board(&self, room_id: u32) -> GraphQLResponse {
        let Some(board) = self.state.game_boards.get(&room_id).await.unwrap() else {
            return GraphQLResponse::new(Value::from_json(json!({"error":"Game not found"})).unwrap_or_default());
        };

        let players = self.state.game_players.get(&room_id).await.unwrap().unwrap_or([None, None]);
        let current_player_idx = self.state.game_current_players.get(&room_id).await.unwrap().unwrap_or(0);
        let winner = self.state.game_winners.get(&room_id).await.unwrap().flatten();
        let last_move_time = self.state.game_move_times.get(&room_id).await.unwrap().unwrap_or(0);
        let current_time = self.runtime.system_time().micros();
        let mode = self.state.room_modes.get(&room_id).await.unwrap().unwrap_or(GameMode::Classic);

        let player_x_nickname = match players[0] {
            Some(p) => self.state.nicknames.get(&p).await.unwrap().unwrap_or_else(|| "Player X".to_string()),
            None => "Player X".to_string(),
        };
        let player_o_nickname = match players[1] {
            Some(p) => self.state.nicknames.get(&p).await.unwrap().unwrap_or_else(|| "Player O".to_string()),
            None => "Player O".to_string(),
        };

        // precompute moves_count (NO let blocks inside json!)
        let indices = self.state.game_moves_history.indices().await.unwrap_or_default();
        let moves_count = indices.iter().filter(|(r_id, _)| *r_id == room_id).count();

        let response = json!({
            "board": board,
            "players": players,
            "current_player": players.get(current_player_idx as usize).copied().flatten(),
            "winner": winner,
            "last_move_time": last_move_time,
            "current_time": current_time,
            "is_timed_out": match mode {
                GameMode::Speed(time_limit) => current_time - last_move_time > time_limit * 1_000_000,
                _ => false
            },
            "player_nicknames": {
                "player_x": player_x_nickname,
                "player_o": player_o_nickname
            },
            "mode": mode,
            "stake": self.state.room_stakes.get(&room_id).await.unwrap().flatten(),
            "moves_count": moves_count
        });

        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_chat(&self, room_id: u32) -> GraphQLResponse {
        let Some(count) = self.state.chat_counts.get(&room_id).await.unwrap() else {
            return GraphQLResponse::new(Value::from_json(json!([])).unwrap_or_default());
        };

        let mut messages = Vec::with_capacity(count as usize);
        for i in 0..count {
            if let Some(msg) = self.state.chat_messages.get(&(room_id, i)).await.unwrap() {
                messages.push(msg);
            }
        }
        GraphQLResponse::new(Value::from_json(json!(messages)).unwrap_or_default())
    }

    async fn get_player_stats(&self, player: AccountOwner) -> GraphQLResponse {
        let stats = self.state.player_stats.get(&player).await.unwrap().unwrap_or((0, 0, 0));
        let elo = self.state.player_elo.get(&player).await.unwrap().unwrap_or(1500);
        let streak = self.state.player_streaks.get(&player).await.unwrap().unwrap_or(0);
        let nickname = self.state.nicknames.get(&player).await.unwrap().unwrap_or_else(|| "Anonymous".to_string());
        let balance = self.state.player_balances.get(&player).await.unwrap().unwrap_or(0);

        let guild = if let Some(guild_id) = self.state.player_guilds.get(&player).await.unwrap() {
            self.state.guilds.get(&guild_id).await.unwrap()
        } else {
            None
        };

        let total = stats.0 + stats.1 + stats.2;
        let win_rate = if total > 0 {
            (stats.0 as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        let response = json!({
            "player": player,
            "nickname": nickname,
            "elo": elo,
            "wins": stats.0,
            "losses": stats.1,
            "draws": stats.2,
            "total_games": total,
            "win_rate": win_rate,
            "current_streak": streak,
            "balance": balance,
            "guild": guild
        });

        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_tournaments(&self, status: Option<TournamentStatus>) -> GraphQLResponse {
        let mut tournaments = Vec::new();
        let tournament_ids: Vec<u64> = self.state.tournament_names.indices().await.unwrap_or_default();

        for tid in tournament_ids {
            let Some(name) = self.state.tournament_names.get(&tid).await.unwrap() else { continue; };
            let Some(format) = self.state.tournament_formats.get(&tid).await.unwrap() else { continue; };
            let Some(ts) = self.state.tournament_status.get(&tid).await.unwrap() else { continue; };

            if let Some(filter) = status.clone() {
                if ts != filter {
                    continue;
                }
            }

            let entry_fee = self.state.tournament_entry_fees.get(&tid).await.unwrap().flatten();
            let players = self.state.tournament_players.get(&tid).await.unwrap().unwrap_or_default();
            let prize_pool = self.state.tournament_prize_pools.get(&tid).await.unwrap().unwrap_or(0);

            tournaments.push(json!({
                "id": tid,
                "name": name,
                "format": format,
                "status": ts,
                "entry_fee": entry_fee,
                "prize_pool": prize_pool,
                "players": players
            }));
        }

        GraphQLResponse::new(Value::from_json(json!(tournaments)).unwrap_or_default())
    }

    async fn get_tournament_details(&self, tournament_id: u64) -> GraphQLResponse {
        let Some(name) = self.state.tournament_names.get(&tournament_id).await.unwrap() else {
            return GraphQLResponse::new(Value::from_json(json!({"error":"Tournament not found"})).unwrap_or_default());
        };

        let format = self.state.tournament_formats.get(&tournament_id).await.unwrap();
        let status = self.state.tournament_status.get(&tournament_id).await.unwrap();
        let entry_fee = self.state.tournament_entry_fees.get(&tournament_id).await.unwrap().flatten();
        let players = self.state.tournament_players.get(&tournament_id).await.unwrap().unwrap_or_default();
        let prize_pool = self.state.tournament_prize_pools.get(&tournament_id).await.unwrap().unwrap_or(0);
        let bracket = self.state.tournament_brackets.get(&tournament_id).await.unwrap();
        let winners = self.state.tournament_winners.get(&tournament_id).await.unwrap();

        let response = json!({
            "id": tournament_id,
            "name": name,
            "format": format,
            "status": status,
            "entry_fee": entry_fee,
            "prize_pool": prize_pool,
            "players": players,
            "bracket": bracket,
            "winners": winners
        });

        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_player_balance(&self, player: AccountOwner) -> GraphQLResponse {
        let balance = self.state.player_balances.get(&player).await.unwrap().unwrap_or(0);
        let in_escrow = self.state.escrow_accounts.get(&player).await.unwrap().unwrap_or(0);

        let response = json!({
            "player": player,
            "balance": balance,
            "in_escrow": in_escrow,
            "total": balance + in_escrow
        });

        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_guilds(&self) -> GraphQLResponse {
        let mut guilds = Vec::new();
        let ids: Vec<u64> = self.state.guilds.indices().await.unwrap_or_default();
        for gid in ids {
            if let Some(g) = self.state.guilds.get(&gid).await.unwrap() {
                guilds.push(g);
            }
        }
        guilds.sort_by(|a, b| b.level.cmp(&a.level).then(b.member_count.cmp(&a.member_count)));
        GraphQLResponse::new(Value::from_json(json!(guilds)).unwrap_or_default())
    }

    async fn get_guild_details(&self, guild_id: u64) -> GraphQLResponse {
        let Some(guild) = self.state.guilds.get(&guild_id).await.unwrap() else {
            return GraphQLResponse::new(Value::from_json(json!({"error":"Guild not found"})).unwrap_or_default());
        };

        let member_keys: Vec<(u64, AccountOwner)> = self.state.guild_members.indices().await.unwrap_or_default();
        let mut members = Vec::new();

        for (gid, member) in member_keys.into_iter().filter(|(gid, _)| *gid == guild_id) {
            let _ = gid;
            if let Some(role) = self.state.guild_members.get(&(guild_id, member)).await.unwrap() {
                let nickname = self.state.nicknames.get(&member).await.unwrap().unwrap_or_else(|| "Anonymous".to_string());
                let stats = self.state.player_stats.get(&member).await.unwrap().unwrap_or((0, 0, 0));
                let elo = self.state.player_elo.get(&member).await.unwrap().unwrap_or(1500);

                members.push(json!({
                    "account": member,
                    "nickname": nickname,
                    "role": role,
                    "wins": stats.0,
                    "losses": stats.1,
                    "draws": stats.2,
                    "elo": elo
                }));
            }
        }

        let total_elo: u64 = members.iter().map(|m| m["elo"].as_u64().unwrap_or(0)).sum();
        let avg_elo = if members.is_empty() { 0 } else { total_elo / members.len() as u64 };

        let response = json!({
            "guild": guild,
            "members": members,
            "member_count": guild.member_count,
            "avg_elo": avg_elo
        });

        GraphQLResponse::new(Value::from_json(response).unwrap_or_default())
    }

    async fn get_replays(&self, player: AccountOwner) -> GraphQLResponse {
        let mut replays = Vec::new();
        let ids: Vec<u64> = self.state.game_replays.indices().await.unwrap_or_default();

        for rid in ids {
            if let Some(r) = self.state.game_replays.get(&rid).await.unwrap() {
                if r.players.contains(&Some(player)) {
                    replays.push(json!({
                        "id": rid,
                        "room_id": r.room_id,
                        "players": r.players,
                        "winner": r.winner,
                        "duration": r.duration,
                        "timestamp": r.timestamp,
                        "move_count": r.moves.len()
                    }));
                }
            }
        }

        replays.sort_by(|a, b| b["timestamp"].as_u64().unwrap_or(0).cmp(&a["timestamp"].as_u64().unwrap_or(0)));
        GraphQLResponse::new(Value::from_json(json!(replays)).unwrap_or_default())
    }

    async fn get_leaderboard(&self, mode: GameMode, limit: u32) -> GraphQLResponse {
        let mut players = Vec::new();
        let accounts: Vec<AccountOwner> = self.state.player_stats.indices().await.unwrap_or_default();

        for p in accounts {
            let stats = self.state.player_stats.get(&p).await.unwrap().unwrap_or((0, 0, 0));
            let elo = self.state.player_elo.get(&p).await.unwrap().unwrap_or(1500);
            let nickname = self.state.nicknames.get(&p).await.unwrap().unwrap_or_else(|| "Anonymous".to_string());

            let total = stats.0 + stats.1 + stats.2;
            let win_rate = if total > 0 { (stats.0 as f64 / total as f64) * 100.0 } else { 0.0 };

            players.push(json!({
                "account": p,
                "nickname": nickname,
                "elo": elo,
                "wins": stats.0,
                "losses": stats.1,
                "draws": stats.2,
                "total_games": total,
                "win_rate": win_rate
            }));
        }

        players.sort_by(|a, b| b["elo"].as_u64().unwrap_or(0).cmp(&a["elo"].as_u64().unwrap_or(0)));
        let limited = players.into_iter().take(limit as usize).collect::<Vec<_>>();

        GraphQLResponse::new(Value::from_json(json!({"mode": mode, "players": limited})).unwrap_or_default())
    }
}
