import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { normalize } from 'viem/ens';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {
  submitClaim,
  parseProof,
  getGroupIdFromVerificationLevel,
  fetchCampaign,
} from '@/lib/relayer';
import { type SupportedChainId } from '@/lib/chains';
import { getExplorerTxUrl } from '@/lib/chains';

// Request body schema
interface ClaimRequest {
  campaignId: number;
  chainId: number;
  recipient: string; // Wallet address (already resolved) - also used as signal
  // World ID proof fields (from IDKit)
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string; // "orb" or "device"
}

// Response schema
interface ClaimResponse {
  success: boolean;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
}

// ENS client for resolving World ID usernames
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Resolve a World ID username or validate an address
 */
async function resolveRecipient(recipient: string): Promise<`0x${string}`> {
  // If it's already a valid address, return it
  if (isAddress(recipient)) {
    return recipient as `0x${string}`;
  }

  // Handle @username format
  let ensName = recipient;
  if (recipient.startsWith('@')) {
    ensName = recipient.slice(1);
  }

  // Append .world.id if not already an ENS name
  if (!ensName.includes('.')) {
    ensName = `${ensName}.world.id`;
  }

  // Normalize and resolve
  try {
    const normalized = normalize(ensName);
    const address = await ensClient.getEnsAddress({ name: normalized });
    
    if (!address) {
      throw new Error(`Could not resolve username: ${recipient}`);
    }
    
    return address;
  } catch (error) {
    throw new Error(`Failed to resolve username "${recipient}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ClaimResponse>> {
  try {
    const body: ClaimRequest = await request.json();

    // Validate required fields
    if (!body.campaignId && body.campaignId !== 0) {
      return NextResponse.json({ success: false, error: 'Missing campaignId' }, { status: 400 });
    }
    if (!body.chainId) {
      return NextResponse.json({ success: false, error: 'Missing chainId' }, { status: 400 });
    }
    if (!body.recipient) {
      return NextResponse.json({ success: false, error: 'Missing recipient' }, { status: 400 });
    }
    if (!body.merkle_root) {
      return NextResponse.json({ success: false, error: 'Missing merkle_root' }, { status: 400 });
    }
    if (!body.nullifier_hash) {
      return NextResponse.json({ success: false, error: 'Missing nullifier_hash' }, { status: 400 });
    }
    if (!body.proof) {
      return NextResponse.json({ success: false, error: 'Missing proof' }, { status: 400 });
    }
    if (!body.verification_level) {
      return NextResponse.json({ success: false, error: 'Missing verification_level' }, { status: 400 });
    }

    // Validate chain ID
    const chainId = body.chainId as SupportedChainId;
    if (chainId !== 480 && chainId !== 8453) {
      return NextResponse.json({ success: false, error: 'Unsupported chain' }, { status: 400 });
    }

    // Verify campaign exists and is active
    const campaign = await fetchCampaign(chainId, BigInt(body.campaignId));
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    if (!campaign.isActive) {
      return NextResponse.json({ success: false, error: 'Campaign is not active' }, { status: 400 });
    }
    if (BigInt(Math.floor(Date.now() / 1000)) >= campaign.expiresAt) {
      return NextResponse.json({ success: false, error: 'Campaign has expired' }, { status: 400 });
    }

    // Validate recipient address (should already be resolved by frontend)
    if (!isAddress(body.recipient)) {
      return NextResponse.json({ success: false, error: 'Invalid recipient address' }, { status: 400 });
    }
    const recipientAddress = body.recipient as `0x${string}`;

    // Parse proof and get groupId
    const proof = parseProof(body.proof);
    const groupId = getGroupIdFromVerificationLevel(body.verification_level);

    // Convert merkle_root and nullifier_hash to bigint
    const root = BigInt(body.merkle_root);
    const nullifierHash = BigInt(body.nullifier_hash);

    // DEBUG: Log all values for troubleshooting
    console.log('=== CLAIM DEBUG ===' );
    console.log('campaignId:', body.campaignId);
    console.log('recipient (signal):', recipientAddress);
    console.log('merkle_root (raw):', body.merkle_root);
    console.log('root (bigint):', root.toString());
    console.log('nullifier_hash (raw):', body.nullifier_hash);
    console.log('nullifierHash (bigint):', nullifierHash.toString());
    console.log('proof (raw):', body.proof);
    console.log('proof (raw) length:', body.proof.length);
    console.log('proof (parsed):', proof.map(p => p.toString()));
    console.log('groupId:', groupId.toString());
    console.log('verification_level:', body.verification_level);
    console.log('=== END DEBUG ===');

    // Submit the claim transaction
    // Signal is the recipient address - IDKit hashes "0x..." as 20-byte address
    const txHash = await submitClaim(
      chainId,
      BigInt(body.campaignId),
      recipientAddress,
      root,
      nullifierHash,
      proof,
      groupId
    );

    const explorerUrl = getExplorerTxUrl(chainId, txHash);

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      explorerUrl,
    });

  } catch (error) {
    console.error('Claim error:', error);
    
    // Extract error message
    let errorMessage = 'Failed to submit claim';
    if (error instanceof Error) {
      // Check for common contract errors
      if (error.message.includes('AlreadyClaimed')) {
        errorMessage = 'You have already claimed from this campaign';
      } else if (error.message.includes('CampaignExpired')) {
        errorMessage = 'This campaign has expired';
      } else if (error.message.includes('InsufficientBudget')) {
        errorMessage = 'Campaign has run out of tokens';
      } else if (error.message.includes('ClaimIntervalNotPassed')) {
        errorMessage = 'Please wait before claiming again';
      } else if (error.message.includes('InvalidGroupId')) {
        errorMessage = 'Invalid verification level';
      } else if (error.message.includes('InvalidClaimAmounts')) {
        errorMessage = 'This verification level is not supported for this campaign';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
