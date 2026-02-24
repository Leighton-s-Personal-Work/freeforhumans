import { SerializedCampaign } from '@/lib/contracts';
import { formatUnits } from 'viem';
import { DropClaimFlow } from '@/components/DropClaimFlow';
import { Countdown } from '@/components/Countdown';

// Fetch campaigns server-side
async function getCampaigns(): Promise<SerializedCampaign[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      next: { revalidate: 30 },
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
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(6);
}


function computeClaimsCount(campaign: SerializedCampaign): { claimed: number; total: number } {
  const orbAmt = BigInt(campaign.orbClaimAmount);
  if (orbAmt === 0n) return { claimed: 0, total: 0 };
  const claimed = Number(BigInt(campaign.totalClaimed) / orbAmt);
  const total = Number(BigInt(campaign.totalBudget) / orbAmt);
  return { claimed, total };
}

// Token icon that varies by symbol
function TokenIcon({ symbol }: { symbol?: string }) {
  const s = (symbol || '').toUpperCase();
  if (s === 'XAUT') {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center shadow">
        <span className="text-sm font-bold text-yellow-900/80">Au</span>
      </div>
    );
  }
  if (s === 'USDC') {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow">
        <span className="text-sm font-bold text-white">$</span>
      </div>
    );
  }
  if (s === 'ETH' || s === 'WETH') {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow">
        <span className="text-sm font-bold text-white">Ξ</span>
      </div>
    );
  }
  if (s === 'WLD') {
    return (
      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow">
        <span className="text-sm font-bold text-white">W</span>
      </div>
    );
  }
  // Default: first letter
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow">
      <span className="text-sm font-bold text-white">{s.charAt(0) || '?'}</span>
    </div>
  );
}

// Chain badge
function ChainBadge({ chainId }: { chainId: number }) {
  if (chainId === 480) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 text-gray-600">
        <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
        World Chain
      </span>
    );
  }
  if (chainId === 8453) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
        Base
      </span>
    );
  }
  return null;
}

// World Verified Human badge per World ID design guidelines
function VerifiedHumanBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-black text-white">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
      human
    </span>
  );
}

function DropCard({ campaign, appId }: { campaign: SerializedCampaign; appId: string }) {
  const isExpired = campaign.expiresAt <= Math.floor(Date.now() / 1000);
  const isEmpty = BigInt(campaign.remainingBudget) === 0n;
  const counts = computeClaimsCount(campaign);
  const progress = Number((BigInt(campaign.totalClaimed) * 100n) / BigInt(campaign.totalBudget));

  return (
    <div className="drop-card">
      {/* Chain badge */}
      <div className="flex justify-center mb-4">
        <ChainBadge chainId={campaign.chainId} />
      </div>

      {/* Token identity */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <TokenIcon symbol={campaign.tokenSymbol} />
        <div>
          <p className="font-semibold text-lg leading-tight">
            {campaign.title || campaign.tokenSymbol || 'Token Drop'}
          </p>
          <p className="text-sm text-gray-400">{campaign.tokenSymbol}</p>
        </div>
      </div>

      {/* Claim amount — big and clear */}
      <div className="text-center mb-8">
        <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gradient-gold mb-2">
          {formatTokenAmount(campaign.orbClaimAmount, campaign.tokenDecimals)}
        </p>
        <p className="text-gray-500 text-base">
          {campaign.tokenSymbol} per human
        </p>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="progress-bar mb-2">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 text-center">
          {counts.total > 0
            ? `${counts.claimed.toLocaleString()} / ${counts.total.toLocaleString()} humans claimed`
            : `${formatTokenAmount(campaign.remainingBudget, campaign.tokenDecimals)} remaining`}
        </p>
      </div>

      {/* Countdown — distinct element */}
      <div className="mb-8 rounded-xl bg-gray-50 border border-gray-100 py-3 px-4 text-center">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Time Remaining</p>
        <Countdown expiresAt={campaign.expiresAt} />
      </div>

      {/* Claim flow — inline */}
      {isExpired ? (
        <div className="text-center py-6">
          <p className="text-lg font-semibold mb-1">This drop has ended.</p>
          <p className="text-gray-400 text-sm">Check back for the next one.</p>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-6">
          <p className="text-lg font-semibold mb-1">
            This drop is gone! All claimed by real humans.
          </p>
          <p className="text-gray-400 text-sm">Stay tuned for the next drop.</p>
        </div>
      ) : appId ? (
        <DropClaimFlow campaign={campaign} appId={appId} />
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">Configuration required — World ID App ID not set.</p>
        </div>
      )}

      {/* Verification level note */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
        <VerifiedHumanBadge />
        <span>·</span>
        <span>Gas-free claim</span>
        <span>·</span>
        <span>One per human</span>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const campaigns = await getCampaigns();
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || '';

  // Filter to active campaigns
  const activeCampaigns = campaigns.filter(c => c.isActive);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ======== HERO ======== */}
      <section className="pt-16 sm:pt-24 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
          <span className="text-gradient-gold">Free for humans.</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto">
          No catch, claim things just by being a human (no clankers allowed!)
        </p>
      </section>

      {/* ======== DROP CARDS ======== */}
      {activeCampaigns.length > 0 ? (
        <section className="pb-12 space-y-8">
          {activeCampaigns.map((campaign) => (
            <DropCard key={campaign.id} campaign={campaign} appId={appId} />
          ))}
        </section>
      ) : (
        /* No campaigns — coming soon */
        <section className="pb-20">
          <div className="drop-card text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">First drop coming soon</h3>
            <p className="text-gray-500">
              Get verified now so you&apos;re ready when the first drop goes live.
            </p>
            <a href="/get-verified" className="btn-primary mt-6 inline-block">
              Get Verified
            </a>
          </div>
        </section>
      )}

      {/* ======== GET VERIFIED CTA ======== */}
      <section className="pb-10 text-center">
        <a
          href="/get-verified"
          className="inline-block text-sm py-2.5 px-6 rounded-xl border border-gray-200 text-gray-500 font-medium hover:border-gray-300 hover:text-gray-700 transition-colors"
        >
          Don&apos;t have the World App?
        </a>
      </section>

      {/* ======== COMING NEXT TEASER ======== */}
      <section className="pb-12">
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 sm:p-10 text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
            Coming Next
          </p>
          <p className="text-2xl sm:text-3xl font-bold mb-2">
            Something worth ???
          </p>
          <p className="text-gray-400">
            Next drop coming soon — stay tuned.
          </p>
        </div>
      </section>

      {/* ======== CREATE CAMPAIGN LINK ======== */}
      <section className="pb-20 text-center">
        <a
          href="/create"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Want to give something away? →{' '}
          <span className="underline">Create a campaign</span>
        </a>
      </section>

    </div>
  );
}
