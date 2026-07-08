'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccount, useWriteContract, usePublicClient, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, isAddress, type Address } from 'viem';
import { Attribution } from 'ox/erc8021';
import { getBestQuote, type BestQuoteResult } from '@/lib/swap/getBestQuote';
import { CONTRACTS, erc20Abi, swapRouter02Abi, aerodromeRouterAbi, NATIVE_ETH } from '@/lib/swap/abis';
import { executeSwap } from '@/lib/swap/executeSwap';
import { useToast } from '@/components/Toast';

// Builder Code Attribution
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_0997z4ol';
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

interface Token {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  emoji: string;
  logoURI?: string; // Token logo URL'i
  isNative?: boolean; // ETH için
}

// ETH için özel sentinel adres
const WETH_ADDRESS = CONTRACTS.weth as `0x${string}`;

type SwapStep = "idle" | "quoting" | "approving" | "swapping" | "done" | "error";

// Base Mainnet için güvenilir token'lar
const DEFAULT_TOKENS: Token[] = [
  { 
    symbol: 'ETH',  
    name: 'Ethereum',       
    address: NATIVE_ETH as `0x${string}`,  
    decimals: 18, 
    emoji: '⟠',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    isNative: true 
  },
  { 
    symbol: 'WETH', 
    name: 'Wrapped Ether',  
    address: CONTRACTS.weth as `0x${string}`, 
    decimals: 18, 
    emoji: '🔷',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  
  // Base Mainnet Token Adresleri
  { 
    symbol: 'USDC', 
    name: 'USD Coin',       
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
    decimals: 6,  
    emoji: '🔵',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
  },
  { 
    symbol: 'USDbC',  
    name: 'USD Base Coin', 
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', 
    decimals: 6, 
    emoji: '💵',
    logoURI: 'https://basescan.org/token/images/usdbc_ofc_32.png'
  },
  { 
    symbol: 'DAI',  
    name: 'Dai Stablecoin', 
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', 
    decimals: 18, 
    emoji: '🟡',
    logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
  },
  { 
    symbol: 'cbETH', 
    name: 'Coinbase Wrapped Staked ETH',
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', 
    decimals: 18,  
    emoji: '🔷',
    logoURI: 'https://assets.coingecko.com/coins/images/27008/small/cbeth.png'
  },
  { 
    symbol: 'cbBTC', 
    name: 'Coinbase Wrapped BTC',      
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 
    decimals: 8, 
    emoji: '₿',
    logoURI: 'https://assets.coingecko.com/coins/images/31869/small/cbBTC.png'
  },
];

const SLIPPAGE_OPTIONS = [0.5, 1, 5];

// Humanize blockchain error messages for users
function humanizeError(raw: string): string {
  if (raw.includes("insufficient funds")) return "Insufficient ETH/gas in your wallet.";
  if (raw.includes("User rejected") || raw.includes("User denied"))
    return "Transaction was not approved in wallet.";
  if (raw.includes("execution reverted"))
    return "Transaction rejected by chain (insufficient liquidity or slippage exceeded).";
  return "An error occurred, please try again.";
}

type QuoteResult = { dex: 'uniswap' | 'aerodrome'; amountOut: bigint; formatted: string };

// Token seçim modalı
function TokenModal({ onSelect, onClose, exclude }: { onSelect: (t: Token) => void; onClose: () => void; exclude: Token }) {
  const publicClient = usePublicClient();
  const [search, setSearch] = useState('');
  const [customToken, setCustomToken] = useState<Token | null>(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!isAddress(search) || !publicClient) { setCustomToken(null); return; }
    setLoadingCustom(true);
    Promise.all([
      publicClient.readContract({ address: search as `0x${string}`, abi: erc20Abi, functionName: 'symbol' }),
      publicClient.readContract({ address: search as `0x${string}`, abi: erc20Abi, functionName: 'name' }),
      publicClient.readContract({ address: search as `0x${string}`, abi: erc20Abi, functionName: 'decimals' }),
    ]).then(([symbol, name, decimals]) => {
      setCustomToken({ symbol: symbol as string, name: name as string, address: search as `0x${string}`, decimals: decimals as number, emoji: '🪙' });
    }).catch(() => setCustomToken(null))
      .finally(() => setLoadingCustom(false));
  }, [search, publicClient]);

  const filtered = DEFAULT_TOKENS.filter(
    (t) => t.address !== exclude.address && (
      search === '' ||
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Select Token</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-xl hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>×</button>
        </div>
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, symbol or contract address..."
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--ice-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
          {loadingCustom && (
            <div className="px-5 py-4 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Loading token...</div>
          )}
          {customToken && (
            <button onClick={() => { onSelect(customToken); onClose(); }} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-opacity-50 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ice-pale)') }
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--ice-pale)' }}>
                {customToken.logoURI ? (
                  <img src={customToken.logoURI} alt={customToken.symbol} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = customToken.emoji; }} />
                ) : customToken.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{customToken.symbol}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{customToken.name}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>Custom</div>
            </button>
          )}
          {filtered.map((token) => (
            <button key={token.address} onClick={() => { onSelect(token); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ice-pale)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--ice-pale)' }}>
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = token.emoji; }} />
                ) : token.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{token.symbol}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{token.name}</div>
              </div>
            </button>
          ))}
          {!loadingCustom && filtered.length === 0 && !customToken && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Token not found. You can add a custom token by entering the contract address.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SwapPage() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: txHash, writeContractAsync } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { showSuccess, showError } = useToast();

  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS[0]);   // ETH
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS[2]); // USDC
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSlippage, setShowSlippage] = useState(false);
  const [showModalIn, setShowModalIn] = useState(false);
  const [showModalOut, setShowModalOut] = useState(false);
  const [quoteResult, setQuoteResult] = useState<BestQuoteResult | null>(null);
  const [step, setStep] = useState<SwapStep>("idle");
  const [balanceIn, setBalanceIn] = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');

  const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
  const slippageBps = Math.floor(effectiveSlippage * 100); // %1 = 100 bps

  // ETH native bakiyesi - use wallet's native balance
  const { data: nativeBalance, isLoading: isBalanceLoading, isError: isBalanceError } = useBalance({ 
    address: address,
  });

  // Amount in wei
  const amountInWei = useMemo(() => {
    if (!amountIn || Number.isNaN(Number(amountIn))) return null;
    try {
      return parseUnits(amountIn, tokenIn.decimals);
    } catch {
      return null;
    }
  }, [amountIn, tokenIn.decimals]);

  // ETH ise WETH adresini kullan, yoksa token adresini
  const addrIn = tokenIn.address === NATIVE_ETH ? WETH_ADDRESS : tokenIn.address;
  const addrOut = tokenOut.address === NATIVE_ETH ? WETH_ADDRESS : tokenOut.address;

  // Allowance check - sadece ERC20 için (native ETH ve WETH wrap için değil)
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address === NATIVE_ETH ? undefined : tokenIn.address,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && quoteResult?.best && tokenIn.address !== NATIVE_ETH && quoteResult.best.dex !== "weth-wrap"
        ? [
            address,
            (quoteResult.best.dex === "uniswap"
              ? CONTRACTS.uniswap.swapRouter02
              : CONTRACTS.aerodrome.router) as Address,
          ]
        : undefined,
    query: { enabled: Boolean(address && quoteResult?.best && tokenIn.address !== NATIVE_ETH && quoteResult.best.dex !== "weth-wrap") },
  });

  // Approve gerekli mi? Native ETH ve WETH unwrap için asla gerekmez
  const needsApproval = useMemo(() => {
    if (tokenIn.address === NATIVE_ETH) return false; // native ETH için approve yok
    if (quoteResult?.best?.dex === "weth-wrap") {
      // WETH → ETH için de approve gerekmez (kendi token'ımızı withdraw ediyoruz)
      return false;
    }
    if (!amountInWei || currentAllowance === undefined) return true;
    return currentAllowance < amountInWei;
  }, [tokenIn.address, amountInWei, currentAllowance, quoteResult]);

  // minAmountOut hesapla
  const minAmountOut = useMemo(() => {
    if (!quoteResult?.best) return 0n;
    return (quoteResult.best.amountOut * BigInt(10000 - slippageBps)) / 10000n;
  }, [quoteResult, slippageBps]);

  // TokenIn bakiyesini güncelle
  const refetchBalanceIn = useCallback(() => {
    if (!address || !publicClient) return;
    
    if (tokenIn.address === NATIVE_ETH) {
      publicClient.getBalance({ address }).then((bal) => {
        setBalanceIn(formatUnits(bal, 18));
      }).catch(() => setBalanceIn('0'));
    } else {
      publicClient.readContract({ 
        address: tokenIn.address, 
        abi: erc20Abi, 
        functionName: 'balanceOf', 
        args: [address] 
      }).then((bal) => {
        setBalanceIn(formatUnits(bal as bigint, tokenIn.decimals));
      }).catch(() => setBalanceIn('0'));
    }
  }, [address, publicClient, tokenIn]);

  useEffect(() => {
    if (!address || !publicClient) { 
      setBalanceIn('0'); 
      return; 
    }
    refetchBalanceIn();
  }, [address, publicClient, tokenIn, refetchBalanceIn]);

  // TokenOut bakiyesini güncelle
  const refetchBalanceOut = useCallback(() => {
    if (!address || !publicClient) return;

    if (tokenOut.address === NATIVE_ETH) {
      publicClient.getBalance({ address }).then((bal) => {
        setBalanceOut(formatUnits(bal, 18));
      }).catch(() => setBalanceOut('0'));
    } else {
      publicClient.readContract({ 
        address: tokenOut.address, 
        abi: erc20Abi, 
        functionName: 'balanceOf', 
        args: [address] 
      }).then((bal) => {
        setBalanceOut(formatUnits(bal as bigint, tokenOut.decimals));
      }).catch(() => setBalanceOut('0'));
    }
  }, [address, publicClient, tokenOut]);

  useEffect(() => {
    if (!address || !publicClient) { 
      setBalanceOut('0'); 
      return; 
    }
    refetchBalanceOut();
  }, [address, publicClient, tokenOut, refetchBalanceOut]);

  // Quote fetching
  const fetchQuote = useCallback(async () => {
    if (!publicClient || !amountInWei || !tokenOut.address) return;
    setStep("quoting");
    
    console.log('Fetching quote:', {
      tokenInRaw: tokenIn.address,
      tokenOutRaw: tokenOut.address,
      amountIn: amountInWei.toString()
    });
    
    try {
      // RAW adresleri gönder (NATIVE_ETH olabilir), getBestQuote içinde wrap detection yapılacak
      const result = await getBestQuote(publicClient, tokenIn.address, tokenOut.address, amountInWei);
      console.log('Quote result:', result);
      setQuoteResult(result);
      if (!result.best) {
        const errMsg = "No liquidity found in any DEX for this pair. A liquidity pool must be created first.";
        showError(errMsg);
        setStep("error");
      } else {
        setStep("idle");
      }
    } catch (err) {
      console.error('Quote error:', err);
      const errMsg = err instanceof Error ? err.message : "Failed to get quote";
      showError(errMsg);
      setStep("error");
    }
  }, [publicClient, tokenIn.address, tokenOut.address, amountInWei, showError]);

  // Debounced quote
  useEffect(() => {
    if (!amountInWei || !tokenOut.address) {
      setQuoteResult(null);
      return;
    }
    const t = setTimeout(fetchQuote, 500);
    return () => clearTimeout(t);
  }, [amountInWei, tokenOut.address, fetchQuote]);

  const setAmountPercent = (pct: number) => {
    const bal = parseFloat(balanceIn);
    if (!bal) return;
    setAmountIn((bal * pct / 100).toFixed(tokenIn.decimals > 6 ? 6 : tokenIn.decimals));
  };

  const switchTokens = () => {
    setTokenIn(tokenOut); 
    setTokenOut(tokenIn);
    setAmountIn(''); 
    setQuoteResult(null);
  };

  // Approve handler
  const handleApprove = useCallback(async () => {
    if (!quoteResult?.best || !amountInWei || !address) return;
    setStep("approving");
    try {
      const spender = (quoteResult.best.dex === "uniswap"
        ? CONTRACTS.uniswap.swapRouter02
        : CONTRACTS.aerodrome.router) as Address;
      
      const hash = await writeContractAsync({
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amountInWei],
        dataSuffix: DATA_SUFFIX,
      });
      
      await publicClient?.waitForTransactionReceipt({ hash });
      await refetchAllowance();
      
      const basescanUrl = `https://basescan.org/tx/${hash}`;
      showSuccess('Token approved! You can now swap.', basescanUrl);
      setStep("idle");
    } catch (err) {
      const errorMessage = err instanceof Error ? humanizeError(err.message) : "Approve transaction failed";
      showError(errorMessage);
      setStep("error");
    }
  }, [quoteResult, amountInWei, tokenIn.address, writeContractAsync, publicClient, refetchAllowance, address, showSuccess, showError]);

  // Swap handler
  const handleSwap = useCallback(async () => {
    if (!quoteResult?.best || !amountInWei || !address) return;
    setStep("swapping");
    
    console.log('handleSwap called:', {
      best: quoteResult.best,
      tokenInAddr: tokenIn.address,
      tokenOutAddr: tokenOut.address,
      amountIn: amountInWei.toString(),
      minAmountOut: minAmountOut.toString()
    });
    
    try {
      const hash = await executeSwap({
        writeContractAsync,
        best: quoteResult.best,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountInWei,
        minAmountOut,
        userAddress: address,
        dataSuffix: DATA_SUFFIX,
      });

      console.log('Swap transaction sent:', hash);
      await publicClient?.waitForTransactionReceipt({ hash });
      
      // Swap başarılı, bakiyeleri hemen güncelle
      refetchBalanceIn();
      refetchBalanceOut();
      await refetchAllowance();
      
      // Success message with BaseScan link
      const basescanUrl = `https://basescan.org/tx/${hash}`;
      showSuccess('Swap successful!', basescanUrl);
      
      setStep("idle");
      setQuoteResult(null);
      // Don't reset amountIn - allow user to swap same amount again
    } catch (err) {
      console.error('Swap error:', err);
      const errorMessage = err instanceof Error ? humanizeError(err.message) : "Swap transaction failed";
      showError(errorMessage);
      setStep("error");
    }
  }, [quoteResult, amountInWei, minAmountOut, address, tokenIn.address, tokenOut.address, writeContractAsync, publicClient, refetchBalanceIn, refetchBalanceOut, refetchAllowance, showSuccess, showError]);

  // Rate calculation
  const rate = quoteResult?.best && parseFloat(amountIn) > 0 
    ? Number(formatUnits(quoteResult.best.amountOut, tokenOut.decimals)) / parseFloat(amountIn) 
    : null;

  if (!isConnected) {
    return (
      <div className="p-6" style={{ paddingTop: '80px' }}>
        <div className="max-w-lg mx-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 text-center text-sm text-[var(--text-secondary)]">
          Please connect your wallet to swap.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      {showModalIn && <TokenModal onSelect={(t) => { setTokenIn(t); setQuoteResult(null); }} onClose={() => setShowModalIn(false)} exclude={tokenOut} />}
      {showModalOut && <TokenModal onSelect={(t) => { setTokenOut(t); setQuoteResult(null); }} onClose={() => setShowModalOut(false)} exclude={tokenIn} />}

      <div className="max-w-lg mx-auto">
        {/* Main Swap Card */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {/* Header with Slippage */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Swap</h1>
            <button onClick={() => setShowSlippage(!showSlippage)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-opacity relative"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              ⊙ Slippage: {effectiveSlippage}%
              {showSlippage && (
                <div className="absolute right-0 top-12 z-20 rounded-xl p-3 shadow-xl w-52" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Slippage Tolerance</p>
                  <div className="flex gap-1 mb-2">
                    {SLIPPAGE_OPTIONS.map((s) => (
                      <button key={s} onClick={(e) => { e.stopPropagation(); setSlippage(s); setCustomSlippage(''); setShowSlippage(false); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: slippage === s && !customSlippage ? 'var(--ice-primary)' : 'var(--ice-pale)', color: slippage === s && !customSlippage ? '#fff' : 'var(--ice-deep)' }}>
                        %{s}
                      </button>
                    ))}
                  </div>
                  <input type="number" value={customSlippage} onChange={(e) => { e.stopPropagation(); setCustomSlippage(e.target.value); }} placeholder="Custom %" className="w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)', color: 'var(--ice-deep)' }} />
                </div>
              )}
            </button>
          </div>

          {/* You Pay */}
          <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>You pay</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{parseFloat(balanceIn).toFixed(6)}</span></span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="number" 
                value={amountIn} 
                onChange={(e) => setAmountIn(e.target.value)} 
                placeholder="0.0"
                className="flex-1 text-2xl font-bold bg-transparent focus:outline-none tabular-nums min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ color: 'var(--text-primary)' }} />
              <button onClick={() => setShowModalIn(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm flex-shrink-0"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                {tokenIn.logoURI ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#fff' }}>
                    <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = tokenIn.emoji; }} />
                  </div>
                ) : (
                  <span>{tokenIn.emoji}</span>
                )}
                <span>{tokenIn.symbol}</span>
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button key={pct} onClick={() => setAmountPercent(pct)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button onClick={switchTokens} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-surface)', border: '2px solid var(--border)', color: 'var(--ice-primary)' }}>↕</button>
          </div>

          {/* You Receive */}
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>You receive</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{parseFloat(balanceOut).toFixed(6)}</span></span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-bold tabular-nums min-w-0" style={{ color: quoteResult?.best ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {step === "quoting" ? '...' : quoteResult?.best ? Number(formatUnits(quoteResult.best.amountOut, tokenOut.decimals)).toFixed(6) : '0.0'}
              </div>
              <button onClick={() => setShowModalOut(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm flex-shrink-0"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                {tokenOut.logoURI ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#fff' }}>
                    <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = tokenOut.emoji; }} />
                  </div>
                ) : (
                  <span>{tokenOut.emoji}</span>
                )}
                <span>{tokenOut.symbol}</span>
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>
            </div>
          </div>

          {/* Rate - Inside Card, Two-way */}
          {rate && (
            <div className="flex items-center justify-between text-sm py-4 px-2" style={{ color: 'var(--text-secondary)' }}>
              <span>⇌ 1 {tokenIn.symbol} = <b style={{ color: 'var(--text-primary)' }}>{rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}</b> {tokenOut.symbol}</span>
              <span>≈ 1 {tokenOut.symbol} = <b style={{ color: 'var(--text-primary)' }}>{(1 / rate).toFixed(6)}</b> {tokenIn.symbol}</span>
            </div>
          )}

          {/* Single Action Button - Inside Card */}
          {!quoteResult?.best ? (
            <button disabled={step === "quoting"}
              className="w-full py-3 rounded-xl font-semibold text-base"
              style={{ background: amountIn && parseFloat(amountIn) > 0 && step !== "quoting" ? 'var(--ice-primary)' : 'var(--border)', color: amountIn && parseFloat(amountIn) > 0 ? '#fff' : 'var(--text-secondary)', cursor: amountIn && parseFloat(amountIn) > 0 && step !== "quoting" ? 'pointer' : 'not-allowed' }}>
              {step === "quoting" ? 'Getting Quote...' : amountIn ? 'Enter Amount' : 'Enter Amount'}
            </button>
          ) : needsApproval ? (
            <button onClick={handleApprove} disabled={step === "approving" || isTxLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-base"
              style={{ background: step === "approving" || isTxLoading ? 'var(--border)' : 'var(--ice-primary)' }}>
              {step === "approving" ? 'Approving...' : 'Approve'}
            </button>
          ) : (
            <button onClick={handleSwap} disabled={step === "swapping" || isTxLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-base"
              style={{ background: (step === "swapping" || isTxLoading) ? 'var(--border)' : 'var(--ice-primary)' }}>
              {step === "swapping" ? 'Sending Swap...' : 'Swap'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
