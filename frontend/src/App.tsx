// src/App.tsx
import React, { createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Dynamic Labs imports
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

// Components
import { Navigation } from "./components/Navigation";
import { WalletConnect } from "./components/WalletConnect";
import { SoundPreloader } from "./components/SoundPreloader";

// Pages
import { Home } from "./pages/Home";
import { Game } from "./pages/Game";
import { Guild } from "./pages/Guild";
import { TournamentPage as Tournament } from "./pages/Tournament";
import { Profile } from "./pages/Profile";
import { LobbyPage } from "./pages/LobbyPage";
import { GameCreationPage } from "./pages/GameCreationPage";

// Providers
import { GameProvider } from "./contexts/GameContext";
import { TournamentProvider } from "./contexts/TournamentContext";
import { useGameSounds } from "./hooks/useGameSounds";

// Sound context to provide sound effects throughout the app
const SoundContext = createContext<ReturnType<typeof useGameSounds> | null>(null);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSounds must be used within SoundProvider");
  return context;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sounds = useGameSounds();
  return <SoundContext.Provider value={sounds}>{children}</SoundContext.Provider>;
};

function App() {
  const [soundsLoaded, setSoundsLoaded] = React.useState(false);

  return (
    <DynamicContextProvider
      settings={{
        environmentId: (import.meta as any).env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        cssOverrides: `
          .dynamic-modal { 
            background: #111827 !important; 
            color: white !important; 
          }
          .dynamic-widget-inline-controls {
            background: #1f2937 !important;
          }
        `,
        eventsCallbacks: {
          onAuthSuccess: (args: unknown) => console.log("Auth success:", args),
        },
      }}
    >
      {/* Preload sounds, but DO NOT block rendering the whole app */}
      <SoundPreloader onLoadComplete={() => setSoundsLoaded(true)} />

      <SoundProvider>
        <GameProvider>
          <TournamentProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
                <Navigation />
                <WalletConnect />

                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/game/:roomId" element={<Game />} />
                    <Route path="/game/create" element={<GameCreationPage />} />
                    <Route path="/game/lobby" element={<LobbyPage />} />
                    <Route path="/guild" element={<Guild />} />
                    <Route path="/guilds" element={<Guild />} />
                    <Route path="/tournaments" element={<Tournament />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </AnimatePresence>

                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "#1f2937",
                      color: "#fff",
                      border: "1px solid #374151",
                    },
                  }}
                />

                <footer className="mt-16 py-6 text-center text-gray-400 border-t border-gray-800">
                  <p>InstantTacToe Pro • Built on Linera • Play to Earn</p>
                </footer>

                {/* Optional lightweight overlay */}
                {!soundsLoaded && (
                  <div className="fixed bottom-4 left-4 text-xs text-gray-200 bg-black/40 px-3 py-2 rounded-lg">
                    Loading sounds…
                  </div>
                )}
              </div>
            </Router>
          </TournamentProvider>
        </GameProvider>
      </SoundProvider>
    </DynamicContextProvider>
  );
}

export default App;
