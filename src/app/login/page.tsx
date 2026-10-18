import Link from 'next/link';
import { LoginForm } from './form';
export default function Login() {
  return (
    <main className="login">
      <section className="intro">
        <Link className="logo" href="/">
          w<span>workify</span>
        </Link>
        <div>
          <span className="eyebrow">AVRASIA CREATIVE / EKİP ALANI</span>
          <h1>
            İyi işler,
            <br />
            birlikte başlar.
          </h1>
          <p>
            Markalarınız, projeleriniz ve yaratıcı ekibiniz.
            <br />
            Hepsi aynı çalışma alanında.
          </p>
        </div>
        <small>Ajansın ritmini yakala.</small>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">ÇALIŞMA ALANINIZA GİRİŞ</span>
          <h2>Tekrar hoş geldiniz</h2>
          <p>Devam etmek için ekip hesabınızla giriş yapın.</p>
          <LoginForm />
          <footer>
            Hesabınız yok mu? Yöneticinizden davet isteyin.
            <br />
            Bu çalışma alanı yalnızca yetkili ekip üyelerine açıktır.
          </footer>
        </div>
      </section>
    </main>
  );
}
