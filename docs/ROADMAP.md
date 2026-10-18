# Yol haritası

1. Temel: repo, Next.js, auth şeması, kurum izolasyonu, negatif erişim testleri.
2. Gerçek PostgreSQL entegrasyon testleri ve migration; ilk admin için güvenli tek seferlik kurulum; audit log.
3. Tek kullanımlık admin daveti, parola sıfırlama teslimatı, MFA kurulum/doğrulama, session iptali. DB ve e-posta teslimat ayarı gerekir.
4. Yönetici/çalışan panoları; marka CRUD ve üyelik; görev oluşturma, atama, yorum, alt görev ve kalıcı Kanban sıralaması.
5. Paket şablonundan bağımsız abonelik snapshot'ları; idempotent kullanım defteri ve hesap testleri.
6. İçerik takvimi ve onay geçmişi; yayınlandı durumu yalnız doğrulanmış işlemle.
7. Özel notlar, açık paylaşımlar, bildirimler ve mention.
8. Özel S3 depolama; dosya türü/boyut ve erişim testleri.
9. E2E, erişilebilirlik, güvenlik ve yük kontrolleri; Railway config, readiness, yedek geri yükleme tatbikatı.
10. Üretim öncesi ürün sahibi onayı. Ücretli kaynak veya public servis otomatik açılmaz.
