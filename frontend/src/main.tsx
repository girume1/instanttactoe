// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

import App from "./App";
import "./styles/cyber-theme.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicContextProvider
      theme="dark" // Fits cyberpunk
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);