import { Chain } from 'viem';

// World Chain Mainnet
export const worldchain: Chain = {
  id: 480,
  name: 'World Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.WORLD_CHAIN_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/public'],
    },
    public: {
      http: ['https://worldchain-mainnet.g.alchemy.com/public'],
    },
  },
  blockExplorers: {
    default: { name: 'Worldscan', url: 'https://worldscan.org' },
  },
};

// Base Mainnet
export const base: Chain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.BASE_RPC_URL || 'https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
};

export type SupportedChainId = 480 | 8453;

// Contract addresses - can be overridden via env vars for testing
// Production (app_70a008e9fcd1d01ec35fb6e64f736a70):
//   World Chain: 0xb08FB3DD699988EF51402dB69DFB9A7BCeD802e4
//   Base: 0x36A9dD08A1703e63139DFaa3FFA6C6a44f47AA09
// Use NEXT_PUBLIC_ prefix so they're available client-side
const WORLD_CHAIN_CONTRACT = (process.env.NEXT_PUBLIC_WORLD_CHAIN_CONTRACT_ADDRESS || '0xb08FB3DD699988EF51402dB69DFB9A7BCeD802e4') as `0x${string}`;
const BASE_CONTRACT = (process.env.NEXT_PUBLIC_BASE_CONTRACT_ADDRESS || '0x36A9dD08A1703e63139DFaa3FFA6C6a44f47AA09') as `0x${string}`;

export const CHAIN_CONFIG: Record<SupportedChainId, {
  chain: Chain;
  name: string;
  contractAddress: `0x${string}`;
  worldIdRouter: `0x${string}`;
  explorerUrl: string;
}> = {
  480: {
    chain: worldchain,
    name: 'World Chain',
    contractAddress: WORLD_CHAIN_CONTRACT,
    worldIdRouter: '0x57f928158C3EE7CDad1e4D8642503c4D0201f611',
    explorerUrl: 'https://worldscan.org',
  },
  8453: {
    chain: base,
    name: 'Base',
    contractAddress: BASE_CONTRACT,
    worldIdRouter: '0xBCC7e5910178AFFEEeBA573ba6903E9869594163',
    explorerUrl: 'https://basescan.org',
  },
};

export function getChainConfig(chainId: number) {
  const config = CHAIN_CONFIG[chainId as SupportedChainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const config = getChainConfig(chainId);
  return `${config.explorerUrl}/tx/${txHash}`;
}
