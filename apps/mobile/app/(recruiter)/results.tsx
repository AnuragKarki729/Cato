import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecruiterCandidate, RecruiterCandidateReviewStatus, RecruiterCandidateSearchFilters } from '@cato/shared';
import { academicFields, semesters } from '@cato/shared';
import { getRecruiterCandidates } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

function formatMatchStrength(value: RecruiterCandidate['matchStrength']) {
  if (value === 'strong_match') return 'Strong match';
  if (value === 'good_match') return 'Good match';
  if (value === 'potential_match') return 'Potential match';
  return 'Needs review';
}

export default function RecruiterResultsScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams();
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const filters = getFiltersFromParams(params);
  const activeFilters = getActiveFilterLabels(filters);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    getRecruiterCandidates(session.access_token, filters)
      .then((response) => setCandidates(response.candidates))
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidates');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [JSON.stringify(filters), session]);

  if (isLoading) {
    return <LoadingScreen banner="Loading candidates" />;
  }

  if (error || candidates.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel={error ? 'Back to dashboard' : 'Search again'}
          body={
            error ??
            (activeFilters.length > 0 ? 'No completed profiles matched these filters.' : 'Completed applicant profiles will appear here soon.')
          }
          onAction={() => router.replace(error ? '/(recruiter)/dashboard' : '/(recruiter)/search')}
          title={error ? 'Unable to load candidates' : activeFilters.length > 0 ? 'No matches yet' : 'No applicants yet'}
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <View style={styles.row}>
        <Text style={styles.title}>{candidates.length} {candidates.length === 1 ? 'result' : 'results'}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(recruiter)/evidence-queue',
                params: buildSearchParams(filters)
              })
            }
          >
            <Text style={styles.linkText}>Evidence queue</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(recruiter)/shortlist')}>
            <Text style={styles.linkText}>Shortlist</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(recruiter)/feed')}>
            <Text style={styles.linkText}>Video feed</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.body}>
        {filters.categoryFieldId || filters.categoryFieldIds?.length
          ? 'Results prioritize complete profiles, then category match, internships, and projects.'
          : activeFilters.length > 0
          ? 'Showing completed profiles matching your filters.'
          : 'Showing completed applicant profiles.'}
      </Text>
      {activeFilters.length > 0 ? (
        <View style={styles.activeFilters}>
          {activeFilters.map((filter) => (
            <View key={filter} style={styles.activeChip}>
              <Text style={styles.activeChipText}>{filter}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
              <View style={styles.nameRow}>
                <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{candidate.matchScore}%</Text>
                </View>
              </View>
              <View style={styles.matchRow}>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{formatMatchStrength(candidate.matchStrength)}</Text>
                </View>
                {candidate.categoryMatch ? (
                  <View style={styles.matchBadgeMuted}>
                    <Text style={styles.matchBadgeMutedText}>{candidate.categoryMatch.label}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.body}>{candidate.major ?? 'Major not set'} · GPA {candidate.gpa ?? 'N/A'}</Text>
              <Text style={styles.meta}>{candidate.universityName ?? 'University not set'} · {candidate.semesterLabel ?? 'Semester not set'}</Text>
              <Text style={styles.meta}>Profile strength: {candidate.profileStrength}%</Text>
              {candidate.matchEvidence[0] ? (
                <Text style={styles.evidenceText}>{candidate.matchEvidence[0].title}: {candidate.matchEvidence[0].body}</Text>
              ) : null}
              {candidate.promptFieldLabel ? <Text style={styles.meta}>Prompt: {candidate.promptFieldLabel}</Text> : null}
              {candidate.review?.status && candidate.review.status !== 'none' ? (
                <Text style={styles.meta}>Review: {candidate.review.status}</Text>
              ) : null}
              {candidate.interestRequestStatus ? <Text style={styles.meta}>Request: {candidate.interestRequestStatus}</Text> : null}
            </View>
            <View style={styles.duration}>
              <Text style={styles.durationText}>{candidate.tenSecondVideoUrl ? '10s' : 'Profile'}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </RecruiterContent>
  );
}

const recruiterSemesterLabels = new Map<number, string>([
  [1, 'Year 1: Sem 1'],
  [2, 'Year 1: Sem 2'],
  [3, 'Year 2: Sem 1'],
  [4, 'Year 2: Sem 2'],
  [5, 'Year 3: Sem 1'],
  [6, 'Year 3: Sem 2'],
  [7, 'Year 4: Sem 1'],
  [8, 'Year 4: Sem 2'],
  [9, 'Year 5+'],
  [10, 'Graduate student'],
  [99, 'Graduating this semester'],
  [100, 'Graduated']
]);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { alignItems: 'flex-end', gap: spacing.xs },
  title: { color: colors.text, ...typography.screenTitle },
  linkText: { color: colors.purple, ...typography.label },
  body: { color: colors.muted, ...typography.body },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  activeChip: { borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  activeChipText: { color: colors.text, ...typography.meta },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  avatar: { width: 64, height: 76, borderRadius: 8, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 64, height: 76, borderRadius: 8, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { color: colors.text, ...typography.label },
  matchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.xs },
  matchBadge: { alignSelf: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.xs, borderRadius: 999, backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  matchBadgeText: { color: colors.text, ...typography.meta },
  matchBadgeMuted: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  matchBadgeMutedText: { color: colors.text, ...typography.meta },
  scoreBadge: { borderRadius: 999, backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  scoreText: { color: colors.primaryText, fontSize: 11, fontWeight: '900' },
  meta: { marginTop: 3, color: colors.muted, ...typography.meta },
  evidenceText: { marginTop: spacing.xs, color: colors.text, ...typography.meta },
  duration: { borderRadius: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 5 },
  durationText: { color: colors.primaryText, fontSize: 11, fontWeight: '900' }
});

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getNumberParam(value: string | string[] | undefined) {
  const parsed = Number(getSingleParam(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getArrayParam(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = values.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function getNumberArrayParam(value: string | string[] | undefined) {
  const values = getArrayParam(value)
    ?.map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  return values && values.length > 0 ? values : undefined;
}

function getBooleanParam(value: string | string[] | undefined) {
  const normalized = getSingleParam(value);
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

function getFiltersFromParams(params: Record<string, string | string[] | undefined>): RecruiterCandidateSearchFilters {
  const reviewStatus = getSingleParam(params.reviewStatus) as RecruiterCandidateReviewStatus | undefined;

  return {
    q: getSingleParam(params.q),
    categoryFieldId: getSingleParam(params.categoryFieldId),
    categoryFieldIds: getArrayParam(params.categoryFieldIds),
    university: getSingleParam(params.university),
    universities: getArrayParam(params.universities),
    major: getSingleParam(params.major),
    majors: getArrayParam(params.majors),
    semesterNumber: getNumberParam(params.semesterNumber),
    semesterNumbers: getNumberArrayParam(params.semesterNumbers),
    gpaMin: getNumberParam(params.gpaMin),
    gpaMax: getNumberParam(params.gpaMax),
    hasInternship: getBooleanParam(params.hasInternship),
    bookmarkedOnly: getBooleanParam(params.bookmarkedOnly),
    reviewStatus
  };
}

function getActiveFilterLabels(filters: RecruiterCandidateSearchFilters) {
  const categoryLabels = [
    filters.categoryFieldId ? academicFields.find((field) => field.id === filters.categoryFieldId)?.label : undefined,
    ...(filters.categoryFieldIds ?? []).map((fieldId) => academicFields.find((field) => field.id === fieldId)?.label)
  ].filter((label): label is string => Boolean(label));
  const semesterLabels = [
    filters.semesterNumber ? getRecruiterSemesterLabel(filters.semesterNumber) : undefined,
    ...(filters.semesterNumbers ?? []).map(getRecruiterSemesterLabel)
  ].filter((label): label is string => Boolean(label));

  return [
    filters.q ? `Search: ${filters.q}` : undefined,
    categoryLabels.length > 0 ? `Category: ${Array.from(new Set(categoryLabels)).join(', ')}` : undefined,
    filters.university ? `University: ${filters.university}` : undefined,
    filters.universities?.length ? `University: ${filters.universities.join(', ')}` : undefined,
    filters.major ? `Major: ${filters.major}` : undefined,
    filters.majors?.length ? `Major: ${filters.majors.join(', ')}` : undefined,
    semesterLabels.length > 0 ? `Semester: ${Array.from(new Set(semesterLabels)).join(', ')}` : undefined,
    filters.gpaMin ? `GPA >= ${filters.gpaMin}` : undefined,
    filters.gpaMax ? `GPA <= ${filters.gpaMax}` : undefined,
    filters.hasInternship === true ? 'Has internship' : undefined,
    filters.hasInternship === false ? 'No internship' : undefined,
    filters.bookmarkedOnly ? 'Bookmarked' : undefined,
    filters.reviewStatus ? `Review: ${filters.reviewStatus}` : undefined
  ].filter((value): value is string => Boolean(value));
}

function getRecruiterSemesterLabel(semesterNumber: number) {
  return recruiterSemesterLabels.get(semesterNumber) ?? semesters.find((semester) => semester.value === semesterNumber)?.label ?? `Semester ${semesterNumber}`;
}

function buildSearchParams(filters: RecruiterCandidateSearchFilters) {
  const nextParams: Record<string, string | string[]> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    nextParams[key] = Array.isArray(value) ? value.map(String) : String(value);
  });

  return nextParams;
}
