# 🎯 Base Builder Code Integration Guide

## What is a Builder Code?

Base Builder Codes are unique identifiers (e.g., `bc_b20token`) that enable **onchain attribution** for your application. They help Base track which apps drive transactions, unlocking:

- 🎁 **Rewards**: Earn rewards based on transaction volume
- 📊 **Analytics**: Detailed metrics on base.dev
- 🔍 **Visibility**: Featured in App Leaderboards and discovery

## How It Works

Builder Codes use the **ERC-8021 standard** to append a special suffix to transaction calldata:

```
Original calldata: 0x1234abcd...
With Builder Code:  0x1234abcd...bc_b20token8021802180218021
```

### Key Features:
- ✅ **Smart contracts ignore it** - No contract modifications needed
- ✅ **Zero impact on execution** - Contracts work exactly as before
- ✅ **Minimal gas cost** - Only ~16 gas per byte (negligible)
- ✅ **Works with EOAs and Smart Wallets** - Compatible with all wallet types

---

## Implementation in B20TOKEN

### 1. Installation

We've already integrated Builder Codes using the `ox` library:

```bash
npm install ox@latest
```

### 2. Wagmi Configuration

File: `lib/wagmi.ts`

```typescript
import { Attribution } from 'ox/erc8021';

// Your Builder Code from base.dev
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_b20token';

// Generate ERC-8021 suffix
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const config = getDefaultConfig({
  // ... other config
  dataSuffix: DATA_SUFFIX, // ← Automatically appends to ALL transactions
});
```

### 3. Environment Variables

File: `.env.local`

```env
# Get your code from base.dev > Settings > Builder Code
NEXT_PUBLIC_BUILDER_CODE=bc_b20token
```

---

## Getting Your Builder Code

### Step 1: Register on base.dev

1. Visit [base.dev](https://base.dev)
2. Connect your wallet
3. Complete the registration form:
   - App name: **B20TOKEN**
   - Description: **B20 Token Launchpad & DEX Aggregator on Base**
   - Website: Your deployment URL
   - Category: DeFi

### Step 2: Get Your Code

1. Go to **Settings → Builder Code**
2. Copy your unique code (e.g., `bc_xyz123abc`)
3. Add it to `.env.local`:
   ```env
   NEXT_PUBLIC_BUILDER_CODE=bc_xyz123abc
   ```

### Step 3: Redeploy

```bash
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

---

## Verification

### Method 1: Check on base.dev

1. Visit [base.dev](https://base.dev)
2. Navigate to your app dashboard
3. Select **"Onchain"** from transaction type dropdown
4. Watch **Total Transactions** increment when users make transactions

### Method 2: Use Block Explorer (BaseScan)

1. Find any transaction from your app
2. View the **Input Data** field
3. Check the last 16 bytes - should be `8021` repeating
4. Decode the suffix to verify your Builder Code

### Method 3: Use Validation Tool

1. Visit [builder-code-checker.vercel.app](https://builder-code-checker.vercel.app/)
2. Enter your transaction hash
3. Click **"Check Attribution"**
4. Verify your Builder Code appears in the results

---

## How Transactions Are Attributed

All transactions made through B20TOKEN will automatically include your Builder Code:

| Transaction Type | Attribution |
|------------------|-------------|
| **Token Creation** (Launchpad) | ✅ Attributed to B20TOKEN |
| **Token Swaps** (Uniswap/Aerodrome) | ✅ Attributed to B20TOKEN |
| **Add Liquidity** (Aerodrome) | ✅ Attributed to B20TOKEN |
| **Remove Liquidity** (Aerodrome) | ✅ Attributed to B20TOKEN |
| **All other transactions** | ✅ Attributed to B20TOKEN |

---

## Benefits for B20TOKEN

### 1. Transaction Rewards
- Base may reward builders based on transaction volume
- Revenue share from protocol fees
- Future incentive programs

### 2. Analytics Dashboard
On base.dev, you'll see:
- **Total Transactions**: Number of txs attributed to your app
- **Unique Users**: Number of unique addresses
- **Transaction Volume**: Total value transacted
- **Growth Trends**: Daily/weekly/monthly charts

### 3. App Discovery
- Featured in **Base App Leaderboards**
- Listed in **Base App Store**
- Highlighted in ecosystem spotlights

---

## FAQ

### Q: Do I need to modify my smart contracts?
**A:** No! The suffix is appended to calldata. Smart contracts execute normally and ignore the extra data.

### Q: How much extra gas does it cost?
**A:** Approximately 16 gas per non-zero byte. For a typical Builder Code (`bc_xyz123abc`), this is ~200 gas - negligible compared to transaction costs.

### Q: Does it work with all wallets?
**A:** Yes! Works with:
- ✅ EOAs (MetaMask, Rainbow, Coinbase Wallet, etc.)
- ✅ Smart Wallets (Coinbase Smart Wallet, Safe, etc.)
- ✅ Embedded Wallets (Privy, Dynamic, etc.)

### Q: Will it expose my users' identity?
**A:** No. Builder Codes only associate transactions with your **application**, not individual users. All wallet information remains as public/private as it was before.

### Q: Can I use multiple Builder Codes?
**A:** Yes! You can pass multiple codes to `Attribution.toDataSuffix()`:
```typescript
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_app1', 'bc_partner', 'bc_campaign'],
});
```

### Q: What if I don't register on base.dev?
**A:** The code will still be appended to transactions, but you won't get:
- Analytics dashboard access
- Reward eligibility
- App leaderboard placement

---

## Testing in Development

### Local Testing
```bash
npm run dev
```

1. Connect your wallet (Base Mainnet)
2. Make a test transaction (e.g., swap tokens)
3. Check the transaction on BaseScan
4. Verify the Builder Code in calldata

### Example Test Transaction Flow
1. Go to `/swap`
2. Connect wallet
3. Swap 0.001 ETH → USDC
4. Copy transaction hash from wallet
5. Check on BaseScan → Input Data
6. Look for `8021802180218021` at the end
7. Decode to verify your Builder Code

---

## Resources

- [Base Builder Codes Docs](https://docs.base.org/apps/builder-codes/builder-codes)
- [ERC-8021 Proposal](https://eip.tools/eip/8021)
- [Builder Code Validation Tool](https://builder-code-checker.vercel.app/)
- [Register on base.dev](https://base.dev)

---

## Support

For issues or questions:
1. Check [Base Documentation](https://docs.base.org/apps/builder-codes/builder-codes)
2. Join [Base Discord](https://base.org/discord)
3. Submit feedback via [Base Builder Code Feedback Form](https://t.co/zwvtmXXzGz)

---

**🎉 Congratulations!** You've successfully integrated Base Builder Codes into B20TOKEN. All transactions are now attributed to your app, qualifying you for rewards and analytics! 🚀
