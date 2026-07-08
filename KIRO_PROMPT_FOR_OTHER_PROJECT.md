# 🤖 Kiro Prompt: Hatasız Swap Sistemi + Builder Code Entegrasyonu

## 📋 Context

B20 FUN projesinde kusursuz çalışan bir swap sistemi var. Bu prompt ile aynı sistemi başka projelere taşıyacaksınız.

---

## 🎯 PROMPT (Kiro'ya yapıştırın)

```
Merhaba! B20 FUN projesinden başarılı swap mimarisini ve Builder Code entegrasyonunu bu projeye taşımak istiyorum.

## KAYNAK PROJE
Repository: https://github.com/b20fun/b20FUN
Dosyalar:
- lib/swap/abis.ts
- lib/swap/getBestQuote.ts  
- lib/swap/executeSwap.ts
- app/swap/page.tsx
- SWAP_ARCHITECTURE_GUIDE.md (detaylı guide)

## HEDEF
1. **Swap sistemini kopyala ve adapte et**
2. **Builder Code'u tüm transaction'lara ekle**
3. **Error handling ve allowance check ekle**

## ADIM 1: Kaynak Dosyaları İncele

Lütfen B20 FUN projesindeki şu dosyaları oku ve analiz et:
- `lib/swap/abis.ts` - Contract adresleri ve ABI'ler
- `lib/swap/getBestQuote.ts` - DEX aggregator logic
- `lib/swap/executeSwap.ts` - Transaction execution
- `app/swap/page.tsx` - UI ve state yönetimi

## ADIM 2: Mevcut Swap Kodunu Analiz Et

Şu anki swap implementasyonumda:
- Hangi sorunlar var? (swap failed, approve hataları vs)
- Builder Code nerede eksik?
- ETH/WETH handling doğru mu?
- Allowance check var mı?

Lütfen mevcut `app/swap/page.tsx` ve ilgili dosyaları oku ve sorunları listele.

## ADIM 3: Yeni Mimariyi Uygula

B20 FUN'daki yapıyı kullanarak:

### 3.1 Dosya Yapısı Oluştur
```
lib/swap/
├── abis.ts              # Contract adresleri ve ABI'ler
├── getBestQuote.ts      # Quote karşılaştırma
└── executeSwap.ts       # Swap execution
```

### 3.2 ABIs Dosyası
`lib/swap/abis.ts` oluştur:
- WETH, Uniswap, Aerodrome (veya proje DEX'leri) adresleri
- ERC20 ABI
- Router ABI'leri
- NATIVE_ETH sentinel değeri

### 3.3 Quote Sistemi
`lib/swap/getBestQuote.ts` oluştur:
- Her DEX'ten quote al (parallel)
- ETH/WETH dönüşümlerini handle et
- Pool existence check
- En iyi quote'u döndür
- Hata durumlarını handle et (pool yok, insufficient liquidity)

**Kritik:** Promise.all kullan, her DEX için ayrı try-catch.

### 3.4 Swap Execution
`lib/swap/executeSwap.ts` oluştur:
- **dataSuffix parametresi ekle** (Builder Code için)
- ETH input handling (value gönder)
- ETH output handling (multicall veya special function)
- Token → Token swap
- WETH wrap/unwrap
- Her writeContractAsync'e dataSuffix ekle

**Kritik Şablon:**
```typescript
type ExecuteSwapArgs = {
  writeContractAsync: WriteContractMutateAsync<any, any>;
  best: DexQuote;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  userAddress: Address;
  dataSuffix?: `0x${string}`;  // Builder Code için
};

export async function executeSwap({
  writeContractAsync,
  best,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  userAddress,
  dataSuffix,  // ← Al
}: ExecuteSwapArgs) {
  // Her writeContractAsync çağrısında dataSuffix kullan
  return writeContractAsync({
    address: routerAddress,
    abi: routerAbi,
    functionName: 'swapExactTokensForTokens',
    args: [...],
    dataSuffix,  // ← Ekle
  });
}
```

### 3.5 UI ve State (page.tsx)
Swap sayfasında:

#### Builder Code Setup
```typescript
import { Attribution } from 'ox/erc8021';

const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_xxxxx';
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });
```

#### Allowance Check
```typescript
const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
  address: tokenIn.address === NATIVE_ETH ? undefined : tokenIn.address,
  abi: erc20Abi,
  functionName: "allowance",
  args: address && quoteResult?.best && tokenIn.address !== NATIVE_ETH
    ? [address, ROUTER_ADDRESS]
    : undefined,
  query: { enabled: Boolean(address && quoteResult?.best && tokenIn.address !== NATIVE_ETH) },
});

const needsApproval = useMemo(() => {
  if (tokenIn.address === NATIVE_ETH) return false;
  if (quoteResult?.best?.dex === "weth-wrap") return false;
  if (!amountInWei || currentAllowance === undefined) return true;
  return currentAllowance < amountInWei;
}, [tokenIn.address, amountInWei, currentAllowance, quoteResult]);
```

#### Approve Handler (Builder Code ile)
```typescript
const handleApprove = useCallback(async () => {
  if (!quoteResult?.best || !amountInWei || !address) return;
  setStep("approving");
  try {
    const spender = ROUTER_ADDRESS;
    
    const hash = await writeContractAsync({
      address: tokenIn.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amountInWei],
      dataSuffix: DATA_SUFFIX,  // ← Builder Code
    });
    
    await publicClient?.waitForTransactionReceipt({ hash });
    await refetchAllowance();
    
    showSuccess('Token approved!');
    setStep("idle");
  } catch (err) {
    const errorMessage = err instanceof Error ? humanizeError(err.message) : "Approve failed";
    showError(errorMessage);
    setStep("error");
  }
}, [quoteResult, amountInWei, tokenIn.address, writeContractAsync, publicClient, refetchAllowance, address]);
```

#### Swap Handler (Builder Code ile)
```typescript
const handleSwap = useCallback(async () => {
  if (!quoteResult?.best || !amountInWei || !address) return;
  setStep("swapping");
  
  try {
    const hash = await executeSwap({
      writeContractAsync,
      best: quoteResult.best,
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amountIn: amountInWei,
      minAmountOut,
      userAddress: address,
      dataSuffix: DATA_SUFFIX,  // ← Builder Code
    });

    await publicClient?.waitForTransactionReceipt({ hash });
    
    refetchBalanceIn();
    refetchBalanceOut();
    await refetchAllowance();
    
    showSuccess('Swap successful!');
    setStep("idle");
    setQuoteResult(null);
  } catch (err) {
    const errorMessage = err instanceof Error ? humanizeError(err.message) : "Swap failed";
    showError(errorMessage);
    setStep("error");
  }
}, [quoteResult, amountInWei, minAmountOut, address, tokenIn.address, tokenOut.address, writeContractAsync, publicClient]);
```

#### Error Handling
```typescript
function humanizeError(raw: string): string {
  if (raw.includes("insufficient funds")) 
    return "Insufficient ETH/gas in your wallet.";
  if (raw.includes("User rejected") || raw.includes("User denied"))
    return "Transaction was not approved in wallet.";
  if (raw.includes("execution reverted"))
    return "Transaction rejected (insufficient liquidity or slippage exceeded).";
  return "An error occurred, please try again.";
}
```

## ADIM 4: Builder Code'u Her Yere Ekle

Projedeki **tüm writeContractAsync çağrılarını** bul ve dataSuffix ekle:

### 4.1 Launchpad
```typescript
import { Attribution } from 'ox/erc8021';
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

// Token creation
await writeContractAsync({
  address: factoryAddress,
  abi: factoryAbi,
  functionName: 'createToken',
  args: [...],
  dataSuffix: DATA_SUFFIX,  // ← Ekle
});

// Fee payment
await sendTransaction({
  to: feeRecipient,
  value: feeAmount,
  data: DATA_SUFFIX,  // ← Ekle
});
```

### 4.2 Liquidity
```typescript
// Add liquidity approvals
await writeContractAsync({
  address: tokenA.address,
  abi: erc20Abi,
  functionName: 'approve',
  args: [routerAddress, amountA],
  dataSuffix: DATA_SUFFIX,  // ← Ekle
});

// Add liquidity
await writeContractAsync({
  address: routerAddress,
  abi: routerAbi,
  functionName: 'addLiquidity',
  args: [...],
  dataSuffix: DATA_SUFFIX,  // ← Ekle
});

// Remove liquidity
await writeContractAsync({
  address: routerAddress,
  abi: routerAbi,
  functionName: 'removeLiquidity',
  args: [...],
  dataSuffix: DATA_SUFFIX,  // ← Ekle
});
```

### 4.3 Her Transaction Fonksiyonunda

**Pattern:**
```typescript
// 1. Dosya başında
import { Attribution } from 'ox/erc8021';
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_xxxxx';
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

// 2. Her writeContractAsync'te
await writeContractAsync({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'anyFunction',
  args: [...],
  dataSuffix: DATA_SUFFIX,  // ← Bu satırı ekle
});

// 3. sendTransaction'larda
await sendTransaction({
  to: recipientAddress,
  value: amount,
  data: DATA_SUFFIX,  // ← Bu satırı ekle
});
```

## ADIM 5: Kritik Kontroller

### Checklist:
- [ ] `ox` paketi yüklü mü? (`npm install ox@latest`)
- [ ] `NEXT_PUBLIC_BUILDER_CODE` env variable set mi?
- [ ] Her `writeContractAsync`'te `dataSuffix` var mı?
- [ ] Her `sendTransaction`'da `data` var mı?
- [ ] Approve transaction'larında dataSuffix var mı?
- [ ] Swap transaction'larında dataSuffix var mı?
- [ ] Liquidity transaction'larında dataSuffix var mı?
- [ ] ETH/WETH handling doğru mu?
- [ ] Allowance check implementasyonu var mı?
- [ ] Error messages kullanıcı dostu mu?
- [ ] Slippage toleransı ayarlanabilir mi?

## ADIM 6: Test

Build ve çalıştır:
```bash
npm install ox@latest
npm run build
npm run dev
```

Test senaryoları:
1. ETH → Token swap
2. Token → ETH swap
3. Token → Token swap
4. Approve + Swap akışı
5. Builder Code'un transaction'larda görünmesi (BaseScan'de kontrol)

## ADIM 7: Doğrulama

Bir transaction yaptıktan sonra:
1. Transaction hash al
2. Block explorer'da (BaseScan) aç
3. "Input Data" sekmesine bak
4. Sonunda `8021802180218021` görmeli
5. https://builder-code-checker.vercel.app/ ile doğrula

## ÖNEMLİ NOTLAR

### 🚨 Yapılması Gerekenler
1. **Her transaction'a dataSuffix ekle** - Hiç unutma!
2. **ETH handling özel** - value göndermeyi unutma
3. **Allowance check** - Gereksiz approve'ları önle
4. **Error handling** - Kullanıcıya ne olduğunu açıkla
5. **Slippage management** - Varsayılan 0.5%, ayarlanabilir yap

### ⚠️ Yaygın Hatalar
1. dataSuffix'i unutmak
2. ETH için value göndermemek
3. Approve'dan sonra allowance'ı refetch etmemek
4. Pool existence check yapmamak
5. Error message'leri raw göstermek

### ✅ Başarı Kriterleri
1. Swap asla fail olmuyor (pool varsa)
2. Builder Code her transaction'da
3. Gereksiz approve yok
4. ETH/WETH seamless çalışıyor
5. Error message'ler anlaşılır

## DÖKÜMANTASYON

Detaylı mimari açıklaması için:
- `SWAP_ARCHITECTURE_GUIDE.md` dosyasını oku
- B20 FUN repo'sunu incele: https://github.com/b20fun/b20FUN

## ÖZET

Bu prompt'u takip ederek:
1. ✅ Hatasız swap sistemi kurulacak
2. ✅ Builder Code her transaction'da olacak
3. ✅ Approve'lar optimize edilecek
4. ✅ Error handling profesyonel olacak
5. ✅ ETH/WETH seamless çalışacak

Şimdi lütfen bu adımları sırayla uygula ve her adımda sonucu göster.
```

---

## 📝 Nasıl Kullanılır?

1. **Kiro'yu aç** (VS Code'da)
2. **Bu prompt'u kopyala** (yukarıdaki markdown kısmını)
3. **Diğer projenizde Kiro'ya yapıştır**
4. **Kiro adım adım uygulamaya başlar**

## 🎯 Sonuç

Kiro bu prompt ile:
- B20 FUN'daki swap sistemini analiz eder
- Aynı mimariyi diğer projeye taşır
- Builder Code'u her yere ekler
- Test eder ve doğrular

Başarılar! 🚀
