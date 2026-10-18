# Tek proje geçişi ve geri alma

19 Ekim 2026: ürün sahibi, panel ve backend'in asıl `workify` klasöründe tek Next.js uygulamasında birleştirilmesini ve `workify-backend` klasörünün kaldırılmasını istedi.

## Korunan yedekler

- `.local/migration-backups/frontend-before-single-project-20261019.tar.gz`: eski frontend, Git geçmişi ve o andaki dosyalar.
- `.local/migration-backups/frontend-uncommitted.patch`: geçiş öncesi takip edilen dosya değişiklikleri.
- `.local/migration-backups/backend-before-single-project-20261019.tar.gz`: kaldırılan Express backend, `.env` ve Git geçmişi; hassas arşiv özel dosya izinleriyle korunur.
- `.local/pre-panel-source`: taşınan eski arayüz, bileşenler ve derleme önbelleği.
- `.local/migration-backups/panel-imported.json`: aktarım özeti.

Bu yedekler Git'e girmez ve `public/` altında değildir. Backend kaynaklarının yedekle eşleştiği silmeden önce doğrulanmıştır.

## Geri yükleme

Aktif uygulamayı ezmek yerine önce ayrı bir kurtarma klasörü oluşturup ilgili tar arşivini oraya açın. Git geçmişi arşivde korunur. Kontrol sonrasında hangi sürümün kullanılacağına karar verilir. Üretim/gerçek veri üzerinde otomatik geri alma yapılmaz.

PostgreSQL kopyası temiz kapatma sonrasında alınmıştır. Önceki kaynak klasördeki DB kopyası silinmedi. İki cluster kopyası aynı anda çalıştırılmamalıdır. Gelecekte düzenli mantıksal yedekleme ve geri yükleme testi ayrıca kurulmalıdır.

## Güncel çalışma

İki terminal, tek repo:

```sh
npm run db:local
```

```sh
npm run dev
```

Panel `http://localhost:3000/login`. Ayrı Express süreci veya `workify-backend` klasörü gerekmez. Yönetici hesabı mevcut DB'den korunmuştur; parola proje dosyalarına eklenmez.
