# Workify mimarisi

Aktif repo: `/Users/oktanefecakar/workify`. Ürün sahibinin talimatıyla frontend/backend ayrımı kaldırıldı; Next.js App Router, React ve TypeScript tabanlı modüler monolit kullanılır. Backend Route Handler ve Server Action olarak aynı uygulamadadır. PostgreSQL ve Prisma veriye erişir; Better Auth oturumları yönetir.

Katmanlar: `src/app` sayfa/HTTP, `src/lib` oturum ve erişim yardımcıları, `src/services` iş kuralları, `prisma` şema ve migration. Tenant bağlamı oturumdan türetilir. Çalışanlar yalnız marka üyeliği ve görev atamasıyla erişir. Çoklu kurum seçimi henüz yoktur.

19 Ekim 2026 geçişi: daha önce yanlışlıkla boş `Documents/ChatGPT/workify` içinde hazırlanan panel, asıl Workify reposuna içerik özetleriyle doğrulanarak taşındı. Asıl repodaki eski tanıtım/prototip arayüzü ile Express sağlık-kontrol backend'i özel yedeklere alındı. Yeni bir repo oluşturulmadı; asıl Git geçmişi korundu.

Kaynak doğrulama: Better Auth resmi options/rate-limit belgeleri kullanıldı. Railway bağlantısı, üretim DB, CI/CD ve özel obje depolama henüz kurulmuş/doğrulanmış değildir.
