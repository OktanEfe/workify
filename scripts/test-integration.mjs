import EmbeddedPostgres from 'embedded-postgres';
import { spawnSync } from 'node:child_process';
const source = new URL(process.env.DATABASE_URL);
if (
  !['127.0.0.1', 'localhost'].includes(source.hostname) ||
  process.env.NODE_ENV === 'production'
)
  throw new Error('Yalnız yerel test ortamı desteklenir.');
const manager = new EmbeddedPostgres({
  user: decodeURIComponent(source.username),
  password: decodeURIComponent(source.password),
  port: Number(source.port || 5432),
});
const client = manager.getPgClient('postgres', '127.0.0.1');
await client.connect();
const exists = await client.query(
  'SELECT 1 FROM pg_database WHERE datname=$1',
  ['workify_test'],
);
if (!exists.rowCount) await client.query('CREATE DATABASE workify_test');
await client.end();
source.pathname = '/workify_test';
const env = {
  ...process.env,
  DATABASE_URL: source.toString(),
  RUN_DB_TESTS: '1',
  NODE_ENV: 'test',
};
for (const args of [
  ['prisma', 'migrate', 'deploy'],
  ['vitest', 'run', 'tests/integration/operations.test.ts'],
]) {
  const result = spawnSync('npx', args, { stdio: 'inherit', env });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
