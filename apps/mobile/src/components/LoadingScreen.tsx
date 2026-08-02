import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from './Screen';
import { colors, radii, spacing, typography } from '../theme';

type LoadingScreenProps = {
  banner?: string;
};

export function LoadingScreen({ banner = 'Loading' }: LoadingScreenProps) {
  return (
    <Screen centered>
      <View style={styles.shell}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <View style={styles.banner}>
          <ActivityIndicator color={colors.primaryText} />
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      </View>
    </Screen>
  );
}

export function ReconnectScreen() {
  return <LoadingScreen banner="Reconnecting to Cato" />;
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    gap: spacing.xxl
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  logoText: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: '900'
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 18
  },
  bannerText: {
    color: colors.primaryText,
    ...typography.button
  }
});
