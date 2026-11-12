import type { SQLiteDatabase } from 'expo-sqlite';
import { MUSCLE_GROUPS, MUSCLES } from '@/data/muscles';

/**
 * Carga inicial idempotente: pode rodar a cada abertura do app.
 * - Catálogo (grupos e músculos): atualizado por UPSERT.
 * - Perfil local: criado uma única vez e nunca sobrescrito.
 */
export async function seedBase(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < MUSCLE_GROUPS.length; i++) {
      const g = MUSCLE_GROUPS[i];
      await db.runAsync(
        `INSERT INTO muscle_groups (id, name, sort_order) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order`,
        [g.id, g.name, i],
      );
    }

    for (let i = 0; i < MUSCLES.length; i++) {
      const m = MUSCLES[i];
      await db.runAsync(
        `INSERT INTO muscles (id, group_id, parent_id, name, sort_order) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           group_id = excluded.group_id,
           parent_id = excluded.parent_id,
           name = excluded.name,
           sort_order = excluded.sort_order`,
        [m.id, m.groupId, m.parentId, m.name, i],
      );
    }

    await db.runAsync(
      `INSERT OR IGNORE INTO user_profile (id, water_goal_ml, created_at, updated_at)
       VALUES ('local', 3000, ?, ?)`,
      [now, now],
    );
  });
}
