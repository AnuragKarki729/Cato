import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from './Screen';
import { colors, spacing, typography } from '../theme';

type StateViewProps = {
  title: string;
  body?: string;
  loading?: boolean;
};

export function StateView({ body, loading = false, title }: StateViewProps) {
  return (
    <Screen centered>
      <View style={styles.shell}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center'
  },
  title: {
    color: colors.text,
    ...typography.sectionTitle,
    textAlign: 'center'
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body,
    textAlign: 'center'
  }
});
