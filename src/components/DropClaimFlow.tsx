'use client';

import { useState, useCallback, useRef } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { type SerializedCampaign } from '@/lib/contracts';
import { formatUnits, isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';

type ClaimStep = 'input' | 'verifying' | 'submitting' | 'success' | 'already-claimed' | 'error';

interface DropClaimFlowProps {
  campaign: SerializedCampaign;
  appId: string;
}

interface ClaimResult {
  transactionHash: string;
  explorerUrl: string;
}

function formatClaimAmount(amount: string, decimals: number = 18): string {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(6);
}

// Gold coin SVG component
function GoldCoin({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg coin-glow">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-300/50">
          <span className="text-2xl font-bold text-yellow-900/80">Au</span>
        </div>
      </div>
    </div>
  );
}

// Particle effect for celebration
function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: -(Math.random() * 100 + 50),
    delay: Math.random() * 0.3,
    size: Math.random() * 6 + 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `hsl(${40 + Math.random() * 20}, ${80 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, 1.5, 0.5],
          }}
          transition={{
            duration: 1.2,
            delay: 0.4 + p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export function DropClaimFlow({ campaign, appId }: DropClaimFlowProps) {
  const [step, setStep] = useState<ClaimStep>('input');
  const [recipient, setRecipient] = useState('');
  const [resolvedRecipient, setResolvedRecipient] = useState<`0x${string}` | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track which verification level the user selected
  const [verificationLevel, setVerificationLevel] = useState<'orb' | 'device'>('orb');
  const selectedLevelRef = useRef<'orb' | 'device'>('orb');
  const claimAmount = verificationLevel === 'orb' ? campaign.orbClaimAmount : campaign.nfcClaimAmount;
  const hasPassport = BigInt(campaign.nfcClaimAmount) > 0n;

  const resolveAndOpenVerify = async () => {
    if (!recipient.trim()) return;

    setIsResolving(true);
    setError(null);

    try {
      if (isAddress(recipient)) {
        setResolvedRecipient(recipient as `0x${string}`);
        setIsResolving(false);
        return recipient as `0x${string}`;
      }

      const response = await fetch('/api/resolve-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: recipient }),
      });

      const data = await response.json();

      if (!response.ok || !data.address) {
        throw new Error(data.error || 'Could not resolve username');
      }

      setResolvedRecipient(data.address as `0x${string}`);
      setIsResolving(false);
      return data.address as `0x${string}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve address');
      setIsResolving(false);
      return null;
    }
  };

  const handleVerificationSuccess = useCallback(async (proof: ISuccessResult) => {
    const address = resolvedRecipient;
    if (!address) {
      setError('Missing recipient information');
      setStep('error');
      return;
    }

    setStep('submitting');
    setError(null);

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: parseInt(campaign.id),
          chainId: campaign.chainId,
          recipient: address,
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          proof: proof.proof,
          verification_level: selectedLevelRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Failed to submit claim';
        // Detect "already claimed" errors gracefully
        if (
          errorMsg.includes('already claimed') ||
          errorMsg.includes('AlreadyClaimed')
        ) {
          setStep('already-claimed');
          return;
        }
        throw new Error(errorMsg);
      }

      setResult({
        transactionHash: data.transactionHash,
        explorerUrl: data.explorerUrl,
      });
      setStep('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit claim';
      if (msg.includes('already claimed') || msg.includes('AlreadyClaimed')) {
        setStep('already-claimed');
        return;
      }
      setError(msg);
      setStep('error');
    }
  }, [resolvedRecipient, campaign]);

  const handleReset = () => {
    setStep('input');
    setRecipient('');
    setResolvedRecipient(null);
    setResult(null);
    setError(null);
  };

  const tweetText = encodeURIComponent(
    `I just claimed free gold on @FreeForHumans! 🪙\n\nProve you're human → get free stuff.\n\nhttps://freeforhumans.com`
  );

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* ---- INPUT STEP ---- */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter Your World App Username"
                  className="input text-center text-lg"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {resolvedRecipient ? (
                <>
                  <p className="text-sm text-gray-400 text-center">
                    Claiming as <span className="font-medium text-gray-600">{recipient}</span>
                  </p>

                  {/* Orb claim button */}
                  <IDKitWidget
                    app_id={appId as `app_${string}`}
                    action="claim"
                    signal={resolvedRecipient}
                    verification_level={VerificationLevel.Orb}
                    onSuccess={handleVerificationSuccess}
                  >
                    {({ open }) => (
                      <button
                        onClick={() => {
                          selectedLevelRef.current = 'orb';
                          setVerificationLevel('orb');
                          open();
                        }}
                        className="btn-primary w-full text-lg py-4"
                      >
                        Claim {formatClaimAmount(campaign.orbClaimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol} — Orb ✨
                      </button>
                    )}
                  </IDKitWidget>

                  {/* Passport claim button */}
                  {hasPassport && (
                    <IDKitWidget
                      app_id={appId as `app_${string}`}
                      action="claim"
                      signal={resolvedRecipient}
                      verification_level={VerificationLevel.Device}
                      onSuccess={handleVerificationSuccess}
                    >
                      {({ open }) => (
                        <button
                          onClick={() => {
                            selectedLevelRef.current = 'device';
                            setVerificationLevel('device');
                            open();
                          }}
                          className="w-full text-base py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:border-gray-300 hover:text-gray-800 transition-colors"
                        >
                          Claim {formatClaimAmount(campaign.nfcClaimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol} — Passport
                        </button>
                      )}
                    </IDKitWidget>
                  )}

                  <button
                    onClick={() => setResolvedRecipient(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto block"
                  >
                    Change username
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    await resolveAndOpenVerify();
                  }}
                  disabled={!recipient.trim() || isResolving}
                  className="btn-primary w-full text-lg py-4"
                >
                  {isResolving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resolving...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              )}

              <p className="text-sm text-gray-400 text-center mt-1">
                <a href="/get-verified" className="text-world-blue hover:underline font-medium">
                  Need to get verified?
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {/* ---- SUBMITTING STEP ---- */}
        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="w-14 h-14 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Sending your gold...</h3>
            <p className="text-gray-500 text-sm">
              Hang tight, this takes a few seconds.
            </p>
          </motion.div>
        )}

        {/* ---- SUCCESS STEP — THE CELEBRATION 🎉 ---- */}
        {step === 'success' && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 relative"
          >
            <Particles />

            <motion.div
              initial={{ y: -80, opacity: 0, rotate: 0 }}
              animate={{ y: 0, opacity: 1, rotate: 360 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="flex justify-center mb-5"
            >
              <GoldCoin />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-2xl font-bold mb-2">
                You just claimed free gold! 🪙
              </h3>
              <p className="text-gray-500 mb-6">
                {formatClaimAmount(claimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol} is on its way to you.
              </p>

              <div className="space-y-3">
                <a
                  href={`https://x.com/intent/tweet?text=${tweetText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  Share on X 🐦
                </a>

                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors block"
                >
                  View transaction →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ---- ALREADY CLAIMED — FRIENDLY MESSAGE ---- */}
        {step === 'already-claimed' && (
          <motion.div
            key="already-claimed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">🙌</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              You already claimed this one!
            </h3>
            <p className="text-gray-500 mb-1">
              One per human 😊
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Check back for the next drop.
            </p>
            <button onClick={handleReset} className="btn-secondary text-sm">
              Go back
            </button>
          </motion.div>
        )}

        {/* ---- ERROR STEP ---- */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button onClick={handleReset} className="btn-secondary text-sm">
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
