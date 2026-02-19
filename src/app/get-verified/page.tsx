export default function GetVerifiedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-world-blue/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">Claim your humanity</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Prove you&apos;re a unique human to unlock access.
        </p>
      </div>

      {/* What is World ID */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4 text-center">What is World ID?</h2>
        <div className="card">
          <p className="text-gray-600 mb-4">
            World ID is a privacy-preserving proof of personhood protocol. It lets you prove
            you&apos;re a unique human without revealing your identity. This prevents bots and
            fake accounts from claiming tokens meant for real people.
          </p>
          <p className="text-gray-500 text-sm">
            Your World ID doesn&apos;t share any personal information—it only proves you&apos;re
            human and haven&apos;t already claimed from a specific campaign.
          </p>
        </div>
      </section>

      {/* Why Verify */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4 text-center">Why Get Verified?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Claim Free</h3>
            <p className="text-gray-500 text-sm">
              Access exclusive token distributions from projects and individuals.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Higher Claim Amounts</h3>
            <p className="text-gray-500 text-sm">
              Orb-verified users often receive higher claim amounts than NFC-verified users.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Privacy Preserved</h3>
            <p className="text-gray-500 text-sm">
              Zero-knowledge proofs mean your identity stays private.
            </p>
          </div>
        </div>
      </section>

      {/* Two Ways to Verify */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Two Ways to Verify</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orb Verification */}
          <div className="card border-world-blue/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-world-blue rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Orb Verification</h3>
                <span className="badge-orb text-xs">Highest Trust Level</span>
              </div>
            </div>
            
            <p className="text-gray-500 mb-4">
              The gold standard of verification. Visit a World ID Orb location for
              a quick, privacy-preserving biometric scan.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Highest claim amounts</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Takes about 30 seconds</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Completely free</span>
              </div>
            </div>

            <a
              href="https://world.org/find-orb"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center inline-block"
            >
              Find an Orb Near You →
            </a>
          </div>

          {/* NFC/Passport Verification */}
          <div className="card border-emerald-500/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Passport Verification</h3>
                <span className="badge-nfc text-xs">NFC</span>
              </div>
            </div>
            
            <p className="text-gray-500 mb-4">
              Verify from home using your NFC-enabled passport and the World App.
              No need to visit an Orb location.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Verify from anywhere</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Uses your phone&apos;s NFC</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Done in minutes</span>
              </div>
            </div>

            <a
              href="https://world.org/download"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full text-center inline-block"
            >
              Download World App →
            </a>
          </div>
        </div>
      </section>

      {/* Download World App */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4 text-center">Get the World App</h2>
        <div className="card">
          <p className="text-gray-600 mb-6">
            The World App is your gateway to World ID. Download it to get verified
            and manage your digital identity.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://apps.apple.com/app/world-app-worldcoin-wallet/id1560859847"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.worldcoin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-2">Is my data safe?</h3>
            <p className="text-gray-500 text-sm">
              Yes. World ID uses zero-knowledge proofs, which means it can verify
              you&apos;re human without storing or sharing any personal data. Your
              biometric data is not stored anywhere.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">What does verification prove?</h3>
            <p className="text-gray-500 text-sm">
              It proves two things: (1) you&apos;re a unique human, and (2) you
              haven&apos;t already claimed from a specific campaign. It does not
              reveal your identity.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Can I verify with both Orb and NFC?</h3>
            <p className="text-gray-500 text-sm">
              Yes! You can have both verification levels. Orb verification provides
              the highest trust level and typically unlocks higher claim amounts.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Is verification free?</h3>
            <p className="text-gray-500 text-sm">
              Yes, both Orb and NFC/Passport verification are completely free.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <a href="/" className="btn-primary inline-block">
          Claim free stuff →
        </a>
      </section>
    </div>
  );
}
