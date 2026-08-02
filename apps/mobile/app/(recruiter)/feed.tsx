import { useEffect, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { RecruiterCandidate } from '@cato/shared';
import { getRecruiterCandidates } from '../../src/api/recruiter';
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
                isPaused={!isFocused || Boolean(selectedCandidate)}
                onKnowMore={setSelectedCandidate}
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
      <RecruiterCandidateSheet candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
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
