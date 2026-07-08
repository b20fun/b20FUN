'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  variant: string;
  decimals: number;
  deployer_address: string;
  supply_cap: number | null;
  total_supply: number;
  created_at: string;
}

export default function ExplorePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filtered, setFiltered] = useState<Token[]>([]);
  const [search, setSearch] = useState('');
  const [variantFilter, setVariantFilter] = useState<'ALL' | 'ASSET' | 'STABLECOIN'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTokens() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError('Failed to load tokens.');
      } else {
        setTokens(data || []);
        setFiltered(data || []);
      }
      setLoading(false);
    }
    fetchTokens();
  }, []);

  useEffect(() => {
    let result = tokens;
    if (variantFilter !== 'ALL') {
      result = result.filter((t) => t.variant === variantFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, variantFilter, tokens]);

  function shortAddr(addr: string) {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return days + ' days ago';
    if (hours > 0) return hours + ' hours ago';
    if (mins > 0) return mins + ' minutes ago';
    return 'Just now';
  }

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)', borderTop: '3px solid var(--ice-primary)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="text-2xl">&#128202;</div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Explore</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Discover all B20 tokens</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search token name, symbol or address..."
              className="flex-1 rounded-xl px-4 py-3 focus:outline-none"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              {(['ALL', 'ASSET', 'STABLECOIN'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariantFilter(v)}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: variantFilter === v ? 'var(--ice-primary)' : 'var(--bg-surface)',
                    color: variantFilter === v ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {v === 'ALL' ? 'All' : v}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: 'var(--ice-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading tokens...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl p-4 mb-6" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <p style={{ color: 'var(--error)' }}>&#10060; {error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--ice-pale)' }}>
              <div className="text-3xl mb-2">&#128269;</div>
              {tokens.length === 0 ? (
                <>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No tokens created yet</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Be the first to create a B20 token via Launchpad!</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No search results found</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Try a different keyword.</p>
                </>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{filtered.length} tokens found</p>
              <div className="space-y-3">
                {filtered.map((token) => (
                  <div
                    key={token.id}
                    className="rounded-xl p-4 flex items-center justify-between gap-4"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: token.variant === 'STABLECOIN' ? 'var(--success)' : 'var(--ice-primary)' }}
                      >
                        {token.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{token.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--ice-pale)', color: 'var(--ice-deep)' }}>{token.symbol}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: token.variant === 'STABLECOIN' ? '#F0FDF4' : 'var(--ice-pale)', color: token.variant === 'STABLECOIN' ? 'var(--success)' : 'var(--ice-deep)' }}>{token.variant}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{shortAddr(token.address)}</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Deployer: {shortAddr(token.deployer_address)}</span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(token.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Decimals</div>
                      <div className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{token.decimals}</div>
                      {token.supply_cap && (
                        <>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Max Supply</div>
                          <div className="text-xs tabular-nums" style={{ color: 'var(--text-primary)' }}>{Number(token.supply_cap).toLocaleString()}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}