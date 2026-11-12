import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';
import type { Profile } from '@/types/profile';

export const profileInputSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(40, 'O nome pode ter no máximo 40 caracteres.')
    .nullable(),
  waterGoalMl: z
    .number({ message: 'Informe a meta de água em ml.' })
    .int('A meta deve ser um número inteiro.')
    .min(500, 'A meta mínima é 500 ml.')
    .max(10000, 'A meta máxima é 10.000 ml.'),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

type ProfileRow = {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  water_goal_ml: number;
};

export async function getProfile(db: SQLiteDatabase): Promise<Profile> {
  const row = await db.getFirstAsync<ProfileRow>(
    `SELECT id, display_name, height_cm, water_goal_ml
     FROM user_profile WHERE id = 'local' AND deleted_at IS NULL`,
  );
  if (!row) {
    throw new Error('Perfil local não encontrado.');
  }
  return {
    id: row.id,
    displayName: row.display_name,
    heightCm: row.height_cm,
    waterGoalMl: row.water_goal_ml,
  };
}

export async function updateProfile(db: SQLiteDatabase, input: ProfileInput): Promise<void> {
  const name = input.displayName && input.displayName.length > 0 ? input.displayName : null;
  await db.runAsync(
    `UPDATE user_profile
     SET display_name = ?, water_goal_ml = ?, updated_at = ?, sync_status = 'pending'
     WHERE id = 'local'`,
    [name, input.waterGoalMl, new Date().toISOString()],
  );
}
