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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 h-screen flex-col flex-shrink-0 shadow-sm" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
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

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        {/* Logo and Wallet */}
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
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
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AGROSFI</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>DEX Aggregator</div>
            </div>
          </Link>
          <div className="scale-90 origin-right">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>

        {/* Horizontal Scrollable Navigation */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
          <div className="flex gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${isActive ? 'ice-glow' : 'hover:opacity-80'}`}
                  style={{
                    background: isActive ? 'var(--ice-primary)' : 'var(--bg-base)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    border: isActive ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <span className="text-base">{item.name.split(' ')[0]}</span>
                  <span className="text-sm">{item.name.split(' ').slice(1).join(' ')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
