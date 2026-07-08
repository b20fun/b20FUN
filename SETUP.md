# B20TOKEN Kurulum Rehberi

Bu dokümanda projeyi sıfırdan kurma adımları detaylıca açıklanmıştır.

## Ön Gereksinimler

- Node.js 18+ yüklü olmalı
- Base Sepolia testnet'te test ETH'iniz olmalı (ücretsiz faucet: [faucet.base.org](https://faucet.base.org))
- MetaMask veya başka bir Web3 cüzdanınız olmalı

## Adım 1: Reown (WalletConnect) Project ID

1. [cloud.reown.com](https://cloud.reown.com) adresine gidin
2. "Sign Up" ile ücretsiz hesap oluşturun (GitHub ile giriş yapabilirsiniz)
3. "Create New Project" butonuna tıklayın
4. Proje adı: `B20TOKEN` (veya istediğiniz isim)
5. Project ID'yi kopyalayın
6. `.env.local` dosyasında `NEXT_PUBLIC_REOWN_PROJECT_ID` değişkenine yapıştırın

## Adım 2: Supabase Veritabanı

### 2a. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" > "Sign up" (GitHub ile giriş yapabilirsiniz)
3. "New project" butonuna tıklayın
4. Organization seçin veya yeni oluşturun
5. Proje ayarları:
   - Name: `b20token`
   - Database Password: Güçlü bir şifre oluşturun (kaydedin!)
   - Region: En yakın bölgeyi seçin (örn: Frankfurt, Amsterdam)
   - Plan: Free tier (hobi projeleri için yeterli)
6. "Create new project" butonuna tıklayın (1-2 dakika sürer)

### 2b. Veritabanı Şemasını Oluşturma

1. Sol menüden "SQL Editor" sekmesine gidin
2. Aşağıdaki SQL kodunu yapıştırın ve çalıştırın:

```sql
-- Oluşturulan tüm B20 token'ları
create table tokens (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  name text not null,
  symbol text not null,
  variant text not null check (variant in ('ASSET', 'STABLECOIN')),
  decimals int not null,
  admin_address text not null,
  deployer_address text not null,
  supply_cap numeric,
  total_supply numeric default 0,
  created_via_launchpad boolean default true,
  tx_hash text not null,
  created_at timestamptz default now()
);

-- Mint/Burn olayları
create table token_events (
  id uuid primary key default gen_random_uuid(),
  token_address text references tokens(address),
  event_type text not null check (event_type in ('mint', 'burn', 'burn_blocked', 'transfer', 'pause', 'unpause')),
  from_address text,
  to_address text,
  amount numeric,
  tx_hash text not null,
  block_number bigint not null,
  created_at timestamptz default now()
);

-- Rol atamaları
create table token_roles (
  id uuid primary key default gen_random_uuid(),
  token_address text references tokens(address),
  role_type text not null check (role_type in ('ADMIN', 'MINT', 'BURN', 'BURN_BLOCKED', 'PAUSE', 'UNPAUSE', 'METADATA')),
  holder_address text not null,
  granted_at timestamptz default now(),
  revoked_at timestamptz
);

-- Policy (allowlist/blocklist) durumu
create table token_policies (
  id uuid primary key default gen_random_uuid(),
  token_address text references tokens(address),
  policy_type text not null check (policy_type in ('ALLOWLIST', 'BLOCKLIST', 'NONE')),
  target_address text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

-- Swap geçmişi (opsiyonel, analitik için)
create table swaps (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  token_in text not null,
  token_out text not null,
  amount_in numeric not null,
  amount_out numeric not null,
  dex_used text not null check (dex_used in ('uniswap', 'aerodrome')),
  tx_hash text not null,
  created_at timestamptz default now()
);

-- İndeksler
create index idx_tokens_address on tokens(address);
create index idx_token_events_token on token_events(token_address);
create index idx_token_events_type on token_events(event_type);
create index idx_swaps_user on swaps(user_address);
```

3. "Run" butonuna tıklayın (veya Ctrl+Enter)
4. "Success. No rows returned" mesajını görmelisiniz

### 2c. API Anahtarlarını Alma

1. Sol menüden "Project Settings" > "API" sekmesine gidin
2. Aşağıdaki değerleri kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (uzun bir JWT token)
   - **service_role**: `eyJhbG...` (uzun bir JWT token - gizli tutun!)

3. `.env.local` dosyasına ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## Adım 3: Platform Ücret Adresi

Token oluşturma ücretlerinin gönderileceği cüzdan adresinizi ayarlayın:

```env
NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS=0xYourWalletAddress
```

⚠️ **ÖNEMLİ**: Bu adres sizin kontrolünüzdeki bir cüzdan adresi olmalı. Token oluşturma ücreti (0.002 ETH) bu adrese gönderilecek.

## Adım 4: Projeyi Çalıştırma

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Build kontrolü:
```bash
npm run build
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın

## Adım 5: Cüzdan Bağlama ve Test

1. Sağ üstten "Connect Wallet" butonuna tıklayın
2. MetaMask'ı seçin (veya tercih ettiğiniz cüzdanı)
3. Base Sepolia ağına geçin (otomatik istek gelecek)
4. Test ETH almak için: [faucet.base.org](https://faucet.base.org)

## Adım 6: İlk Token'ınızı Oluşturun

1. Sol menüden "🚀 Launchpad" sayfasına gidin
2. Token bilgilerini doldurun:
   - İsim: `Test Token`
   - Sembol: `TEST`
   - Tür: Asset
   - Ondalık: 18
3. "Token Oluşturmaya Başla" butonuna tıklayın
4. İki ayrı işlemi onaylayın:
   - Adım 1: 0.002 ETH ücret ödemesi
   - Adım 2: Token oluşturma

## Sorun Giderme

### "Yanlış Ağ" Hatası
- Cüzdanınızın Base Sepolia ağında olduğundan emin olun
- Chain ID: 84532
- RPC URL: https://sepolia.base.org

### "Invalid supabaseUrl" Hatası
- `.env.local` dosyasındaki Supabase URL'in doğru olduğundan emin olun
- URL `https://` ile başlamalı

### "Insufficient funds for gas" Hatası
- Base Sepolia test ETH'iniz yok
- [faucet.base.org](https://faucet.base.org) adresinden ücretsiz test ETH alın

### Build Hataları
- `node_modules` klasörünü silin ve tekrar yükleyin:
  ```bash
  rm -rf node_modules
  npm install
  ```

## Sonraki Adımlar

✅ Proje kuruldu ve çalışıyor!

Şimdi şunları ekleyebilirsiniz:
- [ ] Gerçek B20Factory ABI encoding (base-std kütüphanesi)
- [ ] Token detay sayfası
- [ ] Swap aggregator
- [ ] Indexer (Vercel Cron)
- [ ] x402 API endpoints

Her özellik için ayrı branch açıp PR gönderebilirsiniz.

## Destek

Sorularınız için:
- GitHub Issues açın
- [Base Docs](https://docs.base.org) okuyun
- [RainbowKit Docs](https://www.rainbowkit.com/) bakın
