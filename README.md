# Workify

Tek proje: `/Users/oktanefecakar/workify`. Panel ve sunucu işlemleri aynı Next.js uygulamasındadır. Ayrı Express backend gerekmez.

Avrasia Creative için Türkçe ajans operasyon platformu. **Temel geliştirme aşamasında; üretime hazır değildir.**

## Kurulum

Node.js 22.12+ ve PostgreSQL 16+ önerilir. `npm ci` ardından `.env.example` dosyasını `.env` olarak kopyalayın. `BETTER_AUTH_SECRET` için `openssl rand -base64 32` ile ayrı bir rastgele değer üretin; çıktıyı depoya eklemeyin.

```sh
npm run db:generate
npm run db:migrate
npm run dev
```

`db:migrate` yalnız geliştirme veritabanında kullanılmalıdır. Docker varsa yerel DB için `docker compose up -d` kullanılabilir; bu makinede Docker bulunmadığından çalıştırılmadı. Ardından `npm run admin:bootstrap` komutunu etkileşimli terminalde çalıştırın. Parola ekranda gösterilmez; mevcut yönetici varsa komut işlemi reddeder. Varsayılan hesap/parola yoktur. MFA kurulumu `/security` sayfasındadır. Çalışan daveti henüz yoktur.

## Doğrulama

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

İlk sayfa korumalı çalışma alanına, oturumsuz istek ise girişe yönlendirilir. Veritabanı ve auth ortam değişkenleri olmadan korumalı sayfa çalışmaz. `/login` yapılandırmadan görüntülenebilir. `/api/health` yalnız süreç canlılığını bildirir; veritabanı hazırlık kontrolü değildir.

## Durum

Kurum izolasyonlu marka/görev şeması, oturum altyapısı, giriş arayüzü ve ilk 30 yetkili görevin okunması mevcut. İlk yönetici kurulum komutu, MFA kurulum/doğrulama ekranı ve görev durumu güncelleme mevcut; gerçek DB üzerinde henüz doğrulanmadı. Davet, parola sıfırlama teslimatı, görev oluşturma/atama arayüzü ve diğer modüller henüz yoktur. Ayrıntılar: `docs/DEVELOPMENT_STATUS.md`.

## Docker olmadan yerel önizleme

Yerel PostgreSQL için ayrı terminalde `npm run db:local` çalıştırın. Veriler Git dışında kalan `.local/postgres` içinde kalır; sunucu yalnız 127.0.0.1 adresine bağlanır. Bu yardımcı yalnız geliştirme içindir. İkinci terminalde `npm run db:deploy`, ilk kurulumda `npm run admin:bootstrap`, ardından `npm run dev` çalıştırılır. Yönetici parolası kaynak koda veya belgelere yazılmaz. Uygulama adresi `http://localhost:3000/login`.

## Önceki projenin yedeği

Tek proje geçişinden önceki frontend ve backend, Git geçmişleri ve commit edilmemiş değişiklikler `.local/migration-backups` içinde korunur. Önceki frontend kaynakları ayrıca `.local/pre-panel-source` içindedir. Bu özel dizinler Git, lint ve tip denetimi dışında tutulur.
