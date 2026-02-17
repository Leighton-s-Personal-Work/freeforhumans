'use client';

import { useState, useCallback } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { type SerializedCampaign } from '@/lib/contracts';
import { formatUnits } from 'viem';

type ClaimStep = 'select-level' | 'verify' | 'enter-recipient' | 'submitting' | 'success' | 'error';

interface ClaimFlowProps {
  campaign: SerializedCampaign;
  appId: string;
}

interface ClaimResult {
  transactionHash: string;
  explorerUrl: string;
}

function formatTokenAmount(amount: string, decimals: number = 18): string {
  const formatted = formatUnits(BigInt(amount), decimals);
  const num = parseFloat(formatted);
  if (num >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

export function ClaimFlow({ campaign, appId }: ClaimFlowProps) {
  const [step, setStep] = useState<ClaimStep>('select-level');
  const [verificationLevel, setVerificationLevel] = useState<'orb' | 'device' | null>(null);
  const [proofData, setProofData] = useState<ISuccessResult | null>(null);
  const [recipient, setRecipient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimAmount = verificationLevel === 'orb' 
    ? campaign.orbClaimAmount 
    : campaign.nfcClaimAmount;

  const handleSelectLevel = (level: 'orb' | 'device') => {
    setVerificationLevel(level);
    setStep('verify');
  };

  const handleVerificationSuccess = useCallback((result: ISuccessResult) => {
    setProofData(result);
    setStep('enter-recipient');
  }, []);

  const handleSubmitClaim = async () => {
    if (!proofData || !recipient || !verificationLevel) return;

    setIsSubmitting(true);
    setStep('submitting');
    setError(null);

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: parseInt(campaign.id),
          chainId: campaign.chainId,
          recipient: recipient,
          merkle_root: proofData.merkle_root,
          nullifier_hash: proofData.nullifier_hash,
          proof: proofData.proof,
          verification_level: verificationLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit claim');
      }

      setResult({
        transactionHash: data.transactionHash,
        explorerUrl: data.explorerUrl,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('select-level');
    setVerificationLevel(null);
    setProofData(null);
    setRecipient('');
    setResult(null);
    setError(null);
  };

  // Check if campaign supports the verification levels
  const supportsOrb = BigInt(campaign.orbClaimAmount) > 0n;
  const supportsNfc = BigInt(campaign.nfcClaimAmount) > 0n;

  return (
    <div className="card">
      {/* Step: Select Verification Level */}
      {step === 'select-level' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Claim Your Tokens</h3>
          <p className="text-gray-400 mb-6">
            Select your World ID verification level to claim tokens.
          </p>

          <div className="space-y-3">
            {supportsOrb && (
              <button
                onClick={() => handleSelectLevel('orb')}
                className="w-full p-4 rounded-xl border border-dark-border hover:border-world-blue bg-dark-bg-tertiary transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Orb Verified</span>
                      <span className="badge-orb text-xs">Highest Trust</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Verified with a World ID Orb
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-world-blue-light">
                      {formatTokenAmount(campaign.orbClaimAmount, campaign.tokenDecimals)}
                    </div>
                    <div className="text-sm text-gray-500">{campaign.tokenSymbol}</div>
                  </div>
                </div>
              </button>
            )}

            {supportsNfc && (
              <button
                onClick={() => handleSelectLevel('device')}
                className="w-full p-4 rounded-xl border border-dark-border hover:border-emerald-500 bg-dark-bg-tertiary transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Passport Verified</span>
                      <span className="badge-nfc text-xs">NFC</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Verified with NFC passport
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-400">
                      {formatTokenAmount(campaign.nfcClaimAmount, campaign.tokenDecimals)}
                    </div>
                    <div className="text-sm text-gray-500">{campaign.tokenSymbol}</div>
                  </div>
                </div>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Don&apos;t have World ID?{' '}
            <a href="/get-verified" className="text-world-blue hover:underline">
              Get verified
            </a>
          </p>
        </div>
      )}

      {/* Step: Verify with World ID */}
      {step === 'verify' && verificationLevel && (
        <div>
          <button
            onClick={() => setStep('select-level')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 text-sm"
          >
            ← Back
          </button>

          <h3 className="text-xl font-semibold mb-4">Verify with World ID</h3>
          <p className="text-gray-400 mb-6">
            Scan the QR code with your World App to verify your humanity.
          </p>

          <div className="flex justify-center">
            <IDKitWidget
              app_id={appId as `app_${string}`}
              action={`claim_campaign_${campaign.id}`}
              signal={recipient || '0x0000000000000000000000000000000000000000'}
              verification_level={
                verificationLevel === 'orb' 
                  ? VerificationLevel.Orb 
                  : VerificationLevel.Device
              }
              onSuccess={handleVerificationSuccess}
            >
              {({ open }) => (
                <button
                  onClick={open}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                  Verify with World ID
                </button>
              )}
            </IDKitWidget>
          </div>

          <div className="mt-6 p-4 bg-dark-bg rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">You will receive:</span>
              <span className="font-semibold">
                {formatTokenAmount(claimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step: Enter Recipient */}
      {step === 'enter-recipient' && (
        <div>
          <button
            onClick={() => setStep('verify')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 text-sm"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-500 font-medium">Verified!</span>
          </div>

          <h3 className="text-xl font-semibold mb-4">Where should we send your tokens?</h3>
          <p className="text-gray-400 mb-6">
            Enter your World ID username or wallet address.
          </p>

          <div className="space-y-4">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="@username or 0x..."
              className="input"
              autoFocus
            />

            <button
              onClick={handleSubmitClaim}
              disabled={!recipient.trim()}
              className="btn-primary w-full"
            >
              Claim {formatTokenAmount(claimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            World ID usernames are resolved via ENS. You can also enter any Ethereum address.
          </p>
        </div>
      )}

      {/* Step: Submitting */}
      {step === 'submitting' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-world-blue border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Submitting Claim</h3>
          <p className="text-gray-400">
            Please wait while we process your claim...
          </p>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && result && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Claim Successful!</h3>
          <p className="text-gray-400 mb-6">
            {formatTokenAmount(claimAmount, campaign.tokenDecimals)} {campaign.tokenSymbol} has been sent to your wallet.
          </p>

          <div className="space-y-3">
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              View Transaction
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {campaign.isRecurring && (
              <p className="text-sm text-gray-500">
                This is a recurring campaign. You can claim again in{' '}
                {Math.floor(campaign.claimInterval / 86400)} days.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Claim Failed</h3>
          <p className="text-red-400 mb-6">{error}</p>

          <button onClick={handleReset} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
