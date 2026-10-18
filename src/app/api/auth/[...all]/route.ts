import { getAuth } from '@/lib/auth';
export const runtime = 'nodejs';
async function handle(request: Request) {
  return getAuth().handler(request);
}
export { handle as GET, handle as POST };
