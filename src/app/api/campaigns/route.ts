import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCampaigns, fetchRemainingBudget, getPublicClient } from '@/lib/relayer';
import { type SupportedChainId, CHAIN_CONFIG } from '@/lib/chains';
import { serializeCampaign, ERC20_ABI, type SerializedCampaign } from '@/lib/contracts';

interface CampaignsResponse {
  campaigns: SerializedCampaign[];
  error?: string;
}

// Cache campaigns for 30 seconds
let campaignsCache: { data: SerializedCampaign[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

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

export async function GET(request: NextRequest): Promise<NextResponse<CampaignsResponse>> {
  try {
    // Check cache
    if (campaignsCache && Date.now() - campaignsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ campaigns: campaignsCache.data });
    }

    // Optional chain filter
    const searchParams = request.nextUrl.searchParams;
    const chainFilter = searchParams.get('chainId');

    const allCampaigns: SerializedCampaign[] = [];
    const chainIds: SupportedChainId[] = chainFilter
      ? [parseInt(chainFilter) as SupportedChainId]
      : [480, 8453];

    // Fetch campaigns from each chain
    for (const chainId of chainIds) {
      // Skip if contract not configured
      if (CHAIN_CONFIG[chainId].contractAddress === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      try {
        const campaigns = await fetchAllCampaigns(chainId);

        for (const campaign of campaigns) {
          // Only include active, non-expired campaigns
          const now = BigInt(Math.floor(Date.now() / 1000));
          if (!campaign.isActive || campaign.expiresAt <= now) {
            continue;
          }

          const remainingBudget = await fetchRemainingBudget(chainId, campaign.id);
          
          // Skip if no budget remaining
          if (remainingBudget === 0n) {
            continue;
          }

          const serialized = serializeCampaign(campaign, chainId, remainingBudget);

          // Fetch token metadata
          const tokenMeta = await getTokenMetadata(chainId, campaign.token);
          serialized.tokenSymbol = tokenMeta.symbol;
          serialized.tokenDecimals = tokenMeta.decimals;

          allCampaigns.push(serialized);
        }
      } catch (error) {
        console.error(`Error fetching campaigns from chain ${chainId}:`, error);
        // Continue with other chains
      }
    }

    // Sort by remaining budget (descending)
    allCampaigns.sort((a, b) => {
      const budgetA = BigInt(a.remainingBudget);
      const budgetB = BigInt(b.remainingBudget);
      return budgetB > budgetA ? 1 : budgetB < budgetA ? -1 : 0;
    });

    // Update cache
    campaignsCache = { data: allCampaigns, timestamp: Date.now() };

    return NextResponse.json({ campaigns: allCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { campaigns: [], error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
