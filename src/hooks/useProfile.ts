import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDatabase } from '@/db/DatabaseProvider';
import { getProfile, profileInputSchema, updateProfile } from '@/repositories/profileRepository';
import type { Profile } from '@/types/profile';

export type SaveResult = { ok: true } | { ok: false; message: string };

export function useProfile() {
  const db = useDatabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProfile(await getProfile(db));
      setError(null);
    } catch (e) {
      console.error('Falha ao carregar perfil', e);
      setError('Não foi possível carregar o perfil.');
    }
  }, [db]);

  // Recarrega sempre que a tela ganha foco (ex.: voltar da aba Perfil para o Início).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = useCallback(
    async (input: { displayName: string | null; waterGoalMl: number }): Promise<SaveResult> => {
      const parsed = profileInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
      }
      try {
        await updateProfile(db, parsed.data);
        await load();
        return { ok: true };
      } catch (e) {
        console.error('Falha ao salvar perfil', e);
        return { ok: false, message: 'Não foi possível salvar. Tente novamente.' };
      }
    },
    [db, load],
  );

  return { profile, error, save, reload: load };
}
