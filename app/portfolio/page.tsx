'use client';
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { createClient } from '@supabase/supabase-js';
import { erc20Abi } from '@/lib/swap/abis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const POPULAR_TOKENS = [
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' as Address, decimals: 18, logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address, decimals: 18, logo: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png' },
];

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState<'wallet' | 'b20' | 'created'>('wallet');
  const [ethBal, setEthBal] = useState('0');
  const [tokens, setTokens] = useState<any[]>([]);
  const [b20Tokens, setB20Tokens] = useState<any[]>([]);
  const [createdTokens, setCreatedTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1); // Reset page when tab changes
    if (!address || !publicClient) return;
    if (tab === 'wallet') {
      setLoading(true);
      Promise.all([
        publicClient.getBalance({ address }).then(b => setEthBal(formatUnits(b, 18))),
        Promise.all(POPULAR_TOKENS.map(async t => {
          try {
            const bal = await publicClient.readContract({ address: t.address, abi: erc20Abi, functionName: 'balanceOf', args: [address] });
            return { ...t, balance: formatUnits(bal as bigint, t.decimals) };
          } catch { return null; }
        })).then(r => setTokens(r.filter(Boolean) as any[]))
      ]).finally(() => setLoading(false));
    } else if (tab === 'b20') {
      setLoading(true);
      supabase.from('tokens').select('*').order('created_at', { ascending: false }).then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        const results = await Promise.all(data.map(async (t: any) => {
          try {
            const bal = await publicClient.readContract({ address: t.address, abi: erc20Abi, functionName: 'balanceOf', args: [address] });
            return bal > 0n ? { ...t, balance: formatUnits(bal as bigint, t.decimals) } : null;
          } catch { return null; }
        }));
        setB20Tokens(results.filter(Boolean) as any[]);
        setLoading(false);
      });
    } else if (tab === 'created') {
      setLoading(true);
      supabase.from('tokens').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        setCreatedTokens((data || []).filter((t: any) => t.deployer_address?.toLowerCase() === address.toLowerCase()));
        setLoading(false);
      });
    }
  }, [address, publicClient, tab]);

  if (!isConnected) return (
    <div className="p-6" style={{ paddingTop: '80px' }}><div className="max-w-4xl mx-auto"><div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="text-3xl mb-3">💼</div><h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Wallet connection required for portfolio.</p></div></div></div>
  );

  const shortAddr = (a: string) => a.slice(0, 6) + '...' + a.slice(-4);
  const timeAgo = (d: string) => { const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000); return h > 24 ? Math.floor(h/24) + ' days ago' : h > 0 ? h + ' hours ago' : 'Just now'; };

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}><div className="max-w-4xl mx-auto">
      <div className="mb-4"><h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📈 Portfolio</h1>
      <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{address}</p></div>
      
      <div className="flex gap-2 mb-4">
        {[['wallet','💰','Wallet'],['b20','🔥','My B20 Tokens'],['created','🚀','Created']].map(([k,e,n]) => (
          <button key={k} onClick={() => setTab(k as any)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" 
            style={{ background: tab === k ? 'var(--ice-primary)' : 'var(--bg-surface)', color: tab === k ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <span className="text-sm">{e}</span><span>{n}</span>
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--ice-primary)' }} /><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>}
      
      {!loading && tab === 'wallet' && (
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {/* Total Balance Header */}
          <div className="flex items-start justify-between mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>TOTAL BALANCE</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${((Number(ethBal) * 1780) + tokens.reduce((sum, t) => sum + (Number(t.balance) * (t.symbol === 'USDC' ? 1 : t.symbol === 'DAI' ? 1 : 1780)), 0)).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>24h Change</div>
              <div className="text-sm font-semibold" style={{ color: '#10B981' }}>+$0.00</div>
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-3">
            {/* ETH - always show if on page 1 */}
            {currentPage === 1 && (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" alt="ETH" className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ETH <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>Ethereum</span></div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{Number(ethBal).toFixed(4)} ETH</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>${(Number(ethBal) * 1780).toFixed(2)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>@$1,780</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--bg-base)' }}>
                    <div className="h-1 rounded-full" style={{ 
                      background: 'linear-gradient(90deg, var(--ice-primary) 0%, var(--ice-deep) 100%)', 
                      width: `${((Number(ethBal) * 1780) / ((Number(ethBal) * 1780) + tokens.reduce((sum, t) => sum + (Number(t.balance) * (t.symbol === 'USDC' ? 1 : t.symbol === 'DAI' ? 1 : 1780)), 0)) * 100).toFixed(1)}%` 
                    }} />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {((Number(ethBal) * 1780) / ((Number(ethBal) * 1780) + tokens.reduce((sum, t) => sum + (Number(t.balance) * (t.symbol === 'USDC' ? 1 : t.symbol === 'DAI' ? 1 : 1780)), 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Other Tokens - Paginated */}
            {(() => {
              const startIdx = currentPage === 1 ? (currentPage - 1) * itemsPerPage : (currentPage - 1) * itemsPerPage - 1;
              const endIdx = currentPage === 1 ? itemsPerPage - 1 : currentPage * itemsPerPage - 1;
              const paginatedTokens = tokens.slice(startIdx, endIdx);
              const totalValue = (Number(ethBal) * 1780) + tokens.reduce((sum, tk) => sum + (Number(tk.balance) * (tk.symbol === 'USDC' ? 1 : tk.symbol === 'DAI' ? 1 : 1780)), 0);
              
              return paginatedTokens.map((t: any, idx: number) => {
                const tokenPrice = t.symbol === 'USDC' ? 1 : t.symbol === 'DAI' ? 1 : 1780;
                const tokenValue = Number(t.balance) * tokenPrice;
                const percentage = (tokenValue / totalValue * 100).toFixed(1);
                const priceDisplay = tokenPrice >= 1000 ? `$${(tokenPrice/1000).toFixed(2)}K` : `$${tokenPrice.toFixed(2)}`;
                
                return (
                  <div key={t.address} className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <img src={t.logo} alt={t.symbol} className="w-8 h-8 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%2393C5FD"/><text x="50%" y="50%" font-size="14" fill="white" text-anchor="middle" dy=".3em">?</text></svg>'; }} />
                        <div>
                          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.symbol} <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>{t.symbol === 'WETH' ? 'Wrapped Ether' : t.symbol === 'USDC' ? 'USD Coin' : 'Dai Stablecoin'}</span></div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{Number(t.balance).toFixed(4)} {t.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>${tokenValue.toFixed(2)}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{priceDisplay}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--bg-base)' }}>
                        <div className="h-1 rounded-full" style={{ 
                          background: 'linear-gradient(90deg, var(--ice-primary) 0%, var(--ice-deep) 100%)', 
                          width: `${percentage}%` 
                        }} />
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{percentage}%</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Pagination */}
          {tokens.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ 
                  background: currentPage === 1 ? 'var(--bg-base)' : 'var(--ice-pale)', 
                  color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--ice-deep)', 
                  border: '1px solid var(--border)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                ←
              </button>
              
              {Array.from({ length: Math.ceil((tokens.length + 1) / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
                  style={{ 
                    background: currentPage === page ? 'var(--ice-primary)' : 'var(--bg-base)', 
                    color: currentPage === page ? '#fff' : 'var(--text-primary)', 
                    border: '1px solid var(--border)' 
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil((tokens.length + 1) / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil((tokens.length + 1) / itemsPerPage)}
                className="px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ 
                  background: currentPage === Math.ceil((tokens.length + 1) / itemsPerPage) ? 'var(--bg-base)' : 'var(--ice-pale)', 
                  color: currentPage === Math.ceil((tokens.length + 1) / itemsPerPage) ? 'var(--text-secondary)' : 'var(--ice-deep)', 
                  border: '1px solid var(--border)',
                  cursor: currentPage === Math.ceil((tokens.length + 1) / itemsPerPage) ? 'not-allowed' : 'pointer',
                  opacity: currentPage === Math.ceil((tokens.length + 1) / itemsPerPage) ? 0.5 : 1
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}


      {!loading && tab === 'b20' && (
        b20Tokens.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'var(--ice-pale)' }}><div className="text-3xl mb-3">📦</div>
          <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>No B20 token balance</h3>
          <div className="flex gap-2 justify-center mt-3"><a href="/swap" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--ice-primary)' }}>Swap</a></div></div>
        ) : (
          <div className="space-y-2">{b20Tokens.map((t: any) => (
            <div key={t.id} className="rounded-lg p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ background: 'var(--ice-primary)' }}>{t.symbol.slice(0,3)}</div>
                <div><div className="flex items-center gap-1.5 mb-0.5"><span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>{t.symbol}</span></div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{shortAddr(t.address)}</div></div></div>
                <div className="text-right"><div className="text-[10px] mb-0.5" style={{ color: 'var(--text-secondary)' }}>Balance</div>
                <div className="font-bold text-base tabular-nums" style={{ color: 'var(--text-primary)' }}>{Number(t.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t.symbol}</div></div>
              </div>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{timeAgo(t.created_at)}</span>
                <a href={`https://basescan.org/address/${t.address}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium hover:underline" style={{ color: 'var(--ice-primary)' }}>BaseScan →</a>
              </div>
            </div>
          ))}</div>
        )
      )}

      {!loading && tab === 'created' && (
        createdTokens.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'var(--ice-pale)' }}><div className="text-3xl mb-2">🚀</div>
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>No tokens created</p></div>
        ) : (
          <div className="space-y-2">{createdTokens.map((t: any) => (
            <div key={t.id} className="rounded-lg p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ background: 'var(--ice-deep)' }}>{t.symbol.slice(0,3)}</div>
                <div><div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name} <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>{t.symbol}</span></div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{shortAddr(t.address)}</div></div></div>
                <div className="text-right"><div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{timeAgo(t.created_at)}</div>
                <div className="text-[10px] px-1.5 py-0.5 rounded-full mt-1" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>{t.variant}</div></div>
              </div>
            </div>
          ))}</div>
        )
      )}
    </div></div>
  );
}
