# B20 FUN - Base B20 Token Launchpad & DEX Platform

Base network üzerinde B20 token standardı için kapsamlı bir platform:

- 🚀 **Launchpad** - Kod yazmadan B20 token oluşturma
- 🔄 **Swap** - DEX Aggregator (Uniswap V3 + Aerodrome)
- 📊 **Explore** - Token keşif ve arama
- 💧 **Liquidity** - Likidite yönetimi
- 📈 **Portfolio** - Token ve işlem takibi
- 🔌 **API** - x402 protokolü ile veri API'si

## Teknoloji Yığını

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Cüzdan**: RainbowKit + Wagmi + Viem
- **Veritabanı**: Supabase (PostgreSQL)
- **Blockchain**: Base Sepolia (testnet)
- **Stil**: Tailwind CSS

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`.env.local` dosyasını düzenleyin:

```env
# Reown Cloud (WalletConnect) projectId
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id

# Platform ücret alıcı adresi
NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS=0x...

# RPC ve Chain
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532

# Base Builder Code (Optional - Get yours from base.dev)
# Enables onchain attribution and rewards
NEXT_PUBLIC_BUILDER_CODE=bc_yourcode

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### Reown Project ID Alma
1. [cloud.reown.com](https://cloud.reown.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. Yeni proje oluşturun
4. Project ID'yi kopyalayın

#### Base Builder Code Alma (Opsiyonel)
1. [base.dev](https://base.dev) adresine gidin
2. Uygulamanızı kaydedin
3. Settings > Builder Code'dan kodunuzu alın
4. **Faydaları:**
   - 🎁 Transaction ödülleri kazanabilirsiniz
   - 📊 base.dev'de detaylı analytics
   - 🔍 App Leaderboard'larda görünürlük
5. **Not:** Builder Code ERC-8021 standardını kullanarak tüm transaction'lara otomatik olarak eklenir (smart contract'ları etkilemez)

#### Supabase Kurulumu
1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni proje oluşturun
3. SQL Editor'de `kiro-prompt.md` dosyasındaki veritabanı şemasını çalıştırın
4. Project Settings > API'den URL ve anahtarları alın

### 3. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Proje Yapısı

```
b20token/
├── app/                      # Next.js App Router sayfaları
│   ├── launchpad/           # Token oluşturma
│   ├── swap/                # DEX aggregator
│   ├── explore/             # Token keşfi
│   ├── liquidity/           # Likidite yönetimi
│   ├── portfolio/           # Kullanıcı portföyü
│   └── api-docs/            # API dokümantasyonu
├── components/              # React bileşenleri
│   ├── TestnetBanner.tsx   # Testnet uyarı banner'ı
│   ├── Navbar.tsx          # Ana navigasyon
│   ├── Footer.tsx          # Footer
│   └── NetworkGuard.tsx    # Ağ kontrolü modal
├── lib/                    # Yardımcı kütüphaneler
│   ├── wagmi.ts           # Wagmi/RainbowKit config
│   ├── supabase.ts        # Supabase client
│   └── constants.ts       # Kontrat adresleri ve sabitler
└── .env.local            # Ortam değişkenleri

```

## Kontrat Adresleri (Base Sepolia)

### B20 Precompiles
- **B20Factory**: `0xB20f000000000000000000000000000000000000`
- **Activation Registry**: `0x8453000000000000000000000000000000000001`
- **Policy Registry**: `0x8453000000000000000000000000000000000002`

### Uniswap V3
- **Universal Router**: `0x492E6456D9528771018DeB9E87ef7750EF184104`
- **QuoterV2**: `0xC5290058841028F1614F3A6F0F5816cAd0df5E27`
- **WETH**: `0x4200000000000000000000000000000000000006`

### Aerodrome
- **Router**: `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`
- **SlipStream Router**: `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5`

## Özellikler

### ✅ Tamamlanan
- [x] Proje iskeleti ve config
- [x] RainbowKit cüzdan entegrasyonu
- [x] Testnet banner ve ağ kontrolü
- [x] Ana sayfa ve navigasyon
- [x] Launchpad UI ve form
- [x] 2 aşamalı token oluşturma akışı

### 🚧 Devam Eden
- [ ] B20Factory ABI encoding (base-std entegrasyonu)
- [ ] Supabase veritabanı şeması kurulumu
- [ ] Token detay sayfası
- [ ] Swap aggregator mantığı
- [ ] Indexer (Vercel Cron)
- [ ] x402 API endpoints

## Güvenlik

⚠️ **ÖNEMLİ**: Bu platform kendi akıllı kontratı deploy etmez. Tüm işlemler doğrudan Base'in denetlenmiş B20Factory precompile'ına ve mevcut DEX'lere yapılır. Bu, hack riskini minimize eder.

## Lisans

MIT

## Destek

Sorularınız için issue açabilir veya dokümantasyonu inceleyebilirsiniz:
- [Base B20 Docs](https://docs.base.org/base-chain/specs/upgrades/beryl/b20)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Docs](https://wagmi.sh/)
