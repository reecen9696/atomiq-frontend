/**
 * Environment configuration
 * Type-safe access to environment variables
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  // API Configuration
  apiUrl: getOptionalEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:3001"),
  wsUrl: getOptionalEnvVar("NEXT_PUBLIC_WS_URL", "ws://localhost:3001"),

  // Blockchain Configuration (to be updated)
  rpcUrl: getOptionalEnvVar("NEXT_PUBLIC_RPC_URL", ""),
  chainId: getOptionalEnvVar("NEXT_PUBLIC_CHAIN_ID", ""),

  // Feature Flags
  enableWebSocket:
    getOptionalEnvVar("NEXT_PUBLIC_ENABLE_WS", "false") === "true",
  enableAnalytics:
    getOptionalEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", "false") === "true",

  // Build Info
  nodeEnv: getOptionalEnvVar("NODE_ENV", "development"),
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
} as const;
