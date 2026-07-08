# 🔧 Security Fixes TODO

Bu dosya güvenlik raporunda belirlenen sorunların düzeltilmesi için yapılacaklar listesidir.

---

## 🔴 HIGH PRIORITY (Hemen Yapılmalı)

### 1. Admin Address Validation

**File:** `app/launchpad/page.tsx`

**Current Code:**
```typescript
<input 
  type="text" 
  value={adminAddress} 
  onChange={(e) => setAdminAddress(e.target.value)} 
  placeholder={address || 'Your wallet address will be used automatically'}
/>
```

**Fix:**
```typescript
import { isAddress } from 'viem';

// In handleSubmit:
if (adminAddress && !isAddress(adminAddress)) {
  setError('Invalid admin address. Must be a valid Ethereum address (0x...)');
  return;
}
```

**Priority:** 🔴 HIGH  
**Impact:** Prevents 0.002 ETH fee loss from invalid admin address  
**Estimated Time:** 5 minutes

---

### 2. Token Symbol Validation

**File:** `app/launchpad/page.tsx`

**Current Code:**
```typescript
<input 
  value={tokenSymbol} 
  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().slice(0, 10))}
/>
```

**Fix:**
```typescript
// In handleSubmit:
if (!/^[A-Z0-9]+$/.test(tokenSymbol)) {
  setError('Token symbol can only contain letters (A-Z) and numbers (0-9)');
  return;
}

if (tokenSymbol.length === 0 || tokenSymbol.length > 10) {
  setError('Token symbol must be 1-10 characters');
  return;
}
```

**Priority:** 🔴 HIGH  
**Impact:** Prevents transaction failure from invalid symbols  
**Estimated Time:** 5 minutes

---

### 3. Token Name Sanitization

**File:** `app/launchpad/page.tsx`

**Current Code:**
```typescript
const params = toHex(`${tokenName}|${tokenSymbol}|${adminAddress || address}|${finalDecimals}`);
```

**Fix:**
```typescript
// Add sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[|]/g, '') // Remove pipe character
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim();
};

// In handleCreateToken:
const sanitizedName = sanitizeInput(tokenName);
const sanitizedSymbol = sanitizeInput(tokenSymbol);
const params = toHex(`${sanitizedName}|${sanitizedSymbol}|${adminAddress || address}|${finalDecimals}`);
```

**Priority:** 🔴 HIGH  
**Impact:** Prevents params parsing errors  
**Estimated Time:** 10 minutes

---

### 4. Decimals Range Validation

**File:** `app/launchpad/page.tsx`

**Current Code:**
```typescript
<input 
  type="number" 
  value={decimals} 
  onChange={(e) => setDecimals(parseInt(e.target.value))} 
  min="6" 
  max="18"
/>
```

**Fix:**
```typescript
// In handleSubmit:
if (variant === 'ASSET') {
  const decimalValue = parseInt(decimals.toString());
  if (isNaN(decimalValue) || decimalValue < 6 || decimalValue > 18) {
    setError('Decimals must be a number between 6 and 18');
    return;
  }
}
```

**Priority:** 🔴 HIGH  
**Impact:** Prevents invalid decimals from being submitted  
**Estimated Time:** 5 minutes

---

## 🟡 MEDIUM PRIORITY (Yakında Yapılmalı)

### 5. Quote Freshness Before Swap

**File:** `app/swap/page.tsx`

**Current Code:**
```typescript
const handleSwap = useCallback(async () => {
  if (!quoteResult?.best || !amountInWei || !address) return;
  setStep("swapping");
  
  const hash = await executeSwap({...});
  // ...
}, [quoteResult, ...]);
```

**Fix:**
```typescript
const handleSwap = useCallback(async () => {
  if (!amountInWei || !address) return;
  
  // Re-fetch quote for freshness
  setStep("quoting");
  await fetchQuote();
  
  if (!quoteResult?.best) {
    setError('Failed to get fresh quote');
    return;
  }
  
  setStep("swapping");
  const hash = await executeSwap({...});
  // ...
}, [amountInWei, address, fetchQuote]);
```

**Priority:** 🟡 MEDIUM  
**Impact:** Better price execution, prevents stale quotes  
**Estimated Time:** 15 minutes

---

### 6. Custom Token Warning

**File:** `app/swap/page.tsx`

**Current Code:**
```typescript
{customToken && (
  <button onClick={() => { onSelect(customToken); onClose(); }}>
    // ... token display
  </button>
)}
```

**Fix:**
```typescript
{customToken && (
  <>
    <div className="px-5 py-3" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
      <p className="text-xs font-semibold" style={{ color: '#92400E' }}>⚠️ Unverified Token</p>
      <p className="text-xs mt-1" style={{ color: '#92400E' }}>
        This is a custom token. Verify it's legitimate before swapping.
      </p>
      <a 
        href={`https://basescan.org/token/${customToken.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline"
        style={{ color: '#1E40AF' }}
      >
        View on BaseScan →
      </a>
    </div>
    <button onClick={() => { onSelect(customToken); onClose(); }}>
      // ... token display
    </button>
  </>
)}
```

**Priority:** 🟡 MEDIUM  
**Impact:** Protects users from scam tokens  
**Estimated Time:** 20 minutes

---

### 7. Impermanent Loss Warning

**File:** `app/liquidity/page.tsx`

**Current Code:**
```typescript
{tab === 'add' && (
  <form onSubmit={handleAddLiquidity}>
    // ... form fields
  </form>
)}
```

**Fix:**
```typescript
{tab === 'add' && (
  <form onSubmit={handleAddLiquidity}>
    <div className="rounded-lg p-3 mb-4" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>
        ⚠️ Impermanent Loss Risk
      </p>
      <p className="text-xs" style={{ color: '#92400E' }}>
        Providing liquidity exposes you to impermanent loss. If token prices diverge significantly, 
        you may end up with less value than if you had simply held the tokens.
      </p>
      <a 
        href="https://docs.uniswap.org/concepts/protocol/concentrated-liquidity#impermanent-loss"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline mt-1 inline-block"
        style={{ color: '#1E40AF' }}
      >
        Learn more about IL →
      </a>
    </div>
    // ... form fields
  </form>
)}
```

**Priority:** 🟡 MEDIUM  
**Impact:** User education, reduces complaints  
**Estimated Time:** 15 minutes

---

## 🟢 LOW PRIORITY (İyileştirmeler)

### 8. Partial Liquidity Withdrawal

**File:** `app/liquidity/page.tsx`

**Current Code:**
```typescript
const lpAmount = parseUnits(lpBalance, 18); // Always 100%
```

**Fix:**
```typescript
const [withdrawPercent, setWithdrawPercent] = useState(100);

// In UI:
<div className="mb-4">
  <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
    Amount to withdraw: {withdrawPercent}%
  </label>
  <input 
    type="range" 
    min="0" 
    max="100" 
    step="1"
    value={withdrawPercent}
    onChange={(e) => setWithdrawPercent(parseInt(e.target.value))}
    className="w-full"
  />
  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
    <span>0%</span>
    <span>25%</span>
    <span>50%</span>
    <span>75%</span>
    <span>100%</span>
  </div>
</div>

// In handleRemoveLiquidity:
const lpAmount = (parseUnits(lpBalance, 18) * BigInt(withdrawPercent)) / 100n;
```

**Priority:** 🟢 LOW  
**Impact:** Better UX, flexibility  
**Estimated Time:** 30 minutes

---

### 9. Dependency Pinning

**File:** `package.json`

**Current Code:**
```json
{
  "dependencies": {
    "wagmi": "^2.12.9",
    "viem": "^2.21.45",
    "@rainbow-me/rainbowkit": "^2.1.7"
  }
}
```

**Fix:**
```json
{
  "dependencies": {
    "wagmi": "2.12.9",
    "viem": "2.21.45",
    "@rainbow-me/rainbowkit": "2.1.7"
  }
}
```

**Priority:** 🟢 LOW  
**Impact:** Prevents unexpected breaking changes  
**Estimated Time:** 2 minutes

---

### 10. Add E2E Tests

**File:** Create `tests/e2e/launchpad.spec.ts`

**Fix:**
```typescript
import { test, expect } from '@playwright/test';

test('should create B20 token successfully', async ({ page }) => {
  await page.goto('/launchpad');
  
  // Connect wallet (mock)
  await page.click('button:has-text("Connect Wallet")');
  
  // Fill form
  await page.fill('input[placeholder="E.g: My Token"]', 'Test Token');
  await page.fill('input[placeholder="E.g: MYT"]', 'TEST');
  
  // Submit
  await page.click('button:has-text("Start Token Creation")');
  
  // Wait for success
  await expect(page.locator('text=Token Successfully Created')).toBeVisible({ timeout: 60000 });
});

test('should show error for invalid admin address', async ({ page }) => {
  await page.goto('/launchpad');
  
  await page.fill('input[placeholder="E.g: My Token"]', 'Test');
  await page.fill('input[placeholder="E.g: MYT"]', 'TEST');
  await page.fill('input[placeholder*="admin"]', 'invalid-address');
  
  await page.click('button:has-text("Start Token Creation")');
  
  await expect(page.locator('text=Invalid admin address')).toBeVisible();
});
```

**Priority:** 🟢 LOW  
**Impact:** Prevents regressions  
**Estimated Time:** 2-3 hours

---

## 📋 Implementation Order

### Week 1: Critical Fixes
1. ✅ Admin address validation (5 min)
2. ✅ Token symbol validation (5 min)
3. ✅ Token name sanitization (10 min)
4. ✅ Decimals validation (5 min)

**Total Time:** ~30 minutes

### Week 2: UX Improvements
5. ✅ Quote freshness (15 min)
6. ✅ Custom token warning (20 min)
7. ✅ Impermanent loss warning (15 min)

**Total Time:** ~50 minutes

### Week 3: Polish
8. ✅ Partial withdrawal (30 min)
9. ✅ Dependency pinning (2 min)
10. ⏳ E2E tests (2-3 hours)

**Total Time:** ~3-4 hours

---

## ✅ Testing Checklist

After implementing fixes, test:

- [ ] Create token with valid inputs → Success
- [ ] Create token with invalid admin address → Error shown
- [ ] Create token with special characters → Sanitized
- [ ] Create token with invalid decimals → Error shown
- [ ] Swap with fresh quote → Better price
- [ ] Add custom token → Warning shown
- [ ] Add liquidity → IL warning shown
- [ ] Remove partial liquidity → Slider works
- [ ] All Builder Codes present → Verify on BaseScan

---

## 🎯 Success Criteria

All fixes implemented when:
- ✅ No HIGH priority issues remain
- ✅ Input validation comprehensive
- ✅ User warnings displayed
- ✅ E2E tests passing
- ✅ Zero regressions

**Target Date:** Before B20 Mainnet Activation (July 8, 2026)
