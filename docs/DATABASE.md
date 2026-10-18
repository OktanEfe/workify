# Veritabanı durumu

PostgreSQL + Prisma. Güncel ayrıntı: [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md).

Yerel geliştirme cluster'ı artık asıl `workify/.local/postgres` içindedir. Foundation migration uygulanmış; 1 kullanıcı, 1 aktif yönetici, 1 kurum ve 1 migration kaydı yeni konumda doğrulanmıştır. Bağlantı bilgileri yalnız `.env` içindedir.

Üretim için ayrı kullanıcı/yetki, havuz sınırları, otomatik yedekleme ve geri yükleme denemesi henüz eksiktir. Üretime migration uygulanmadı. Yıkıcı migration/üretim veri değişikliği açık onay gerektirir.
