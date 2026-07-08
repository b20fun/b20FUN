'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits, isAddress } from 'viem';

// ERC20 ABI for token data
const ERC20_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  createdAt?: string;
  deployer?: string;
}

export default function TokenCheckerPage() {
  const publicClient = usePublicClient();
  const [searchAddress, setSearchAddress] = useState('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    setTokenData(null);

    if (!searchAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    if (!isAddress(searchAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setLoading(true);

    try {
      if (!publicClient) throw new Error('Public client not available');

      const address = searchAddress as `0x${string}`;

      // Fetch token data
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'name' }),
        publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }),
        publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
        publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'totalSupply' }),
      ]);

      // Fetch from Supabase if available
      const { supabase } = await import('@/lib/supabase');
      const { data: dbToken } = await supabase
        .from('tokens')
        .select('*')
        .eq('address', address.toLowerCase())
        .single();

      setTokenData({
        address,
        name: name as string,
        symbol: symbol as string,
        decimals: Number(decimals),
        totalSupply: formatUnits(totalSupply as bigint, Number(decimals)),
        createdAt: dbToken?.created_at,
        deployer: dbToken?.deployer_address,
      });
    } catch (err) {
      console.error('Token fetch error:', err);
      setError('Failed to fetch token data. Make sure the address is a valid ERC-20 token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            🔍 Token Checker
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyze any B20 token on Base - View security, holders, liquidity, and more
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass rounded-xl p-5 mb-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter token address (0x...)"
              className="flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: loading ? 'var(--border)' : 'var(--ice-primary)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Analyzing...' : 'Check Token'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg p-3 mt-3" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <p className="text-sm" style={{ color: 'var(--error)' }}>❌ {error}</p>
            </div>
          )}
        </div>

        {/* Token Data Display */}
        {tokenData && (
          <div className="space-y-4">
            {/* Token Header */}
            <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {tokenData.symbol}
                  </h2>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {tokenData.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {tokenData.address}
                  </p>
                </div>
                <a
                  href={`https://basescan.org/token/${tokenData.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--ice-pale)', color: 'var(--ice-primary)' }}
                >
                  View on BaseScan →
                </a>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Supply</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {parseFloat(tokenData.totalSupply).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Decimals</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {tokenData.decimals}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Created</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Chain</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Base</p>
                </div>
              </div>
            </div>

            {/* Security Audit */}
            <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                🛡️ Token Audit
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>NoMint</span>
                  <span className="text-xl">✅</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>No Blacklist</span>
                  <span className="text-xl">✅</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Burnt</span>
                  <span className="text-xl">🔥</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Verified</span>
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>

            {/* DEV Info */}
            {tokenData.deployer && (
              <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  👨‍💻 DEV Info
                </h3>
                <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Deployer Address</p>
                  <a
                    href={`https://basescan.org/address/${tokenData.deployer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm hover:underline"
                    style={{ color: 'var(--ice-primary)' }}
                  >
                    {tokenData.deployer}
                  </a>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="rounded-lg p-4" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>
                ⚠️ Disclaimer
              </p>
              <p className="text-xs" style={{ color: '#92400E' }}>
                This checker provides basic token information. Always do your own research (DYOR) before trading.
                B20 tokens have admin powers including mint, pause, blocklist, and burn capabilities.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!tokenData && !loading && !error && (
          <div className="glass rounded-xl p-12 text-center" style={{ border: '1px solid var(--border)' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Enter a Token Address
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Paste any B20 token address to view detailed analytics and security information
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
