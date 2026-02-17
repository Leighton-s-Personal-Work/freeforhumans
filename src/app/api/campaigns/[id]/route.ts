import { NextRequest, NextResponse } from 'next/server';
import { fetchCampaign, fetchRemainingBudget, getPublicClient } from '@/lib/relayer';
import { type SupportedChainId, CHAIN_CONFIG } from '@/lib/chains';
import { serializeCampaign, ERC20_ABI, type SerializedCampaign } from '@/lib/contracts';

interface CampaignResponse {
  campaign?: SerializedCampaign;
  error?: string;
}

/**
 * Fetch token metadata (symbol, decimals)
 */
async function getTokenMetadata(
  chainId: SupportedChainId,
  tokenAddress: `0x${string}`
): Promise<{ symbol: string; decimals: number }> {
  const publicClient = getPublicClient(chainId);

  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return { symbol, decimals };
  } catch {
    return { symbol: 'UNKNOWN', decimals: 18 };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CampaignResponse>> {
  try {
    // Parse campaign ID from path
    // Format: chainId-campaignId (e.g., "480-0" or "8453-1")
    const [chainIdStr, campaignIdStr] = params.id.split('-');
    
    if (!chainIdStr || !campaignIdStr) {
      return NextResponse.json(
        { error: 'Invalid campaign ID format. Expected: chainId-campaignId' },
        { status: 400 }
      );
    }

    const chainId = parseInt(chainIdStr) as SupportedChainId;
    const campaignId = BigInt(campaignIdStr);

    // Validate chain ID
    if (chainId !== 480 && chainId !== 8453) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
    }

    // Check if contract is configured
    if (CHAIN_CONFIG[chainId].contractAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ error: 'Contract not configured for this chain' }, { status: 400 });
    }

    // Fetch campaign
    const campaign = await fetchCampaign(chainId, campaignId);
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get remaining budget
    const remainingBudget = await fetchRemainingBudget(chainId, campaignId);

    // Serialize campaign
    const serialized = serializeCampaign(campaign, chainId, remainingBudget);

    // Fetch token metadata
    const tokenMeta = await getTokenMetadata(chainId, campaign.token);
    serialized.tokenSymbol = tokenMeta.symbol;
    serialized.tokenDecimals = tokenMeta.decimals;

    return NextResponse.json({ campaign: serialized });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}
