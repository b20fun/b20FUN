'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

const navigation = [
  { name: '🔄 Swap', href: '/swap' },
  { name: '📊 Explore', href: '/explore' },
  { name: '📈 Portfolio', href: '/portfolio' },
  { name: '📜 History', href: '/history' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile: Toggle Button (Hamburger/Close) */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {isMenuOpen ? (
          // Close icon (X)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Hamburger icon (≡)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative w-56 h-screen flex flex-col flex-shrink-0 shadow-xl transition-transform duration-300 ease-in-out z-40`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: '#fff' }}
            >
              <img 
                src="/b20 logo.png" 
                alt="AGROSFI Logo" 
                className="w-full h-full object-contain"
                style={{ padding: '2px' }}
              />
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>AGROSFI</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>DEX Aggregator</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'ice-glow' : 'hover:opacity-80'}`}
                style={{
                  background: isActive ? 'var(--ice-primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                <span className="text-xl">{item.name.split(' ')[0]}</span>
                <span>{item.name.split(' ').slice(1).join(' ')}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Connect - Always visible at bottom */}
        <div className="p-4 flex-shrink-0 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </aside>
    </>
  );
}
