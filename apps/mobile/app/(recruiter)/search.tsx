import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

const filters = [
  ['Skills', 'Data Analysis, SQL, Python'],
  ['Industry', 'Healthcare'],
  ['Career Level', 'Mid-level'],
  ['Education', 'University of California'],
  ['Location', 'San Francisco, CA'],
  ['More Filters', 'Experience, Remote, etc.']
];

export default function RecruiterSearchScreen() {
  return (
    <RecruiterContent>
      <Text style={styles.title}>Search Candidates</Text>
      <View style={styles.filters}>
        {filters.map(([label, value]) => (
          <View key={label} style={styles.filterRow}>
            <View>
              <Text style={styles.filterLabel}>{label}</Text>
              <Text style={styles.filterValue}>{value}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={() => router.push('/(recruiter)/feed')} style={styles.button}>
        <Text style={styles.buttonText}>Search Candidates</Text>
      </Pressable>
      <Pressable>
        <Text style={styles.clearText}>Clear all filters</Text>
      </Pressable>
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, ...typography.screenTitle },
  filters: { gap: spacing.md, marginTop: spacing.xl },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 62, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  filterLabel: { color: colors.text, ...typography.label },
  filterValue: { marginTop: spacing.xs, color: colors.muted, ...typography.meta },
  chevron: { color: colors.muted, fontSize: 24 },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: controls.buttonHeight, marginTop: spacing.xxl, borderRadius: radii.sm, backgroundColor: colors.primary },
  buttonText: { color: colors.primaryText, ...typography.button },
  clearText: { marginTop: spacing.lg, color: colors.purple, ...typography.label, textAlign: 'center' }
});
