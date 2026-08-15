import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { RecruiterCandidate } from '@cato/shared';
import { getRecruiterBookmarks } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii } from '../../src/theme';

export default function RecruiterBookmarksScreen() {
  const { session } = useSession();
  const [bookmarks, setBookmarks] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterBookmarks(session.access_token)
      .then((response) => setBookmarks(response.bookmarks))
      .catch((bookmarkError) => {
        setError(bookmarkError instanceof Error ? bookmarkError.message : 'Unable to load bookmarks');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session]);

  if (isLoading) {
    return <LoadingScreen banner="Loading bookmarks" />;
  }

  if (error || bookmarks.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel={error ? 'Back to dashboard' : 'Browse video feed'}
          body={error ?? 'Saved candidates will appear here after you bookmark them.'}
          onAction={() => router.replace(error ? '/(recruiter)/dashboard' : '/(recruiter)/feed')}
          title={error ? 'Unable to load bookmarks' : 'No bookmarks yet'}
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <Text style={styles.title}>Bookmarks</Text>
      <View style={styles.list}>
        {bookmarks.map((candidate) => (
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
            <View>
              <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
              <Text style={styles.body}>{candidate.major ?? 'Major not set'}</Text>
              <Text style={styles.meta}>{candidate.universityName ?? 'University not set'}</Text>
              {candidate.review?.status && candidate.review.status !== 'none' ? (
                <Text style={styles.meta}>Review: {candidate.review.status}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  list: { gap: 12, marginTop: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: 10 },
  avatar: { width: 54, height: 64, borderRadius: 8, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 54, height: 64, borderRadius: 8, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  name: { color: colors.text, fontSize: 16, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700' }
});
