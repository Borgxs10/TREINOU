import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { useProfile } from '@/hooks/useProfile';

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatMl(value: number): string {
  return `${value.toLocaleString('pt-BR')} ml`;
}

export default function MeuPainelScreen() {
  const router = useRouter();
  const { profile, error } = useProfile();
  const now = new Date();
  const name = profile?.displayName;

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View>
        <AppText variant="caption" color={colors.textMuted}>
          {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </AppText>
        <AppText variant="display">{name ? `${greeting(now)}, ${name}` : greeting(now)}</AppText>
        <AppText variant="title" color={colors.accent}>
          Meu Painel
        </AppText>
      </View>

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}

      <View>
        <SectionHeader title="Treinamento" />
        <SummaryCard title="Treinos da semana" icon="barbell-outline" onPress={() => router.push('/treinos')}>
          <AppText variant="metric">0</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Nenhum treino registrado ainda. Toque para ir à aba Treinos.
          </AppText>
        </SummaryCard>
      </View>

      <View>
        <SectionHeader title="Hidratação" />
        <SummaryCard title="Água de hoje" icon="water-outline" onPress={() => router.push('/perfil')}>
          <View style={styles.hydrationRow}>
            <ProgressRing progress={0} size={84} strokeWidth={8}>
              <AppText variant="subtitle">0%</AppText>
            </ProgressRing>
            <View style={styles.flex}>
              <AppText variant="metric">
                {profile ? formatMl(profile.waterGoalMl) : '—'}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Meta diária. O registro de consumo chega junto com a área de hábitos.
              </AppText>
            </View>
          </View>
        </SummaryCard>
      </View>

      <View>
        <SectionHeader title="Suplementação" />
        <SummaryCard title="Minha Suplementação" icon="medkit-outline" onPress={() => router.push('/perfil')}>
          <AppText variant="body" color={colors.textMuted}>
            Nenhum suplemento cadastrado.
          </AppText>
        </SummaryCard>
      </View>

      <View>
        <SectionHeader title="Evolução física" />
        <SummaryCard title="Peso e medidas" icon="trending-up-outline" onPress={() => router.push('/evolucao')}>
          <AppText variant="body" color={colors.textMuted}>
            Nenhum peso ou medida registrado.
          </AppText>
        </SummaryCard>
      </View>

      <View>
        <SectionHeader title="Conquistas" />
        <SummaryCard title="Recordes e metas" icon="trophy-outline" onPress={() => router.push('/treinos')}>
          <AppText variant="body" color={colors.textMuted}>
            Seus recordes pessoais e sequência de treinos aparecerão aqui depois do primeiro treino registrado.
          </AppText>
        </SummaryCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  flex: { flex: 1, gap: spacing.xs },
  hydrationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});
