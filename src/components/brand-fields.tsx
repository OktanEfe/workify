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
    <div className="form-grid">
      <label>
        Marka adı
        <input
          name="name"
          required
          maxLength={200}
          defaultValue={brand.name}
          placeholder="Müşterinizin marka adı"
        />
      </label>
      <label>
        Sektör
        <input
          name="sector"
          maxLength={100}
          defaultValue={brand.sector}
          placeholder="Örn. Yeme-içme"
        />
      </label>
      <label>
        Web sitesi
        <input
          name="website"
          type="url"
          maxLength={2000}
          defaultValue={brand.website}
          placeholder="https://"
        />
      </label>
      <label>
        İletişim kişisi
        <input
          name="contactName"
          maxLength={100}
          defaultValue={brand.contactName}
        />
      </label>
      <label>
        E-posta
        <input name="email" type="email" defaultValue={brand.email} />
      </label>
      <label>
        Telefon
        <input name="phone" maxLength={50} defaultValue={brand.phone} />
      </label>
      <label className="span-2">
        Marka açıklaması
        <textarea
          name="description"
          maxLength={5000}
          defaultValue={brand.description}
        />
      </label>
    </div>
  );
}
