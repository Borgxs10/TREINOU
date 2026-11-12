import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';

export default function EvolucaoScreen() {
  return (
    <ScreenContainer>
      <AppText variant="display">Minha Evolução</AppText>
      <EmptyState
        icon="trending-up-outline"
        title="Peso, medidas e fotos"
        description="O registro de peso, medidas e fotografias de evolução será entregue na Etapa 6."
      />
    </ScreenContainer>
  );
}
