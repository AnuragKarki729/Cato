import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

type SectionProps = PropsWithChildren<{
  title?: string;
}>;

export function Section({ children, title }: SectionProps) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    marginTop: spacing.xxl
  },
  title: {
    color: colors.text,
    ...typography.sectionTitle
  }
});
