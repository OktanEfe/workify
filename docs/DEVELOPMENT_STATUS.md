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

Davet ve e-posta/parola sıfırlama teslimatı; zaman takibi; müşteri dış onayları; hizmet paketi ve kullanım defteri; özel dosya depolama; raporlar; mention; bağımsız atanabilen alt görevler; proje şablonları; çoklu kurum seçimi henüz tamamlanmadı. Kanban durumlar arasında taşır; aynı sütun içinde sürükleyerek sıralama tamamlanmadı. Yapılacak düzenleme ve gelişmiş tekrar seçenekleri eksik.

Railway/üretim DB, obje depolama, CI/CD, monitoring ve yedekten geri yükleme tatbikatı doğrulanmadı. Önceki bağımlılık taramasında çalışma zamanı 0, geliştirme araçları 8 yüksek bulgu vardı. Üretime hazır olduğu iddia edilmez; üretim dağıtımı yapılmadı.


## Erişim ve kullanılabilirlik düzeltmesi

Marka ekleme, belirgin düğmeyle `/workspace/brands/new` sayfasına taşındı. Sayfa sunucuda ADMIN kontrolü yapar. Üst çubukta oturum e-postası ve Yönetici/Çalışan rolü görünür. Mobil menü kaydırma yerine satırlara bölünür; çalışan boş durum mesajı marka oluşturmasını istemez. İki gerçek hesapla HTTP kontrollerinde yönetici sayfaları 200, çalışan için marka oluşturma/yapılacaklar/ekip sayfaları 404 verdi. Tarayıcıdan marka kaydı ve çalışan girişi doğrulandı; yalnız geçici kontrol markası temizlendi. Entegrasyon testleri 12/12, tür/lint ve üretim derlemesi başarılı. Codex tarayıcısı ve kişinin diğer tarayıcısı farklı oturum çerezleri kullanabilir; aynı URL farklı hesap menüleri gösterebilir.


## Yerel adres ve giriş teşhisi

Geliştirmede 127.0.0.1 istekleri BETTER_AUTH_URL localhost adresine geçici 307 ile yönlendirilir; yol ve sorgu korunur. Üretimde bu kural uygulanmaz. Böylece aynı tarayıcıda IP/hostname arasında ayrı oturum çerezleri oluşması önlenir. Chrome'da 429 geçici giriş limiti doğrudan gözlendi. Giriş formu 429, 403 ve hatalı kimlik bilgisini ayrı mesajlarla gösterir; rate limit kapatılmadı. Marka oluşturma sayfasında çalışan oturumu artık 404 yerine yönetici girişi gerektiğini açıklar; kaydetme servisi ADMIN kontrolünü korur.


## Çalışan, takvim, içerik ve tema — 19 Ekim 2026

- Yönetici Çalışanlar sayfasında ad/e-posta/unvan/parola ile gerçek çalışan hesabı oluşturabilir. Rol EMPLOYEE olarak sabittir; yinelenen e-posta ve parola eşleşmesi doğrulanır, Argon2id özeti kaydedilir; otomatik e-posta gönderilmez. Genel kayıt kapalıdır.
- `/workspace/calendar`: İstanbul saatine göre aylık görev teslimleri, içerik yayın planları ve yalnız sahibinin yönetici yapılacakları; önceki/sonraki ay ve marka filtresi. Her kaynak en fazla 500 kayıt; sınır uyarısı vardır.
- `/workspace/content`: marka/kanal/format/metin/yayın planı oluşturma, düzenleme, arama, marka/durum filtreleri ve altı durum. Düzenleme onayı taslağa döndürür; yayınlanan içerik önce taslağa alınmalıdır. Yayınlandı manuel kayıt olup sosyal ağlara paylaşım değildir. En fazla 100 kayıt gösterilir.
- Çalışan içerik ve takvim okumaları aktif marka üyeliğiyle sınırlandırılır; görevler için ayrıca atama gerekir. İçerik oluşturma/düzenleme/durum değişikliği yöneticiye aittir. Bileşik kurum/marka FK ve audit korunur.
- Marka alanlarının tamamı isteğe bağlıdır. Ad boşsa “İsimsiz marka” kaydedilir; dolu e-posta/URL değerlerinin biçimi doğrulanır.
- Gece mavisi/fildişi tema; koyu navigasyon, açık kartlar ve telefon ekranında alt alta takvim günleri.

Doğrulama: 44 birim testi, ayrı PostgreSQL veritabanında 17 entegrasyon testi, lint/tür kontrolü, üretim derlemesi ve Prisma validate geçti. Tarayıcıdan boş marka kaydı ve içerik oluşturma → takvimde 20 Ekim 14:30 görünümü doğrulandı. Yalnız bu UI testinin sabit kimlikli marka/içerik kayıtları temizlendi; mevcut kişisel yapılacaklar korundu. Şema eklendikten sonra geliştirme sunucusu yeni Prisma istemcisiyle yenilendi.

Kalanlar: güvenli davet/e-posta teslimatı ve parola sıfırlama; zaman takibi; dosya yükleme; hizmet paketleri; müşteri dış onayı; sosyal ağ entegrasyonları; rapor dışa aktarma. İlk içerik modülü bu özelliklerin tamamlandığı anlamına gelmez.

## Yerel başlatma düzeltmesi — 21 Ekim 2026

İlk incelemede yerel PostgreSQL ve uygulama sunucusu dinlemiyordu. PostgreSQL başlatıldıktan sonra yönetici girişi ve workspace/team/calendar/content/brands/new sayfaları gerçek HTTP oturumuyla 200 verdi; hata sınırı ekranı görülmedi. Tür kontrolü, lint, 44 birim testi, 17 ayrı PostgreSQL entegrasyon testi, üretim derlemesi ve Prisma validate geçti.

`npm run dev` artık önce portu ve DB bağlantısını kontrol eder; erişilebilir mevcut DB'yi kullanır, yerel DB kapalıysa yerel PostgreSQL başlatıcısını çalıştırır. Çocuk süreçlerin temiz kapanışını yönetir; önceden açık DB'yi kapatmaz. Eksik şemayı sessizce migrate etmez, anlaşılır uyarı verir. 3000 doluysa 3001'e sessizce geçmez; mevcut sunucunun adresini gösterir. Açık sunucu korunarak port çakışması davranışı doğrulandı. `npm run dev:web` yalnız Next sunucusunu başlatır. Kullanıcının özel hata mesajı henüz paylaşılmadı; bunun dışında uygulama sayfalarında hata yeniden üretilemedi.

Vercel yayını kullanıcı incelemesinden sonraya bırakıldı; bu aşamada hesap, alan adı veya üretim veritabanı değiştirilmedi.

## İş panosu ve yayın hazırlığı — 21 Ekim 2026

Takvimde ve görevler sayfasında üç sütunlu Yapılacak/Yapılıyor/Yapıldı iş panosu eklendi. Fare ve dokunmatik tutamaçla taşıma; durum menüsüyle klavye alternatifi; ayrıntılı yedi durum görünümü ve iptal edilenleri geri alma vardır. İnceleme/revize kayıtları basit görünümde Yapılıyor altında tutulur. Kartlar mevcut oturum/kurum/marka/atama/sürüm kontrolleri üzerinden kaydedilir. Kalıcı hareketler tarayıcı ve audit/DB ile doğrulandı; sabit kimlikli geçici fixture'lar temizlendi. Liste ve pano aynı filtre ve 30 kayıt sayfalamasını kullanır; takvimdeki pano ay filtresinden bağımsızdır, marka filtresine uyar.

Gece mavisi/fildişi tasarımda canlı mavi, sıcak altın, açık mor tonlar; okunur durum şeritleri, avatarlar, kart gölgeleri ve sürükleme geri bildirimi eklendi. Marka alanları hâlâ tamamen isteğe bağlıdır. MFA kurulumunda QR ve manuel anahtar seçeneği vardır; etkin hesap yeniden kurulum formuna yönlendirilmez.

Vercel hesabı kullanıcı tarafından bağlandı; oktan-efes-projects/workify projesi mevcut OktanEfe/workify GitHub deposuna bağlandı. Neon free_v3/Frankfurt veritabanı açık ücretsiz plan seçilerek oluşturuldu. Üç migration yeni boş uzak DB'ye uygulandı. Mevcut 2 hesap ve 1 kurumun verileri transaction ile ilk kez kopyalandı ve model sayıları doğrulandı. Oturum çerezleri taşınmadı. Var olan şifrelenmiş MFA verileri için uygulamanın mevcut auth anahtarı üretim secret olarak korundu. Secret ve özel yedekler Git/deployment dışında .local içinde kalır.

Vercel Hobby kullanımı kullanıcı tercihidir; resmi Hobby ticari kullanım kısıtı kullanıcıya bildirildi. Ücretli plana geçilmedi. Hatırlatmalar Hobby uyumlu günlük Cron (06:00 UTC) ve yönetici paneli görünürken dakikalık sahip kapsamlı kontrol ile çalışır. Bu, kapalı tarayıcıda dakika hassasiyetli bildirim garantisi değildir. Cron endpoint güçlü CRON_SECRET ile korunur; hatalı yetkilendirme ve scope izolasyonu test edildi.

Kontroller: 49 birim testi, 18 ayrı PostgreSQL entegrasyon testi, lint/tür kontrolü, üretim build başarılı. Çalışma zamanı bağımlılık taramasında 0 bulgu. Bu bölümdeki aşamada GitHub gönderimi ve canlı yayın doğrulaması henüz yapılmak üzeredir; doğrulanınca sonuç ayrıca kaydedilir.


## Yayın doğrulaması tamamlandı — 21 Ekim 2026

Vercel üretim yayını READY: https://workify-liard.vercel.app . GitHub main ve codex/agency-operations 2e045eb sürümüne gönderildi. Gerçek uzak DB ile readiness ve iki hesap girişi doğrulandı; çalışan ekranları ve yönetici sayfası engeli test edildi. Kullanıcı yönetici MFA kurulumunu tamamladı; uzaktaki twoFactorEnabled=true ve readiness=200 tekrar doğrulandı. Önceki “henüz yayınlanmadı” notları tarihsel aşamaları anlatır; güncel işletim bilgisi DEPLOYMENT.md içindedir.

## Marka formu sadeleştirmesi — 21 Ekim 2026

Web sitesi, iletişim kişisi, e-posta ve telefon kapalı/isteğe bağlı detay bölümüne taşındı. Hiçbir marka alanında required yoktur; boş/atlanmış marka adı varsayılan adla, boş veya yalnız boşluk içeren URL/e-posta boş değerle kaydedilir. Şemasız web adresleri HTTPS ile normalleştirilir; HTTP/HTTPS dışındaki protokoller reddedilir. 19 PostgreSQL entegrasyon testi, lint/tür kontrolü ve build geçti. Bu kaynak güncellemesi yerel Git'e kaydedildi; GitHub gönderimi için Anahtar Zinciri izni yeniden istenmedi. Canlı dağıtım Vercel CLI üzerinden yapılır.

## Başlangıç tarihi ve takvimden iş planlama — 21 Ekim 2026

Task.startAt isteğe bağlı başlangıç zamanı ve kurum/tarih indeksi eklemeli migration ile eklendi. Görev oluşturma/düzenleme formunda başlangıç ve teslim ayrı seçilir; teslim başlangıçtan önce olamaz. Takvim her güne “＋ İş” bağlantısı ve doğrudan tarih seçme formu sunar; seçilen gün görev formunda İstanbul saati 09:00 olarak önceden doldurulur ve değiştirilebilir. Kaydetmeden durum otomatik değiştirilmez. Başlangıç ve teslim ay içindeyse ayrı takvim kayıtları gösterilir; başlangıç tarihi listede, detayda ve pano kartında görünür. Var olan görevlerin startAt değeri null olarak korunur.

51 birim testi, 20 ayrı PostgreSQL entegrasyon testi, lint/tür kontrolü, build ve Prisma validate geçti. Negatif tarih sırası ve başka kurum/çalışanın tarih düzenleme yetkisi test edildi. Üretim güncellemesi için eski DB'nin üzerine yalnız eklemeli tarih migration'ı uygulanır; ilk veri kopyalama betiği tekrar çalıştırılmaz.

## Ekip takvim planlaması — 21 Ekim 2026

Çalışanlar marka üyeliği ve görev ataması birlikte doğrulanan işlerde durum ve tarih değiştirebilir. Takvim tutamacıyla başlangıç taşınırsa teslim aynı süreyle kayar; teslim kartı yalnız teslim gününü taşır. Görev ayrıntısında klavye/telefon için tarih formu vardır. Çalışanın eklediği görevler creatorRole anlık rol kaydıyla turkuaz gösterilir; istemci rolü yetki kanıtı değildir. Ay/yıl seçiciler, günlük iş özeti, plan/gecikme sayaçları ve kırmızı/sarı/yeşil pano şeritleri eklendi; metin boyutları büyütüldü.

52 birim testi ve 23 ayrı PostgreSQL entegrasyon testi, typecheck, lint, build ve db:validate geçti. Yetkisiz kurum, atamasız çalışan, marka erişimi kaldırılmış çalışan, tarih sırası ve eski sürüm olumsuz senaryoları kapsandı. Chrome'da Ekim–Kasım geçişi ve gerçek sürükleme doğrulandı; başlangıç 1→3 Ekim taşındığında teslim 2→4 Ekim kaydı DB'den kontrol edildi, geçici yerel kayıtlar temizlendi. Eklemeli creatorRole migration'ı üretime uygulandı. Bu bölüm yazılırken yeni uygulama dağıtımı henüz doğrulanmadı.

Bu sürüm cd66023 kaynak commit'iyle Vercel üretime dağıtıldı: dpl_GmVvmyAobnJvw5pRFmujTVJCj4iA READY, ana alan adı workify-liard.vercel.app ve /api/ready yanıtı 200/status=ready doğrulandı. GitHub push yapılmadı; kullanıcının macOS Anahtar Zinciri işlemi manuel kalır.

## Arayüz yenileme ve yöneticiye atama — 21 Ekim 2026

Gece mavisi gezinme, fildişi yüzeyler ve canlı mavi aksiyonlarla ortak tasarım katmanı yenilendi: butonlar, formlar, kartlar, tablolar, takvim ve mobil düzenler. Ana sayfaya takvim/atama hızlı erişimi eklendi. Yerel ana ekran tarayıcıda görsel olarak doğrulandı.

Çalışan kendi yetkili markasında oluşturduğu göreve aktif kurum yöneticilerini ekleyebilir; kendisi de atamada kalır. Yöneticiye bildirim gider. Yöneticilerin kurum genelindeki mevcut erişimi gereği ayrıca marka üyeliği aranmaz; çalışan hedefi kendisi veya yönetici ile sınırlıdır. Düzenleme ve yorum bildirimleri aynı yönetici kuralıyla uyumludur. Başka kurum, başka çalışan ve pasif yönetici atamaları transaction içinde reddedilir. Şema değişmedi.

52 birim testi, 25 ayrı PostgreSQL entegrasyon testi, typecheck, lint, db:validate ve üretim build geçti. Bu aşamada üretim dağıtımı henüz doğrulanmadı; GitHub push manuel kalır.

6abfaf4 sürümü üretime dağıtıldı: dpl_7hCH89LzAVYx4ACuvRcJpHmUDhaJ READY. workify-liard.vercel.app ana alan adı ve /api/ready (HTTP 200, status=ready) doğrulandı. Üretim MFA oturumu gerektiren yönetici ekranı yerine yerel oturumla tasarım kontrolü yapıldı; canlı kullanıcı verisi test için değiştirilmedi.

## Avrasia, kişisel takvim ve parola yönetimi — 21 Ekim 2026

Görünen uygulama adı, oturum açma markası, metadata, Better Auth uygulama adı ve npm paket adı Avrasia oldu. Mevcut depo, hesap e-postaları, oturum anahtarları ve alan adı korundu. Kişisel takvim ve altındaki pano yönetici dahil her rol için yalnız oturum sahibinin atamalarını gösterir; marka yetkisi/kurum scope korunur. Ortak içerik kayıtları kişisel takvimden çıkarıldı; kişisel hatırlatmalar yalnız sahibinde kalır.

Hesap güvenliğine mevcut parola, yeni parola ve tekrar alanları eklendi. Better Auth yerleşik changePassword kullanılır; aktif kurum üyeliği sunucuda doğrulanır, endpoint için dakikada 5 istek sınırı vardır. Diğer oturumlar kapatılır; MFA verileri değiştirilmez. Tarayıcıda kullanıcı parolası değiştirilmedi. Ayrı test DB'de gerçek Better Auth parola değişimi, hatalı eski parola, pasif üye, oturumsuz istek ve diğer oturumların iptali doğrulandı.

52 birim ve 27 PostgreSQL entegrasyon testi, typecheck, lint, db:validate ve üretim build geçti. Yerel takvim ve parola formu tarayıcıda doğrulandı. Bu aşamada GitHub gönderimi ve yeni üretim dağıtımı henüz doğrulanmadı.

Avrasia güncellemesi da42b71 kaynak commit'iyle üretime dağıtıldı: dpl_D4TSNGTHW24MxZaa3MoYaS4SU6xg READY, ana alan adı workify-liard.vercel.app ve /api/ready HTTP 200 doğrulandı. GitHub gönderimi HTTPS kimlik doğrulaması eksikliği nedeniyle başarısız oldu; tarayıcıyla GitHub yetkilendirmesi hazırlanıyor.

## İçerik stüdyosu, Excel ve internet örnekleri — 22 Ekim 2026

İçerik planı, Excel önizleme/aktarım ve ilham alanıyla genişletildi. .xlsx ilk sayfası, en fazla 100 satır ve 2 MB; başlık zorunlu, kanal/format varsayılanlıdır. ZIP dizininde açılmış boyut/öğe sınırları ve makro/dış bağlantı reddi uygulanır. Dosya tarayıcıda okunur; sunucuya yalnız doğrulanan satırlar gelir. Sunucu tüm satırları yeniden doğrular, aktif yönetici/kurum/marka kontrolü ile transaction içinde ekler. Kurum+marka+satır özeti benzersizliği tekrar aktarımı kopyasız yapar. Dosyanın kendisi saklanmaz. Var olan içerikler korunarak referenceLinks ve importKey eklemeli migration ile eklendi.

Her içerikte en fazla 10 HTTPS örnek linki kaydedilebilir. Aynı marka arşivinde konu/format/kanal eşleştirmesi ve kurala dayalı ilk sahne/akış/kapanış taslakları sunulur; model veya video analizi yapıldığı iddia edilmez. İnternet önerileri Tavily Search ile gerçek kaynak linklerinden gelir. Kullanıcı ayrıca isterse en fazla üç referansın okunabilen sayfa metni Tavily Extract ile incelenir; buradan çıkarılan konular aramayı genişletir. Video görüntüsü/ses veya kapalı paylaşım içeriği analiz edilmez. Okunamayan kaynaklar açıkça belirtilir. Arşiv tamamı gönderilmez; yalnız kullanıcı arama metni, kanal/format ve seçerse ilgili referans URL'leri gönderilir.

Kullanıcı Tavily girişini tamamladı; Continue on Free seçildi (Researcher, 1000 kredili plan; pay-as-you-go kapalı görüldü). Mevcut anahtar gizli Vercel Production TAVILY_API_KEY olarak eklendi; anahtar loglanmadı ve Git dışında tutuldu. Sabit sağlayıcı adresi, zaman aşımı, yanıt boyutu sınırı, HTTPS sonuç doğrulaması ve DB'de kişi başına dakikada 3 / kurum başına 24 saatte 20 arama sınırı vardır. Gerçek arama servisinden 6 sonuç ve yerel tarayıcı arayüzünde gerçek sonuç kartları doğrulandı.

59 birim testi, 30 ayrı PostgreSQL entegrasyon testi, typecheck, lint, db:validate, build ve çalışma zamanı bağımlılık taraması (0 bulgu) başarılı. Gerçek XLSX okuma, tekrar/yanlış aktarım, başka kurum/çalışan/sahte rol reddi, revize marka erişimi, bağlantı doğrulama, sağlayıcı yanıtları ve kalıcı kota senaryoları kapsandı. Üretim migration'ı uygulandı; bu aşamada yeni uygulama dağıtımı ve GitHub gönderimi henüz doğrulanmadı.
