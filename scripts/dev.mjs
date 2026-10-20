import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const children = new Set();
let stopping = false;
function start(args) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: process.env,
  });
  children.add(child);
  child.once('error', () => stop(1));
  child.once('exit', (code) => {
    children.delete(child);
    if (!stopping) stop(code ?? 1);
  });
  return child;
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());

const args = process.argv.slice(2);
const portFlag = args.findIndex((a) => a === '-p' || a === '--port');
const inlinePort = args.find((a) => a.startsWith('--port='))?.split('=')[1];
const port = Number(inlinePort ?? (portFlag >= 0 ? args[portFlag + 1] : 3000));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Geçerli bir port numarası girin.');
  process.exit(1);
}
const portAvailable = await new Promise((resolve) => {
  const server = createServer();
  server.once('error', () => resolve(false));
  server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
});
if (!portAvailable) {
  console.error(
    `${port} portu zaten kullanılıyor. Açık Workify sunucusunu kullanın veya önce onu durdurun: http://localhost:${port}`,
  );
  process.exit(1);
}
const db = new PrismaClient();
async function ready() {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
try {
  const url = new URL(process.env.DATABASE_URL);
  if (!(await ready())) {
    if (!['127.0.0.1', 'localhost'].includes(url.hostname))
      throw new Error(
        'Veritabanına ulaşılamadı. DATABASE_URL bağlantısını kontrol edin.',
      );
    console.log('Yerel PostgreSQL başlatılıyor…');
    start(['--env-file=.env', 'scripts/local-db.mjs']);
    for (let i = 0; i < 40 && !stopping; i++) {
      if (await ready()) break;
      await delay(250);
    }
    if (stopping || !(await ready()))
      throw new Error('Yerel veritabanı başlatılamadı.');
  }
  await db.membership.count();
  await db.contentItem.count();
  console.log(`Veritabanı hazır. Panel: http://localhost:${port}`);
  await db.$disconnect();
  const customPort = args.some(
    (a) => a === '-p' || a === '--port' || a.startsWith('--port='),
  );
  if (!stopping)
    start([
      'node_modules/next/dist/bin/next',
      'dev',
      '--hostname',
      '127.0.0.1',
      ...(!customPort ? ['--port', '3000'] : []),
      ...args,
    ]);
} catch (error) {
  console.error(
    error instanceof Error && !('code' in error)
      ? error.message
      : 'Veritabanı hazır değil. Bağlantıyı ve npm run db:deploy ile migration durumunu kontrol edin.',
  );
  await db.$disconnect();
  stop(1);
}
