type BrandValues = {
  name?: string;
  description?: string;
  sector?: string;
  website?: string;
  contactName?: string;
  email?: string;
  phone?: string;
};
export function BrandFields({ brand = {} }: { brand?: BrandValues }) {
  return (
    <>
      <p className="hint">
        Web sitesi veya iletişim bilgisi olmayan markaları da ekleyebilirsiniz.
        Hiçbir alan zorunlu değildir.
      </p>
      <div className="form-grid">
        <label>
          Marka adı (isteğe bağlı)
          <input
            name="name"
            maxLength={200}
            defaultValue={brand.name}
            placeholder="Markanızın adı"
          />
        </label>
        <label>
          Sektör (isteğe bağlı)
          <input
            name="sector"
            maxLength={100}
            defaultValue={brand.sector}
            placeholder="Daha sonra ekleyebilirsiniz"
          />
        </label>
        <label className="span-2">
          Marka açıklaması (isteğe bağlı)
          <textarea
            name="description"
            maxLength={5000}
            defaultValue={brand.description}
          />
        </label>
      </div>
      <details className="optional-brand-fields">
        <summary>Web sitesi ve iletişim bilgileri ekle (isteğe bağlı)</summary>
        <p>
          Bu bölümün tamamını boş bırakabilirsiniz. Web sitesi yoksa herhangi
          bir şey yazmanıza gerek yok.
        </p>
        <div className="form-grid">
          <label>
            Web sitesi (isteğe bağlı)
            <input
              name="website"
              type="text"
              inputMode="url"
              maxLength={2000}
              defaultValue={brand.website}
              placeholder="Varsa: www.markaniz.com"
            />
          </label>
          <label>
            İletişim kişisi (isteğe bağlı)
            <input
              name="contactName"
              maxLength={100}
              defaultValue={brand.contactName}
            />
          </label>
          <label>
            E-posta (isteğe bağlı)
            <input
              name="email"
              type="email"
              maxLength={254}
              defaultValue={brand.email}
              placeholder="Yoksa boş bırakın"
            />
          </label>
          <label>
            Telefon (isteğe bağlı)
            <input name="phone" maxLength={50} defaultValue={brand.phone} />
          </label>
        </div>
      </details>
    </>
  );
}
