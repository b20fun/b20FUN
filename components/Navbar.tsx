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
      {/* Mobile: Hamburger Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile: Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative w-56 h-screen flex flex-col flex-shrink-0 shadow-sm transition-transform duration-300 ease-in-out z-50`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xl hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          ×
        </button>

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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

        {/* Wallet Connect */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </aside>
    </>
  );
}
