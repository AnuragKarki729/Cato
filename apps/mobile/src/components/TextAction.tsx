import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

type TextActionProps = PropsWithChildren<{
  destructive?: boolean;
  onPress?: () => void;
}>;

export function TextAction({ children, destructive = false, onPress }: TextActionProps) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Text style={[styles.text, destructive ? styles.destructive : null]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  text: {
    color: colors.purple,
    ...typography.label,
    textAlign: 'center'
  },
  destructive: {
    color: colors.danger
  }
});
