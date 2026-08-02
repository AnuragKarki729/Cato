import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { RecruiterDashboardResponse } from '@cato/shared';
import { getRecruiterDashboard } from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function RecruiterDashboardScreen() {
  const { session } = useSession();
  const [dashboard, setDashboard] = useState<RecruiterDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterDashboard(session.access_token)
      .then(setDashboard)
      .catch((dashboardError) => {
        setError(dashboardError instanceof Error ? dashboardError.message : 'Unable to load recruiter dashboard');
      });
  }, [session]);

  const metrics = dashboard?.metrics ?? { candidates: 0, bookmarks: 0, messages: 0 };
  const recruiterName = dashboard?.recruiter.name?.split(/\s+/)[0] ?? 'there';
  const recentActivity = dashboard?.recentActivity ?? [];

  return (
    <RecruiterContent>
      <Text style={styles.title}>Good morning, {recruiterName}</Text>
      <View style={styles.planCard}>
        <Text style={styles.planLabel}>Your Plan</Text>
        <Text style={styles.planTitle}>Professional</Text>
        <Text style={styles.planBody}>Review candidates, watch signals, and shortlist students.</Text>
        <Pressable onPress={() => router.push('/(recruiter)/upgrade')} style={styles.lightButton}>
          <Text style={styles.lightButtonText}>View Plan</Text>
        </Pressable>
      </View>
      <View style={styles.metrics}>
        {[
          [String(metrics.candidates), 'Candidates'],
          [String(metrics.bookmarks), 'Bookmarked'],
          [String(metrics.messages), 'Messages']
        ].map(([value, label]) => (
          <View key={label} style={styles.metric}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((item) => (
          <Text key={item} style={styles.body}>{item}</Text>
        ))}
        {recentActivity.length === 0 ? <Text style={styles.body}>No recruiter activity yet.</Text> : null}
      </View>
      <Pressable onPress={() => router.push('/(recruiter)/search')} style={styles.button}>
        <Text style={styles.buttonText}>Search Candidates</Text>
      </Pressable>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, ...typography.screenTitle },
  planCard: { gap: spacing.sm, marginTop: spacing.xl, borderRadius: radii.sm, backgroundColor: colors.primary, padding: spacing.xl },
  planLabel: { color: colors.primaryText, ...typography.meta },
  planTitle: { color: colors.primaryText, fontSize: 24, fontWeight: '900' },
  planBody: { color: colors.primaryText, ...typography.body },
  lightButton: { alignSelf: 'flex-start', marginTop: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  lightButtonText: { color: colors.text, ...typography.label },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metric: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  metricLabel: { marginTop: spacing.xs, color: colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  section: { gap: spacing.sm, marginTop: spacing.xxl },
  sectionTitle: { color: colors.text, ...typography.sectionTitle },
  body: { color: colors.muted, ...typography.body },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: controls.buttonHeight, marginTop: spacing.xxl, borderRadius: radii.sm, backgroundColor: colors.primary },
  buttonText: { color: colors.primaryText, ...typography.button },
  error: { marginTop: spacing.md, color: colors.danger, ...typography.meta }
});
