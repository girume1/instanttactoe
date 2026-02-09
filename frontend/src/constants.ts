const getEnvVar = (key: string, defaultValue?: string): string => {
  // Type assertion for import.meta.env
  const env = (import.meta as any).env;
  const value = env[key];
  
  if (!value && !defaultValue) {
    console.warn(`Missing environment variable: ${key}`);
    return defaultValue || '';
  }
  return value || defaultValue!;
};

export const LINERA_RPC_URL = getEnvVar(
  'VITE_LINERA_RPC_URL',
  'https://rpc.testnet-conway.linera.net'
);

export const LINERA_FAUCET_URL = getEnvVar(
  'VITE_LINERA_FAUCET_URL',
  'https://faucet.testnet-conway.linera.net'
);

export const CONTRACT_APP_ID = getEnvVar(
  'VITE_CONTRACT_APP_ID',
  '7f7edacbbbf55f44ffe0a4d939a816145b2093f072f9c3668ff6d509c755114a'
);

export const chainId = getEnvVar(
  'VITE_chainId',
  '74a81927acd5c0048a05bdb206ce6252b29a4d3c423fbcfae8e32d0a30c3d88f'
);

export const DYNAMIC_ENVIRONMENT_ID = getEnvVar('VITE_DYNAMIC_ENVIRONMENT_ID', 'cdbf83d4-5c65-43da-b046-1e6f6cfb1c1c');
