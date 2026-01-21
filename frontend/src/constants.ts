// src/constants.ts

export const DYNAMIC_ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

export const LINERA_RPC_URL = import.meta.env.VITE_LINERA_RPC_URL;
export const LINERA_APP_ID = import.meta.env.VITE_LINERA_APP_ID;
export const LINERA_CHAIN_ID = import.meta.env.VITE_LINERA_CHAIN_ID;

if (!DYNAMIC_ENVIRONMENT_ID) throw new Error("❌ Missing VITE_DYNAMIC_ENVIRONMENT_ID");
if (!LINERA_RPC_URL) throw new Error("❌ Missing VITE_LINERA_RPC_URL");
if (!LINERA_APP_ID) throw new Error("❌ Missing VITE_LINERA_APP_ID");
if (!LINERA_CHAIN_ID) throw new Error("❌ Missing VITE_LINERA_CHAIN_ID");
