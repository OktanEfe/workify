import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (
      !process.env.BETTER_AUTH_URL ||
      !process.env.BETTER_AUTH_SECRET ||
      process.env.BETTER_AUTH_SECRET.length < 32
    )
      throw new Error();
    await db.$queryRaw`SELECT 1`;
    await db.membership.count();
    return Response.json(
      { status: 'ready' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { status: 'not_ready' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
