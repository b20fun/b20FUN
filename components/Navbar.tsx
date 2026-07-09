'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navigation = [
  { name: '🔄 Swap', href: '/swap' },
  { name: '📊 Explore', href: '/explore' },
  { name: '📈 Portfolio', href: '/portfolio' },
  { name: '📜 History', href: '/history' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-56 h-auto md:h-screen flex md:flex-col flex-shrink-0 shadow-sm overflow-x-auto md:overflow-x-visible scrollbar-hide" style={{ background: 'var(--bg-surface)', borderRight: '0 md:1px solid var(--border)', borderBottom: '1px md:0 solid var(--border)' }}>
      {/* Logo - Hidden on mobile */}
      <div className="hidden md:block p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-3">
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

      {/* Navigation - Horizontal scroll on mobile, vertical on desktop */}
      <nav className="flex md:flex-col flex-1 p-2 md:p-4 gap-2 md:gap-1 md:space-y-0 overflow-x-auto md:overflow-y-auto scrollbar-hide">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'ice-glow' : 'hover:opacity-80'}`}
              style={{
                background: isActive ? 'var(--ice-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
              }}
            >
              <span className="text-base md:text-xl">{item.name.split(' ')[0]}</span>
              <span>{item.name.split(' ').slice(1).join(' ')}</span>
            </Link>
          );
        })}
      </nav>

      {/* Wallet Connect - Hidden on mobile */}
      <div className="hidden md:block p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </aside>
  );
}
