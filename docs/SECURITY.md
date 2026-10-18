# Güvenlik durumu

Mevcut: Better Auth, Argon2id (64 MiB / 3 iterasyon), HttpOnly/SameSite=Lax, üretimde Secure çerez, 7 gün oturum, DB tabanlı hız sınırlama, genel kayıt kapalı, origin/CSRF kontrolleri kitaplığa bırakılmıştır. Cookie cache kapalıdır; oturum iptali DB üzerinden doğrulanır. Auth ayarları eksikse işlem reddedilir.

MFA eklentisi ve TOTP kurulum/giriş ekranı mevcut; üretimde MFA etkin olmayan yönetici `/security` sayfasına yönlendirilir. Yedek kodlar kurulumda gösterilir; yedek kodla giriş arayüzü henüz yoktur. İlk yönetici yerel etkileşimli CLI üzerinden yalnız bir kez, serializable transaction ile oluşturulur. Bu akışların gerçek DB entegrasyon testleri eksik. Parola sıfırlama teslimatı, tek kullanımlık davet, audit log ve hesap devre dışı bırakma arayüzü eksik.

OWASP ASVS/API Top 10 hedefleri: tenant sorguları ve bileşik FK'lerle BOLA azaltma; Prisma ile parametreli sorgu; React metin kaçışı; istek şemasında strict doğrulama. Tam ASVS denetimi yapılmadı. CSP Next.js için inline script/style izni içerir; üretim öncesi nonce tabanlı sıkılaştırılmalı, HTTPS HSTS dağıtımda doğrulanmalı.

Henüz özel dosya yükleme/indirme yüzeyi yok. Özel depolama ve imzalı indirme yetkileri tamamlanmadan eklenmemeli. Birim testleri çalışan DB, CSRF, çerez ve brute-force entegrasyon testleri değildir.

Bağımlılık taraması: çalışma zamanı paketlerinde 0 bulgu; tüm paketlerde 8 yüksek bulgu (Prisma CLI → deepmerge-ts; Next ESLint → braces zinciri). Körlemesine major sürüm düşürme/force-fix uygulanmadı. Bu bulgular geliştirme araçlarıyla sınırlı olsa da güvenlik kapısı olarak açık tutulur.
