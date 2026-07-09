'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navigation = [
  { name: '🔄 B20 Swap', href: '/swap' },
  { name: '📊 Explore', href: '/explore' },
  { name: '📈 Portfolio', href: '/portfolio' },
  { name: '📜 History', href: '/history' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen flex flex-col flex-shrink-0 shadow-sm" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: '#fff' }}
          >
            <img 
              src="/b20 logo.png" 
              alt="B20 FUN Logo" 
              className="w-full h-full object-contain"
              style={{ padding: '2px' }}
            />
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>B20 FUN</div>
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
  );
}
