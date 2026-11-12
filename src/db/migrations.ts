/**
 * Migrações versionadas. A versão aplicada fica em PRAGMA user_version.
 * Regra: nunca editar uma migração já publicada — crie uma nova com versão maior.
 *
 * Todas as tabelas de dados do usuário carregam created_at, updated_at, deleted_at
 * (exclusão lógica) e sync_status, para permitir sincronização em nuvem no futuro
 * sem refazer o esquema.
 */

export type Migration = { version: number; name: string; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'fundacao',
    sql: `
      CREATE TABLE user_profile (
        id TEXT PRIMARY KEY NOT NULL,
        display_name TEXT,
        height_cm REAL,
        water_goal_ml INTEGER NOT NULL DEFAULT 3000,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'local'
      );

      CREATE TABLE muscle_groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE muscles (
        id TEXT PRIMARY KEY NOT NULL,
        group_id TEXT NOT NULL REFERENCES muscle_groups(id),
        parent_id TEXT REFERENCES muscles(id),
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );
      CREATE INDEX idx_muscles_group ON muscles(group_id);

      CREATE TABLE equipment (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE exercises (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        exercise_type TEXT,
        instructions TEXT,
        common_mistakes TEXT,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'local'
      );

      CREATE TABLE exercise_muscles (
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        muscle_id TEXT NOT NULL REFERENCES muscles(id),
        role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
        PRIMARY KEY (exercise_id, muscle_id)
      );
      CREATE INDEX idx_exercise_muscles_muscle ON exercise_muscles(muscle_id);

      CREATE TABLE exercise_equipment (
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        equipment_id TEXT NOT NULL REFERENCES equipment(id),
        PRIMARY KEY (exercise_id, equipment_id)
      );

      CREATE TABLE exercise_aliases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        alias_normalized TEXT NOT NULL
      );
      CREATE INDEX idx_exercise_aliases_norm ON exercise_aliases(alias_normalized);

      CREATE TABLE images (
        id TEXT PRIMARY KEY NOT NULL,
        owner_type TEXT NOT NULL CHECK (owner_type IN ('exercise', 'equipment', 'supplement')),
        owner_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('execution', 'equipment', 'supplement')),
        source TEXT NOT NULL CHECK (source IN ('bundled', 'remote', 'user')),
        uri_local TEXT,
        uri_origin TEXT,
        license TEXT,
        credit TEXT,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'local'
      );
      CREATE INDEX idx_images_owner ON images(owner_type, owner_id);
    `,
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
