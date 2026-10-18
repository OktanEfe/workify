import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { hash, argon2id } from 'argon2';
import { PrismaClient, Prisma } from '@prisma/client';

async function main() {
  // Local operator only. Never expose this operation as an HTTP endpoint.
  if (!process.stdin.isTTY) throw new Error('Etkileşimli terminal gereklidir.');
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const prompt = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  const db = new PrismaClient();
  try {
    const email = (await prompt.question('Yönetici e-posta adresi: '))
      .trim()
      .toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error('Geçersiz e-posta.');
    const name = (await prompt.question('Ad soyad: ')).trim();
    if (name.length < 2 || name.length > 100) throw new Error('Geçersiz ad.');
    process.stdout.write('Parola (en az 12 karakter, ekranda gösterilmez): ');
    muted = true;
    const password = await prompt.question('');
    muted = false;
    process.stdout.write('\nParolayı tekrar girin: ');
    muted = true;
    const confirmation = await prompt.question('');
    muted = false;
    process.stdout.write('\n');
    if (password.length < 12 || password.length > 128)
      throw new Error('Geçersiz parola uzunluğu.');
    if (confirmation !== password) throw new Error('Parolalar eşleşmedi.');
    const encoded = await hash(password, {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
    await db.$transaction(
      async (tx) => {
        if (await tx.membership.count({ where: { role: 'ADMIN' } }))
          throw new Error('İlk yönetici zaten mevcut.');
        const userId = randomUUID();
        await tx.user.create({
          data: { id: userId, email, name, emailVerified: true },
        });
        await tx.account.create({
          data: {
            id: randomUUID(),
            userId,
            accountId: userId,
            providerId: 'credential',
            password: encoded,
          },
        });
        const organization = await tx.organization.create({
          data: { name: 'Avrasia Creative' },
        });
        await tx.membership.create({
          data: { userId, organizationId: organization.id, role: 'ADMIN' },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    console.log(
      'İlk yönetici oluşturuldu. Giriş yaptıktan sonra hesap güvenliği sayfasından MFA kurun.',
    );
  } catch {
    console.error(
      'Kurulum tamamlanamadı. Girdileri, veritabanını ve mevcut yönetici durumunu kontrol edin.',
    );
    process.exitCode = 1;
  } finally {
    muted = false;
    prompt.close();
    await db.$disconnect();
  }
}

void main().catch(() => {
  console.error('Yönetici kurulumu başlatılamadı.');
  process.exitCode = 1;
});
