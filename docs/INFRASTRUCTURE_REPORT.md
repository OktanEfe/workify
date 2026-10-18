# Workify altyapı raporu — 19 Ekim 2026

## Doğru çalışma konumu

Tek aktif proje: `/Users/oktanefecakar/workify`. Önceki frontend Next.js 16.1.6 / React 19.2.3 / Tailwind tabanlı tanıtım ve çalışma alanı prototipiydi. Giriş formu backend'e bağlı değildi; öğrenci/profesyonel seçimi istemci durumuydu ve gerçek RBAC değildi. Ayrı Express 4 backend yalnız `/health` sağlıyordu; DB/ORM ve auth yoktu.

Ürün sahibinin açık talimatıyla tek Next.js modüler monolite geçildi. Daha önce `Documents/ChatGPT/workify` içinde hazırlanan panel, auth, Prisma, test ve belgeler doğru repoya aktarıldı. Eski frontend/backend kaynakları ve Git geçmişleri `.local/migration-backups` içinde; önceki frontend kaynakları ayrıca `.local/pre-panel-source` içinde korunur. Bunlar Git dışındadır ve hassas yedekler özel izinlidir.

## Güncel envanter

| Konu | Durum |
|---|---|
| Framework / frontend | Next.js 16.4.2, React 19.3.1, TypeScript; Türkçe CSS arayüz |
| Backend | Aynı Next.js uygulamasında Route Handler ve Server Action; ayrı Express gerekmiyor |
| Veritabanı / ORM | PostgreSQL 18 yerel geliştirme, Prisma 6.19.3 |
| Barındırma | Yalnız bu bilgisayar; gerçek production/staging doğrulanmadı |
| Railway | Bir yapılandırma taslağı var; hesap, proje veya bağlantı doğrulanmadı |
| MongoDB | Projelerde yapılandırılmamış |
| Migration | Prisma SQL migration sistemi; foundation migration yerel DB'ye uygulanmış |
| Auth | Better Auth, Argon2id, DB oturumları, HttpOnly / SameSite, üretimde Secure |
| Yetki | Sunucuda aktif kurum üyeliği, ADMIN/EMPLOYEE, marka ve görev ataması |
| Dosya depolama | Özel obje depolama henüz yok; upload yüzeyi eklenmedi |
| Ortam | Git dışında `.env`; DB URL, auth URL ve auth secret yapılandırılmış; değerleri raporlanmaz |
| Deployment | Gerçek dağıtım yok; Railway taslağı doğrulanmamış |
| Git | Asıl frontend reposu korunuyor; `codex/workify-agency-v2` dalı. Remote erişimi ve CI doğrulanmadı |
| Test | Vitest birim/servis testleri, lint, TypeScript ve build komutları |
| Modüller | Giriş/MFA ekranları, yönetici kurulumu, yetkili görev listesi ve durum güncelleme |
| Eksikler | Tam panolar, marka/ekip CRUD, davet, audit, hatırlatma, projeler, zaman, içerik, paket, not ve dosyalar |

## Operasyonel eksikler

- Prisma süreç başına paylaşılan istemci kullanır; harici pooler ve üretim havuz sınırları doğrulanmadı.
- Yerel DB hesabı geliştirme amaçlıdır. Üretimde uygulama/migration kullanıcıları ayrılmalı ve en az yetki uygulanmalıdır.
- Otomatik DB yedeği, geri yükleme tatbikatı, staging/prod ayrımı ve izleme kurulmadı.
- Yapılandırılmış hata toplama, monitoring ve CI/CD henüz yok.
- Auth/üyelik/modül testleri gerçek dağıtım ve güvenlik denetimi yerine geçmez.
- Son bağımlılık taramasında çalışma zamanı paketleri temiz, geliştirme araçlarında 8 yüksek önem bulgusu vardı; üretim öncesi giderilmeli.
- Kaynak panel iCloud altında yalnız bulutta tutulan dosyalar nedeniyle zaman aşımına uğruyordu. Aktif proje artık home altındaki asıl Workify konumundadır.

Taşıma doğrulama sonuçları `DEVELOPMENT_STATUS.md` içinde güncellenir. Üretim verisi değiştirilmedi ve dağıtım yapılmadı.
