'use client';

import { useState } from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  const [activeSection, setActiveSection] = useState('intro');

  if (!isOpen) return null;

  const menuItems = [
    { id: 'intro', label: 'Getting Started', icon: '📖' },
    { id: 'what-is', label: 'What is AGROSFI?', icon: '❓' },
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'explore', label: 'Explore', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '📈' },
    { id: 'history', label: 'History', icon: '🧾' },
    { id: 'b20-standard', label: 'B20 Token Standard', icon: '🔷' },
    { id: 'architecture', label: 'Architecture Overview', icon: '🏗️' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'faq', label: 'FAQ', icon: '💬' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div 
        className="rounded-2xl w-full max-w-6xl mx-4 overflow-hidden shadow-2xl flex"
        style={{ 
          background: 'var(--bg-base)', 
          border: '1px solid var(--border)',
          height: '85vh'
        }}
      >
        {/* Left Sidebar - Menu */}
        <div 
          className="w-64 flex-shrink-0 overflow-y-auto"
          style={{ 
            background: 'var(--bg-surface)', 
            borderRight: '1px solid var(--border)' 
          }}
        >
          {/* Header */}
          <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-2xl">📖</div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>AGROSFI</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Documentation</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 text-left ${
                  activeSection === item.id ? '' : 'hover:opacity-80'
                }`}
                style={{
                  background: activeSection === item.id ? 'var(--ice-primary)' : 'transparent',
                  color: activeSection === item.id ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Close Button */}
          <div 
            className="flex items-center justify-between p-5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {menuItems.find(item => item.id === activeSection)?.label}
            </h1>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xl hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl">
              {activeSection === 'intro' && <IntroContent />}
              {activeSection === 'what-is' && <WhatIsContent />}
              {activeSection === 'swap' && <SwapContent />}
              {activeSection === 'explore' && <ExploreContent />}
              {activeSection === 'portfolio' && <PortfolioContent />}
              {activeSection === 'history' && <HistoryContent />}
              {activeSection === 'b20-standard' && <B20StandardContent />}
              {activeSection === 'architecture' && <ArchitectureContent />}
              {activeSection === 'security' && <SecurityContent />}
              {activeSection === 'faq' && <FAQContent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Components
function IntroContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        AGROSFI is a <strong>DEX Aggregator</strong> protocol running on the <strong>Base Mainnet</strong>. 
        For a single swap, it scans dozens of liquidity pools (Uniswap, Aerodrome) and finds the best route 
        based on a balance of price, gas, and slippage.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Three things set it apart from other aggregators:</h3>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>Lightning Fast</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Built on Base network for high-speed transactions with minimal gas fees.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>Multi-DEX Routing</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Compares prices across Uniswap and Aerodrome to find you the best rate.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>Built-in Compliance</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ERC-20 and B20 token standard support with role-based access control.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
        <p className="text-sm" style={{ color: '#92400E' }}>
          ⚠️ <strong>AGROSFI currently only operates on Base Mainnet.</strong> All transactions are irreversible — 
          check the price impact, slippage, and fees on the Swap Preview screen before confirming a swap.
        </p>
      </div>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Getting Started</h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        Network: <strong>Base Mainnet</strong> (an OP Stack-based Ethereum L2), native token <strong>ETH</strong>, 
        supported stablecoin <strong>USDC</strong>.
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        When determining a route, AGROSFI compares Uniswap V3 and Aerodrome. Pool depth, live price, 
        and gas cost are recalculated with every swap request.
      </p>
    </div>
  );
}

function WhatIsContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        AGROSFI is a decentralized platform that allows users to connect their wallets and swap tokens 
        on the Base network in seconds. Instead of sending transactions to a single exchange, the system 
        simultaneously scans major Base DEXs like <strong>Uniswap</strong> and <strong>Aerodrome</strong> 
        to offer users the most advantageous rate.
      </p>

      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        Additionally, AGROSFI enables the discovery, analysis, and trading of <strong>B20 standard tokens</strong> 
        created through its Launchpad infrastructure.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Key Highlights</h3>
      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <li>⚡ Fast and low-cost transactions on the Base network</li>
        <li>🔄 Best price comparison across multiple DEXs</li>
        <li>🔐 Built-in compliance and role-based access mechanisms</li>
        <li>🧩 Full compatibility with ERC-20 and B20 standards</li>
      </ul>
    </div>
  );
}

function SwapContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        The Swap screen is the heart of AGROSFI, enabling users to quickly swap between two tokens.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Features</h3>
      <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        <li><strong>You Pay / You Receive</strong> fields for selecting tokens to send and receive</li>
        <li>Quick wallet balance selection at <strong>25% / 50% / 75% / Max</strong> ratios</li>
        <li>Adjustable <strong>slippage tolerance</strong> — default 0.5%</li>
        <li>One-click token direction reversal (swap direction flip)</li>
        <li>Supported major tokens: <strong>ETH, WETH, USDC, DAI, cbETH, cbBTC</strong></li>
      </ul>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>How to Use</h3>
      <ol className="space-y-2 text-sm list-decimal pl-5" style={{ color: 'var(--text-secondary)' }}>
        <li>Select the token you want to pay from the "You Pay" field</li>
        <li>Enter the amount manually or use the percentage buttons</li>
        <li>Select the token you want to receive from the "You Receive" field</li>
        <li>Review the quote and slippage settings</li>
        <li>Click "Approve" if needed (for ERC-20 tokens)</li>
        <li>Click "Swap" and confirm the transaction in your wallet</li>
        <li>Track the result in the "History" tab</li>
      </ol>
    </div>
  );
}

function ExploreContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        The Explore tab is the discovery center where all <strong>B20 tokens</strong> created via the 
        Launchpad on the Base network are listed.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Features</h3>
      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <li>Search by name, symbol, or contract address</li>
        <li>Filter by <strong>All / Asset / Stablecoin</strong> categories</li>
        <li>View detailed analysis and market data for each token</li>
        <li>See token deployer address and creation timestamp</li>
      </ul>
    </div>
  );
}

function PortfolioContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        The Portfolio panel allows users to track all their wallet assets in a single screen.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Features</h3>
      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <li>Total balance and <strong>24-hour change</strong> tracking</li>
        <li>Amount, USD equivalent, and proportional weight for each token in the wallet</li>
        <li>Detailed asset management with <strong>Wallet / My B20 Tokens / Created</strong> tabs</li>
        <li>Visual progress bars showing portfolio allocation percentages</li>
      </ul>
    </div>
  );
}

function HistoryContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        The History screen transparently lists all completed swap transactions.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Features</h3>
      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <li>Transaction pair (e.g., USDC → ETH), timestamp, and status (Completed)</li>
        <li>Block explorer viewing link for each transaction</li>
        <li>Auto-refresh every 3 seconds for real-time updates</li>
        <li>Pagination for easy browsing (5 transactions per page)</li>
      </ul>
    </div>
  );
}

function B20StandardContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        AGROSFI offers a token standard called <strong>B20</strong> within its ecosystem, 
        which is fully compatible with ERC-20. Every token created via the Launchpad automatically:
      </p>

      <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        <li>✅ Conforms to the ERC-20 standard, works seamlessly with existing wallets and exchanges</li>
        <li>✅ Has a built-in <strong>compliance layer</strong> — supports role-based authorization and access restrictions (policy gating)</li>
        <li>✅ Is automatically listed in the Explore tab and can be included in Asset / Stablecoin categories</li>
      </ul>

      <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-2" style={{ color: 'var(--ice-deep)' }}>ERC-20 Compatible</h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          B20 tokens are fully compatible with the industry-standard ERC-20, ensuring broad compatibility 
          with existing DeFi infrastructure.
        </p>
      </div>
    </div>
  );
}

function ArchitectureContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        AGROSFI operates as an <strong>aggregator</strong>; it routes user transactions not to a single 
        exchange but to multiple liquidity sources:
      </p>

      <div className="p-6 rounded-lg font-mono text-xs mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <pre style={{ color: 'var(--text-secondary)' }}>{`
User Request
     │
     ▼
AGROSFI Router
     │
  ┌──┴──┐
  ▼     ▼
Uniswap  Aerodrome
  │     │
  └──┬──┘
     ▼
Best Price Selected
     │
     ▼
Swap Confirmed
        `}</pre>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        This structure ensures users always get the best market rate without having to manually check 
        each exchange individually.
      </p>
    </div>
  );
}

function SecurityContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Security & Compliance</h3>
      
      <div className="space-y-4">
        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>ERC-20 Compatible</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The B20 standard is fully compatible with industry-standard ERC-20
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>Built-in Compliance</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Role-based access and policy controls are embedded in the protocol
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--ice-deep)' }}>Base Network</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Fast and low-cost infrastructure leveraging Ethereum Layer 2 security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQContent() {
  return (
    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Which network does AGROSFI operate on?
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AGROSFI currently operates on <strong>Base Mainnet</strong>.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Which wallets are supported?
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            All EVM-compatible wallets that support the Base network (MetaMask, Coinbase Wallet, etc.) can be used.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Which exchanges does AGROSFI collect prices from?
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Currently, the main sources are <strong>Uniswap</strong> and <strong>Aerodrome</strong>; 
            coverage will be expanded over time.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            How are transaction fees determined?
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Thanks to Base network's low gas costs, transactions are fast and economical; 
            exact fees vary based on network congestion.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            How can I create a B20 token?
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You can create your own B20 token through the Launchpad feature in the Explore tab.
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--ice-pale)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-2" style={{ color: 'var(--ice-deep)' }}>Need More Help?</h4>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Join our community for support and updates:
        </p>
        <div className="flex gap-3">
          <a 
            href="https://x.com/agros_fi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--ice-primary)' }}
          >
            🐦 Twitter
          </a>
          <a 
            href="https://github.com/b20fun/b20FUN" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            💻 GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
