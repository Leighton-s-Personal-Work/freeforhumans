import {
  createWalletClient,
  createPublicClient,
  http,
  decodeAbiParameters,
  type WalletClient,
  type PublicClient,
  type Account,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG, type SupportedChainId } from './chains';
import { FREE_FOR_HUMANS_ABI, type Campaign } from './contracts';

// Cache clients per chain
const publicClients: Map<number, PublicClient> = new Map();
const walletClients: Map<number, WalletClient> = new Map();

let relayerAccount: Account | null = null;

/**
 * Get the relayer account from environment
 */
function getRelayerAccount(): Account {
  if (relayerAccount) return relayerAccount;

  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('RELAYER_PRIVATE_KEY environment variable not set');
  }

  // Ensure proper format
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  relayerAccount = privateKeyToAccount(formattedKey as `0x${string}`);
  return relayerAccount;
}

/**
 * Get a public client for reading from the chain
 */
export function getPublicClient(chainId: SupportedChainId): PublicClient {
  if (publicClients.has(chainId)) {
    return publicClients.get(chainId)!;
  }

  const config = CHAIN_CONFIG[chainId];
  const client = createPublicClient({
    chain: config.chain as Chain,
    transport: http(),
  });

  publicClients.set(chainId, client);
  return client;
}

/**
 * Get a wallet client for submitting transactions
 */
export function getWalletClient(chainId: SupportedChainId): WalletClient {
  if (walletClients.has(chainId)) {
    return walletClients.get(chainId)!;
  }

  const config = CHAIN_CONFIG[chainId];
  const account = getRelayerAccount();

  const client = createWalletClient({
    account,
    chain: config.chain as Chain,
    transport: http(),
  });

  walletClients.set(chainId, client);
  return client;
}

/**
 * Get the relayer's address
 */
export function getRelayerAddress(): `0x${string}` {
  return getRelayerAccount().address;
}

/**
 * Submit a claim transaction
 * The signal is the recipient address - IDKit hashes "0x..." addresses as 20-byte hex
 */
export async function submitClaim(
  chainId: SupportedChainId,
  campaignId: bigint,
  recipient: `0x${string}`,
  root: bigint,
  nullifierHash: bigint,
  proof: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  groupId: bigint
): Promise<`0x${string}`> {
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClient(chainId);
  const config = CHAIN_CONFIG[chainId];

  // Simulate first to catch errors
  const { request } = await publicClient.simulateContract({
    address: config.contractAddress,
    abi: FREE_FOR_HUMANS_ABI,
    functionName: 'claim',
    args: [campaignId, recipient, root, nullifierHash, proof, groupId],
    account: getRelayerAccount(),
  });

  // Submit transaction
  const txHash = await walletClient.writeContract(request);

  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

/**
 * Fetch a campaign from the contract
 */
export async function fetchCampaign(
  chainId: SupportedChainId,
  campaignId: bigint
): Promise<Campaign | null> {
  const publicClient = getPublicClient(chainId);
  const config = CHAIN_CONFIG[chainId];

  try {
    const campaign = await publicClient.readContract({
      address: config.contractAddress,
      abi: FREE_FOR_HUMANS_ABI,
      functionName: 'getCampaign',
      args: [campaignId],
    });

    // Check if campaign exists (creator would be zero address if not)
    if (campaign.creator === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return campaign as Campaign;
  } catch {
    return null;
  }
}

/**
 * Fetch remaining budget for a campaign
 */
export async function fetchRemainingBudget(
  chainId: SupportedChainId,
  campaignId: bigint
): Promise<bigint> {
  const publicClient = getPublicClient(chainId);
  const config = CHAIN_CONFIG[chainId];

  const remaining = await publicClient.readContract({
    address: config.contractAddress,
    abi: FREE_FOR_HUMANS_ABI,
    functionName: 'getRemainingBudget',
    args: [campaignId],
  });

  return remaining;
}

/**
 * Get the next campaign ID (total number of campaigns)
 */
export async function fetchNextCampaignId(chainId: SupportedChainId): Promise<bigint> {
  const publicClient = getPublicClient(chainId);
  const config = CHAIN_CONFIG[chainId];

  const nextId = await publicClient.readContract({
    address: config.contractAddress,
    abi: FREE_FOR_HUMANS_ABI,
    functionName: 'nextCampaignId',
  });

  return nextId;
}

/**
 * Fetch all active campaigns from a chain
 */
export async function fetchAllCampaigns(chainId: SupportedChainId): Promise<Campaign[]> {
  const nextId = await fetchNextCampaignId(chainId);
  const campaigns: Campaign[] = [];

  for (let i = 0n; i < nextId; i++) {
    const campaign = await fetchCampaign(chainId, i);
    if (campaign && campaign.isActive) {
      campaigns.push(campaign);
    }
  }

  return campaigns;
}

/**
 * Check the relayer's ETH balance on a chain
 */
export async function getRelayerBalance(chainId: SupportedChainId): Promise<bigint> {
  const publicClient = getPublicClient(chainId);
  const account = getRelayerAccount();

  return publicClient.getBalance({ address: account.address });
}

/**
 * Parse proof from IDKit format to contract format
 * IDKit returns proof as an ABI-encoded hex string that needs to be decoded
 * See: https://docs.world.org/world-id/reference/contracts
 */
export function parseProof(proofString: string): readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
  // IDKit proof is ABI-encoded as uint256[8]
  // We need to decode it using ABI decoding, not raw hex slicing
  const proofHex = proofString.startsWith('0x') ? proofString : `0x${proofString}`;
  
  const decoded = decodeAbiParameters(
    [{ type: 'uint256[8]' }],
    proofHex as `0x${string}`
  );
  
  return decoded[0] as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

/**
 * Get groupId from verification level string
 */
export function getGroupIdFromVerificationLevel(level: string): bigint {
  switch (level.toLowerCase()) {
    case 'orb':
      return 1n;
    case 'device':
    case 'nfc':
    case 'passport':
      return 2n;
    default:
      throw new Error(`Unknown verification level: ${level}`);
  }
}
