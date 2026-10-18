import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname))
  throw new Error('Yalnız yerel geliştirme bağlantısı desteklenir.');
const directory = resolve('.local/postgres');
mkdirSync(resolve('.local'), { recursive: true, mode: 0o700 });
const pg = new EmbeddedPostgres({
  databaseDir: directory,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5432),
  persistent: true,
  authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1', '-k', resolve('.local')],
  onLog: () => {},
  onError: () => {},
});
if (!existsSync(resolve(directory, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const database = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-zA-Z0-9_]+$/.test(database))
  throw new Error('Geçersiz yerel veritabanı adı.');
const found = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [
  database,
]);
await client.end();
if (!found.rowCount) await pg.createDatabase(database);
console.log('Workify yerel veritabanı hazır. Durdurmak için Ctrl+C.');
const keepAlive = setInterval(() => {}, 60_000);
async function stop() {
  clearInterval(keepAlive);
  await pg.stop();
  process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
