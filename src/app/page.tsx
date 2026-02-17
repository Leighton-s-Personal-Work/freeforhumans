import { SerializedCampaign } from '@/lib/contracts';
import { CHAIN_CONFIG, type SupportedChainId } from '@/lib/chains';
import { formatUnits } from 'viem';

// Fetch campaigns server-side
async function getCampaigns(): Promise<SerializedCampaign[]> {
  try {
    // In production, this would be the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.campaigns || [];
  } catch {
    return [];
  }
}

function formatTokenAmount(amount: string, decimals: number = 18): string {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else if (num >= 1) {
    return num.toFixed(2);
  } else {
    return num.toFixed(4);
  }
}

function formatTimeRemaining(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  
  if (days > 0) {
    return `${days}d ${hours}h left`;
  } else if (hours > 0) {
    return `${hours}h left`;
  } else {
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${minutes}m left`;
  }
}

function CampaignCard({ campaign }: { campaign: SerializedCampaign }) {
  const chainConfig = CHAIN_CONFIG[campaign.chainId as SupportedChainId];
  const progress = (BigInt(campaign.totalClaimed) * 100n) / BigInt(campaign.totalBudget);
  
  return (
    <a
      href={`/campaign/${campaign.chainId}-${campaign.id}`}
      className="card-hover block group"
    >
      {/* Campaign image or placeholder */}
      <div className="aspect-video bg-dark-bg-tertiary rounded-xl mb-4 overflow-hidden">
        {campaign.imageUrl ? (
          <img 
            src={campaign.imageUrl} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-world-blue/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-world-blue">
                {campaign.tokenSymbol?.[0] || '?'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Title and badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-lg group-hover:text-world-blue-light transition-colors">
          {campaign.title}
        </h3>
        <span className="badge-chain text-xs">
          {chainConfig?.name || 'Unknown'}
        </span>
      </div>

      {/* Token info */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-bold">
          {formatTokenAmount(campaign.orbClaimAmount, campaign.tokenDecimals)}
        </span>
        <span className="text-gray-400">{campaign.tokenSymbol}</span>
        <span className="badge-orb text-xs ml-auto">Orb</span>
      </div>

      {/* NFC amount if different */}
      {campaign.nfcClaimAmount !== campaign.orbClaimAmount && BigInt(campaign.nfcClaimAmount) > 0n && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
          <span>{formatTokenAmount(campaign.nfcClaimAmount, campaign.tokenDecimals)}</span>
          <span>{campaign.tokenSymbol}</span>
          <span className="badge-nfc text-xs ml-auto">NFC</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${Math.min(Number(progress), 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{formatTokenAmount(campaign.remainingBudget, campaign.tokenDecimals)} remaining</span>
          <span>{formatTimeRemaining(campaign.expiresAt)}</span>
        </div>
      </div>

      {/* Recurring badge */}
      {campaign.isRecurring && (
        <div className="text-xs text-gray-500">
          🔄 Recurring claim available
        </div>
      )}
    </a>
  );
}

export default async function HomePage() {
  const campaigns = await getCampaigns();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Free things for{' '}
          <span className="text-gradient">verified humans</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Claim free tokens from campaigns created by projects and individuals.
          All you need is World ID verification.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/get-verified" className="btn-primary">
            Get Verified
          </a>
          <a href="/offer" className="btn-secondary">
            Create a Campaign
          </a>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
        
        {campaigns.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-dark-bg-tertiary rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No active campaigns</h3>
            <p className="text-gray-500 mb-4">
              Be the first to create a campaign and give free things to verified humans.
            </p>
            <a href="/offer" className="btn-primary inline-block">
              Create a Campaign
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard 
                key={`${campaign.chainId}-${campaign.id}`} 
                campaign={campaign} 
              />
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-8 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-world-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-bold text-world-blue">1</span>
            </div>
            <h3 className="font-semibold mb-2">Get Verified</h3>
            <p className="text-gray-500 text-sm">
              Verify your humanity with World ID using Orb or NFC passport verification.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-world-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-bold text-world-blue">2</span>
            </div>
            <h3 className="font-semibold mb-2">Browse Campaigns</h3>
            <p className="text-gray-500 text-sm">
              Find campaigns offering free tokens you&apos;re interested in claiming.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-world-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-bold text-world-blue">3</span>
            </div>
            <h3 className="font-semibold mb-2">Claim for Free</h3>
            <p className="text-gray-500 text-sm">
              Verify with World ID and receive tokens directly to your wallet. No gas fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
