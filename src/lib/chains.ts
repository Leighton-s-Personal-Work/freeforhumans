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
    contractAddress: (process.env.WORLD_CHAIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    worldIdRouter: (process.env.WORLD_CHAIN_WORLD_ID_ROUTER || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    explorerUrl: 'https://worldscan.org',
  },
  8453: {
    chain: base,
    name: 'Base',
    contractAddress: (process.env.BASE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
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
