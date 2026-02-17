import { notFound } from 'next/navigation';
import { ClaimFlow } from '@/components/ClaimFlow';
import { type SerializedCampaign } from '@/lib/contracts';
import { CHAIN_CONFIG, type SupportedChainId } from '@/lib/chains';
import { formatUnits } from 'viem';

async function getCampaign(id: string): Promise<SerializedCampaign | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/campaigns/${id}`, {
      next: { revalidate: 10 },
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.campaign || null;
  } catch {
    return null;
  }
}

function formatTokenAmount(amount: string, decimals: number = 18): string {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

function formatTimeRemaining(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaign(params.id);
  
  if (!campaign) {
    notFound();
  }

  const chainConfig = CHAIN_CONFIG[campaign.chainId as SupportedChainId];
  const progress = (BigInt(campaign.totalClaimed) * 100n) / BigInt(campaign.totalBudget);
  const isExpired = campaign.expiresAt <= Math.floor(Date.now() / 1000);
  const isEmpty = BigInt(campaign.remainingBudget) === 0n;
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back link */}
      <a 
        href="/" 
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white mb-6 text-sm"
      >
        ← Back to campaigns
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Campaign Info - Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div>
            {/* Campaign image */}
            <div className="aspect-video bg-dark-bg-secondary rounded-2xl mb-6 overflow-hidden">
              {campaign.imageUrl ? (
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-world-blue/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-world-blue">
                      {campaign.tokenSymbol?.[0] || '?'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Title and badges */}
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">{campaign.title}</h1>
              <span className="badge-chain">{chainConfig?.name || 'Unknown Chain'}</span>
              {campaign.isRecurring && (
                <span className="badge bg-purple-500/20 text-purple-400">Recurring</span>
              )}
            </div>

            {/* Description */}
            {campaign.description && (
              <p className="text-gray-400 mb-6">{campaign.description}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Orb Claim</div>
              <div className="text-xl font-bold">
                {formatTokenAmount(campaign.orbClaimAmount, campaign.tokenDecimals)}
              </div>
              <div className="text-sm text-gray-400">{campaign.tokenSymbol}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">NFC Claim</div>
              <div className="text-xl font-bold">
                {BigInt(campaign.nfcClaimAmount) > 0n 
                  ? formatTokenAmount(campaign.nfcClaimAmount, campaign.tokenDecimals)
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">{campaign.tokenSymbol}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Remaining</div>
              <div className="text-xl font-bold">
                {formatTokenAmount(campaign.remainingBudget, campaign.tokenDecimals)}
              </div>
              <div className="text-sm text-gray-400">{campaign.tokenSymbol}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Time Left</div>
              <div className="text-xl font-bold">
                {isExpired ? 'Expired' : formatTimeRemaining(campaign.expiresAt).split(' ')[0]}
              </div>
              <div className="text-sm text-gray-400">
                {isExpired ? '' : formatTimeRemaining(campaign.expiresAt).split(' ').slice(1).join(' ')}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Distribution Progress</span>
              <span className="font-medium">{Number(progress)}% claimed</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min(Number(progress), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                {formatTokenAmount(campaign.totalClaimed, campaign.tokenDecimals)} claimed
              </span>
              <span>
                {formatTokenAmount(campaign.totalBudget, campaign.tokenDecimals)} total
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card space-y-3">
            <h3 className="font-semibold mb-2">Campaign Details</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Token Contract</span>
              <a 
                href={`${chainConfig?.explorerUrl}/address/${campaign.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-world-blue hover:underline font-mono text-xs"
              >
                {campaign.token.slice(0, 6)}...{campaign.token.slice(-4)}
              </a>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Creator</span>
              <a 
                href={`${chainConfig?.explorerUrl}/address/${campaign.creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-world-blue hover:underline font-mono text-xs"
              >
                {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
              </a>
            </div>
            {campaign.isRecurring && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Claim Interval</span>
                <span>Every {Math.floor(campaign.claimInterval / 86400)} days</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Expires</span>
              <span>{new Date(campaign.expiresAt * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Claim Flow - Right Column */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-8">
            {isExpired ? (
              <div className="card text-center py-8">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Campaign Expired</h3>
                <p className="text-gray-400">
                  This campaign has ended and is no longer accepting claims.
                </p>
              </div>
            ) : isEmpty ? (
              <div className="card text-center py-8">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fully Claimed</h3>
                <p className="text-gray-400">
                  All tokens from this campaign have been claimed.
                </p>
              </div>
            ) : !appId ? (
              <div className="card text-center py-8">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Configuration Required</h3>
                <p className="text-gray-400">
                  World ID App ID not configured.
                </p>
              </div>
            ) : (
              <ClaimFlow campaign={campaign} appId={appId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
