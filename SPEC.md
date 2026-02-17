# FreeForHumans.com — Project Brief & Technical Specification

## 1. Product Overview

**Domain:** freeforhumans.com
**Tagline:** A marketplace where verified humans claim free things and people/companies offer free things to verified humans.
**Core idea:** Leveraging World ID's proof-of-personhood to create a trustless, sybil-resistant platform for distributing ERC-20 tokens (and eventually other assets) for free to unique, verified humans.

### 1.1 V1 Scope

- **Claiming:** Verified humans browse active "campaigns" and claim free ERC-20 tokens on World Chain or Base
- **Verification:** Supports both Orb-verified and NFC/Passport-verified World ID holders, with different claim amounts per level
- **Offering:** Whitelisted campaign creators can deposit tokens and configure distribution campaigns via a self-serve UI
- **Education:** A page guiding unverified users on how to get verified with World ID

---

## 2. Architecture Overview

### 2.1 High-Level Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14+ (App Router) | Deployed on Vercel |
| Styling | Tailwind CSS | Dark theme, World-inspired branding |
| Wallet Connection (Campaign Creators) | RainbowKit + wagmi + viem | For campaign creation/funding only |
| Human Verification | @worldcoin/idkit (React SDK) | IDKit widget for proof generation |
| Smart Contracts | Solidity (Foundry) | Deployed on World Chain + Base |
| Backend / Relayer | Next.js API Routes (Vercel) | Submits claim transactions on behalf of users, pays gas |
| On-chain Verification | World ID Router contract | For both Orb (group 1) and NFC (group 2) claims |
| ENS Resolution | viem ENS utilities | Resolve `name.world.id` usernames to addresses |

### 2.2 Why a Relayer is Needed

Users claiming tokens do NOT connect a wallet. They verify via World ID (scanning a QR code with World App), then enter their World ID username or wallet address. Since they aren't signing transactions, a backend relayer must:

1. Receive the proof + recipient address + groupId from the frontend
2. Submit the proof to the smart contract's `claim()` function (proof is verified on-chain for both Orb and NFC)
3. Pay gas fees from a funded relayer wallet
4. Return the transaction hash to the frontend

The relayer has no special trust privileges — it simply acts as a gas station. All proof verification is handled trustlessly by the smart contract via the World ID Router.

### 2.3 On-Chain Verification for Both Orb and NFC

Both verification levels are supported on-chain via the World ID Router:

| Verification Level | Group ID | Trust Model |
|---|---|---|
| Orb | `1` | Trustless — contract verifies ZK proof on-chain |
| NFC/Passport | `2` | Trustless — contract verifies ZK proof on-chain |

This means **all claims are trustlessly verified on-chain**. The relayer's only job is to submit transactions and pay gas on behalf of users — it has no privileged trust role. This is a much cleaner architecture.

---

## 3. Smart Contract Design

### 3.1 Contract: `FreeForHumans.sol`

Deploy one instance per chain (World Chain and Base).

### 3.2 Campaign Data Structure

```solidity
struct Campaign {
    uint256 id;
    address creator;             // Campaign creator's address
    address token;               // ERC-20 token address
    uint256 chainId;             // Which chain this campaign lives on
    uint256 orbClaimAmount;      // Amount per claim for Orb-verified humans
    uint256 nfcClaimAmount;      // Amount per claim for NFC-verified humans
    uint256 totalBudget;         // Total tokens deposited
    uint256 totalClaimed;        // Total tokens claimed so far
    uint256 expiresAt;           // Unix timestamp when campaign expires
    bool isRecurring;            // Can humans claim more than once?
    uint256 claimInterval;       // If recurring, minimum seconds between claims (0 if one-time)
    bool isActive;               // Can be set to false to cancel
    string title;                // Campaign display name
    string description;          // Campaign description
    string imageUrl;             // Campaign image/logo URL
}
```

### 3.3 Claim Tracking

```solidity
// For one-time claims: nullifierHash => campaignId => bool
mapping(uint256 => mapping(uint256 => bool)) public hasClaimed;

// For recurring claims: nullifierHash => campaignId => lastClaimTimestamp
mapping(uint256 => mapping(uint256 => uint256)) public lastClaimTime;
```

**Important:** The nullifier hash is unique per (user, app_id, action). Each campaign should use a unique action ID so that nullifier hashes are campaign-specific. This means:
- For on-chain Orb verification (group 1): each campaign needs its own `externalNullifier` derived from the app_id + a campaign-specific action string
- For on-chain NFC verification (group 2): same approach — each campaign needs its own `externalNullifier`, and nullifier hashes are tracked per campaign per groupId in the contract

### 3.4 Key Functions

```solidity
// === Campaign Management ===

// Create a new campaign (only whitelisted creators)
function createCampaign(
    address token,
    uint256 orbClaimAmount,
    uint256 nfcClaimAmount,
    uint256 totalBudget,
    uint256 expiresAt,
    bool isRecurring,
    uint256 claimInterval,
    string calldata title,
    string calldata description,
    string calldata imageUrl
) external returns (uint256 campaignId);
// Creator must have approved token transfer before calling
// Transfers totalBudget of token from creator to contract

// Cancel a campaign and return remaining tokens to creator
function cancelCampaign(uint256 campaignId) external;
// Only callable by campaign creator or contract owner
// Returns (totalBudget - totalClaimed) tokens to creator

// === Claiming (Unified — on-chain verified for both Orb and NFC) ===

// Claim tokens with a World ID proof (works for both Orb and NFC)
function claim(
    uint256 campaignId,
    address recipient,        // Where to send tokens
    uint256 root,             // From IDKit
    uint256 nullifierHash,    // From IDKit
    uint256[8] calldata proof,// From IDKit
    uint256 groupId           // 1 = Orb, 2 = NFC
) external;
// Called by relayer on behalf of user
// Verifies proof on-chain via World ID Router with the appropriate groupId
// Uses orbClaimAmount if groupId == 1, nfcClaimAmount if groupId == 2
// Checks nullifier hasn't claimed (or interval has passed for recurring)
// Transfers appropriate amount to recipient

// === Admin ===

function setRelayer(address _relayer) external onlyOwner;
function whitelistCreator(address creator, bool status) external onlyOwner;
function pause() external onlyOwner;
function unpause() external onlyOwner;
```

### 3.5 World ID Integration Details

**On-chain verification (both Orb and NFC):**
- Use the `IWorldID` interface to call `verifyProof()` on the World ID Router contract
- `groupId = 1` for Orb-verified users
- `groupId = 2` for NFC/Passport-verified users
- The `signal` should be the recipient's wallet address (prevents proof tampering)
- The `externalNullifier` should incorporate the campaign ID to prevent cross-campaign replay

**Base Deployments (provided directly — not yet in official docs):**
- World ID Router: `0xBCC7e5910178AFFEEeBA573ba6903E9869594163`
  - Orb (Group 1): `0xE85bC6Df4BcE507FC789bCBEfD6471AbE5B93Df2`
  - NFC (Group 2): `0x13F5788c3CE48911bca120C9e197fBdFED8bEBf3`

**World Chain Deployments:**
- World ID Router: Look up at https://docs.world.org/world-id/reference/contract-deployments
- Supports both Group 1 (Orb) and Group 2 (NFC) on-chain

**Reference implementation:** https://github.com/worldcoin/world-id-onchain-template

**Important:** The contract should accept `groupId` as a parameter in the claim function and pass it through to the World ID Router's `verifyProof()`. This lets the same contract handle both verification levels. The claim amount is determined by the groupId: `groupId == 1` → `orbClaimAmount`, `groupId == 2` → `nfcClaimAmount`.

### 3.6 Deployment Plan

1. Deploy on World Chain first (primary chain)
2. Deploy on Base second
3. Each deployment has its own contract instance
4. The frontend knows which contract address to call based on the campaign's chain

### 3.7 Security Considerations

- Use OpenZeppelin's `Ownable`, `Pausable`, `ReentrancyGuard`
- Use `SafeERC20` for all token transfers
- Validate campaign isn't expired before claims
- Validate sufficient remaining budget before claims
- Validate `groupId` is either 1 or 2 (reject other values)
- Ensure `cancelCampaign` uses check-effects-interactions pattern
- The relayer wallet submits transactions but has no special trust role — all proofs are verified on-chain
- Keep relayer private key secure (consider using a KMS or hardware wallet)
- Consider adding a rate limit on the relayer to prevent gas-draining spam
- Nullifier hashes should be tracked per campaign AND per groupId to prevent cross-type replay

---

## 4. Backend / Relayer Design

### 4.1 Next.js API Routes

All backend logic lives in Next.js API routes, deployed on Vercel.

**`POST /api/claim`** — Main claim endpoint

```typescript
// Request body
{
  campaignId: number,
  recipient: string,            // Wallet address or World ID username (name.world.id)
  // World ID proof fields (from IDKit)
  merkle_root: string,
  nullifier_hash: string,
  proof: string,
  verification_level: string,   // "orb" or "device" — maps to groupId 1 or 2
  groupId: number               // 1 = Orb, 2 = NFC
}

// Flow:
// 1. Resolve recipient if it's a World ID username (ENS resolution)
// 2. Look up campaign details (chain, contract address)
// 3. Submit proof to contract's claim() function with appropriate groupId
//    — The contract handles ALL proof verification on-chain
// 4. Return transaction hash to frontend
```

**`GET /api/campaigns`** — List active campaigns
- Read from contract or index via events
- Cache aggressively (campaigns don't change often)

**`GET /api/campaigns/[id]`** — Campaign details + remaining balance

**`POST /api/resolve-username`** — Resolve World ID username to wallet address
- Uses ENS resolution for `name.world.id` names
- Returns the resolved 0x address

### 4.2 Relayer Wallet

- A server-side Ethereum wallet (private key stored in environment variables)
- Funded with ETH on both World Chain and Base for gas
- **No special contract privileges** — the relayer simply submits transactions; all proof verification happens on-chain
- **Monitor balance** — set up alerts when gas balance drops below threshold
- Consider using a service like OpenZeppelin Defender or Gelato for more robust relaying in production

### 4.3 Environment Variables

```
# World ID
NEXT_PUBLIC_WORLD_APP_ID=app_xxxxx
WORLD_ID_ACTION_PREFIX=claim_campaign_    # Action = prefix + campaignId

# Relayer wallet
RELAYER_PRIVATE_KEY=0x...

# Contract addresses (FreeForHumans contract)
WORLD_CHAIN_CONTRACT_ADDRESS=0x...
BASE_CONTRACT_ADDRESS=0x...

# RPC endpoints
WORLD_CHAIN_RPC_URL=https://...
BASE_RPC_URL=https://...

# World ID Router addresses (per chain)
WORLD_CHAIN_WORLD_ID_ROUTER=0x...          # Look up in docs
BASE_WORLD_ID_ROUTER=0xBCC7e5910178AFFEEeBA573ba6903E9869594163

# WalletConnect (for campaign creators)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxxxx
```

---

## 5. Frontend Design

### 5.1 Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home / Campaign List | Hero section + grid of active campaigns |
| `/campaign/[id]` | Campaign Detail | Claim flow with World ID verification |
| `/get-verified` | Verification Guide | How to get Orb or NFC verified |
| `/offer` | Offer Page | Info for potential campaign creators + contact form |
| `/create` | Create Campaign | Campaign creation form (wallet-connected, whitelisted only) |
| `/admin` | Admin Dashboard | Owner-only: whitelist creators, pause, manage relayer |

### 5.2 Claim Flow (User Journey)

1. User lands on homepage, sees active campaigns (grid of cards showing token, amount, time remaining)
2. User clicks a campaign → campaign detail page
3. Campaign page shows: what's being given away, how much per claim (Orb vs NFC amounts), how much is left, expiry
4. User clicks "Claim as Verified Human"
5. User selects verification type: "Orb Verified" (group 1) or "Passport/NFC Verified" (group 2)
6. IDKit widget opens → user scans QR code with World App → proof generated
7. After verification, user sees an input field: "Enter your World ID username or wallet address"
8. User enters `@username` or `0x...` address
9. User clicks "Claim" → frontend sends proof + recipient + groupId to `/api/claim`
10. Loading state while relayer submits transaction (proof verified on-chain by contract)
11. Success screen with transaction hash link (to block explorer)
12. If recurring: show "Next claim available in X days/hours"

### 5.3 Campaign Creation Flow (Creator Journey)

1. Creator navigates to `/create`
2. Connects wallet via RainbowKit
3. If wallet is not whitelisted → shows "Contact us to get approved" message
4. If whitelisted → shows campaign creation form:
   - Token address (or select from common tokens like WLD, XAUT, USDC)
   - Claim amount per Orb-verified human
   - Claim amount per NFC-verified human
   - Total budget (how many tokens to deposit)
   - Expiry date/time
   - Is it recurring? If yes, claim interval (daily, weekly, monthly, custom)
   - Campaign title, description, image
5. Creator approves token spend → creates campaign (two transactions: approve + createCampaign)
6. Campaign goes live immediately

### 5.4 Branding & Design Direction

**Reference sites:**
- **puf.world** — Clean, dark theme, crypto-native aesthetic, bold typography
- **world.org** — Professional, trustworthy, modern

**Design principles:**
- Dark background (#0a0a0a or similar very dark gray/black)
- World's blue as primary accent color (#4940E0 or the World blue — match their verified badge color)
- Clean sans-serif typography (Inter or similar)
- Generous whitespace
- Rounded corners on cards and buttons
- The **World Verified Human Badge** (blue checkmark) should be used prominently:
  - Next to claim amounts to indicate "for verified humans"
  - On the verification guide page
  - In campaign cards to show this is human-only
  - Differentiate Orb badge vs NFC badge visually (Orb = stronger verification = more prominent styling)
- Subtle gradients and glows for emphasis
- Mobile-first responsive design (many World App users are mobile)

**Component patterns:**
- Campaign cards: Token icon + name, claim amount, progress bar (claimed/total), time remaining, verification level badges
- Hero: Bold headline "Free things for verified humans" with CTA
- Verification status indicator: Show user's verification level after IDKit verification
- Transaction status: Clear loading → success → error states

### 5.5 Key Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "@worldcoin/idkit": "latest",
    "@rainbow-me/rainbowkit": "latest",
    "wagmi": "latest",
    "viem": "latest",
    "@tanstack/react-query": "latest",
    "tailwindcss": "latest"
  }
}
```

---

## 6. World ID IDKit Integration

### 6.1 Frontend Configuration

```tsx
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'

<IDKitWidget
  app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID}
  action={`claim_campaign_${campaignId}`}   // Unique per campaign
  signal={recipientAddress}                  // Ties proof to recipient
  verification_level={VerificationLevel.Orb} // Or handle both levels
  onSuccess={onVerificationSuccess}
  handleVerify={handleProofReceived}
>
  {({ open }) => <button onClick={open}>Verify & Claim</button>}
</IDKitWidget>
```

### 6.2 Developer Portal Setup

Before building, register at https://developer.worldcoin.org:
1. Create a new app
2. Set it as **on-chain** app type (required for on-chain Orb verification)
3. Note the `app_id`
4. Create actions for each campaign (or use a dynamic action naming scheme)

### 6.3 Two-Level Verification UX

The claim page should let users choose their verification level:
- "I'm Orb Verified" → groupId 1, uses orbClaimAmount
- "I'm Passport Verified (NFC)" → groupId 2, uses nfcClaimAmount

Both paths generate a proof via IDKit and both are verified on-chain. The only difference is the groupId passed to the contract. IDKit may also indicate the verification level in its response, which can be used to auto-detect.

---

## 7. Get Verified Page (`/get-verified`)

A clean, informational page explaining:

1. **What is World ID?** — Brief explanation of proof-of-personhood
2. **Why verify?** — Access to free claims, higher claim amounts with Orb
3. **Two ways to verify:**
   - **Orb Verification (Strongest):** Find an Orb near you → visit → takes ~30 seconds → link to Orb locator (https://world.org/find-orb or the equivalent in-app finder)
   - **Passport/NFC Verification:** Open World App → go to verification → scan your NFC-enabled passport → done from your phone
4. **Download World App:** Links to iOS App Store and Google Play
5. **FAQ:** Common questions about privacy, data handling, what World ID does/doesn't share

Use the World Verified Human Badge prominently. Link out to world.org for detailed information.

---

## 8. Offer Page (`/offer`)

### 8.1 V1: Simple Contact

- Headline: "Want to give something free to verified humans?"
- Description of how campaigns work
- Simple form: name, email, what you want to distribute, how much
- Sends email to your specified address (use a service like Resend or just mailto: link)
- "For self-serve campaign creation, connect your wallet" → link to `/create` (if whitelisted)

### 8.2 Creator Whitelist Flow

- Contact form submissions are reviewed manually
- Once approved, the contract owner calls `whitelistCreator(address, true)`
- Creator can then access `/create` with their connected wallet

---

## 9. Multi-Chain Support

### 9.1 Architecture

- One smart contract deployed per chain (World Chain + Base)
- Campaigns exist on one chain only (specified at creation time)
- Frontend displays campaigns from both chains, with chain badges
- Relayer wallet needs ETH on both chains
- Campaign creators choose which chain when creating

### 9.2 Chain Configuration

```typescript
const CHAINS = {
  worldchain: {
    id: 480,  // World Chain mainnet chain ID
    name: 'World Chain',
    rpcUrl: process.env.WORLD_CHAIN_RPC_URL,
    contractAddress: process.env.WORLD_CHAIN_CONTRACT_ADDRESS,
    worldIdRouter: process.env.WORLD_CHAIN_WORLD_ID_ROUTER,
    explorerUrl: 'https://worldscan.org',
  },
  base: {
    id: 8453,  // Base mainnet chain ID
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL,
    contractAddress: process.env.BASE_CONTRACT_ADDRESS,
    worldIdRouter: '0xBCC7e5910178AFFEEeBA573ba6903E9869594163',
    explorerUrl: 'https://basescan.org',
  }
}
```

### 9.3 Token Addresses to Support Initially

| Token | World Chain Address | Base Address |
|-------|-------------------|--------------|
| WLD | Look up on worldscan.org | Look up on basescan.org (if bridged) |
| XAUT (Tether Gold) | Look up on worldscan.org | Look up on basescan.org |
| USDC | Look up on worldscan.org | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |

Note: Verify all token addresses before deployment. Some tokens may not be available on all chains.

---

## 10. Development Roadmap (Suggested Order)

### Phase 1: Smart Contract (Week 1)
1. Set up Foundry project
2. Implement `FreeForHumans.sol` with campaign CRUD, claim with on-chain verification (both Orb group 1 and NFC group 2), cancel/withdraw
3. Write comprehensive tests (Foundry tests)
4. Test against World ID on testnet (World Chain Sepolia / Base Sepolia)
5. Use the World ID Simulator for testing: https://simulator.worldcoin.org

### Phase 2: Backend/Relayer (Week 1-2)
1. Set up Next.js project
2. Implement `/api/claim` endpoint with both Orb and NFC paths
3. Implement ENS username resolution
4. Implement `/api/campaigns` read endpoints
5. Set up relayer wallet management
6. Test end-to-end claim flow on testnet

### Phase 3: Frontend — Claim Flow (Week 2-3)
1. Home page with campaign grid
2. Campaign detail page with IDKit integration
3. Claim flow: verify → enter address → submit → success
4. Transaction status tracking
5. Mobile-responsive design

### Phase 4: Frontend — Creator Flow (Week 3)
1. RainbowKit wallet connection
2. Campaign creation form
3. Token approval + campaign creation transactions
4. Creator dashboard (view their campaigns, remaining balance)

### Phase 5: Static Pages (Week 3-4)
1. Get Verified guide page
2. Offer/contact page
3. About page / FAQ
4. Terms of Service, Privacy Policy

### Phase 6: Deploy & Launch (Week 4)
1. Deploy contracts to mainnet (World Chain + Base)
2. Fund relayer wallet on both chains
3. Deploy frontend to Vercel
4. Configure custom domain (freeforhumans.com)
5. Create initial campaigns (WLD + XAUT)
6. Register World ID app in Developer Portal (production)

---

## 11. Testing Strategy

### 11.1 Smart Contract Tests (Foundry)
- Campaign creation with token deposits
- Orb claim (groupId=1) with valid/invalid/replayed proofs
- NFC claim (groupId=2) with valid/invalid/replayed proofs
- Rejection of invalid groupId values (not 1 or 2)
- Correct claim amounts per groupId (orbClaimAmount vs nfcClaimAmount)
- Recurring claims (interval enforcement)
- Campaign cancellation and token return
- Expiry enforcement
- Edge cases: claiming from empty campaign, claiming expired campaign, double-claims

### 11.2 World ID Testing
- Use the **World ID Simulator** (https://simulator.worldcoin.org) for generating test proofs
- Test on World Chain Sepolia and Base Sepolia testnets
- Use staging app_id from Developer Portal

### 11.3 Frontend Testing
- Test IDKit widget flow with Simulator
- Test ENS username resolution
- Test wallet connection for campaign creators
- Mobile device testing (World App users are primarily mobile)

---

## 12. Initial Campaign Configuration

For launch, manually create two campaigns:

**Campaign 1: WLD Distribution**
- Token: WLD
- Orb claim amount: [TBD by you]
- NFC claim amount: [TBD by you]
- Total budget: [TBD by you]
- Expiry: [TBD]
- Recurring: [TBD — one-time or periodic?]
- Chain: World Chain

**Campaign 2: Tether Gold (XAUT) Distribution**
- Token: XAUT
- Orb claim amount: [TBD by you]
- NFC claim amount: [TBD by you]
- Total budget: [TBD by you]
- Expiry: [TBD]
- Recurring: [TBD]
- Chain: World Chain (or Base — your choice)

---

## 13. Open Questions / Decisions Needed Before Building

1. **Claim amounts:** Specific token amounts per verification level for the initial WLD and XAUT campaigns
2. **Recurring cadence:** For the initial campaigns, one-time or recurring? If recurring, what interval?
3. **Contact email:** What email address for the offer page contact form?
4. **World ID fees:** World Foundation is introducing fees for World ID usage in 2025. Budget for potential per-verification costs.
5. **Relayer redundancy:** Single Vercel API route is fine for v1, but consider upgrading to a queuing system if transaction volume is high
6. **Token list:** Beyond WLD and XAUT, should the campaign creation form have a curated token list, or allow any ERC-20 address?

---

## 14. File Structure (Suggested)

```
freeforhumans/
├── contracts/                    # Foundry project
│   ├── src/
│   │   └── FreeForHumans.sol
│   ├── test/
│   │   └── FreeForHumans.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
├── src/                          # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home / campaign list
│   │   ├── campaign/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Campaign detail + claim
│   │   ├── get-verified/
│   │   │   └── page.tsx
│   │   ├── offer/
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx          # Campaign creation (wallet-connected)
│   │   └── api/
│   │       ├── claim/
│   │       │   └── route.ts      # Claim relayer endpoint
│   │       ├── campaigns/
│   │       │   └── route.ts      # List campaigns
│   │       └── resolve-username/
│   │           └── route.ts      # ENS resolution
│   ├── components/
│   │   ├── CampaignCard.tsx
│   │   ├── ClaimFlow.tsx
│   │   ├── WorldIdVerify.tsx
│   │   ├── WalletConnect.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── VerifiedBadge.tsx     # World verified human badge component
│   ├── lib/
│   │   ├── contracts.ts          # Contract ABIs and addresses
│   │   ├── chains.ts             # Chain configuration
│   │   └── relayer.ts            # Relayer wallet utilities
│   └── styles/
│       └── globals.css
├── public/
│   └── images/                   # World badge assets, etc.
├── package.json
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

---

## 15. How to Use This Spec with Claude Code

1. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
2. Create your project directory: `mkdir freeforhumans && cd freeforhumans`
3. Start Claude Code: `claude`
4. Give it this spec: "Read the spec at [path to this file] and start building Phase 1 — the smart contract"
5. Work through each phase sequentially
6. For each phase, tell Claude Code which phase you're on and what specific piece to build
7. Test as you go — don't move to the next phase until the current one works

**Tips for working with Claude Code:**
- Be specific: "Implement the createCampaign function with token transfer and event emission"
- Iterate: "Run the tests. Fix any failures."
- Ask it to explain: "Walk me through how the Orb claim verification works"
- Keep the spec handy and reference it: "According to the spec, the NFC claim path should..."

---

## 16. Key Reference Links

| Resource | URL |
|----------|-----|
| World ID Concepts | https://docs.world.org/world-id/concepts |
| World ID On-Chain Verification | https://docs.world.org/world-id/id/on-chain |
| IDKit React SDK | https://docs.world.org/world-id/id/web-react |
| World ID Contract Deployments | https://docs.world.org/world-id/reference/contract-deployments |
| World ID Smart Contract Reference | https://docs.world.org/world-id/reference/contracts |
| On-Chain Template Repo | https://github.com/worldcoin/world-id-onchain-template |
| IDKit JS Repo | https://github.com/worldcoin/idkit-js |
| World ID Developer Portal | https://developer.worldcoin.org |
| World ID Simulator (Testing) | https://simulator.worldcoin.org |
| RainbowKit Docs | https://www.rainbowkit.com/docs/introduction |
| Foundry Book | https://book.getfoundry.sh |
| Vercel Deployment | https://vercel.com/docs |
| World Verified Badge Info | https://world.org/blog/announcements/the-new-world-app-secure-chat-global-payments-and-mini-apps-for-everyone |
