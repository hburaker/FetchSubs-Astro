# FetchSubs – Astro sürümü

fetchsubs.com'un sunucusuz sürümü. Cloudflare Workers'ın ücretsiz planında, statik dosyalarla (Workers Static Assets) birlikte çalışır.

- **Statik site:** Astro bütün sayfaları derleme sırasında HTML'e çevirir. Buna ana sayfa, 8 landing sayfası, blog, SSS, Hakkında, İletişim, Gizlilik, Şartlar, 404 ve sitemap dahildir. Bu dosyalar `dist/` klasöründen sunulur.
- **Tek serverless parça:** `worker/` klasöründeki küçük Cloudflare Worker.
  - YouTube'un altyazı listesini veren `player` servisi tarayıcıdan çağrılamıyor (CORS engeli). Worker bu yüzden var ve sadece video bilgisini ve altyazı listesini döndürür (`/api/video`).
  - Kiralanacak ya da yönetilecek bir sunucu yoktur.
  - Ücretsiz planda günde 100.000 istek hakkı vardır.
  - Statik sayfalar Worker'ı çalıştırmaz ve bu kotayı harcamaz; Worker yalnızca `/api/*` isteklerinde çalışır (`wrangler.toml` → `run_worker_first`).
- **Altyazı indirme tarayıcıda yapılır:**
  - Altyazı dosyası YouTube'dan doğrudan ziyaretçinin tarayıcısına iner. İmzalı link IP'ye bağlı değil ve CORS'a açık.
  - SRT, VTT ve TXT dönüşümü `src/lib/captions.ts` içinde yapılır.
  - `/api/caption` (`worker/caption.js`) yalnızca doğrudan indirme başarısız olursa yedek olarak kullanılır.
- **Eski sunucuya yedekleme:** YouTube, Cloudflare IP'lerinden gelen istekleri çoğu zaman "bot" diye reddediyor. Bu durumda Worker, eski ASP.NET FetchSubs sunucusuna (`LEGACY_API_ORIGIN`) sunucudan sunucuya sorar:
  - `/api/video` → eski sunucunun `/fetch-info` adresi (altyazı listesi)
  - `/api/subtitle` → eski sunucunun `/fetch-subs` adresi (hazır SRT/VTT/TXT dosyası)
  - Tarayıcı eski sunucuyla hiç konuşmaz, bu yüzden eski sunucuda CORS ayarı gerekmez.

## Önemli: alan adını taşımadan önce

`LEGACY_API_ORIGIN` şu an `https://fetchsubs.com`, çünkü eski sunucu hâlâ bu adreste. `fetchsubs.com`'u bu Worker'a bağladığınız anda Worker kendine istek atmaya başlar ve araç çalışmaz. Bu yüzden önce:

1. Cloudflare DNS'te eski sunucunun IP'sine giden yeni bir kayıt açın, örneğin `api.fetchsubs.com`.
2. Plesk'te bu adı eski siteye alias olarak ekleyin (ve SSL sertifikasına dahil edin).
3. `https://api.fetchsubs.com/fetch-info` adresinin çalıştığını kontrol edin.
4. `wrangler.toml` içinde `LEGACY_API_ORIGIN = "https://api.fetchsubs.com"` yapıp push edin.
5. Ancak bundan sonra `fetchsubs.com`'u Worker'a bağlayın.

## Komutlar

Node 24 gerekir (`.node-version`).

```powershell
npm install
npm run build     # dist/ klasörünü üretir
npm run preview   # Worker dahil yerel Cloudflare ortamı: http://localhost:8788 (önce build gerekir)
npm run dev       # Sadece sayfa geliştirme (Astro dev). /api çalışmaz.
```

## Cloudflare'e yayınlama

### A) GitHub üzerinden (önerilen)

1. Cloudflare panelinde **Workers & Pages → Create → Import a repository** ile bu repoyu seçin.
2. Ayarlar:
   - Project name: `fetchsubs-astro` (`wrangler.toml` içindeki `name` ile aynı olmalı)
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
   - Node sürümü `.node-version` dosyasından okunur (24).
3. **Settings → Domains & Routes** bölümünden `fetchsubs.com` alan adını ekleyin. Alan adı Cloudflare'de olduğu için DNS kaydı otomatik eklenir.

Her `master` push'unda Cloudflare siteyi yeniden derler ve yayınlar.

### B) Komut satırından

```powershell
npx wrangler login
npm run deploy
```

## Zamanlanmış blog yazıları

`publishDate` alanı ileri bir tarih olan yazılar derlemeye girmez. O tarihten sonraki ilk derlemede kendiliğinden yayına çıkarlar. Bunu otomatik yapmak için `.github/workflows/scheduled-rebuild.yml` her gün siteyi derleyip yayınlar. Gerekenler, GitHub reposunda **Settings → Secrets and variables → Actions** altına eklenecek iki secret:

1. `CLOUDFLARE_API_TOKEN`: Cloudflare'de **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** şablonuyla oluşturulan token.
2. `CLOUDFLARE_ACCOUNT_ID`: Cloudflare hesap kimliği (panel adresindeki `dash.cloudflare.com/<hesap-id>/...` kısmı).

Bu GitHub Actions'ın ücretsiz kotası içinde kalır.

## İçerik nerede?

| Ne | Nerede |
|---|---|
| Blog yazıları | `src/content/blog/<slug>.html` (üstte frontmatter, altında HTML) |
| Kapak görselleri | `public/Content/blog/<slug>.png` |
| Landing sayfaları listesi | `src/data/landing.ts` |
| Sayfalar | `src/pages/` |
| Ortak şablon | `src/layouts/Layout.astro` |
| Altyazı aracı | `src/components/ToolWidget.astro`, `src/lib/tool.ts` |
| API (Worker) | `worker/index.js`, `worker/video.js`, `worker/subtitle.js`, `worker/caption.js` |
| Eski sunucu adresi | `wrangler.toml` → `LEGACY_API_ORIGIN` |
| Yönlendirmeler (301) | `public/_redirects` |
| Güvenlik başlıkları, önbellek | `public/_headers` |
| Engellenen videolar | `wrangler.toml` → `BLOCKED_VIDEO_IDS` |

Yeni yazı eklemek için mevcut bir `.html` dosyasını kopyalayın. Frontmatter'daki `title`, `summary`, `publishDate` ve `order` alanlarını değiştirin. Dosya adı, yazının URL'si olur.
