import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <Screen centered>
      <View style={styles.shell}>
        <View style={[styles.logo, styles.reconnectLogo]}>
          <Ionicons color={colors.text} name="cloud-offline-outline" size={30} />
        </View>
        <View style={[styles.banner, styles.reconnectBanner]}>
          <Text style={[styles.bannerText, styles.reconnectText]}>Connection interrupted. Retrying...</Text>
        </View>
      </View>
    </Screen>
  );
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
  reconnectLogo: {
    backgroundColor: colors.surface
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
  },
  reconnectBanner: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  reconnectText: {
    color: colors.text
  }
});
