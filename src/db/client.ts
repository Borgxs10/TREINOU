import * as SQLite from 'expo-sqlite';
import { LATEST_VERSION, MIGRATIONS } from './migrations';
import { seedBase } from './seed';

export const DB_NAME = 'fitness.db';

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current > LATEST_VERSION) {
    throw new Error(
      `O banco de dados (v${current}) é mais novo que esta versão do app (v${LATEST_VERSION}). Atualize o app.`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    // Cada migração roda em transação: se falhar, nada é alterado.
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
    });
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }
}

/** Abre o banco, aplica migrações pendentes e garante a carga inicial. */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  await seedBase(db);
  return db;
}

export async function getSchemaVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}
