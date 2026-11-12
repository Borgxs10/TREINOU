import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TreinosScreen() {
  return (
    <ScreenContainer>
      <AppText variant="display">Treinos</AppText>
      <EmptyState
        icon="barbell-outline"
        title="Seus treinos aparecerão aqui"
        description="A biblioteca de exercícios (Etapa 3) e a criação de treinos personalizados (Etapa 4) ainda não foram implementadas."
      />
    </ScreenContainer>
  );
}
