import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="anatomia" options={{ title: 'Anatomia', tabBarIcon: tabIcon('body-outline') }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos', tabBarIcon: tabIcon('barbell-outline') }} />
      <Tabs.Screen name="evolucao" options={{ title: 'Evolução', tabBarIcon: tabIcon('trending-up-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tabIcon('person-outline') }} />
    </Tabs>
  );
}
