# B20TOKEN - Geliştirme Yol Haritası

## ✅ Tamamlanan (Faz 1: İskelet)

- [x] Next.js 15 + TypeScript + Tailwind kurulumu
- [x] RainbowKit + Wagmi + Viem entegrasyonu
- [x] Supabase client setup
- [x] Ana layout (Navbar, Footer, TestnetBanner)
- [x] NetworkGuard (ağ kontrolü modal)
- [x] Ana sayfa (home page)
- [x] Launchpad UI (form + 2 aşamalı akış)
- [x] Placeholder sayfalar (Swap, Explore, Liquidity, Portfolio, API)
- [x] Kontrat adresleri ve constants
- [x] README ve SETUP dokümantasyonu

## 🚧 Devam Ediyor (Faz 2: Launchpad Tamamlama)

### Öncelik 1: B20Factory Entegrasyonu
- [ ] base-std kütüphanesi veya alternatif encoder
- [ ] Gerçek `B20FactoryLib.encodeAssetCreateParams` implementasyonu
- [ ] initCalls encoding (rol atamaları, supply cap)
- [ ] Transaction receipt'ten token address parsing
- [ ] Event listening (TokenCreated event)
- [ ] Hata yönetimi ve user-friendly error messages

### Öncelik 2: Supabase Entegrasyonu
- [ ] Token kaydı (başarılı launch sonrası)
- [ ] Token listesi API endpoint (`/api/tokens`)
- [ ] Token detay API endpoint (`/api/tokens/[address]`)
- [ ] Error handling ve retry logic

### Öncelik 3: UI İyileştirmeleri
- [ ] Loading states (skeleton screens)
- [ ] Toast bildirimleri (success/error)
- [ ] Transaction explorer link'leri (BaseScan)
- [ ] Copy to clipboard butonları
- [ ] Mobile responsive kontrol
- [ ] Form validation mesajları

## 📊 Faz 3: Explore & Token Detay

### Token Listesi Sayfası
- [ ] Supabase'den token listesi çekme
- [ ] Arama (search) fonksiyonu
- [ ] Filtreleme (Asset/Stablecoin, arz limiti vb.)
- [ ] Sıralama (yeni/eski, isim, sembol)
- [ ] Pagination
- [ ] Her token için card UI
- [ ] "Created via Launchpad" badge

### Token Detay Sayfası (`/token/[address]`)
- [ ] Token bilgileri (isim, sembol, adres, decimals)
- [ ] Supply bilgisi (current supply, cap)
- [ ] Admin ve roller listesi
- [ ] Policy durumu (allowlist/blocklist)
- [ ] Mint/Burn geçmişi tablosu
- [ ] Transfer event'leri
- [ ] Grafik (fiyat/supply history - opsiyonel)
- [ ] Contract interaction butonları (mint, burn, pause)

## 🔄 Faz 4: Swap (DEX Aggregator)

### Quote Fetching
- [ ] Uniswap QuoterV2 entegrasyonu
- [ ] Aerodrome Router quote entegrasyonu
- [ ] Paralel quote alma (Promise.all)
- [ ] En iyi route seçimi

### Swap UI
- [ ] Token seçici (dropdown/modal)
- [ ] Amount input'ları
- [ ] Slippage ayarı (0.5%, 1%, 5%, custom)
- [ ] Swap butonu ve onay akışı
- [ ] Gas tahmini gösterimi
- [ ] Fiyat karşılaştırma tablosu
- [ ] Transaction hash ve BaseScan link

### Swap Backend
- [ ] Token listesi API (tüm B20 + WETH)
- [ ] Quote API endpoint (optional, frontend'de de yapılabilir)
- [ ] Swap geçmişi Supabase'e kaydetme

## 💧 Faz 5: Liquidity

- [ ] Kullanıcının Uniswap V3 pozisyonları
- [ ] Kullanıcının Aerodrome pozisyonları
- [ ] LP token bilgileri
- [ ] "Add Liquidity" wizard (external link veya embed)
- [ ] "Remove Liquidity" fonksiyonu

## 📈 Faz 6: Portfolio

- [ ] Kullanıcının oluşturduğu token'lar
- [ ] Kullanıcının sahip olduğu B20 token'lar (balance check)
- [ ] Swap geçmişi
- [ ] Toplam değer hesaplama (optional)
- [ ] Export CSV özelliği

## 🤖 Faz 7: Indexer

### Vercel Cron Job
- [ ] `vercel.json` cron tanımı (her 1 dakika)
- [ ] `/api/cron/indexer` endpoint
- [ ] B20Factory event listening (TokenCreated)
- [ ] Token event listening (Mint, Burn, Transfer, Pause)
- [ ] Supabase'e bulk insert
- [ ] Duplicate check (tx_hash bazlı)
- [ ] Rate limiting (RPC overload önleme)

### Monitoring
- [ ] Cron job logs
- [ ] Hata bildirimi (optional: Discord webhook)
- [ ] Last indexed block tracking

## 🔌 Faz 8: x402 API

### x402 Entegrasyonu
- [ ] `x402-express` veya Next.js middleware kurulumu
- [ ] Coinbase facilitator config
- [ ] CDP API keys (testnet/mainnet)
- [ ] Payment verification

### API Endpoints (Ücretli)
- [ ] `/api/data/tokens` - Tüm token listesi ($0.005)
- [ ] `/api/data/tokens/:address/history` - Detaylı geçmiş ($0.02)
- [ ] `/api/data/tokens/live-feed` - WebSocket/SSE feed ($0.10)

### Rate Limiting
- [ ] Upstash Redis setup
- [ ] `@upstash/ratelimit` entegrasyonu
- [ ] middleware.ts (IP bazlı 30 req/min)
- [ ] Rate limit aşımı response (429)

### API Docs
- [ ] Swagger/OpenAPI spec
- [ ] Örnek request/response'lar
- [ ] Authentication guide (x402)
- [ ] Pricing tablosu
- [ ] Rate limit bilgisi

## 🧪 Faz 9: Test & QA

- [ ] E2E testler (Playwright/Cypress)
- [ ] Unit testler (önemli fonksiyonlar)
- [ ] Cüzdan bağlantı testleri
- [ ] Transaction flow testleri
- [ ] Mobile test (responsive)
- [ ] Farklı cüzdan testleri (MetaMask, Coinbase, Base Account)

## 🚀 Faz 10: Deploy & DevOps

### Vercel Deployment
- [ ] GitHub repo bağlama
- [ ] Environment variables setup (production)
- [ ] Domain bağlama (opsiyonel)
- [ ] Analytics kurulumu (Vercel Analytics)
- [ ] Monitoring (Sentry veya alternatif)

### Production Hazırlığı
- [ ] Base mainnet ağ desteği ekleme
- [ ] Mainnet kontrat adresleri config
- [ ] Fee recipient mainnet adresi
- [ ] Supabase production veritabanı
- [ ] RPC endpoint (Alchemy/Infura backup)

## 🎨 Ekstra Özellikler (Nice-to-Have)

- [ ] Dark/Light mode toggle
- [ ] Çoklu dil desteği (TR/EN)
- [ ] Token logo upload (IPFS)
- [ ] Social share butonları
- [ ] Notification system (new token alerts)
- [ ] Güven skoru algoritması (token risk analizi)
- [ ] Trending tokens (24h volume bazlı)
- [ ] Launchpad wizard (step-by-step guide)
- [ ] Gas price tracker
- [ ] Network status indicator

## 📚 Dokümantasyon

- [x] README.md
- [x] SETUP.md
- [ ] CONTRIBUTING.md
- [ ] API.md (API dokümantasyonu)
- [ ] ARCHITECTURE.md (mimari açıklama)
- [ ] VIDEO: Kurulum ve kullanım rehberi

## 🔐 Güvenlik

- [ ] Environment variables validation
- [ ] Input sanitization
- [ ] XSS protection kontrol
- [ ] CSRF token (API için)
- [ ] Rate limiting (tüm endpoint'ler)
- [ ] SQL injection prevention (Supabase RLS)
- [ ] Wallet signature verification (önemli işlemler için)

---

## Notlar

- Her özellik için ayrı branch açılmalı (`feature/swap`, `feature/indexer` vb.)
- PR'lar küçük ve odaklı olmalı (bir özellik = bir PR)
- Her PR'da ilgili TODO item'ı işaretlenmeli
- Breaking change'ler CHANGELOG.md'ye yazılmalı
- Mainnet deploy öncesi full security audit yapılmalı

## Tahmini Timeline

- Faz 1: ✅ Tamamlandı
- Faz 2-3: 1-2 hafta
- Faz 4-6: 2-3 hafta
- Faz 7-8: 1-2 hafta
- Faz 9-10: 1 hafta
- **Toplam**: 5-8 hafta (tek kişi, part-time)

## İletişim

Sorularınız için GitHub Issues kullanın veya `kiro-prompt.md` dokümantasyonunu referans alın.
