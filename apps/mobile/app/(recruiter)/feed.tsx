import { useEffect, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, Pressable, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { RecruiterCandidate } from '@cato/shared';
import {
  bookmarkRecruiterCandidate,
  deleteRecruiterCandidateBookmark,
  getRecruiterCandidate,
  getRecruiterCandidates
} from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { RecruiterCandidateSheet } from '../../src/recruiter/RecruiterCandidateSheet';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { RecruiterVideoFeedCard } from '../../src/recruiter/RecruiterVideoFeedCard';
import { colors, spacing, typography } from '../../src/theme';

export default function RecruiterFeedScreen() {
  const isFocused = useIsFocused();
  const params = useLocalSearchParams<{ candidateId?: string }>();
  const { session } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedHeight, setFeedHeight] = useState(0);
  const [isChromeDimmed, setIsChromeDimmed] = useState(false);
  const [bookmarkingCandidateId, setBookmarkingCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);
  const selectedCandidateIdRef = useRef<string | null>(null);
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
        const visibleCandidates = response.candidates.filter((candidate) => candidate.tenSecondVideoUrl || candidate.profileImageUrl);
        setCandidates(visibleCandidates);
        if (params.candidateId) {
          const requestedIndex = visibleCandidates.findIndex((candidate) => candidate.id === params.candidateId);
          if (requestedIndex >= 0) {
            setActiveIndex(requestedIndex);
          }
        }
      })
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidates');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params.candidateId, session]);

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

  function handleKnowMore(candidate: RecruiterCandidate) {
    if (!session?.access_token) {
      return;
    }

    selectedCandidateIdRef.current = candidate.id;
    setSelectedCandidate(candidate);

    getRecruiterCandidate(session.access_token, candidate.id)
      .then((response) => {
        if (selectedCandidateIdRef.current === candidate.id) {
          setSelectedCandidate(response.candidate);
        }
      })
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidate details');
      });
  }

  function handleCloseSheet() {
    selectedCandidateIdRef.current = null;
    setSelectedCandidate(null);
  }

  if (!session?.access_token) {
    return <LoadingScreen banner="Loading recruiter feed" />;
  }

  if (isLoading) {
    return <LoadingScreen banner="Loading candidate videos" />;
  }

  if (error || candidates.length === 0) {
    return (
      <Screen>
        <RecruiterEmptyState
          actionLabel="Back to dashboard"
          body={error ?? 'Candidates will appear here after applicants complete their short take.'}
          onAction={() => router.replace('/(recruiter)/dashboard')}
          title={error ? 'Unable to load videos' : 'No candidate videos yet'}
        />
      </Screen>
    );
  }

  return (
    <Screen edgeToEdge fullBleed>
      <View onLayout={handleLayout} style={styles.feedShell}>
        <Pressable onPress={() => router.replace('/(recruiter)/dashboard')} style={styles.dashboardButton}>
          <Ionicons color={colors.text} name="chevron-back" size={16} />
          <Text style={styles.dashboardButtonText}>Dashboard</Text>
        </Pressable>
        {feedHeight > 0 ? (
          <FlatList
            data={candidates}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({ length: feedHeight, offset: feedHeight * index, index })}
            keyExtractor={(candidate) => candidate.id}
            initialScrollIndex={
              params.candidateId
                ? Math.max(candidates.findIndex((candidate) => candidate.id === params.candidateId), 0)
                : 0
            }
            onViewableItemsChanged={onViewableItemsChanged}
            pagingEnabled
            renderItem={({ item, index }) => (
              <RecruiterVideoFeedCard
                candidate={item}
                height={feedHeight}
                isActive={index === activeIndex}
                isBookmarking={bookmarkingCandidateId === item.id}
                isChromeDimmed={isChromeDimmed}
                isPaused={!isFocused || Boolean(selectedCandidate)}
                onKnowMore={handleKnowMore}
                onToggleChromeDimmed={() => setIsChromeDimmed((current) => !current)}
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
        onClose={handleCloseSheet}
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
  dashboardButton: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    zIndex: 5,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(251,250,247,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dashboardButtonText: {
    color: colors.text,
    ...typography.meta
  }
});
