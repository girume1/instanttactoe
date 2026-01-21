// src/components/AuthWrapper.tsx
import React, { useEffect, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { lineraAdapter } from "../lib/linera-adapter";
import { LINERA_RPC_URL, LINERA_APP_ID, LINERA_CHAIN_ID } from "../constants";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext();
  const [isGuest, setIsGuest] = useState(!!localStorage.getItem("linera_burner_key"));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectLinera = async () => {
      setReady(false);
      setError(null);

      try {
        // If user hasn't logged in and not using guest, don't connect yet
        if (!primaryWallet && !isGuest) return;

        // Connect to Linera (WASM init + client ready)
        await Promise.race([
          lineraAdapter.connect(primaryWallet as any, LINERA_RPC_URL, LINERA_CHAIN_ID),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connect timeout")), 15000)
          ),
        ]);

        // Attach your deployed Conway app
        await lineraAdapter.setApplication(LINERA_APP_ID);

        setReady(true);
        console.log("✅ Linera fully ready");
      } catch (e: any) {
        console.error("Linera connection failed:", e);
        setError(e?.message || "Linera connection failed");
      }
    };

    connectLinera();
  }, [primaryWallet, isGuest]);

  // ---- AUTH SCREEN ----
  if (!user && !isGuest) {
    return (
      <div className="welcome-screen">
        <div className="auth-card">
          <h1 className="neon-text-pulse">CONNECT TO MICROCHAIN</h1>
          <p>Choose your authentication method to access the microchain.</p>
          <button className="primary-btn" onClick={() => setShowAuthFlow(true)}>
            CONNECT WALLET / SOCIAL MEDIA
          </button>
          <div className="divider">OR</div>
          <button className="secondary-btn" onClick={() => setIsGuest(true)}>
            GUEST ACCESS
          </button>
        </div>
      </div>
    );
  }

  // ---- ERROR (show before loading!) ----
  if (error) {
    return <div style={{ color: "red", textAlign: "center" }}>{error}</div>;
  }

  // ---- LOADING ----
  if (!ready) {
    return (
      <div id="splash">
        <div className="loading-text">INITIALIZING MICROCHAIN...</div>
      </div>
    );
  }

  return <>{children}</>;
}
