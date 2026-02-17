export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About FreeForHumans</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          A marketplace where verified humans can claim free tokens.
          No bots. No multi-accounting. Just humans.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-16">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-300 mb-4">
            The crypto space has a sybil problem. Airdrops and token distributions
            are often farmed by bots and multi-wallet operators, leaving genuine
            users with nothing.
          </p>
          <p className="text-gray-400">
            FreeForHumans changes this. By requiring World ID verification, we ensure
            that each person can only claim once per campaign. This creates fair
            distributions where real humans—not sophisticated farmers—receive tokens.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="space-y-4">
          <div className="card flex gap-4">
            <div className="w-10 h-10 bg-world-blue rounded-full flex-shrink-0 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Verify Your Humanity</h3>
              <p className="text-gray-400 text-sm">
                Use World ID to prove you&apos;re a unique human. This can be done
                with an Orb scan or NFC passport verification.
              </p>
            </div>
          </div>
          <div className="card flex gap-4">
            <div className="w-10 h-10 bg-world-blue rounded-full flex-shrink-0 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Browse Campaigns</h3>
              <p className="text-gray-400 text-sm">
                Explore active token distributions from projects and individuals.
                See claim amounts, eligibility requirements, and campaign details.
              </p>
            </div>
          </div>
          <div className="card flex gap-4">
            <div className="w-10 h-10 bg-world-blue rounded-full flex-shrink-0 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Claim Tokens</h3>
              <p className="text-gray-400 text-sm">
                Verify with World ID and receive tokens directly to your wallet.
                Gas fees are sponsored—it&apos;s completely free for claimers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">The Technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">World ID</h3>
            <p className="text-gray-400 text-sm">
              Privacy-preserving proof of personhood using zero-knowledge proofs.
              Your identity stays private while proving you&apos;re human.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Smart Contracts</h3>
            <p className="text-gray-400 text-sm">
              Auditable, transparent token distribution via smart contracts
              on World Chain and Base.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Gas Sponsorship</h3>
            <p className="text-gray-400 text-sm">
              Relayer system covers gas fees for claims, making it completely
              free for users to receive tokens.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">ERC-20 Support</h3>
            <p className="text-gray-400 text-sm">
              Distribute any ERC-20 token. Set different amounts for
              Orb vs NFC verified users.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-2">Who can create campaigns?</h3>
            <p className="text-gray-400 text-sm">
              Anyone can apply to create campaigns, but creators must be whitelisted
              first. This ensures quality and prevents spam. Apply on our{' '}
              <a href="/offer" className="text-world-blue hover:underline">Offer page</a>.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Who can claim tokens?</h3>
            <p className="text-gray-400 text-sm">
              Anyone with a World ID can claim tokens. Orb-verified users typically
              receive higher amounts than NFC-verified users.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Is there a fee to claim?</h3>
            <p className="text-gray-400 text-sm">
              No, claiming is completely free. Gas fees are sponsored by the
              campaign creator through our relayer system.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Can I claim the same campaign multiple times?</h3>
            <p className="text-gray-400 text-sm">
              Each World ID can only claim once per campaign. However, if a campaign
              is recurring, you may be able to claim again in the next period.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Which chains are supported?</h3>
            <p className="text-gray-400 text-sm">
              Currently we support World Chain and Base. More chains may be added
              in the future.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Is my data private?</h3>
            <p className="text-gray-400 text-sm">
              Yes. World ID uses zero-knowledge proofs, which means we can verify
              you&apos;re human without learning your identity. Your biometric data
              is never stored.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">What happens to unclaimed tokens?</h3>
            <p className="text-gray-400 text-sm">
              Campaign creators can withdraw unclaimed tokens after the campaign
              expires.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="text-center">
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/" className="btn-primary">
            Browse Campaigns
          </a>
          <a href="/get-verified" className="btn-secondary">
            Get Verified
          </a>
          <a href="/offer" className="btn-secondary">
            Create a Campaign
          </a>
        </div>
      </section>
    </div>
  );
}
