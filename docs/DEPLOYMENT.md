# Canlı yayın — 21 Ekim 2026

- Uygulama: https://workify-liard.vercel.app
- GitHub: https://github.com/OktanEfe/workify ; üretim dalı main.
- Vercel: oktan-efes-projects/workify, Hobby. Ücretli plan açılmadı. Kullanıcıya Hobby ticari kullanım kısıtı bildirildi; kullanıcı mevcut planda kalmayı seçti. Resmi koşullar: https://vercel.com/docs/plans/hobby .
- PostgreSQL: Vercel Marketplace üzerinden Neon Free (free_v3), Frankfurt. Uzak DB bağlantısı doğrulandı; üç migration uygulandı.

İlk aktarımda iki hesap, kurum ve mevcut operasyon verileri boş uzak DB'ye transaction ile kopyalandı ve model sayıları doğrulandı. Parola özetleri ve şifrelenmiş MFA verileri korundu; oturumlar taşınmadı. Yerel DB ve canlı DB bundan sonra bağımsızdır. Canlı kullanıcı verileri üzerinde bu ilk aktarım komutu tekrar çalıştırılmaz; komut hedef boş değilse durur.

Üretim değişkenleri DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET ve CRON_SECRET Vercel'de saklanır. Secret değerleri ve bağlantı URL'leri repoya yazılmaz. .env, .local, yedekler ve Vercel özel env dosyaları Git/deployment dışında kalır. Mevcut MFA şifreleme anahtarı ilk geçişte korunmuştur. Yönetici MFA kontrolü üretimde açıktır; kullanıcı kurulumunu tamamladı ve uzaktaki twoFactorEnabled=true doğrulandı.

Üretim derlemesi Vercel'de başarılı. /api/health ve /api/ready 200; yönetici ve çalışan girişleri 200; çalışan workspace/calendar/content 200, team 404 olarak doğrulandı. MFA öncesinde yönetici workspace /security adresine yönlendirildi. Yetkisiz cron 401, yetkili cron 200. Kaynak kod main ve geliştirme dalına kullanıcı tarafından gönderildi.

Hatırlatmalar: günlük Vercel Cron 06:00 UTC (09:00 İstanbul) ve panel açık/görünürken yöneticinin kendi kayıtları için dakikalık kontrol. Kapalı panelde dakika hassasiyetli bildirim garantisi yoktur. Kaynak: https://vercel.com/docs/cron-jobs/usage-and-pricing .

Build npm run build. Migration otomatik build içine konulmadı; yeni şema değişiklikleri SQL ve izolasyon testleriyle incelenip yedek alındıktan sonra doğru uzak bağlantıyla uygulanmalıdır. Yerel .env dosyası üretim migration'ına bağlanmak için kullanılmaz. Gelecekteki main gönderimleri Vercel Git entegrasyonuyla dağıtılır; sonucun READY olduğu ve readiness yanıtı ayrıca doğrulanır.

Çalışma zamanı bağımlılık taraması 0 bulgu; 49 birim ve 18 ayrı PostgreSQL entegrasyon testi geçti. Güvenli parola sıfırlama/e-posta teslimatı, kapsamlı yedekten geri yükleme tatbikatı, yük ve erişilebilirlik denetimi henüz tamamlanmadı. Dosya yükleme, müşteri dış onayı ve hizmet paketi modülleri ayrıca geliştirilecek.
