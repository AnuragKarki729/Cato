import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type LoadingOverlayProps = {
  message: string;
  visible: boolean;
};

export function LoadingOverlay({ message, visible }: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <ActivityIndicator color={colors.primaryText} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.36)',
    padding: spacing.xxl,
    zIndex: 20
  },
  panel: {
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 210,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  message: {
    color: colors.primaryText,
    ...typography.label,
    textAlign: 'center'
  }
});
