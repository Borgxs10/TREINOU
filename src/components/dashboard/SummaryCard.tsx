import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  children: ReactNode;
};

export function SummaryCard({ title, icon, onPress, children }: Props) {
  return (
    <Card onPress={onPress} accessibilityLabel={title}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={16} color={colors.accent} />
          <AppText variant="label" color={colors.textMuted}>
            {title}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
