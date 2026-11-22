# FetchSubs – Astro sürümü

fetchsubs.com'un sunucusuz sürümü. Bu sürüm Cloudflare Pages'in ücretsiz planında çalışır.

- **Statik site:** Astro bütün sayfaları derleme sırasında HTML'e çevirir. Buna ana sayfa, 8 landing sayfası, blog, SSS, Hakkında, İletişim, Gizlilik, Şartlar, 404 ve sitemap dahildir.
- **Tek serverless parça:** `functions/api/video.js`, bir Cloudflare Pages Function'dır.
  - YouTube'un altyazı listesini veren `player` servisi tarayıcıdan çağrılamıyor (CORS engeli). Bu fonksiyon bu yüzden var ve sadece video bilgisini ve altyazı listesini döndürür.
  - Kiralanacak ya da yönetilecek bir sunucu yoktur.
  - Ücretsiz planda günde 100.000 istek hakkı vardır.
  - Statik sayfalar bu kotayı harcamaz; kota yalnızca `/api/*` isteklerinde kullanılır.
- **Altyazı indirme tarayıcıda yapılır:**
  - Altyazı dosyası YouTube'dan doğrudan ziyaretçinin tarayıcısına iner. İmzalı link IP'ye bağlı değil ve CORS'a açık.
  - SRT, VTT ve TXT dönüşümü `src/lib/captions.ts` içinde yapılır.
  - `functions/api/caption.js` yalnızca doğrudan indirme başarısız olursa yedek olarak kullanılır.

## Komutlar

```powershell
npm install
npm run build     # dist/ klasörünü üretir
npm run preview   # Functions dahil yerel Cloudflare ortamı: http://localhost:8788
npm run dev       # Sadece sayfa geliştirme (Astro dev). /api çalışmaz.
```

## Cloudflare Pages'e yayınlama

### A) GitHub üzerinden (önerilen)

1. Bu klasörü ayrı bir GitHub reposuna gönderin.
2. Cloudflare panelinde **Workers & Pages → Create → Pages → Connect to Git** yolunu izleyip repoyu seçin.
3. Derleme ayarlarını şöyle girin:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node sürümü `.node-version` dosyasından okunur (22).
4. **Custom domains** bölümünden `fetchsubs.com` alan adını ekleyin. Alan adı Cloudflare'de olduğu için DNS kaydı otomatik eklenir.

`functions/` klasörü otomatik olarak algılanır ve yayınlanır; ek bir ayar gerekmez.

### B) Komut satırından

```powershell
npx wrangler login
npm run deploy
```

Not: Panelden sürükle-bırak ile yükleme **Functions'ı desteklemez**. Bu yöntemle araç çalışmaz.

## Zamanlanmış blog yazıları

`publishDate` alanı ileri bir tarih olan yazılar derlemeye girmez. O tarihten sonraki ilk derlemede kendiliğinden yayına çıkarlar. Bunu otomatik yapmak için:

1. Cloudflare Pages'te **Settings → Builds → Deploy hooks** bölümünden bir hook oluşturun.
2. Hook URL'sini GitHub reposuna `CF_PAGES_DEPLOY_HOOK` adıyla secret olarak ekleyin.

`.github/workflows/scheduled-rebuild.yml` her gün siteyi yeniden derletir. Bu GitHub Actions'ın ücretsiz kotası içinde kalır.

## İçerik nerede?

| Ne | Nerede |
|---|---|
| Blog yazıları | `src/content/blog/<slug>.html` (üstte frontmatter, altında HTML) |
| Kapak görselleri | `public/Content/blog/<slug>.png` |
| Landing sayfaları listesi | `src/data/landing.ts` |
| Sayfalar | `src/pages/` |
| Ortak şablon | `src/layouts/Layout.astro` |
| Altyazı aracı | `src/components/ToolWidget.astro`, `src/lib/tool.ts` |
| Yönlendirmeler (301) | `public/_redirects` |
| Engellenen videolar | `wrangler.toml` → `BLOCKED_VIDEO_IDS` (ya da Pages ortam değişkeni) |

Yeni yazı eklemek için mevcut bir `.html` dosyasını kopyalayın. Frontmatter'daki `title`, `summary`, `publishDate` ve `order` alanlarını değiştirin. Dosya adı, yazının URL'si olur.
