import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getSchemaVersion } from '@/db/client';
import { useDatabase } from '@/db/DatabaseProvider';
import { useProfile } from '@/hooks/useProfile';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

const UPCOMING = [
  { icon: 'water-outline', label: 'Hidratação' },
  { icon: 'medkit-outline', label: 'Minha Suplementação' },
  { icon: 'settings-outline', label: 'Configurações' },
] as const;

export default function PerfilScreen() {
  const db = useDatabase();
  const { profile, error, save } = useProfile();
  const [name, setName] = useState('');
  const [waterGoal, setWaterGoal] = useState('3000');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [schemaVersion, setSchemaVersion] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName ?? '');
      setWaterGoal(String(profile.waterGoalMl));
    }
  }, [profile]);

  useEffect(() => {
    getSchemaVersion(db)
      .then(setSchemaVersion)
      .catch(() => setSchemaVersion(null));
  }, [db]);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    const result = await save({
      displayName: name.trim() === '' ? null : name.trim(),
      waterGoalMl: Number(waterGoal.replace(/\D/g, '')),
    });
    setSaving(false);
    setFeedback(
      result.ok
        ? { kind: 'success', message: 'Perfil salvo.' }
        : { kind: 'error', message: result.message },
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content}>
      <AppText variant="display">Perfil</AppText>

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}

      <View>
        <SectionHeader title="Seus dados" />
        <Card style={styles.form}>
          <View style={styles.field}>
            <AppText variant="caption" color={colors.textMuted}>
              Nome
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Como quer ser chamado"
              placeholderTextColor={colors.textDim}
              maxLength={40}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="caption" color={colors.textMuted}>
              Meta diária de água (ml)
            </AppText>
            <TextInput
              value={waterGoal}
              onChangeText={setWaterGoal}
              placeholder="3000"
              placeholderTextColor={colors.textDim}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.input}
            />
          </View>

          {feedback ? (
            <AppText variant="caption" color={feedback.kind === 'success' ? colors.success : colors.danger}>
              {feedback.message}
            </AppText>
          ) : null}

          <Button title="Salvar" onPress={handleSave} loading={saving} disabled={!profile} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Em breve" />
        <Card style={styles.list}>
          {UPCOMING.map((item) => (
            <View key={item.label} style={styles.row}>
              <Ionicons name={item.icon} size={20} color={colors.textMuted} />
              <AppText variant="body" style={styles.flex}>
                {item.label}
              </AppText>
              <Chip label="Etapa 7" />
            </View>
          ))}
        </Card>
      </View>

      <View>
        <SectionHeader title="Sobre os dados" />
        <AppText variant="caption" color={colors.textDim}>
          Tudo fica salvo apenas neste aparelho. Versão do banco: {schemaVersion ?? '—'}.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
  },
  list: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
