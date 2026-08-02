import { StyleSheet, Text } from 'react-native';
import { Screen } from './Screen';
import { colors, spacing, typography } from '../theme';

type PlaceholderScreenProps = {
  title: string;
};

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <Screen centered>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>POC scaffold placeholder</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  }
});
