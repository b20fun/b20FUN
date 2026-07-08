'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { AERODROME } from '@/lib/constants';
import { aerodromeRouterAbi, erc20Abi } from '@/lib/swap/abis';
import { useToast } from '@/components/Toast';

const TOKENS = [
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' as `0x${string}`, decimals: 18 },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, decimals: 6 }, // Base Mainnet USDC
  { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' as `0x${string}`, decimals: 6 }, // Base Mainnet USDbC
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as `0x${string}`, decimals: 18 }, // Base Mainnet DAI
];

// Token seçim modalı
function TokenModal({ onSelect, onClose, exclude }: { onSelect: (t: typeof TOKENS[0]) => void; onClose: () => void; exclude: typeof TOKENS[0] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = TOKENS.filter(
    (t) => t.address !== exclude.address && (
      search === '' ||
      t.symbol.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
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
            placeholder="Search token..."
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--ice-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
          {filtered.map((token) => (
            <button key={token.address} onClick={() => { onSelect(token); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ice-pale)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <div className="flex-1 min-w-0">
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{token.symbol}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{token.address.slice(0, 6)}...{token.address.slice(-4)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LiquidityPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: txHash, writeContractAsync } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { showSuccess, showError } = useToast();

  const [tokenA, setTokenA] = useState(TOKENS[0]);
  const [tokenB, setTokenB] = useState(TOKENS[1]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balanceA, setBalanceA] = useState('0');
  const [balanceB, setBalanceB] = useState('0');
  const [tab, setTab] = useState<'add' | 'remove'>('add');
  const [showModalA, setShowModalA] = useState(false);
  const [showModalB, setShowModalB] = useState(false);
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [reserves, setReserves] = useState<{ reserveA: bigint; reserveB: bigint } | null>(null);
  const [isCheckingPool, setIsCheckingPool] = useState(false);
  const [poolAddress, setPoolAddress] = useState<Address | null>(null);
  const [lpBalance, setLpBalance] = useState('0');
  const [lpTotalSupply, setLpTotalSupply] = useState<bigint>(0n);

  const setAmountPercentA = (pct: number) => {
    const bal = parseFloat(balanceA);
    if (!bal) return;
    setAmountA((bal * pct / 100).toFixed(tokenA.decimals > 6 ? 6 : tokenA.decimals));
  };

  const setAmountPercentB = (pct: number) => {
    const bal = parseFloat(balanceB);
    if (!bal) return;
    setAmountB((bal * pct / 100).toFixed(tokenB.decimals > 6 ? 6 : tokenB.decimals));
  };

  // Havuz kontrolü - token çifti değiştiğinde
  useEffect(() => {
    if (!publicClient) return;
    
    async function checkPool() {
      setIsCheckingPool(true);
      setPoolExists(null);
      setReserves(null);
      setPoolAddress(null);
      
      try {
        // Aerodrome Factory'den pool adresini al
        const poolAddr = await publicClient!.readContract({
          address: AERODROME.POOL_FACTORY as Address,
          abi: [{
            inputs: [
              { internalType: 'address', name: 'tokenA', type: 'address' },
              { internalType: 'address', name: 'tokenB', type: 'address' },
              { internalType: 'bool', name: 'stable', type: 'bool' }
            ],
            name: 'getPool',
            outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }] as const,
          functionName: 'getPool',
          args: [tokenA.address, tokenB.address, false] // volatile pool
        });

        if (!poolAddr || poolAddr === '0x0000000000000000000000000000000000000000') {
          setPoolExists(false);
          setIsCheckingPool(false);
          return;
        }

        setPoolAddress(poolAddr as Address);

        // Pool var, rezervleri oku
        const reservesData = await publicClient!.readContract({
          address: poolAddr as Address,
          abi: [{
            inputs: [],
            name: 'getReserves',
            outputs: [
              { internalType: 'uint256', name: '_reserve0', type: 'uint256' },
              { internalType: 'uint256', name: '_reserve1', type: 'uint256' },
              { internalType: 'uint256', name: '_blockTimestampLast', type: 'uint256' }
            ],
            stateMutability: 'view',
            type: 'function'
          }] as const,
          functionName: 'getReserves'
        });

        // token0 kontrol
        const token0 = await publicClient!.readContract({
          address: poolAddr as Address,
          abi: [{
            inputs: [],
            name: 'token0',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }] as const,
          functionName: 'token0'
        });

        const isToken0A = token0.toLowerCase() === tokenA.address.toLowerCase();
        const reserveA = isToken0A ? reservesData[0] : reservesData[1];
        const reserveB = isToken0A ? reservesData[1] : reservesData[0];

        setReserves({ reserveA, reserveB });
        setPoolExists(true);
        
        // LP token totalSupply - rate limit'e takılmamak için try-catch içinde
        try {
          const totalSup = await publicClient!.readContract({
            address: poolAddr as Address,
            abi: erc20Abi,
            functionName: 'totalSupply'
          });
          setLpTotalSupply(totalSup as bigint);
        } catch (err) {
          console.warn('Could not fetch totalSupply:', err);
          setLpTotalSupply(1n); // Fallback value
        }
      } catch (err) {
        console.error('Pool check error:', err);
        setPoolExists(false);
      } finally {
        setIsCheckingPool(false);
      }
    }

    checkPool();
  }, [publicClient, tokenA.address, tokenB.address]);

  // AmountA değiştiğinde amountB'yi otomatik hesapla (havuz varsa)
  useEffect(() => {
    if (!amountA || !reserves || !poolExists) return;
    
    try {
      const amtA = parseUnits(amountA, tokenA.decimals);
      // amountB = (amountA * reserveB) / reserveA
      const amtB = (amtA * reserves.reserveB) / reserves.reserveA;
      setAmountB(formatUnits(amtB, tokenB.decimals));
    } catch {
      // ignore
    }
  }, [amountA, reserves, poolExists, tokenA.decimals, tokenB.decimals]);

  useEffect(() => {
    if (!address || !publicClient) return;
    async function fetchBalances() {
      try {
        const [ba, bb] = await Promise.all([
          publicClient!.readContract({ address: tokenA.address, abi: erc20Abi, functionName: 'balanceOf', args: [address!] }),
          publicClient!.readContract({ address: tokenB.address, abi: erc20Abi, functionName: 'balanceOf', args: [address!] }),
        ]);
        setBalanceA(formatUnits(ba as bigint, tokenA.decimals));
        setBalanceB(formatUnits(bb as bigint, tokenB.decimals));
      } catch { /* ignore */ }
    }
    fetchBalances();
  }, [address, publicClient, tokenA, tokenB]);

  // LP token bakiyesini oku - sadece remove tab'ında
  useEffect(() => {
    if (!address || !publicClient || !poolAddress || tab !== 'remove') {
      setLpBalance('0');
      return;
    }
    
    async function fetchLpBalance() {
      try {
        const balance = await publicClient!.readContract({
          address: poolAddress!,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address!]
        });
        setLpBalance(formatUnits(balance as bigint, 18)); // LP tokens are 18 decimals
      } catch (err) {
        console.error('LP balance fetch error:', err);
        setLpBalance('0');
      }
    }
    
    fetchLpBalance();
  }, [address, publicClient, poolAddress, tab]);

  const handleRemoveLiquidity = async () => {
    if (!address || !isConnected || !poolAddress || !reserves) {
      showError('Missing required information');
      return;
    }

    const lpAmount = parseUnits(lpBalance, 18);
    if (lpAmount === 0n) {
      showError('No liquidity to withdraw');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      
      // Slippage %5
      const slippageBps = 500n;
      const shareA = (lpAmount * reserves.reserveA) / lpTotalSupply;
      const shareB = (lpAmount * reserves.reserveB) / lpTotalSupply;
      const minA = (shareA * (10000n - slippageBps)) / 10000n;
      const minB = (shareB * (10000n - slippageBps)) / 10000n;

      console.log('Removing liquidity:', {
        lpAmount: lpAmount.toString(),
        minA: minA.toString(),
        minB: minB.toString()
      });

      // Approve LP token to router
      const hashApprove = await writeContractAsync({
        address: poolAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AERODROME.ROUTER as Address, lpAmount]
      });
      await publicClient?.waitForTransactionReceipt({ hash: hashApprove });

      // Remove Liquidity
      const hash = await writeContractAsync({
        address: AERODROME.ROUTER as Address,
        abi: [{
          inputs: [
            { internalType: 'address', name: 'tokenA', type: 'address' },
            { internalType: 'address', name: 'tokenB', type: 'address' },
            { internalType: 'bool', name: 'stable', type: 'bool' },
            { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
            { internalType: 'uint256', name: 'amountAMin', type: 'uint256' },
            { internalType: 'uint256', name: 'amountBMin', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          ],
          name: 'removeLiquidity',
          outputs: [
            { internalType: 'uint256', name: 'amountA', type: 'uint256' },
            { internalType: 'uint256', name: 'amountB', type: 'uint256' },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        }] as const,
        functionName: 'removeLiquidity',
        args: [tokenA.address, tokenB.address, false, lpAmount, minA, minB, address, deadline],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      
      const basescanUrl = `https://basescan.org/tx/${hash}`;
      showSuccess('Liquidity withdrawn successfully!', basescanUrl);
      
      // Refresh balances
      setLpBalance('0');
    } catch (err: any) {
      console.error('Remove liquidity error:', err);
      const errorMsg = err?.message || 'Failed to withdraw liquidity';
      showError(errorMsg);
    }
  };

  const handleAddLiquidity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!address || !isConnected) {
      showError('Wallet not connected');
      return;
    }
    
    if (!amountA || !amountB) {
      showError('Both amounts must be entered');
      return;
    }

    if (poolExists === false) {
      showError('Pool not found for this token pair. A pool must be created first.');
      return;
    }

    try {
      const amtA = parseUnits(amountA, tokenA.decimals);
      const amtB = parseUnits(amountB, tokenB.decimals);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      
      // Slippage toleransı %5 (daha gevşek)
      const slippageBps = 500n; // 5%
      const minA = (amtA * (10000n - slippageBps)) / 10000n;
      const minB = (amtB * (10000n - slippageBps)) / 10000n;

      console.log('Adding liquidity:', {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        amountA: amtA.toString(),
        amountB: amtB.toString(),
        minA: minA.toString(),
        minB: minB.toString()
      });

      // Approve Token A
      const hashA = await writeContractAsync({
        address: tokenA.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AERODROME.ROUTER as Address, amtA]
      });
      await publicClient?.waitForTransactionReceipt({ hash: hashA });
      console.log('Token A approved:', hashA);

      // Approve Token B
      const hashB = await writeContractAsync({
        address: tokenB.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AERODROME.ROUTER as Address, amtB]
      });
      await publicClient?.waitForTransactionReceipt({ hash: hashB });
      console.log('Token B approved:', hashB);

      // Add Liquidity
      const hash = await writeContractAsync({
        address: AERODROME.ROUTER as Address,
        abi: [{
          inputs: [
            { internalType: 'address', name: 'tokenA', type: 'address' },
            { internalType: 'address', name: 'tokenB', type: 'address' },
            { internalType: 'bool', name: 'stable', type: 'bool' },
            { internalType: 'uint256', name: 'amountADesired', type: 'uint256' },
            { internalType: 'uint256', name: 'amountBDesired', type: 'uint256' },
            { internalType: 'uint256', name: 'amountAMin', type: 'uint256' },
            { internalType: 'uint256', name: 'amountBMin', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          ],
          name: 'addLiquidity',
          outputs: [
            { internalType: 'uint256', name: 'amountA', type: 'uint256' },
            { internalType: 'uint256', name: 'amountB', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        }] as const,
        functionName: 'addLiquidity',
        args: [tokenA.address, tokenB.address, false, amtA, amtB, minA, minB, address, deadline],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      
      const basescanUrl = `https://basescan.org/tx/${hash}`;
      showSuccess('Liquidity added successfully!', basescanUrl);
      
      // Reset form
      setAmountA('');
      setAmountB('');
    } catch (err: any) {
      console.error('Add liquidity error:', err);
      const errorMsg = err?.message || 'Failed to add liquidity';
      showError(errorMsg);
    }
  };

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      {showModalA && <TokenModal onSelect={setTokenA} onClose={() => setShowModalA(false)} exclude={tokenB} />}
      {showModalB && <TokenModal onSelect={setTokenB} onClose={() => setShowModalB(false)} exclude={tokenA} />}

      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {/* Header with Tabs */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Liquidity</h1>
            <div className="flex gap-2">
              {(['add', 'remove'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: tab === t ? 'var(--ice-primary)' : 'var(--bg-base)', color: tab === t ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {t === 'add' ? 'Add' : 'Remove'}
                </button>
              ))}
            </div>
          </div>

          {tab === 'add' && (
            <form onSubmit={handleAddLiquidity} className="space-y-3">
              {/* Token A */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Token A</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{Number(balanceA).toFixed(6)}</span></span>
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                  <input type="number" value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="0.0" required
                    className="flex-1 text-2xl font-bold bg-transparent focus:outline-none tabular-nums min-w-0"
                    style={{ color: 'var(--text-primary)' }} />
                  <button type="button" onClick={() => setShowModalA(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <span>{tokenA.symbol}</span>
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} type="button" onClick={() => setAmountPercentA(pct)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {pct === 100 ? 'MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plus Sign */}
              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg"
                  style={{ background: 'var(--bg-surface)', border: '2px solid var(--border)', color: 'var(--ice-primary)' }}>+</div>
              </div>

              {/* Token B */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Token B</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{Number(balanceB).toFixed(6)}</span></span>
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                  <input 
                    type="number" 
                    value={amountB} 
                    onChange={(e) => !poolExists && setAmountB(e.target.value)}
                    placeholder="0.0" 
                    required
                    readOnly={poolExists === true}
                    className="flex-1 text-2xl font-bold bg-transparent focus:outline-none tabular-nums min-w-0"
                    style={{ color: poolExists ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: poolExists ? 'not-allowed' : 'text' }} />
                  <button type="button" onClick={() => setShowModalB(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <span>{tokenB.symbol}</span>
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </button>
                </div>

                {!poolExists && (
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button key={pct} type="button" onClick={() => setAmountPercentB(pct)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center text-xs py-3" style={{ color: 'var(--text-secondary)' }}>
                {isCheckingPool ? (
                  'Checking pool...'
                ) : poolExists === false ? (
                  '⚠️ Pool not found for this pair'
                ) : poolExists === true && reserves ? (
                  `Current pool rate: 1 ${tokenA.symbol} = ${(Number(formatUnits(reserves.reserveB, tokenB.decimals)) / Number(formatUnits(reserves.reserveA, tokenA.decimals))).toFixed(6)} ${tokenB.symbol}`
                ) : (
                  'Aerodrome volatile pool • 5% slippage tolerance'
                )}
              </div>

              {/* Button */}
              {!isConnected ? (
                <button type="button" disabled className="w-full py-3 rounded-xl font-semibold text-base cursor-not-allowed" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>Connect Wallet</button>
              ) : poolExists === false ? (
                <button type="button" disabled className="w-full py-3 rounded-xl font-semibold text-base cursor-not-allowed" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>Pool Not Found</button>
              ) : (
                <button type="submit" disabled={isTxLoading || isCheckingPool} className="w-full py-3 rounded-xl font-semibold text-white text-base"
                  style={{ background: (isTxLoading || isCheckingPool) ? 'var(--border)' : 'var(--ice-primary)' }}>
                  {isTxLoading ? 'Processing...' : isCheckingPool ? 'Checking Pool...' : 'Add Liquidity'}
                </button>
              )}
            </form>
          )}

          {tab === 'remove' && (
            <>
              {parseFloat(lpBalance) > 0 && reserves && lpTotalSupply > 0n ? (
                <div className="space-y-4">
                  {/* Pozisyon Kartı */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{tokenA.symbol}/{tokenB.symbol}</span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>Volatile</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>LP Token</div>
                        <div className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{parseFloat(lpBalance).toFixed(6)}</div>
                      </div>
                    </div>

                    {/* Pooled Tokens */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pooled {tokenA.symbol}</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {(() => {
                            const lpBalanceBigInt = parseUnits(lpBalance, 18);
                            const share = (lpBalanceBigInt * reserves.reserveA) / lpTotalSupply;
                            return parseFloat(formatUnits(share, tokenA.decimals)).toFixed(6);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pooled {tokenB.symbol}</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {(() => {
                            const lpBalanceBigInt = parseUnits(lpBalance, 18);
                            const share = (lpBalanceBigInt * reserves.reserveB) / lpTotalSupply;
                            return parseFloat(formatUnits(share, tokenB.decimals)).toFixed(6);
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Pool Share */}
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pool Share</span>
                        <span className="font-semibold" style={{ color: 'var(--ice-primary)' }}>
                          {(() => {
                            const lpBalanceBigInt = parseUnits(lpBalance, 18);
                            const sharePercent = (Number(lpBalanceBigInt) / Number(lpTotalSupply)) * 100;
                            return sharePercent.toFixed(4);
                          })()}%
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button 
                      type="button"
                      onClick={handleRemoveLiquidity}
                      disabled={isTxLoading}
                      className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
                      style={{ background: isTxLoading ? 'var(--border)' : 'var(--ice-primary)', cursor: isTxLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {isTxLoading ? 'Processing...' : 'Remove All Liquidity'}
                    </button>
                  </div>

                  {/* Pool Info */}
                  <div className="text-center text-xs py-2" style={{ color: 'var(--text-secondary)' }}>
                    Pool address: {poolAddress?.slice(0, 6)}...{poolAddress?.slice(-4)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl" style={{ background: 'var(--ice-pale)' }}>
                  <div className="text-4xl mb-3">💧</div>
                  <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No liquidity positions</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    After adding liquidity, your position will appear here and you can withdraw from here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}