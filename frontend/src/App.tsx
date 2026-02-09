// src/App.tsx
import React, { createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Dynamic Labs imports
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DYNAMIC_ENVIRONMENT_ID } from "./constants";

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
  const [walletLoading, setWalletLoading] = React.useState(true);

  // Check wallet connection status
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setWalletLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Add a loading overlay
  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  const GameSoundShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [soundsLoaded, setSoundsLoaded] = React.useState(false);
    return (
      <>
        <SoundPreloader onLoadComplete={() => setSoundsLoaded(true)} />
        <SoundProvider>{children}</SoundProvider>
        {!soundsLoaded && (
          <div className="fixed bottom-4 left-4 text-xs text-gray-200 bg-black/40 px-3 py-2 rounded-lg">
            Loading sounds...
          </div>
        )}
      </>
    );
  };

  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],

        eventsCallbacks: {
          onAuthSuccess: (args: unknown) => {
            console.log("Wallet connected:", args);
            toast.success("Wallet connected!");
          },
          onLogout: () => {
            console.log("User logged out");
            toast("Logged out");
          }
        },

        appLogoUrl: '/logo.png',
        appName: 'InstantTacToe Pro',

        cssOverrides: `
          .dynamic-modal { 
            background: #111827 !important; 
            color: white !important; 
            border-radius: 16px !important;
            border: 1px solid #374151 !important;
          }
          .dynamic-widget-inline-controls {
            background: #1f2937 !important;
          }
          .dynamic-widget-button {
            background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%) !important;
            border-radius: 12px !important;
          }
        `,
      }}
    >
      <GameProvider>
        <TournamentProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
              <Navigation />
              <WalletConnect />

              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/game/:roomId"
                    element={
                      <GameSoundShell>
                        <Game />
                      </GameSoundShell>
                    }
                  />
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
                <p>InstantTacToe Pro - Built on Linera - Play to Earn</p>
              </footer>
            </div>
          </Router>
        </TournamentProvider>
      </GameProvider>
    </DynamicContextProvider>
  );
}

export default App;
