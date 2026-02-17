'use client';

import { useState } from 'react';

export default function OfferPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: '',
    website: '',
    tokenAddress: '',
    chain: 'world-chain',
    description: '',
    budget: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // In production, this would send to an API endpoint
    // For now, we'll simulate a submission
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        project: '',
        website: '',
        tokenAddress: '',
        chain: 'world-chain',
        description: '',
        budget: '',
      });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-world-blue/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">Give Away Tokens to Humans</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Distribute your tokens to verified humans. Build community, reward early
          supporters, or run promotional campaigns—all with sybil resistance built in.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="card">
          <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Sybil Resistant</h3>
          <p className="text-gray-400 text-sm">
            World ID verification ensures each person can only claim once—no bots,
            no multiple wallets.
          </p>
        </div>
        <div className="card">
          <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Real Distribution</h3>
          <p className="text-gray-400 text-sm">
            Reach actual humans who can engage with your project—not bots farming
            airdrops.
          </p>
        </div>
        <div className="card">
          <div className="w-12 h-12 bg-world-blue/20 rounded-xl mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Gas-Sponsored</h3>
          <p className="text-gray-400 text-sm">
            We cover gas fees for claimers—zero friction for users to receive your
            tokens.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-world-blue rounded-full mx-auto mb-3 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-semibold mb-1 text-sm">Get Whitelisted</h3>
            <p className="text-gray-400 text-xs">
              Contact us to get your wallet approved
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-world-blue rounded-full mx-auto mb-3 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-semibold mb-1 text-sm">Create Campaign</h3>
            <p className="text-gray-400 text-xs">
              Set token, amounts, and duration
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-world-blue rounded-full mx-auto mb-3 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-semibold mb-1 text-sm">Fund Campaign</h3>
            <p className="text-gray-400 text-xs">
              Approve and deposit your tokens
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-world-blue rounded-full mx-auto mb-3 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-semibold mb-1 text-sm">Humans Claim</h3>
            <p className="text-gray-400 text-xs">
              Verified users claim your tokens
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section>
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Request Access</h2>
          <p className="text-gray-400 mb-6">
            Fill out the form below and we&apos;ll get back to you about creating
            a campaign.
          </p>

          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
              <p className="text-gray-400 mb-4">
                We&apos;ll review your request and get back to you soon.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn-secondary"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                    placeholder="My Token Project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                    placeholder="https://myproject.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Token Contract Address
                  </label>
                  <input
                    type="text"
                    value={formData.tokenAddress}
                    onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preferred Chain
                  </label>
                  <select
                    value={formData.chain}
                    onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                  >
                    <option value="world-chain">World Chain</option>
                    <option value="base">Base</option>
                    <option value="other">Other (specify in description)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Estimated Budget
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent"
                >
                  <option value="">Select a range</option>
                  <option value="<10k">Less than $10,000</option>
                  <option value="10k-50k">$10,000 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k+">$100,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tell us about your campaign <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-world-blue focus:border-transparent resize-none"
                  placeholder="What tokens are you distributing? How many humans do you want to reach? Any special requirements?"
                />
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Already Whitelisted */}
      <section className="mt-12 text-center">
        <p className="text-gray-400">
          Already whitelisted?{' '}
          <a href="/create" className="text-world-blue hover:underline">
            Create a campaign →
          </a>
        </p>
      </section>
    </div>
  );
}
