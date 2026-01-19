#![cfg_attr(target_arch = "wasm32", no_main)]

include!("lib.rs");

linera_sdk::service!(InstantTacToeService);