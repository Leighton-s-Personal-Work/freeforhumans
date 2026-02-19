# FreeForHumans Deployment Guide

## Prerequisites

1. **Funded deployer wallet** with ETH on both chains:
   - Create a wallet with `cast wallet new`
   - Fund with ~0.01 ETH on World Chain
   - Fund with ~0.01 ETH on Base
   - **NEVER commit your private key to git**

2. **World ID App** registered at https://developer.worldcoin.org
   - Create a new app (set as "on-chain" type)
   - Note the numeric `app_id` (e.g., `app_staging_123...` → extract the number)

3. **WalletConnect Project ID** from https://cloud.walletconnect.com

---

## Step 1: Set Environment Variables

Create a `.env` file in the `contracts/` directory:

```bash
cd contracts
cp .env.example .env
```

Edit `.env` with:
```
DEPLOYER_PRIVATE_KEY=<your_private_key>  # NEVER commit this!
WORLD_APP_ID=<your_numeric_app_id>
RELAYER_ADDRESS=<your_wallet_address>
```

Note: For simplicity, the relayer can be the same address as the deployer. This wallet will pay gas for user claims.

---

## Step 2: Deploy to World Chain

```bash
cd /Users/leighton.cusack/freeforhumans/contracts

# Load env vars
source .env

# Deploy
forge script script/Deploy.s.sol:DeployFreeForHumans \
  --sig "deployWorldChain()" \
  --rpc-url https://worldchain-mainnet.g.alchemy.com/public \
  --broadcast \
  --verify
```

**Save the deployed contract address!**

---

## Step 3: Deploy to Base

```bash
forge script script/Deploy.s.sol:DeployFreeForHumans \
  --sig "deployBase()" \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify
```

**Save the deployed contract address!**

---

## Step 4: Configure Frontend

Update the root `.env` file:

```bash
cd /Users/leighton.cusack/freeforhumans
```

Create `.env.local`:
```
# World ID
NEXT_PUBLIC_WORLD_APP_ID=app_<your_app_id>

# Relayer (same key used for deployment, pays gas for claims)
RELAYER_PRIVATE_KEY=<your_private_key>  # Set in Vercel env vars, NEVER commit!

# Contract addresses (from deployment)
WORLD_CHAIN_CONTRACT_ADDRESS=<deployed_address_on_world_chain>
BASE_CONTRACT_ADDRESS=<deployed_address_on_base>

# RPC endpoints
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public
BASE_RPC_URL=https://mainnet.base.org

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_id>

# App URL
NEXT_PUBLIC_BASE_URL=https://freeforhumans.com
```

---

## Step 5: Whitelist Your Address

After deployment, whitelist your address to create campaigns:

```bash
# On World Chain
cast send <WORLD_CHAIN_CONTRACT_ADDRESS> \
  "whitelistCreator(address,bool)" \
  0x9c7EADDd6235e68D27D6f037C79eaa039Fa57389 true \
  --rpc-url https://worldchain-mainnet.g.alchemy.com/public \
  --private-key $DEPLOYER_PRIVATE_KEY

# On Base
cast send <BASE_CONTRACT_ADDRESS> \
  "whitelistCreator(address,bool)" \
  0x9c7EADDd6235e68D27D6f037C79eaa039Fa57389 true \
  --rpc-url https://mainnet.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Step 6: Deploy to Vercel

1. Push your code to GitHub
2. Connect the repo to Vercel
3. Set environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy

---

## Step 7: Configure Domain

In Vercel:
1. Go to Settings → Domains
2. Add `freeforhumans.com`
3. Update DNS records as instructed

---

## Verification Checklist

- [ ] Deployer wallet funded on World Chain
- [ ] Deployer wallet funded on Base
- [ ] World ID app created at developer.worldcoin.org
- [ ] Contract deployed to World Chain
- [ ] Contract deployed to Base
- [ ] Your address whitelisted on both contracts
- [ ] Frontend `.env.local` configured
- [ ] Deployed to Vercel
- [ ] Domain configured

---

## Useful Commands

### Check contract owner
```bash
cast call <CONTRACT_ADDRESS> "owner()" --rpc-url <RPC_URL>
```

### Check if address is whitelisted
```bash
cast call <CONTRACT_ADDRESS> "whitelistedCreators(address)(bool)" <ADDRESS> --rpc-url <RPC_URL>
```

### Check relayer address
```bash
cast call <CONTRACT_ADDRESS> "relayer()" --rpc-url <RPC_URL>
```

### Pause contract (emergency)
```bash
cast send <CONTRACT_ADDRESS> "pause()" --rpc-url <RPC_URL> --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Chain Details

| Chain | Chain ID | RPC | Explorer |
|-------|----------|-----|----------|
| World Chain | 480 | https://worldchain-mainnet.g.alchemy.com/public | https://worldscan.org |
| Base | 8453 | https://mainnet.base.org | https://basescan.org |

---

## World ID Router Addresses

| Chain | Router Address |
|-------|---------------|
|| World Chain | `0x17B354dD2595411ff79041f930e491A4Df39A278` |
| Base | `0xBCC7e5910178AFFEEeBA573ba6903E9869594163` |

Reference: https://docs.world.org/world-id/reference/address-book
