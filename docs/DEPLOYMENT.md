# Dağıtım hazırlığı

Henüz dağıtım yapılmadı. `railway.toml` taslaktır; gerçek Railway ortamında doğrulanmadı. Production için HTTPS `BETTER_AUTH_URL`, en az 32 karakter rastgele `BETTER_AUTH_SECRET`, ayrı PostgreSQL `DATABASE_URL` gerekir. Secret'lar Railway değişkenlerinde tutulmalı, build loglarına yazılmamalı.

Build: `npm ci && npm run build`. Başlatma: `npm run start`; Next.js Railway `PORT` değişkenini kullanır. Node 22 LTS önerilir.

Önce staging veritabanında SQL migration ve auth/erişim E2E testleri çalıştırılmalı. Üretimden yedek alıp geri yükleme denendikten ve ürün sahibi onayından sonra `npm run db:deploy` kullanılabilir. Otomatik start komutunda migration yoktur.

`/api/health` canlılık; `/api/ready` auth ayarları, DB bağlantısı ve Membership tablosuna erişim kontrolüdür. Bu kontrol tüm şema sürümünü garanti etmez. Çalışan readiness olmadan trafik açılmamalı.

Üretim engelleri: ilk admin/MFA akışlarının gerçek DB doğrulaması, güvenli davet, parola reset teslimatı, audit log, gerçek DB/E2E testleri ve bağımlılık bulgularının giderilmesi.

## Vercel hedefi — 21 Ekim 2026

Yeni hedef Vercel'dir; önceki Railway notları geçmiş taslak olarak kalır. Yerel `.local/postgres` üretim veritabanı olarak kullanılamaz. Yayından önce uzak PostgreSQL bağlantısı, HTTPS alan adıyla BETTER_AUTH_URL, özel BETTER_AUTH_SECRET ve veritabanı migration/ilk yönetici/MFA akışı hazırlanıp doğrulanmalıdır. .env ve yerel DB/yedek dosyaları yüklenmez.

Build `npm run build`; framework Next.js. Veritabanı migration'ları build içine otomatik eklenmez. `npm run worker` sürekli süreçtir; Vercel için hatırlatma servisini korumalı bir Function ve Cron zamanlamasına uyarlamak veya ayrı işçi çalıştırmak gerekir. Bu uyarlama henüz uygulanmadı. Resmi kaynaklar: https://vercel.com/docs/cron-jobs/quickstart ve https://vercel.com/docs/cron-jobs/manage-cron-jobs . Alan adı, hesap ve DB seçimi inceleme sonrası netleştirilir. Bu belge dağıtım yapıldığı anlamına gelmez.
