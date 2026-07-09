'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  tx_hash: string;
  from_token_symbol: string;
  to_token_symbol: string;
  from_token_name: string;
  to_token_name: string;
  from_token_logo?: string;
  to_token_logo?: string;
  from_amount: string;
  to_amount: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  user_address: string;
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!address || !isConnected) return;
    
    setLoading(true);
    // Fetch transactions from Supabase
    supabase
      .from('swap_history')
      .select('*')
      .eq('user_address', address.toLowerCase())
      .order('timestamp', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching transactions:', error);
          setTransactions([]);
        } else {
          setTransactions(data || []);
        }
        setLoading(false);
      });
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="p-6" style={{ paddingTop: '80px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-3xl mb-3">📜</div>
            <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Connect Your Wallet
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Wallet connection required to view transaction history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentTransactions = transactions.slice(startIdx, endIdx);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#D1FAE5', color: '#065F46', text: 'Completed' };
      case 'pending':
        return { bg: '#FEF3C7', color: '#92400E', text: 'Pending' };
      case 'failed':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'Failed' };
      default:
        return { bg: '#E5E7EB', color: '#1F2937', text: 'Unknown' };
    }
  };

  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            📜 Transaction History
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your complete swap transaction history on B20 FUN
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--ice-primary)' }}
          >
            History
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3"
              style={{ borderColor: 'var(--ice-primary)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading transactions...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--ice-pale)' }}>
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
              No Transaction History
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Start swapping tokens to see your transaction history
            </p>
            <a
              href="/swap"
              className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--ice-primary)' }}
            >
              Go to Swap
            </a>
          </div>
        ) : (
          <>
            {/* Transaction Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                <div className="col-span-5">
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    TRANSACTION
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    TIME
                  </span>
                </div>
                <div className="col-span-3 text-center">
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    STATUS
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    LINK
                  </span>
                </div>
              </div>

              {/* Transaction Rows */}
              <div>
                {currentTransactions.map((tx, idx) => {
                  const statusStyle = getStatusColor(tx.status);
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-opacity-50 transition-colors"
                      style={{
                        borderBottom: idx < currentTransactions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {/* Transaction */}
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {/* From Token */}
                          <div className="flex items-center gap-1.5">
                            {tx.from_token_logo ? (
                              <img
                                src={tx.from_token_logo}
                                alt={tx.from_token_symbol}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${tx.from_token_logo ? 'hidden' : ''}`}
                              style={{ background: 'var(--ice-primary)' }}
                            >
                              {tx.from_token_symbol.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {tx.from_token_symbol}
                            </span>
                          </div>

                          {/* Arrow */}
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            →
                          </span>

                          {/* To Token */}
                          <div className="flex items-center gap-1.5">
                            {tx.to_token_logo ? (
                              <img
                                src={tx.to_token_logo}
                                alt={tx.to_token_symbol}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${tx.to_token_logo ? 'hidden' : ''}`}
                              style={{ background: 'var(--ice-deep)' }}
                            >
                              {tx.to_token_symbol.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {tx.to_token_symbol}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="col-span-2 text-center">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatTime(tx.timestamp)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-3 flex justify-center">
                        <div
                          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={{ background: statusStyle.bg }}
                        >
                          <span style={{ color: statusStyle.color }}>✓</span>
                          <span className="text-xs font-semibold" style={{ color: statusStyle.color }}>
                            {statusStyle.text}
                          </span>
                        </div>
                      </div>

                      {/* Link */}
                      <div className="col-span-2 flex justify-end">
                        <a
                          href={`https://basescan.org/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
                          style={{ background: 'var(--ice-pale)' }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--ice-primary)' }}
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: currentPage === 1 ? 'var(--bg-base)' : 'var(--ice-pale)',
                    color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--ice-deep)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: currentPage === page ? 'var(--ice-primary)' : 'var(--bg-base)',
                      color: currentPage === page ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: currentPage === totalPages ? 'var(--bg-base)' : 'var(--ice-pale)',
                    color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--ice-deep)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
