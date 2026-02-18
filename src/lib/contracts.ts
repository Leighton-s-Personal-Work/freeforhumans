// FreeForHumans Contract ABI (minimal interface for frontend/relayer)
export const FREE_FOR_HUMANS_ABI = [
  // Read functions
  {
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    name: 'getCampaign',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'orbClaimAmount', type: 'uint256' },
          { name: 'nfcClaimAmount', type: 'uint256' },
          { name: 'totalBudget', type: 'uint256' },
          { name: 'totalClaimed', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'isRecurring', type: 'bool' },
          { name: 'claimInterval', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'imageUrl', type: 'string' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    name: 'getRemainingBudget',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'campaignId', type: 'uint256' },
      { name: 'groupId', type: 'uint256' },
    ],
    name: 'canClaim',
    outputs: [
      { name: 'eligible', type: 'bool' },
      { name: 'nextClaimTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextCampaignId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'signalString', type: 'string' },
      { name: 'root', type: 'uint256' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'proof', type: 'uint256[8]' },
      { name: 'groupId', type: 'uint256' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'orbClaimAmount', type: 'uint256' },
      { name: 'nfcClaimAmount', type: 'uint256' },
      { name: 'totalBudget', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'isRecurring', type: 'bool' },
      { name: 'claimInterval', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'imageUrl', type: 'string' },
    ],
    name: 'createCampaign',
    outputs: [{ name: 'campaignId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    name: 'cancelCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'orbClaimAmount', type: 'uint256' },
      { indexed: false, name: 'nfcClaimAmount', type: 'uint256' },
      { indexed: false, name: 'totalBudget', type: 'uint256' },
      { indexed: false, name: 'expiresAt', type: 'uint256' },
      { indexed: false, name: 'isRecurring', type: 'bool' },
      { indexed: false, name: 'claimInterval', type: 'uint256' },
      { indexed: false, name: 'title', type: 'string' },
    ],
    name: 'CampaignCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: false, name: 'tokensReturned', type: 'uint256' },
    ],
    name: 'CampaignCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'nullifierHash', type: 'uint256' },
    ],
    name: 'TokensClaimed',
    type: 'event',
  },
] as const;

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Campaign type for TypeScript
export interface Campaign {
  id: bigint;
  creator: `0x${string}`;
  token: `0x${string}`;
  orbClaimAmount: bigint;
  nfcClaimAmount: bigint;
  totalBudget: bigint;
  totalClaimed: bigint;
  expiresAt: bigint;
  isRecurring: boolean;
  claimInterval: bigint;
  isActive: boolean;
  title: string;
  description: string;
  imageUrl: string;
}

// Serializable campaign for API responses
export interface SerializedCampaign {
  id: string;
  chainId: number;
  creator: string;
  token: string;
  orbClaimAmount: string;
  nfcClaimAmount: string;
  totalBudget: string;
  totalClaimed: string;
  remainingBudget: string;
  expiresAt: number;
  isRecurring: boolean;
  claimInterval: number;
  isActive: boolean;
  title: string;
  description: string;
  imageUrl: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

export function serializeCampaign(campaign: Campaign, chainId: number, remainingBudget: bigint): SerializedCampaign {
  return {
    id: campaign.id.toString(),
    chainId,
    creator: campaign.creator,
    token: campaign.token,
    orbClaimAmount: campaign.orbClaimAmount.toString(),
    nfcClaimAmount: campaign.nfcClaimAmount.toString(),
    totalBudget: campaign.totalBudget.toString(),
    totalClaimed: campaign.totalClaimed.toString(),
    remainingBudget: remainingBudget.toString(),
    expiresAt: Number(campaign.expiresAt),
    isRecurring: campaign.isRecurring,
    claimInterval: Number(campaign.claimInterval),
    isActive: campaign.isActive,
    title: campaign.title,
    description: campaign.description,
    imageUrl: campaign.imageUrl,
  };
}
