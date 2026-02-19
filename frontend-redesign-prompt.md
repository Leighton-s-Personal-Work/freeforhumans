# FreeForHumans.com — Frontend Redesign Brief

Read SPEC.md for the full project context, then read the entire codebase. This brief overrides the design direction in the spec. Do NOT change any backend logic, API routes, contract interactions, or World ID integration — only change the frontend UI/UX.

---

## Design Direction

### Visual Identity
- **Light, clean, minimal.** White and very light gray backgrounds. NOT dark theme.
- **Futuristic but warm.** Think Apple product pages — lots of whitespace, beautiful typography, things breathe. Not sterile though — it should feel alive.
- **Gold as accent color** for the current launch campaign (giving away gold). Use warm golds, subtle metallic gradients where appropriate.
- **Typography:** Use a clean sans-serif (Inter or similar). Large, confident headlines. Let the text do the work.
- **Personality:** This isn't a generic DeFi dapp. This is a place where real humans get free stuff. The copy should be warm, slightly playful, confident. Not corporate. Not crypto-bro. Think "the internet is cool again."
- **The World Verified Human Badge (blue)** should still appear but complement the light theme — use it as a trust signal next to claim actions.
- **No visual clutter.** Every element should earn its place on the page.

### Reference Vibes
- Apple product pages (layout, whitespace, typography)
- Linear.app (clean, modern, purposeful)
- The lightness and simplicity of Stripe's homepage
- But with personality — not cold

---

## Page Structure

### Remove These Pages/Tabs
- Remove "Offer" page and nav link
- Remove "About" page and nav link  
- Remove "Campaigns" page and nav link
- Remove "Create Campaign" from the main nav (keep the page accessible at /create for whitelisted creators, just don't show it in navigation)

### Keep These
- **Landing page `/`** — This IS the app. Everything happens here.
- **Get Verified `/get-verified`** — Redesign to match new aesthetic
- Keep the `/create` route functional but hidden from main nav

### Navigation
Simple and minimal. Just:
- Logo/wordmark "FreeForHumans" on the left
- "Get Verified" link on the right
- That's it

---

## Landing Page — The Core Experience

The entire landing page is built around ONE concept: **the current drop.**

### Layout (top to bottom):

**1. Hero Section**
- Big, bold headline. Something like: "1 pound of gold. Free for humans."
- Subline that explains the concept in one sentence: "Verified humans can claim free gold. No catch. No wallet needed. Just prove you're real."
- This should feel like an event, a moment, not a product page

**2. The Drop Card (center of the page, the main event)**
This is a single, prominent, beautifully designed card/section that contains EVERYTHING about the current drop:

- **What it is:** "Tether Gold (XAUT)" with a gold-themed visual treatment
- **How much you get:** "0.0001 oz of gold per human" — make this big and clear
- **Progress indicator:** How much has been claimed vs total available. Show something like "412 / 10,000 claims" or a beautiful progress bar. This creates urgency.
- **Time remaining:** How long until the drop expires. Clean countdown or "2 days left" style.
- **The claim flow — right here, no navigation:**
  - Step 1: Input field for wallet address or World ID username. Clean, single input.
  - Step 2: "Claim Your Gold" button — big, prominent, gold-accented
  - Step 3: Clicking opens IDKit verification (this already works, keep the existing logic)
  - Step 4: After verification + successful claim → celebration moment
  - If the user has already claimed → show friendly message (see below)

**3. "Coming Next" Teaser**
Below the main drop, a subtle section that teases what's coming:
- "Next drop in 12 days" with a countdown
- Maybe a blurred or mystery preview: "Something worth ??? — stay tuned"
- This creates return visits and anticipation

**4. How It Works (brief)**
Three simple steps, minimal design:
- "Prove you're human" → World ID verification
- "Enter your address" → Where to send it  
- "Claim for free" → That's it
- Link to "Get Verified" page for people who need to set up World ID first

**5. Footer**
Minimal. Links to Get Verified, maybe a Twitter/X link, "Built with World ID" badge.

---

## Claim States & Interactions

### Before Claiming
- Show the input field and claim button prominently
- Button says something like "Claim Your Gold ✨" or "Claim Free Gold"

### During Verification
- When IDKit is open / QR code is showing, dim the background
- Show a subtle loading state after verification completes while the relayer submits

### Claim Success — THE CELEBRATION MOMENT 🎉
This is critical. The user just got free gold for being human. Make it feel amazing:
- **Animated gold coin** that drops/falls into a wallet graphic — smooth, satisfying animation
- Big congratulatory message: "You just claimed free gold! 🪙" or "0.0001 oz of gold is on its way to you"
- Show the transaction hash as a link to the block explorer (subtle, not the focus)
- Maybe subtle particle effects or a gold shimmer that fades
- The animation should be polished — use Framer Motion or CSS keyframes
- After the animation settles, show a "Share" option: "Tell the world you claimed free gold" with a pre-written tweet

### Already Claimed
If someone tries to claim again and it fails:
- Do NOT show an ugly error message or the raw contract revert
- Catch this specific case and show a friendly, playful message:
- "You already claimed this one! One per human 😊"
- "Check back for the next drop"
- Show when the next drop is coming
- This should feel like a gentle redirect, not a rejection

### Drop Expired or Fully Claimed
- If the drop has run out: "This drop is gone! All claimed by real humans."
- If expired: "This drop has ended."
- In both cases, point to the next upcoming drop

---

## Get Verified Page Redesign

Keep the same content but redesign to match the new aesthetic:
- Clean, light, spacious
- Two clear paths: Orb verification and Passport/NFC verification
- Step-by-step with nice icons or illustrations
- Link to download World App
- Link to find an Orb location
- Should feel encouraging, not technical

---

## Technical Notes

- Use Framer Motion for the celebration animation and any page transitions
- Install it if not already present: `npm install framer-motion`
- Keep ALL existing World ID / IDKit integration code working — just move it into the new layout
- Keep ALL existing API route logic untouched
- Keep the /create page working (accessible by URL, just not in nav)
- The campaign data should be read from the existing contract/API — don't hardcode campaign details, but you CAN style specifically for the gold campaign since that's the launch campaign
- Make sure everything is fully responsive — many users will be on mobile coming from World App
- Use semantic HTML and keep accessibility in mind

---

## Copy & Tone

- Warm, human, slightly playful
- Not corporate: "Claim your allocation" ❌ → "Claim your gold" ✅
- Not crypto-native jargon: "Connect wallet to claim ERC-20" ❌ → "Enter your username or address" ✅
- Confident: This is a cool thing. Free stuff for being human. Lean into it.
- Example headlines:
  - "Free things for real humans"
  - "1 pound of gold. Shared with real humans."
  - "Prove you're human. Get free gold."
  - "No bots. No catch. Just free stuff for humans."

---

## Summary of Priorities

1. **The drop card + claim flow on the landing page** — this is 80% of the work
2. **The celebration animation** — make claiming feel amazing
3. **The "already claimed" graceful handling** — no ugly errors
4. **Overall visual redesign** — light, clean, Apple-esque, with personality
5. **Coming next teaser** — build anticipation
6. **Get Verified page** — clean up to match new design
7. **Mobile responsiveness** — critical, test at 375px width

Start by redesigning the landing page with the drop card and claim flow. Show me the result before moving to the other pieces.
