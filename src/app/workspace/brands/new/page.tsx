import Link from 'next/link';
import { currentActor } from '@/lib/current-actor';
import { ActionForm } from '@/components/action-form';
import { BrandFields } from '@/components/brand-fields';
export default async function NewBrand() {
  const actor = await currentActor();
  if (actor.role !== 'ADMIN')
    return (
      <section className="panel empty-state">
        <h1>Bu hesap çalışan hesabı</h1>
        <p>
          Marka eklemek için yönetici hesabıyla giriş yapmalısınız. Mevcut
          hesabınızı üst çubukta görebilirsiniz.
        </p>
        <Link className="button-link" href="/login">
          Yönetici hesabıyla giriş yap
        </Link>
      </section>
    );
  return (
    <>
      <Link href="/workspace/brands">← Markalar</Link>
      <div className="page-heading">
        <div>
          <h1>Marka ekle</h1>
          <p>
            Tüm alanlar isteğe bağlıdır. Ad girmezseniz “İsimsiz marka” olarak
            kaydedilir. Bilgileri daha sonra tamamlayabilirsiniz.
          </p>
        </div>
      </div>
      <section className="panel">
        <ActionForm operation="brand-save" label="Markayı oluştur">
          <BrandFields />
        </ActionForm>
      </section>
    </>
  );
}
