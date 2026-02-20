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

export default async function HomePage() {
  const campaigns = await getCampaigns();
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || '';

  // The "current drop" is the first active campaign
  const currentDrop = campaigns.length > 0 ? campaigns[0] : null;
  const isExpired = currentDrop ? currentDrop.expiresAt <= Math.floor(Date.now() / 1000) : false;
  const isEmpty = currentDrop ? BigInt(currentDrop.remainingBudget) === 0n : false;
  const counts = currentDrop ? computeClaimsCount(currentDrop) : null;
  const progress = currentDrop
    ? Number((BigInt(currentDrop.totalClaimed) * 100n) / BigInt(currentDrop.totalBudget))
    : 0;

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

      {/* ======== THE DROP CARD ======== */}
      {currentDrop ? (
        <section className="pb-20">
          <div className="drop-card">
            {/* Token identity */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center text-2xl">
                🪨
              </div>
              <div>
                <p className="font-semibold text-lg leading-tight">
                  Tether Gold ({currentDrop.tokenSymbol || 'XAUT'})
                </p>
                <p className="text-sm text-gray-400">{currentDrop.title}</p>
              </div>
            </div>

            {/* Claim amount — big and clear */}
            <div className="text-center mb-8">
              <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gradient-gold mb-2">
                {formatTokenAmount(currentDrop.orbClaimAmount, currentDrop.tokenDecimals)}
              </p>
              <p className="text-gray-500 text-base">
                troy ounces of gold per human
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
                {counts
                  ? `${counts.claimed.toLocaleString()} / ${counts.total.toLocaleString()} humans claimed`
                  : `${formatTokenAmount(currentDrop.remainingBudget, currentDrop.tokenDecimals)} remaining`}
              </p>
            </div>

            {/* Countdown — distinct element */}
            <div className="mb-8 rounded-xl bg-gray-50 border border-gray-100 py-3 px-4 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Time Remaining</p>
              <Countdown expiresAt={currentDrop.expiresAt} />
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
              <DropClaimFlow campaign={currentDrop} appId={appId} />
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Configuration required — World ID App ID not set.</p>
              </div>
            )}

            {/* Verification level note */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-world-blue" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Verified with World ID
              </span>
              <span>·</span>
              <span>Gas-free claim</span>
              <span>·</span>
              <span>One per human</span>
            </div>
          </div>
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
