import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AnatomyViewer } from '@/components/anatomy/AnatomyViewer';
import { manifest } from '@/data/anatomy/manifest';
import { getGroupName, getMuscle, resolveHighlight, type SelectionMode } from '@/data/anatomy/selection';
import { useAnatomyModel } from '@/hooks/useAnatomyModel';
import type { MuscleHit } from '@/services/glbParser';

export default function AnatomiaScreen() {
  const { width } = useWindowDimensions();
  const model = useAnatomyModel();
  const [mode, setMode] = useState<SelectionMode>('muscle');
  const [selected, setSelected] = useState<MuscleHit | null>(null);
  const [faceYaw, setFaceYaw] = useState<{ value: number; nonce: number }>({ value: 0, nonce: 0 });

  const highlighted = useMemo(
    () => (selected ? resolveHighlight(selected.muscleIds, mode, manifest.availableMuscleIds) : new Set<string>()),
    [selected, mode],
  );

  const handlePick = useCallback((hit: MuscleHit | null) => {
    // Tocar fora do corpo, ou de novo no mesmo músculo, limpa a seleção.
    setSelected((current) => (hit === null || current?.label === hit.label ? null : hit));
  }, []);

  const face = (value: number) => setFaceYaw((f) => ({ value, nonce: f.nonce + 1 }));

  const viewerWidth = Math.min(width - spacing.lg * 2, 380);
  const groupId = selected ? getMuscle(selected.muscleIds[0])?.groupId : undefined;
  const groupName = groupId ? getGroupName(groupId) : undefined;
  const sharedPortions = selected !== null && selected.muscleIds.length > 1;

  return (
    <ScreenContainer contentStyle={styles.content}>
      <AppText variant="display">Anatomia</AppText>

      {manifest.placeholder ? (
        <Card style={styles.notice}>
          <AppText variant="label" color={colors.accent}>
            Modelo provisório
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            As formas são simples, só para testar giro, toque e seleção. O corpo anatômico real é gerado com o script
            em tools/ (veja tools/LEIA-ME-MODELO.md).
          </AppText>
        </Card>
      ) : null}

      <View style={styles.chips}>
        <Chip label="Por músculo" selected={mode === 'muscle'} onPress={() => setMode('muscle')} />
        <Chip label="Por grupo" selected={mode === 'group'} onPress={() => setMode('group')} />
        <Chip label="Frente" onPress={() => face(0)} />
        <Chip label="Costas" onPress={() => face(Math.PI)} />
      </View>

      <View style={styles.viewer}>
        {model.status === 'loading' ? (
          <View style={[styles.center, { width: viewerWidth, height: 480 }]}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : model.status === 'error' ? (
          <View style={[styles.center, { width: viewerWidth, height: 200 }]}>
            <AppText variant="body" color={colors.danger} style={styles.centerText}>
              Não foi possível carregar o modelo 3D.
            </AppText>
            <AppText variant="caption" color={colors.textDim} style={styles.centerText}>
              {model.message}
            </AppText>
          </View>
        ) : (
          <AnatomyViewer
            nodes={model.nodes}
            highlighted={highlighted}
            onPick={handlePick}
            faceYaw={faceYaw}
            width={viewerWidth}
            height={480}
          />
        )}
      </View>

      <AppText variant="caption" color={colors.textDim} style={styles.centerText}>
        Arraste para girar · toque em um músculo para selecionar
      </AppText>

      <Card>
        {selected ? (
          <View style={styles.info}>
            <AppText variant="label" color={colors.accent}>
              {mode === 'group' ? 'Grupo selecionado' : 'Músculo selecionado'}
            </AppText>
            <AppText variant="title">{mode === 'group' ? groupName : selected.label}</AppText>
            {mode === 'muscle' ? (
              <AppText variant="caption" color={colors.textMuted}>
                Grupo muscular: {groupName}
              </AppText>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                {highlighted.size} {highlighted.size === 1 ? 'músculo destacado' : 'músculos destacados'} neste modelo.
              </AppText>
            )}
            {sharedPortions && mode === 'muscle' ? (
              <AppText variant="caption" color={colors.textDim}>
                Este modelo não separa as porções deste músculo; todas ficam destacadas juntas.
              </AppText>
            ) : null}
          </View>
        ) : (
          <AppText variant="body" color={colors.textMuted}>
            Toque em um músculo para ver o nome e o grupo. Em "Por grupo", todos os músculos do mesmo grupo acendem
            juntos.
          </AppText>
        )}
      </Card>

      {manifest.missingMuscleIds.length > 0 ? (
        <AppText variant="caption" color={colors.textDim}>
          Sem malha neste modelo: {manifest.missingMuscleIds.map((id) => getMuscle(id)?.name ?? id).join(', ')}.
        </AppText>
      ) : null}

      {manifest.attribution ? (
        <AppText variant="caption" color={colors.textDim}>
          {manifest.attribution}
        </AppText>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  notice: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  viewer: { alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  centerText: { textAlign: 'center' },
  info: { gap: spacing.xs },
});
