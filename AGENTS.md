# Workify geliştirme kuralları

- Next.js App Router, TypeScript strict, PostgreSQL ve Prisma; modüler monolit.
- Türkçe arayüz. İş kuralları `src/services`, güvenlik yardımcıları `src/lib` içinde.
- İstemciden rol, kullanıcı veya kurum id'sini yetki kanıtı olarak kabul etme.
- Her korumalı işlemde oturumu ve aktif kurum üyeliğini doğrula; kaynak sorgularını kurumla sınırla. Çalışan görev erişimi için marka üyeliği ve atama birlikte gerekir.
- Bileşik kurum foreign key'lerini koru. DB şemasını değiştirirken migration ve negatif izolasyon testi ekle.
- Genel kayıt kapalı kalmalı. Kimlik doğrulamada Better Auth kullan; özel kriptografi yazma.
- Secret/token/parola loglama. `.env` commit etme. Özel medyayı public dizinine koyma.
- Kontroller: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run db:validate`.
- Kullanıcı değişikliklerini koru; geliştirme dalında çalış. Üretim deployment, ücretli kaynak, üretim verisi değişikliği ve yıkıcı migration için açık onay gerekir.
- Durum belgeleri yalnız doğrulanmış sonuçları yansıtmalı. Mevcut testler DB entegrasyonunun yerine geçmez.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
