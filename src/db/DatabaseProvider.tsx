import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { openDatabase } from './client';

type State =
  | { status: 'loading' }
  | { status: 'ready'; db: SQLiteDatabase }
  | { status: 'error'; message: string };

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase deve ser usado dentro de <DatabaseProvider>.');
  }
  return db;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    openDatabase()
      .then((db) => {
        if (!cancelled) setState({ status: 'ready', db });
      })
      .catch((error: unknown) => {
        console.error('Falha ao abrir o banco de dados', error);
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Erro desconhecido.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <AppText variant="title" style={styles.text}>
          Não foi possível abrir seus dados
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.text}>
          Seus dados não foram apagados. Tente novamente; se o problema continuar, feche e reabra o app.
        </AppText>
        <AppText variant="caption" color={colors.textDim} style={styles.text}>
          {state.message}
        </AppText>
        <Button title="Tentar novamente" onPress={retry} style={styles.button} />
      </View>
    );
  }

  return <DatabaseContext.Provider value={state.db}>{children}</DatabaseContext.Provider>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
  button: { marginTop: spacing.md, alignSelf: 'stretch' },
});
