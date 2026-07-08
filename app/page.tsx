'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-3 px-3 py-1.5 rounded-full" style={{ background: 'var(--ice-pale)' }}>
            <span className="font-semibold text-xs" style={{ color: 'var(--ice-deep)' }}>⚡ Base Mainnet</span>
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--ice-deep)' }}>
            B20 FUN Platform
          </h1>
          <p className="text-lg mb-6 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Trade tokens at the best price across Base network DEXs
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/swap"
              className="px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover-ice-primary"
              style={{ background: 'var(--ice-primary)' }}
            >
              🔄 Start Swapping
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3 font-semibold rounded-xl transition-colors shadow-sm hover-ice-pale"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '2px solid var(--border)' }}
            >
              📊 Explore Tokens
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Link
            href="/swap"
            className="group p-6 rounded-xl transition-all hover:shadow-xl"
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)',
              borderTop: '3px solid var(--ice-primary)'
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl mb-3 group-hover:scale-110 transition-transform shadow-md"
              style={{ background: 'var(--ice-deep)' }}
            >
              🔄
            </div>
            <h3 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>DEX Aggregator</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Find the best price between Uniswap and Aerodrome and swap.
            </p>
          </Link>

          <Link
            href="/explore"
            className="group p-6 rounded-xl transition-all hover:shadow-xl"
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)',
              borderTop: '3px solid var(--ice-primary)'
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl mb-3 group-hover:scale-110 transition-transform shadow-md"
              style={{ background: 'var(--ice-primary)' }}
            >
              📊
            </div>
            <h3 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Explore</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Discover, search and analyze all B20 tokens in detail.
            </p>
          </Link>
        </div>

        {/* Stats / Features */}
        <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)' }}>
          <h3 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Platform Features</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1.5">✅</div>
              <h4 className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>ERC-20 Compatible</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fully compatible B20 standard</p>
            </div>
            <div>
              <div className="text-2xl mb-1.5">🔒</div>
              <h4 className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>Built-in Compliance</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Policy gating and roles</p>
            </div>
            <div>
              <div className="text-2xl mb-1.5">⚡</div>
              <h4 className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>Base Network</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fast and cheap transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
