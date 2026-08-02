import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { RecruiterCandidate } from '@cato/shared';
import { getRecruiterCandidates } from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii } from '../../src/theme';

export default function RecruiterResultsScreen() {
  const { session } = useSession();
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterCandidates(session.access_token)
      .then((response) => setCandidates(response.candidates))
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidates');
      });
  }, [session]);

  return (
    <RecruiterContent>
      <View style={styles.row}>
        <Text style={styles.title}>128 results</Text>
        <Pressable onPress={() => router.push('/(recruiter)/feed')}>
          <Text style={styles.linkText}>Video feed</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>Swipe to preview 10-second videos.</Text>
      <View style={styles.list}>
        {candidates.map((candidate) => (
          <Pressable
            key={candidate.id}
            onPress={() => router.push({ pathname: '/(recruiter)/candidate/[id]', params: { id: candidate.id } })}
            style={styles.card}
          >
            {candidate.profileImageUrl ? (
              <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
              <Text style={styles.body}>{candidate.major ?? 'Major not set'}</Text>
              <Text style={styles.meta}>{candidate.universityName ?? 'University not set'}</Text>
            </View>
            <View style={styles.duration}>
              <Text style={styles.durationText}>00:10</Text>
            </View>
          </Pressable>
        ))}
        {candidates.length === 0 ? <Text style={styles.body}>No completed applicant profiles yet.</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  linkText: { color: colors.purple, fontSize: 14, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  list: { gap: 12, marginTop: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: 10 },
  avatar: { width: 64, height: 76, borderRadius: 8, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 64, height: 76, borderRadius: 8, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  cardBody: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '900' },
  meta: { marginTop: 3, color: colors.muted, fontSize: 12, fontWeight: '700' },
  duration: { borderRadius: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 5 },
  durationText: { color: colors.primaryText, fontSize: 11, fontWeight: '900' },
  error: { marginTop: 14, color: colors.danger, fontSize: 14, lineHeight: 20 }
});
