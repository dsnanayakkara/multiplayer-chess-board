import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { pgPool } from './postgres';

const runMigrations = async () => {
  const client = await pgPool.connect();

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`Applied migration: ${file}`);
    }
  } finally {
    client.release();
    await pgPool.end();
  }
};

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
