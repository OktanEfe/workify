'use server';
import { currentActor } from '@/lib/current-actor';
import {
  importContentIdeas,
  searchWebExamples,
} from '@/services/content-inspiration';
import { AccessDenied } from '@/lib/access';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
function message(error: unknown) {
  if (error instanceof AccessDenied)
    return 'Bu marka veya içerik için yetkiniz yok.';
  if (error instanceof z.ZodError)
    return 'Tablo alanlarını kontrol edin. En fazla 100 geçerli fikir aktarılabilir.';
  const allowed = [
    'Aktarım çok büyük. Daha küçük bir tablo seçin.',
    'Arama sınırına ulaşıldı. Daha sonra tekrar deneyin.',
    'İnternet aramasına ulaşılamadı. Tekrar deneyin.',
    'Arama servisi isteği tamamlayamadı. Kota veya bağlantı ayarlarını kontrol edin.',
    'Arama yanıtı alınamadı.',
    'Arama yanıtı çok büyük.',
    'Arama yanıtı okunamadı.',
  ];
  return error instanceof Error && allowed.includes(error.message)
    ? error.message
    : 'İşlem tamamlanamadı. Sayfayı yenileyip tekrar deneyin.';
}
export async function importIdeas(input: unknown) {
  const actor = await currentActor();
  try {
    const result = await importContentIdeas(actor, input);
    revalidatePath('/workspace/content');
    return { ok: true as const, ...result };
  } catch (error) {
    return { ok: false as const, message: message(error) };
  }
}
export async function findWebExamples(
  id: string,
  query: string,
  inspectReferences = false,
) {
  const actor = await currentActor();
  try {
    return {
      ok: true as const,
      ...(await searchWebExamples(
        actor,
        id,
        query,
        inspectReferences === true,
      )),
    };
  } catch (error) {
    return { ok: false as const, message: message(error) };
  }
}
