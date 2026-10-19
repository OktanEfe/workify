import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { hash, argon2id } from 'argon2';
import { Prisma } from '@prisma/client';
import type { Actor } from '@/lib/access';
import { withActor, audit } from './context';
const inputSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    jobTitle: z.string().trim().max(100).default(''),
    password: z.string().min(12).max(128),
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, {
    message: 'Parolalar eşleşmiyor.',
  });
export async function createEmployee(actor: Actor, input: unknown) {
  await withActor(actor, async () => undefined, true);
  const data = inputSchema.parse(input);
  const encoded = await hash(data.password, {
    type: argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  try {
    return await withActor(
      actor,
      async (tx, fresh, actorName) => {
        const userId = randomUUID();
        await tx.user.create({
          data: { id: userId, name: data.name, email: data.email },
        });
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: userId,
            userId,
            providerId: 'credential',
            password: encoded,
          },
        });
        const member = await tx.membership.create({
          data: {
            organizationId: fresh.organizationId,
            userId,
            role: 'EMPLOYEE',
            jobTitle: data.jobTitle,
          },
        });
        await audit(tx, fresh, actorName, {
          action: 'CREATE',
          entity: 'Membership',
          entityId: member.id,
          summary: `${data.name} çalışan olarak eklendi.`,
        });
        return member.id;
      },
      true,
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new Error('Bu e-posta adresi zaten kullanılıyor.');
    throw error;
  }
}
