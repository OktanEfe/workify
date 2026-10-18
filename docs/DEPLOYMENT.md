# Dağıtım hazırlığı

Henüz dağıtım yapılmadı. `railway.toml` taslaktır; gerçek Railway ortamında doğrulanmadı. Production için HTTPS `BETTER_AUTH_URL`, en az 32 karakter rastgele `BETTER_AUTH_SECRET`, ayrı PostgreSQL `DATABASE_URL` gerekir. Secret'lar Railway değişkenlerinde tutulmalı, build loglarına yazılmamalı.

Build: `npm ci && npm run build`. Başlatma: `npm run start`; Next.js Railway `PORT` değişkenini kullanır. Node 22 LTS önerilir.

Önce staging veritabanında SQL migration ve auth/erişim E2E testleri çalıştırılmalı. Üretimden yedek alıp geri yükleme denendikten ve ürün sahibi onayından sonra `npm run db:deploy` kullanılabilir. Otomatik start komutunda migration yoktur.

`/api/health` canlılık; `/api/ready` auth ayarları, DB bağlantısı ve Membership tablosuna erişim kontrolüdür. Bu kontrol tüm şema sürümünü garanti etmez. Çalışan readiness olmadan trafik açılmamalı.

Üretim engelleri: ilk admin/MFA akışlarının gerçek DB doğrulaması, güvenli davet, parola reset teslimatı, audit log, gerçek DB/E2E testleri ve bağımlılık bulgularının giderilmesi.
