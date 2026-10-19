# Workify geliştirme durumu — 19 Ekim 2026

Aktif proje `/Users/oktanefecakar/workify`, geliştirme dalı `codex/agency-operations`. Next.js içinde panel ve sunucu işlemleri birlikte çalışır. Eski frontend/backend kaynakları ve Git geçmişleri `.local/migration-backups` içinde korunur. Ayrı backend kaldırıldı.

## Bu sürümde çalışan özellikler

- Gerçek verili yönetici ve çalışan dashboard; haftalık tamamlanma, iş yükü ve işlem geçmişi.
- Marka oluşturma/düzenleme/arşivleme, iletişim bilgileri ve ekip üyelikleri.
- Görev oluşturma/düzenleme/atama, filtreli ve sayfalı liste, kalıcı durum değişiklikli Kanban, ayrıntılar, yorumlar, kontrol listesi ve arşivleme.
- Marka bağlantılı proje oluşturma, durum ve görevlerden hesaplanan ilerleme.
- Ekip rolü, erişim ve unvan yönetimi; erişim kapatıldığında oturum iptali, son yönetici koruması.
- Yalnız sahibinin görebildiği yönetici yapılacakları, tarih filtreleri, sıralama, tamamlama/arşivleme, günlük/haftalık/aylık tekrar.
- Sunucu hatırlatma işçisi; idempotent uygulama içi bildirimler ve bildirim okuma.
- Kurumla sınırlı audit kayıtları. Başka yöneticilerin özel yapılacakları etkinlikte gösterilmez.
- Better Auth, Argon2id, kapalı genel kayıt, DB oturumları, rate limit ve MFA ekranları; üretimde yönetici MFA kontrolü.

## Veri ve çalıştırma

Yerel PostgreSQL `.local/postgres` içindedir. İki migration uygulandı; mevcut yönetici ve deneme çalışanı korundu. Secret ve parolalar Git dışında tutulur.

DB: `npm run db:local`; uygulama: `npm run dev`; hatırlatmalar: `npm run worker`. İşçi ayrı süreçtir; üretimde sürekli çalışan süreç olarak ayrıca işletilmelidir. Panel adresi http://localhost:3000/workspace.

## Doğrulama

39 birim testi ve ayrı `workify_test` PostgreSQL veritabanında 12 entegrasyon testi geçti. Negatif kurum/marka/atama erişimi, DB bileşik foreign key'leri, sürüm çakışmaları, özel yapılacaklar, hatırlatma/tekrar idempotency ve son yönetici koruması test edildi. Tarayıcıda marka oluşturma, çalışan atama ve görev oluşturma gerçek sunucu işlemleriyle doğrulandı; geçici kayıtlar sonrasında temizlendi. Tür kontrolü ve lint geçti. Üretim derlemesi ve Prisma şema doğrulaması geçti.

## Kalan kapsam

Davet ve e-posta/parola sıfırlama teslimatı; zaman takibi; içerik takvimi/onayları; hizmet paketi ve kullanım defteri; özel dosya depolama; raporlar; mention; bağımsız atanabilen alt görevler; proje şablonları; çoklu kurum seçimi henüz tamamlanmadı. Kanban durumlar arasında taşır; aynı sütun içinde sürükleyerek sıralama tamamlanmadı. Yapılacak düzenleme ve gelişmiş tekrar seçenekleri eksik.

Railway/üretim DB, obje depolama, CI/CD, monitoring ve yedekten geri yükleme tatbikatı doğrulanmadı. Önceki bağımlılık taramasında çalışma zamanı 0, geliştirme araçları 8 yüksek bulgu vardı. Üretime hazır olduğu iddia edilmez; üretim dağıtımı yapılmadı.


## Erişim ve kullanılabilirlik düzeltmesi

Marka ekleme, belirgin düğmeyle `/workspace/brands/new` sayfasına taşındı. Sayfa sunucuda ADMIN kontrolü yapar. Üst çubukta oturum e-postası ve Yönetici/Çalışan rolü görünür. Mobil menü kaydırma yerine satırlara bölünür; çalışan boş durum mesajı marka oluşturmasını istemez. İki gerçek hesapla HTTP kontrollerinde yönetici sayfaları 200, çalışan için marka oluşturma/yapılacaklar/ekip sayfaları 404 verdi. Tarayıcıdan marka kaydı ve çalışan girişi doğrulandı; yalnız geçici kontrol markası temizlendi. Entegrasyon testleri 12/12, tür/lint ve üretim derlemesi başarılı. Codex tarayıcısı ve kişinin diğer tarayıcısı farklı oturum çerezleri kullanabilir; aynı URL farklı hesap menüleri gösterebilir.
