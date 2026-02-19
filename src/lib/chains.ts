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
//   World Chain: 0x3f332A60A32F57d77D9834c4B11dB63999387f8f
//   Base: 0x36A9dD08A1703e63139DFaa3FFA6C6a44f47AA09
// Use NEXT_PUBLIC_ prefix so they're available client-side
const WORLD_CHAIN_CONTRACT = (process.env.NEXT_PUBLIC_WORLD_CHAIN_CONTRACT_ADDRESS || '0x3f332A60A32F57d77D9834c4B11dB63999387f8f') as `0x${string}`;
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
    worldIdRouter: '0x17B354dD2595411ff79041f930e491A4Df39A278',
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
