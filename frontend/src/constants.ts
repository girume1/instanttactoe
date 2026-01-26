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
  'https://faucet.testnet-conway.linera.net/'
);

export const CONTRACT_APP_ID = getEnvVar(
  'VITE_CONTRACT_APP_ID',
  '7f7edacbbbf55f44ffe0a4d939a816145b2093f072f9c3668ff6d509c755114a'
);

export const DYNAMIC_ENVIRONMENT_ID = getEnvVar('VITE_DYNAMIC_ENVIRONMENT_ID');