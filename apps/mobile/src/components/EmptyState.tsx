import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../theme';

type EmptyStateProps = {
  actionLabel: string;
  body: string;
  minHeight?: number;
  onAction: () => void;
  onBack?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  body,
  minHeight = 520,
  onAction,
  onBack = () => router.back(),
  title
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, { minHeight }]}>
      <Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.text} name="chevron-back" size={22} />
      </Pressable>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      <Pressable onPress={onAction} style={styles.emptyAction}>
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxxl
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surface
  },
  emptyTitle: {
    color: colors.text,
    ...typography.screenTitle
  },
  emptyBody: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body
  },
  emptyAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: spacing.xxl,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  emptyActionText: {
    color: colors.primaryText,
    ...typography.button
  }
});
