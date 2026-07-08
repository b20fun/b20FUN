export default function ApiDocsPage() {
  return (
    <div className="p-6" style={{ paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto">
        <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border)', borderTop: '3px solid var(--ice-primary)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="text-2xl">🔌</div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>API / Developers</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Programmatic access to B20 token data via x402 protocol
              </p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>📡 API Endpoints</h2>
              <div className="rounded-xl p-4 space-y-2 font-mono text-sm" style={{ background: 'var(--ice-pale)' }}>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>GET</span>
                  <span className="flex-1 ml-4" style={{ color: 'var(--text-primary)' }}>/api/data/tokens</span>
                  <span style={{ color: 'var(--text-secondary)' }}>$0.005</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>GET</span>
                  <span className="flex-1 ml-4" style={{ color: 'var(--text-primary)' }}>/api/data/tokens/:address/history</span>
                  <span style={{ color: 'var(--text-secondary)' }}>$0.02</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>GET</span>
                  <span className="flex-1 ml-4" style={{ color: 'var(--text-primary)' }}>/api/data/tokens/live-feed</span>
                  <span style={{ color: 'var(--text-secondary)' }}>$0.10</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>💳 Payment Model</h2>
              <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                API usage is paid via USDC through the x402 protocol.
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <li>Micro-payment per request (pay-as-you-go)</li>
                <li>Rate limiting: 30 requests/minute (IP-based)</li>
                <li>Facilitator: Coinbase</li>
              </ul>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'var(--ice-pale)', border: '1px solid var(--ice-primary)' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🆓 Free Alternative</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Token list, detail pages and general statistics are free via the web interface.
                The API is paid only for bulk/programmatic data access.
              </p>
            </div>

            <div className="text-center py-6 rounded-xl text-sm" style={{ color: 'var(--text-secondary)', background: 'var(--ice-pale)' }}>
              🚧 API endpoints will be active soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
