# Güvenlik durumu

Mevcut: Better Auth, Argon2id (64 MiB / 3 iterasyon), HttpOnly/SameSite=Lax, üretimde Secure çerez, 7 gün oturum, DB tabanlı hız sınırlama, genel kayıt kapalı, origin/CSRF kontrolleri kitaplığa bırakılmıştır. Cookie cache kapalıdır; oturum iptali DB üzerinden doğrulanır. Auth ayarları eksikse işlem reddedilir.

26 Ekim 2026 kullanıcı talebiyle MFA geçici olarak kapatıldı: Better Auth iki aşamalı doğrulama eklentisi, kod ekranı ve yönetici kurulum yönlendirmesi kaldırıldı. Giriş e-posta/parola ile yapılır; oturum ve aktif üyelik denetimleri sürer. Mevcut MFA verileri silinmez, kullanılmaz. Eski twoFactorEnabled kaydı bulunan hesabın parola ile doğrudan oturum açması gerçek DB testinde doğrulandı. İlk yönetici yerel etkileşimli CLI üzerinden yalnız bir kez, serializable transaction ile oluşturulur. Bu akışların gerçek DB entegrasyon testleri eksik. Parola sıfırlama teslimatı, tek kullanımlık davet, audit log ve hesap devre dışı bırakma arayüzü eksik.

OWASP ASVS/API Top 10 hedefleri: tenant sorguları ve bileşik FK'lerle BOLA azaltma; Prisma ile parametreli sorgu; React metin kaçışı; istek şemasında strict doğrulama. Tam ASVS denetimi yapılmadı. CSP Next.js için inline script/style izni içerir; üretim öncesi nonce tabanlı sıkılaştırılmalı, HTTPS HSTS dağıtımda doğrulanmalı.

Henüz özel dosya yükleme/indirme yüzeyi yok. Özel depolama ve imzalı indirme yetkileri tamamlanmadan eklenmemeli. Birim testleri çalışan DB, CSRF, çerez ve brute-force entegrasyon testleri değildir.

Bağımlılık taraması: çalışma zamanı paketlerinde 0 bulgu; tüm paketlerde 8 yüksek bulgu (Prisma CLI → deepmerge-ts; Next ESLint → braces zinciri). Körlemesine major sürüm düşürme/force-fix uygulanmadı. Bu bulgular geliştirme araçlarıyla sınırlı olsa da güvenlik kapısı olarak açık tutulur.

## Ekip görev takvimi paylaşımı — 25 Ekim 2026

Kullanıcının açık isteğiyle, oturum açmış aktif kurum üyeleri ekip takviminde aynı kurumdaki görevlerin başlığını, markasını, durumunu, sorumlularını ve başlangıç/teslim tarihlerini görebilir. Bu, yalnız `taskCalendar` içindeki sınırlı ortak projeksiyondur: açıklama, yorum, kontrol listesi, kişisel yapılacak veya başka kurum kayıtları döndürülmez. Ayrıntı, sürükleme ve durum/tarih mutasyonlarında çalışan için marka üyeliği + görev ataması şartı sürer. Ortak görünümde `canEdit=false` kayıtlar bağlantısız ve sürüklemesizdir; istemcide değiştirmek sunucu yetkisi sağlamaz. Kişisel görünüm her rolde yalnız kendi atamalarını döndürür.

İçerik oluşturma ve Excel aktarımı, aktif çalışanlara da açılmıştır; her mutasyonda aktif üyelik ve taze rol doğrulanır, hedef markaya erişim ve aktif marka şartı aranır. Yayın onayı/durum değiştirme yöneticiye aittir. Marka kimliği ve tasarım notları yetkili marka ekibince, kurum sınırı ve iyimser sürüm kontrolüyle güncellenebilir. Temel marka/kurum ayarları bu işleme dahil değildir.
