# Veritabanı mimarisi

PostgreSQL + Prisma; tek Next.js uygulaması. Ayrı Express backend gerekli değil. Taşınan geliştirme veritabanı `workify/.local/postgres` altında, yalnız loopback erişimiyle çalışır; bağlantı bilgileri `.env` içinde ve Git dışındadır.

## Uygulanan tablolar

Auth: User, Session, Account, Verification, TwoFactor, RateLimit.

Operasyon: Organization, Membership, Brand, BrandMember, Task, TaskAssignment.

Rol kullanıcıya global olarak verilmez; kurum üyeliğindedir. Marka üyeliği ve görev atamasında bileşik `(organizationId, id)` foreign key'leri farklı kurumların kayıtlarının bağlanmasını engeller. Kaynak erişimi sunucu sorgularında da kuruma göre sınırlandırılır. Görev `version` alanı eşzamanlı durum güncellemelerinde kayıp değişiklikleri önler.

## Taşıma yöntemi

Kaynak PostgreSQL temiz biçimde durduruldu; cluster dosyaları değiştirilmeden yeni konuma kopyalandı. Bu, schema migration veya veri silme değildir. Foundation migration ve mevcut Oktan hesabı taşınan DB içindedir. Kaynak kopya silinmez; doğrulama sonrası yalnız hedef cluster çalıştırılır. Aynı cluster'ın iki kopyası aynı portta eşzamanlı başlatılmamalıdır.

## Sonraki güvenli genişletmeler

AuditLog ve kişisel Todo/Reminder temeli, proje ve görev ayrıntıları, Invitation, TimeEntry, içerik/onaylar, paket snapshot ve idempotent kullanım defteri aşamalı olarak eklenecek. Henüz bu tablolar veya modüller tamamlanmış değildir.

Yeni değişiklikler ayrı additive SQL migration ile hazırlanmalı; önce yerel DB'de negatif tenant/erişim testleriyle doğrulanmalıdır. Üretimde `db push` ve yıkıcı migration kullanılmaz. Otomatik yedekleme ve geri yükleme testi üretim öncesi eksiktir.


## Operasyon şeması — 19 Ekim 2026

`20261019010000_agency_operations` eklemeli migration uygulandı. Project marka/kurum bileşik ilişkisiyle; Task proje/marka/kurum bileşik ilişkisiyle bağlanır. TaskComment ve ChecklistItem görev/kurum; PersonalTodo ve Notification üyelik/kurum bileşik foreign key'leri kullanır. AuditLog aktör adının snapshot'ını saklar; kullanıcı sırları veya özel yapılacak metni audit'e yazılmaz. Görev arşivlemesi deletedAt ile geçmişi korur. Version alanları eşzamanlı güncellemeleri denetler. Todo recurrenceKey ve Notification dedupeKey tekrar çalışmada çoğaltmayı engeller. Ayrı işçi `npm run worker` ile çalışır. Geliştirme DB'si workify; entegrasyon DB'si yalnız loopback üzerinde workify_test'tir. Test fixture temizliği yalnız testte oluşturulan kimliklerle sınırlıdır.
