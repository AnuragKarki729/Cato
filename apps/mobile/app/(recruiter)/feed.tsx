import { useEffect, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { RecruiterCandidate } from '@cato/shared';
import {
  bookmarkRecruiterCandidate,
  deleteRecruiterCandidateBookmark,
  getRecruiterCandidates
} from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { RecruiterCandidateSheet } from '../../src/recruiter/RecruiterCandidateSheet';
import { RecruiterVideoFeedCard } from '../../src/recruiter/RecruiterVideoFeedCard';
import { colors, spacing, typography } from '../../src/theme';

export default function RecruiterFeedScreen() {
  const isFocused = useIsFocused();
  const { session } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedHeight, setFeedHeight] = useState(0);
  const [bookmarkingCandidateId, setBookmarkingCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 82 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const nextIndex = viewableItems[0]?.index;
    if (typeof nextIndex === 'number') {
      setActiveIndex(nextIndex);
    }
  }).current;

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterCandidates(session.access_token)
      .then((response) => {
        setCandidates(response.candidates.filter((candidate) => candidate.tenSecondVideoUrl || candidate.profileImageUrl));
      })
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidates');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session]);

  function handleLayout(event: LayoutChangeEvent) {
    const nextHeight = event.nativeEvent.layout.height;

    if (nextHeight > 0 && Math.round(nextHeight) !== Math.round(feedHeight)) {
      setFeedHeight(nextHeight);
    }
  }

  async function handleToggleBookmark(candidate: RecruiterCandidate) {
    if (!session?.access_token || bookmarkingCandidateId) {
      return;
    }

    const nextBookmarked = !candidate.bookmarked;

    setBookmarkingCandidateId(candidate.id);
    setCandidates((current) =>
      current.map((item) => (item.id === candidate.id ? { ...item, bookmarked: nextBookmarked } : item))
    );
    setSelectedCandidate((current) =>
      current?.id === candidate.id ? { ...current, bookmarked: nextBookmarked } : current
    );

    try {
      if (nextBookmarked) {
        await bookmarkRecruiterCandidate(session.access_token, candidate.id);
      } else {
        await deleteRecruiterCandidateBookmark(session.access_token, candidate.id);
      }
    } catch (bookmarkError) {
      setCandidates((current) =>
        current.map((item) => (item.id === candidate.id ? { ...item, bookmarked: candidate.bookmarked } : item))
      );
      setSelectedCandidate((current) =>
        current?.id === candidate.id ? { ...current, bookmarked: candidate.bookmarked } : current
      );
      setError(bookmarkError instanceof Error ? bookmarkError.message : 'Unable to update bookmark');
    } finally {
      setBookmarkingCandidateId(null);
    }
  }

  if (!session?.access_token) {
    return <LoadingScreen banner="Loading recruiter feed" />;
  }

  if (isLoading) {
    return <LoadingScreen banner="Loading candidate videos" />;
  }

  return (
    <Screen edgeToEdge fullBleed>
      <View onLayout={handleLayout} style={styles.feedShell}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : candidates.length === 0 ? (
          <Text style={styles.empty}>No candidate videos available yet.</Text>
        ) : feedHeight > 0 ? (
          <FlatList
            data={candidates}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({ length: feedHeight, offset: feedHeight * index, index })}
            keyExtractor={(candidate) => candidate.id}
            onViewableItemsChanged={onViewableItemsChanged}
            pagingEnabled
            renderItem={({ item, index }) => (
              <RecruiterVideoFeedCard
                candidate={item}
                height={feedHeight}
                isActive={index === activeIndex}
                isBookmarking={bookmarkingCandidateId === item.id}
                isPaused={!isFocused || Boolean(selectedCandidate)}
                onKnowMore={setSelectedCandidate}
                onToggleBookmark={handleToggleBookmark}
              />
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={feedHeight}
            viewabilityConfig={viewabilityConfig}
          />
        ) : null}
      </View>
      <RecruiterCandidateSheet
        candidate={selectedCandidate}
        isBookmarking={Boolean(selectedCandidate && bookmarkingCandidateId === selectedCandidate.id)}
        onClose={() => setSelectedCandidate(null)}
        onToggleBookmark={handleToggleBookmark}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedShell: {
    flex: 1,
    overflow: 'hidden'
  },
  error: {
    margin: spacing.xxl,
    color: colors.danger,
    ...typography.body
  },
  empty: {
    margin: spacing.xxl,
    color: colors.muted,
    ...typography.body
  }
});
