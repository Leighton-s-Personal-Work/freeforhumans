'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { FREE_FOR_HUMANS_ABI, ERC20_ABI } from '@/lib/contracts';
import { CHAIN_CONFIG, type SupportedChainId } from '@/lib/chains';

// Common tokens per chain
const COMMON_TOKENS: Record<SupportedChainId, { address: `0x${string}`; symbol: string; decimals: number }[]> = {
  480: [
    // World Chain tokens - update with actual addresses
  ],
  8453: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
  ],
};

type FormStep = 'connect' | 'not-whitelisted' | 'form' | 'approving' | 'creating' | 'success';

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [step, setStep] = useState<FormStep>('connect');
  const [selectedChain, setSelectedChain] = useState<SupportedChainId>(480);
  
  // Form state
  const [tokenAddress, setTokenAddress] = useState('');
  const [orbClaimAmount, setOrbClaimAmount] = useState('');
  const [nfcClaimAmount, setNfcClaimAmount] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [isRecurring, setIsRecurring] = useState(false);
  const [claimIntervalDays, setClaimIntervalDays] = useState('7');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Transaction state
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>();
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Cancel campaign state
  const [cancelCampaignId, setCancelCampaignId] = useState('');
  const [cancelTxHash, setCancelTxHash] = useState<`0x${string}` | undefined>();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const chainConfig = CHAIN_CONFIG[selectedChain];

  // Check if user is whitelisted
  const { data: isWhitelisted } = useReadContract({
    address: chainConfig?.contractAddress,
    abi: [
      {
        inputs: [{ name: '', type: 'address' }],
        name: 'whitelistedCreators',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'whitelistedCreators',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!chainConfig?.contractAddress },
  });

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: tokenAddress.length === 42 },
  });

  // Get token symbol
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: tokenAddress.length === 42 },
  });

  // Get current allowance
  const { data: currentAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && chainConfig ? [address, chainConfig.contractAddress] : undefined,
    query: { enabled: !!address && tokenAddress.length === 42 && !!chainConfig?.contractAddress },
  });

  // Write contracts
  const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { writeContract: writeCreate, isPending: isCreating } = useWriteContract();
  const { writeContract: writeCancel, isPending: isCancelling } = useWriteContract();

  // Wait for transactions
  const { isSuccess: approvalSuccess, isLoading: isApprovalLoading } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });
  const { isSuccess: createSuccess, isLoading: isCreateLoading } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  // Track if we've already triggered create after approval
  const [hasTriggeredCreate, setHasTriggeredCreate] = useState(false);

  // Update step based on transaction states
  useEffect(() => {
    if (!isConnected) {
      setStep('connect');
    } else if (isWhitelisted === false) {
      setStep('not-whitelisted');
    } else if (isWhitelisted === true) {
      if (createSuccess) {
        setStep('success');
      } else if (createTxHash && (isCreating || isCreateLoading)) {
        setStep('creating');
      } else if (approvalTxHash && !approvalSuccess && (isApproving || isApprovalLoading)) {
        setStep('approving');
      } else if (!createTxHash && !approvalTxHash) {
        setStep('form');
      }
    }
  }, [isConnected, isWhitelisted, isApproving, isCreating, approvalTxHash, createTxHash, approvalSuccess, createSuccess, isApprovalLoading, isCreateLoading]);

  // After approval succeeds, proceed to create
  useEffect(() => {
    if (approvalSuccess && !hasTriggeredCreate && !createTxHash) {
      setHasTriggeredCreate(true);
      handleCreateCampaign();
    }
  }, [approvalSuccess, hasTriggeredCreate, createTxHash]);

  const decimals = tokenDecimals ?? 18;

  const handleApproveAndCreate = async () => {
    if (!address || !tokenAddress || !chainConfig) return;
    setError(null);

    try {
      const budgetInWei = parseUnits(totalBudget, decimals);
      
      // Check if we need approval
      const needsApproval = !currentAllowance || currentAllowance < budgetInWei;

      if (needsApproval) {
        writeApprove({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [chainConfig.contractAddress, budgetInWei],
        }, {
          onSuccess: (hash) => {
            setApprovalTxHash(hash);
            setStep('approving');
          },
          onError: (err) => {
            setError(err.message);
          },
        });
      } else {
        // Already approved, create directly
        handleCreateCampaign();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleCreateCampaign = async () => {
    if (!address || !tokenAddress || !chainConfig) return;
    setError(null);

    try {
      const budgetInWei = parseUnits(totalBudget, decimals);
      const orbAmountWei = parseUnits(orbClaimAmount || '0', decimals);
      const nfcAmountWei = parseUnits(nfcClaimAmount || '0', decimals);
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + parseInt(expiryDays) * 86400);
      const claimInterval = isRecurring ? BigInt(parseInt(claimIntervalDays) * 86400) : 0n;

      writeCreate({
        address: chainConfig.contractAddress,
        abi: FREE_FOR_HUMANS_ABI,
        functionName: 'createCampaign',
        args: [
          tokenAddress as `0x${string}`,
          orbAmountWei,
          nfcAmountWei,
          budgetInWei,
          expiresAt,
          isRecurring,
          claimInterval,
          title,
          description,
          imageUrl,
        ],
      }, {
        onSuccess: (hash) => {
          setCreateTxHash(hash);
          setStep('creating');
        },
        onError: (err) => {
          setError(err.message);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  };

  const handleCancelCampaign = () => {
    if (!chainConfig || !cancelCampaignId) return;
    setCancelError(null);
    setCancelTxHash(undefined);

    writeCancel({
      address: chainConfig.contractAddress,
      abi: FREE_FOR_HUMANS_ABI,
      functionName: 'cancelCampaign',
      args: [BigInt(cancelCampaignId)],
    }, {
      onSuccess: (hash) => {
        setCancelTxHash(hash);
      },
      onError: (err) => {
        setCancelError(err.message);
      },
    });
  };

  const handleSwitchChain = (newChainId: SupportedChainId) => {
    setSelectedChain(newChainId);
    if (chainId !== newChainId) {
      switchChain({ chainId: newChainId });
    }
  };

  const isFormValid = 
    tokenAddress.length === 42 &&
    (parseFloat(orbClaimAmount) > 0 || parseFloat(nfcClaimAmount) > 0) &&
    parseFloat(totalBudget) > 0 &&
    parseInt(expiryDays) > 0 &&
    title.trim().length > 0 &&
    (!isRecurring || parseInt(claimIntervalDays) > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-2">Create Campaign</h1>
      <p className="text-gray-400 mb-8">
        Distribute tokens to verified humans on World Chain or Base.
      </p>

      {/* Connect Wallet */}
      {step === 'connect' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-world-blue/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-world-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to create a campaign.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Not Whitelisted */}
      {step === 'not-whitelisted' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Not Whitelisted</h2>
          <p className="text-gray-400 mb-6">
            Your wallet is not whitelisted to create campaigns.
            Contact us to get approved.
          </p>
          <div className="space-y-3">
            <a href="/offer" className="btn-primary inline-block">
              Request Access
            </a>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Form */}
      {step === 'form' && (
        <div className="space-y-6">
          {/* Connected wallet info */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Connected Wallet</span>
            <ConnectButton />
          </div>

          {/* Chain Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Chain</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSwitchChain(480)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedChain === 480
                    ? 'border-world-blue bg-world-blue/10'
                    : 'border-dark-border hover:border-dark-border-light'
                }`}
              >
                <div className="font-medium">World Chain</div>
                <div className="text-sm text-gray-400">Chain ID: 480</div>
              </button>
              <button
                onClick={() => handleSwitchChain(8453)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedChain === 8453
                    ? 'border-world-blue bg-world-blue/10'
                    : 'border-dark-border hover:border-dark-border-light'
                }`}
              >
                <div className="font-medium">Base</div>
                <div className="text-sm text-gray-400">Chain ID: 8453</div>
              </button>
            </div>
          </div>

          {/* Token Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Token Address</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="input font-mono"
            />
            {tokenSymbol && (
              <p className="text-sm text-green-500 mt-1">
                Token: {tokenSymbol}
              </p>
            )}
            {COMMON_TOKENS[selectedChain]?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {COMMON_TOKENS[selectedChain].map((token) => (
                  <button
                    key={token.address}
                    onClick={() => setTokenAddress(token.address)}
                    className="text-xs px-2 py-1 rounded bg-dark-bg-tertiary hover:bg-dark-border transition-colors"
                  >
                    {token.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Claim Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Orb Claim Amount
                <span className="badge-orb text-xs ml-2">Required</span>
              </label>
              <input
                type="number"
                value={orbClaimAmount}
                onChange={(e) => setOrbClaimAmount(e.target.value)}
                placeholder="100"
                min="0"
                step="any"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                NFC Claim Amount
                <span className="text-xs text-gray-500 ml-2">Optional</span>
              </label>
              <input
                type="number"
                value={nfcClaimAmount}
                onChange={(e) => setNfcClaimAmount(e.target.value)}
                placeholder="50"
                min="0"
                step="any"
                className="input"
              />
            </div>
          </div>

          {/* Total Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">Total Budget</label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="10000"
              min="0"
              step="any"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total tokens to deposit for distribution
            </p>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Duration (days)</label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="30"
              min="1"
              className="input"
            />
          </div>

          {/* Recurring */}
          <div className="p-4 rounded-xl border border-dark-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-dark-border bg-dark-bg-tertiary"
              />
              <div>
                <div className="font-medium">Recurring Claims</div>
                <div className="text-sm text-gray-400">
                  Allow users to claim multiple times
                </div>
              </div>
            </label>
            
            {isRecurring && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Claim Interval (days)
                </label>
                <input
                  type="number"
                  value={claimIntervalDays}
                  onChange={(e) => setClaimIntervalDays(e.target.value)}
                  placeholder="7"
                  min="1"
                  className="input"
                />
              </div>
            )}
          </div>

          {/* Campaign Details */}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Token Giveaway"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign..."
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL
              <span className="text-xs text-gray-500 ml-2">Optional</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleApproveAndCreate}
            disabled={!isFormValid || isApproving || isCreating}
            className="btn-primary w-full"
          >
            {chainId !== selectedChain
              ? `Switch to ${CHAIN_CONFIG[selectedChain]?.name}`
              : 'Create Campaign'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            This will require two transactions: one to approve the token transfer,
            and one to create the campaign.
          </p>
        </div>
      )}

      {/* Approving */}
      {step === 'approving' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-world-blue border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Approving Token</h2>
          <p className="text-gray-400 mb-4">
            Please confirm the approval transaction in your wallet...
          </p>
          {approvalTxHash && (
            <a
              href={`${chainConfig?.explorerUrl}/tx/${approvalTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-world-blue hover:underline text-sm"
            >
              View transaction →
            </a>
          )}
        </div>
      )}

      {/* Creating */}
      {step === 'creating' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-world-blue border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Creating Campaign</h2>
          <p className="text-gray-400 mb-4">
            Please confirm the campaign creation transaction...
          </p>
          {createTxHash && (
            <a
              href={`${chainConfig?.explorerUrl}/tx/${createTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-world-blue hover:underline text-sm"
            >
              View transaction →
            </a>
          )}
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Campaign Created!</h2>
          <p className="text-gray-400 mb-6">
            Your campaign is now live and verified humans can start claiming.
          </p>
          <div className="space-y-3">
            {createTxHash && (
              <a
                href={`${chainConfig?.explorerUrl}/tx/${createTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              >
                View Transaction
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <a href="/" className="btn-primary w-full inline-block">
              View All Campaigns
            </a>
          </div>
        </div>
      )}

      {/* ======== RECALL / CANCEL CAMPAIGN ======== */}
      {isConnected && isWhitelisted && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Recall Campaign</h2>
          <p className="text-gray-400 text-sm mb-4">
            Cancel an active campaign and return remaining tokens to your wallet.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              value={cancelCampaignId}
              onChange={(e) => setCancelCampaignId(e.target.value)}
              placeholder="Campaign ID"
              min="0"
              className="input flex-1"
            />
            <button
              onClick={handleCancelCampaign}
              disabled={!cancelCampaignId || isCancelling}
              className="px-6 py-3 rounded-xl bg-red-500/10 text-red-600 font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Cancelling...' : 'Recall'}
            </button>
          </div>
          {cancelError && (
            <p className="text-red-500 text-sm mt-2">{cancelError}</p>
          )}
          {cancelTxHash && (
            <p className="text-sm mt-2">
              <a
                href={`${chainConfig?.explorerUrl}/tx/${cancelTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-world-blue hover:underline"
              >
                Transaction submitted — view on explorer →
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
