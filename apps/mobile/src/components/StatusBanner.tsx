import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type StatusBannerTone = 'neutral' | 'success' | 'danger';

type StatusBannerProps = {
  message: string;
  tone?: StatusBannerTone;
  visible?: boolean;
};

export function StatusBanner({ message, tone = 'neutral', visible = true }: StatusBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.banner, tone === 'success' ? styles.success : null, tone === 'danger' ? styles.danger : null]}>
      <Text style={[styles.text, tone === 'success' ? styles.successText : null, tone === 'danger' ? styles.dangerText : null]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  success: {
    borderColor: colors.accent,
    backgroundColor: '#eefee0'
  },
  danger: {
    borderColor: colors.danger,
    backgroundColor: '#fef2f2'
  },
  text: {
    color: colors.muted,
    ...typography.meta
  },
  successText: {
    color: colors.success
  },
  dangerText: {
    color: colors.danger
  }
});
