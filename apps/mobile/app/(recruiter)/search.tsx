import { Children, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  RecruiterCandidateReviewStatus,
  RecruiterCandidateSearchFilters,
  RecruiterSavedFilter,
  RecruiterSavedFilterCriteria
} from '@cato/shared';
import { academicFields, majorFieldMappings, semesters } from '@cato/shared';
import {
  createRecruiterSavedFilter,
  deleteRecruiterSavedFilter,
  getRecruiterSavedFilters
} from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

const universityOptions = [
  'Harvard University',
  'Stanford University',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'New York University',
  'Princeton University',
  'University of Pennsylvania',
  'Columbia University in the City of New York'
];

const majorOptions = Object.keys(majorFieldMappings)
  .map((major) => major.replace(/\b\w/g, (letter) => letter.toUpperCase()))
  .sort((left, right) => left.localeCompare(right));

const gpaMinOptions = [2.5, 3, 3.2, 3.5, 3.7, 3.9];

const reviewStatusOptions: Array<{ label: string; value: RecruiterCandidateReviewStatus }> = [
  { label: 'No status', value: 'none' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Passed', value: 'passed' }
];

const semesterFilterOptions = [
  { label: 'Year 1: Sem 1', value: 1 },
  { label: 'Year 1: Sem 2', value: 2 },
  { label: 'Year 2: Sem 1', value: 3 },
  { label: 'Year 2: Sem 2', value: 4 },
  { label: 'Year 3: Sem 1', value: 5 },
  { label: 'Year 3: Sem 2', value: 6 },
  { label: 'Year 4: Sem 1', value: 7 },
  { label: 'Year 4: Sem 2', value: 8 },
  { label: 'Year 5+', value: 9 },
  { label: 'Graduate student', value: 10 },
  { label: 'Graduating this semester', value: 99 },
  { label: 'Graduated', value: 100 }
];

const semesterFilterPages = [
  semesterFilterOptions.slice(0, 4),
  semesterFilterOptions.slice(4, 8),
  semesterFilterOptions.slice(8)
];

export default function RecruiterSearchScreen() {
  const { session } = useSession();
  const insets = useSafeAreaInsets();
  const [categoryFieldIds, setCategoryFieldIds] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [universityQuery, setUniversityQuery] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [semesterNumbers, setSemesterNumbers] = useState<number[]>([]);
  const [gpaMin, setGpaMin] = useState<number | undefined>(undefined);
  const [hasInternship, setHasInternship] = useState<boolean | undefined>(undefined);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<RecruiterCandidateReviewStatus | undefined>(undefined);
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<RecruiterSavedFilter[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromptSaving, setIsPromptSaving] = useState(false);
  const [pendingSearchCriteria, setPendingSearchCriteria] = useState<RecruiterSavedFilterCriteria | null>(null);
  const [promptFilterName, setPromptFilterName] = useState('');
  const idealApplicantSummary = buildIdealApplicantSummary({
    categoryFieldIds,
    gpaMin,
    hasInternship,
    majors,
    reviewStatus,
    semesterNumbers,
    universities
  });

  const activeFilters = useMemo(
    () =>
      getActiveFilterLabels({
        bookmarkedOnly,
        categoryFieldIds,
        gpaMin,
        hasInternship,
        majors,
        reviewStatus,
        semesterNumbers,
        universities
      }),
    [bookmarkedOnly, categoryFieldIds, gpaMin, hasInternship, majors, reviewStatus, semesterNumbers, universities]
  );

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterSavedFilters(session.access_token)
      .then((response) => setSavedFilters(response.filters))
      .catch(() => setStatusMessage('Saved filters could not be loaded.'));
  }, [session?.access_token]);

  function getCurrentCriteria(): RecruiterSavedFilterCriteria {
    return {
      categoryFieldIds: categoryFieldIds.length > 0 ? categoryFieldIds : undefined,
      universities: universities.length > 0 ? universities : undefined,
      majors: majors.length > 0 ? majors : undefined,
      semesterNumbers: semesterNumbers.length > 0 ? semesterNumbers : undefined,
      gpaMin,
      hasInternship,
      bookmarkedOnly: bookmarkedOnly || undefined,
      reviewStatus
    };
  }

  function navigateToResults(criteria: RecruiterSavedFilterCriteria) {
    router.push({
      pathname: '/(recruiter)/results',
      params: buildSearchParams(criteria)
    });
  }

  function handleSearch(criteria: RecruiterSavedFilterCriteria = getCurrentCriteria(), options: { skipSavePrompt?: boolean } = {}) {
    if (!options.skipSavePrompt && hasMeaningfulCriteria(criteria) && !isFilterAlreadySaved(criteria, savedFilters)) {
      setStatusMessage(null);
      setPendingSearchCriteria(criteria);
      setPromptFilterName(filterName.trim());
      return;
    }

    navigateToResults(criteria);
  }

  async function handlePromptSaveAndSearch() {
    if (!session?.access_token || !pendingSearchCriteria || isPromptSaving) {
      return;
    }

    const name = promptFilterName.trim();

    if (!name) {
      setStatusMessage('Name this filter before saving it.');
      return;
    }

    setIsPromptSaving(true);
    setStatusMessage(null);

    try {
      const response = await createRecruiterSavedFilter(session.access_token, {
        name,
        criteria: pendingSearchCriteria
      });
      setSavedFilters((current) => [response.filter, ...current]);
      setFilterName('');
      setPromptFilterName('');
      setPendingSearchCriteria(null);
      navigateToResults(pendingSearchCriteria);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to save this filter.');
    } finally {
      setIsPromptSaving(false);
    }
  }

  function handlePromptSearchOnly() {
    if (!pendingSearchCriteria) {
      return;
    }

    const criteria = pendingSearchCriteria;
    setPendingSearchCriteria(null);
    setPromptFilterName('');
    navigateToResults(criteria);
  }

  async function handleSaveFilter() {
    if (!session?.access_token || isSaving) {
      return;
    }

    const name = filterName.trim();

    if (!name) {
      setStatusMessage('Name this filter before saving it.');
      return;
    }

    if (activeFilters.length === 0) {
      setStatusMessage('Choose at least one filter before saving.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await createRecruiterSavedFilter(session.access_token, {
        name,
        criteria: getCurrentCriteria()
      });
      setSavedFilters((current) => [response.filter, ...current]);
      setFilterName('');
      setStatusMessage('Filter saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to save this filter.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteSavedFilter(filter: RecruiterSavedFilter) {
    if (!session?.access_token) {
      return;
    }

    Alert.alert('Delete saved filter?', filter.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecruiterSavedFilter(session.access_token, filter.id);
            setSavedFilters((current) => current.filter((savedFilter) => savedFilter.id !== filter.id));
          } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Unable to delete this filter.');
          }
        }
      }
    ]);
  }

  function clearFilters() {
    setCategoryFieldIds([]);
    setUniversities([]);
    setMajors([]);
    setCategoryQuery('');
    setUniversityQuery('');
    setMajorQuery('');
    setSemesterNumbers([]);
    setGpaMin(undefined);
    setHasInternship(undefined);
    setBookmarkedOnly(false);
    setReviewStatus(undefined);
    setStatusMessage(null);
  }

  return (
    <View style={styles.screen}>
      {idealApplicantSummary ? (
        <>
          <View pointerEvents="none" style={[styles.stickySummaryVeil, { height: insets.top + 76 }]}>
            <View style={styles.stickySummaryTint} />
          </View>
          <Pressable
            accessibilityLabel="Clear all filters"
            onPress={clearFilters}
            style={[styles.stickyResetButton, { top: insets.top }]}
          >
            <Text style={styles.stickyResetText}>X</Text>
          </Pressable>
          <View style={[styles.stickySummary, { top: insets.top + spacing.sm }]}>
            <View style={styles.stickySummaryRow}>
              <Text style={styles.stickySummaryLabel}>Ideal applicant:</Text>
              {idealApplicantSummary.categoryBadges.map((badge) => (
                <View key={badge} style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{badge}</Text>
                </View>
              ))}
              {idealApplicantSummary.hiddenCategoryCount > 0 ? (
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>+{idealApplicantSummary.hiddenCategoryCount}</Text>
                </View>
              ) : null}
            </View>
            {idealApplicantSummary.text ? (
              <Text style={styles.stickySummaryText}>{idealApplicantSummary.text}</Text>
            ) : null}
          </View>
        </>
      ) : null}
      <RecruiterContent bottomOffset={15}>
        <Text style={styles.title}>Build a Shortlist</Text>
        <Text style={styles.body}>Create reusable filters from selectable candidate attributes.</Text>

      {savedFilters.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.filterLabel}>Top filters</Text>
          <View style={styles.savedGrid}>
            {savedFilters.map((filter) => (
              <View key={filter.id} style={styles.savedFilter}>
                <Pressable onPress={() => handleSearch(filter.criteria, { skipSavePrompt: true })} style={styles.savedFilterBody}>
                  <Text style={styles.savedFilterName}>{filter.name}</Text>
                  <Text style={styles.savedFilterMeta}>{getActiveFilterLabelsFromCriteria(filter.criteria).join(' · ') || 'All candidates'}</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteSavedFilter(filter)} hitSlop={10}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <SearchSelectSection
        getLabel={(value) => academicFields.find((field) => field.id === value)?.label ?? value}
        onChangeQuery={setCategoryQuery}
        onClear={() => setCategoryFieldIds([])}
        onRemove={(value) => setCategoryFieldIds((current) => current.filter((item) => item !== value))}
        onSelect={(value) => setCategoryFieldIds((current) => addSelected(current, value))}
        options={academicFields.filter((field) => field.id !== 'general').map((field) => ({ label: field.label, value: field.id }))}
        placeholder="Search category"
        query={categoryQuery}
        selectedValues={categoryFieldIds}
        title="Category"
      />

      <SearchSelectSection
        onChangeQuery={setUniversityQuery}
        onClear={() => setUniversities([])}
        onRemove={(value) => setUniversities((current) => current.filter((item) => item !== value))}
        onSelect={(value) => setUniversities((current) => addSelected(current, value))}
        options={universityOptions.map((university) => ({ label: university, value: university }))}
        placeholder="Search university"
        query={universityQuery}
        selectedValues={universities}
        title="University"
      />

      <SearchSelectSection
        onChangeQuery={setMajorQuery}
        onClear={() => setMajors([])}
        onRemove={(value) => setMajors((current) => current.filter((item) => item !== value))}
        onSelect={(value) => setMajors((current) => addSelected(current, value))}
        options={majorOptions.map((major) => ({ label: major, value: major }))}
        placeholder="Search major"
        query={majorQuery}
        selectedValues={majors}
        title="Major"
      />

      <SemesterSection selectedValues={semesterNumbers} onClear={() => setSemesterNumbers([])} onToggle={setSemesterNumbers} />

      <SelectableSection title="GPA minimum" paged={false}>
        <FilterChip active={gpaMin === undefined} label="Any" onPress={() => setGpaMin(undefined)} />
        {gpaMinOptions.map((option) => (
          <FilterChip key={option} active={gpaMin === option} label={`${option.toFixed(2)}+`} onPress={() => setGpaMin(option)} />
        ))}
      </SelectableSection>

      <SelectableSection title="Internship">
        <FilterChip active={hasInternship === undefined} label="Any" onPress={() => setHasInternship(undefined)} />
        <FilterChip active={hasInternship === true} label="Has internship" onPress={() => setHasInternship(true)} />
        <FilterChip active={hasInternship === false} label="No internship" onPress={() => setHasInternship(false)} />
      </SelectableSection>

      <SelectableSection title="Shortlist">
        <FilterChip active={!bookmarkedOnly} label="All candidates" onPress={() => setBookmarkedOnly(false)} />
        <FilterChip active={bookmarkedOnly} label="Bookmarked only" onPress={() => setBookmarkedOnly(true)} />
      </SelectableSection>

      <SelectableSection title="Review status" paged={false}>
        <FilterChip active={!reviewStatus} label="Any" onPress={() => setReviewStatus(undefined)} />
        {reviewStatusOptions.map((option) => (
          <FilterChip
            key={option.value}
            active={reviewStatus === option.value}
            label={option.label}
            onPress={() => setReviewStatus(option.value)}
          />
        ))}
      </SelectableSection>

      {activeFilters.length > 0 ? (
        <View style={styles.activeFilters}>
          {activeFilters.map((filter) => (
            <View key={filter} style={styles.activeChip}>
              <Text style={styles.activeChipText}>{filter}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.saveBox}>
        <Text style={styles.filterLabel}>Save this filter</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={60}
          onChangeText={setFilterName}
          placeholder="Example: Tech first-years"
          placeholderTextColor={colors.muted}
          style={styles.filterInput}
          value={filterName}
        />
        <Text style={styles.helperText}>{savedFilters.length}/10 saved filters</Text>
        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
        <Pressable disabled={isSaving} onPress={handleSaveFilter} style={[styles.secondaryButton, isSaving ? styles.disabledButton : null]}>
          <Text style={styles.secondaryButtonText}>{isSaving ? 'Saving...' : 'Save filter'}</Text>
        </Pressable>
      </View>

      <Modal animationType="fade" transparent visible={Boolean(pendingSearchCriteria)} onRequestClose={() => setPendingSearchCriteria(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save this filter?</Text>
            <Text style={styles.modalBody}>
              Save this combination for later use. Soon you’ll be able to open saved filters quickly from the dashboard.
            </Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={60}
              onChangeText={setPromptFilterName}
              placeholder="Filter name"
              placeholderTextColor={colors.muted}
              style={styles.filterInput}
              value={promptFilterName}
            />
            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
            <Pressable
              disabled={isPromptSaving}
              onPress={handlePromptSaveAndSearch}
              style={[styles.button, styles.modalButton, isPromptSaving ? styles.disabledButton : null]}
            >
              <Text style={styles.buttonText}>{isPromptSaving ? 'Saving...' : 'Save & Search'}</Text>
            </Pressable>
            <Pressable onPress={handlePromptSearchOnly} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryButtonText}>Search only</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setPendingSearchCriteria(null);
                setPromptFilterName('');
              }}
            >
              <Text style={styles.clearText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </RecruiterContent>
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={() => handleSearch()} style={styles.stickyButton}>
          <Text style={styles.buttonText}>Search Candidates</Text>
        </Pressable>
        <Pressable onPress={clearFilters}>
          <Text style={styles.stickyClearText}>Clear all filters</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { color: colors.text, ...typography.screenTitle },
  body: { marginTop: spacing.md, color: colors.muted, ...typography.body },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  filterLabel: { color: colors.text, ...typography.label },
  filterInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body
  },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  pagedOptions: { marginTop: spacing.xs, overflow: 'hidden' },
  chipPage: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, paddingRight: spacing.md },
  pageDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  pageDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.border },
  pageDotActive: { width: 16, backgroundColor: colors.text },
  stickySummary: {
    position: 'absolute',
    right: spacing.xxl,
    left: spacing.xxl,
    zIndex: 50,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  stickySummaryVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 40,
    overflow: 'hidden'
  },
  stickySummaryTint: {
    flex: 1,
    backgroundColor: 'rgba(251, 250, 247, 0.85)'
  },
  stickyResetButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface
  },
  stickyResetText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  stickySummaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  stickySummaryLabel: { color: colors.text, ...typography.label },
  stickySummaryText: { marginTop: spacing.xs, textAlign: 'center', color: colors.text, ...typography.label },
  summaryBadge: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3
  },
  summaryBadgeText: { color: colors.text, ...typography.meta },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.text, ...typography.meta },
  chipTextActive: { color: colors.primaryText },
  savedGrid: { gap: spacing.sm },
  savedFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  savedFilterBody: { flex: 1, gap: spacing.xs },
  savedFilterName: { color: colors.text, ...typography.label },
  savedFilterMeta: { color: colors.muted, ...typography.meta },
  deleteText: { color: colors.danger, ...typography.meta },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  activeChip: { borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  activeChipText: { color: colors.text, ...typography.meta },
  saveBox: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  helperText: { color: colors.muted, ...typography.meta },
  statusText: { color: colors.purple, ...typography.meta },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    marginTop: spacing.xxl,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  stickyFooter: {
    position: 'absolute',
    right: 0,
    bottom: 20,
    left: 0,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md
  },
  stickyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  buttonText: { color: colors.primaryText, ...typography.button },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.text
  },
  secondaryButtonText: { color: colors.background, ...typography.label },
  disabledButton: { opacity: 0.6 },
  clearText: { marginTop: spacing.lg, color: colors.purple, ...typography.label, textAlign: 'center' },
  stickyClearText: { color: colors.purple, ...typography.label, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.35)',
    padding: spacing.xl
  },
  modalCard: {
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  modalTitle: { color: colors.text, ...typography.sectionTitle },
  modalBody: { color: colors.muted, ...typography.body },
  modalButton: { marginTop: spacing.sm },
  modalSecondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  modalSecondaryButtonText: { color: colors.text, ...typography.label }
});

function SelectableSection({ children, paged = true, title }: { children: React.ReactNode; paged?: boolean; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.filterLabel}>{title}</Text>
      {paged ? <PagedChipRow>{children}</PagedChipRow> : <View style={styles.chipRow}>{children}</View>}
    </View>
  );
}

function SemesterSection({
  onClear,
  onToggle,
  selectedValues
}: {
  onClear: () => void;
  onToggle: React.Dispatch<React.SetStateAction<number[]>>;
  selectedValues: number[];
}) {
  const pages = [
    [<FilterChip key="any" active={selectedValues.length === 0} label="Any" onPress={onClear} />, ...buildSemesterChips(semesterFilterPages[0], selectedValues, onToggle)],
    ...semesterFilterPages.slice(1).map((page) => buildSemesterChips(page, selectedValues, onToggle))
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.filterLabel}>Semester</Text>
      <PagedChipPages pages={pages} />
    </View>
  );
}

function buildSemesterChips(
  options: Array<{ label: string; value: number }>,
  selectedValues: number[],
  onToggle: React.Dispatch<React.SetStateAction<number[]>>
) {
  return options.map((semester) => (
    <FilterChip
      key={semester.value}
      active={selectedValues.includes(semester.value)}
      label={semester.label}
      onPress={() => onToggle((current) => toggleItem(current, semester.value))}
    />
  ));
}

function PagedChipRow({ children }: { children: React.ReactNode }) {
  return <PagedChipPages pages={chunkArray(Children.toArray(children), 4)} />;
}

function PagedChipPages({ pages }: { pages: React.ReactNode[][] }) {
  const { width } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const pageWidth = Math.max(280, width - spacing.xl * 2);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActivePage(Math.max(0, Math.min(nextPage, pages.length - 1)));
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        scrollEventThrottle={16}
        style={styles.pagedOptions}
      >
        {pages.map((page, index) => (
          <View key={index} style={[styles.chipPage, { width: pageWidth }]}>
            {page}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? (
        <View style={styles.pageDots}>
          {pages.map((_, index) => (
            <View key={index} style={[styles.pageDot, activePage === index ? styles.pageDotActive : null]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

function SearchSelectSection<T extends string | number>({
  getLabel,
  onChangeQuery,
  onClear,
  onRemove,
  onSelect,
  options,
  placeholder,
  query,
  selectedValues,
  title
}: {
  getLabel?: (value: T) => string;
  onChangeQuery: (value: string) => void;
  onClear: () => void;
  onRemove: (value: T) => void;
  onSelect: (value: T) => void;
  options: SelectOption<T>[];
  placeholder: string;
  query: string;
  selectedValues: T[];
  title: string;
}) {
  const availableOptions = getPrioritizedOptions(options, query).filter((option) => !selectedValues.includes(option.value));
  const isSearching = Boolean(query.trim());
  const visibleOptions = isSearching ? availableOptions.slice(0, 8) : availableOptions;
  const optionChips = [
    <FilterChip key="any" active={selectedValues.length === 0} label="Any" onPress={onClear} />,
    ...visibleOptions.map((option) => (
        <FilterChip
          key={String(option.value)}
          active={false}
          label={option.label}
          onPress={() => {
            onSelect(option.value);
            onChangeQuery('');
          }}
        />
      ))
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.filterLabel}>{title}</Text>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={onChangeQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.filterInput}
        value={query}
      />
      {selectedValues.length > 0 ? (
        <View style={styles.selectedRow}>
          {selectedValues.map((value) => (
            <FilterChip key={String(value)} active label={`${getLabel?.(value) ?? String(value)} x`} onPress={() => onRemove(value)} />
          ))}
        </View>
      ) : null}
      {isSearching ? <View style={styles.optionList}>{optionChips}</View> : <PagedChipRow>{optionChips}</PagedChipRow>}
    </View>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function toggleItem<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

function addSelected<T>(items: T[], item: T) {
  return items.includes(item) ? items : [...items, item];
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getPrioritizedOptions<T extends string | number>(options: SelectOption<T>[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return options;
  }

  return options
    .map((option) => {
      const normalizedLabel = option.label.toLowerCase();
      const startsWith = normalizedLabel.startsWith(normalizedQuery);
      const includes = normalizedLabel.includes(normalizedQuery);

      return { option, rank: startsWith ? 0 : includes ? 1 : 2 };
    })
    .filter((item) => item.rank < 2)
    .sort((left, right) => left.rank - right.rank || left.option.label.localeCompare(right.option.label))
    .map((item) => item.option);
}

function buildSearchParams(filters: RecruiterCandidateSearchFilters | RecruiterSavedFilterCriteria) {
  const params: Record<string, string | string[]> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    params[key] = Array.isArray(value) ? value.map(String) : String(value);
  });

  return params;
}

function hasMeaningfulCriteria(criteria: RecruiterSavedFilterCriteria) {
  return Object.values(criteria).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== false && value !== '';
  });
}

function isFilterAlreadySaved(criteria: RecruiterSavedFilterCriteria, savedFilters: RecruiterSavedFilter[]) {
  const currentKey = buildFilterComparisonKey(criteria);
  return savedFilters.some((filter) => buildFilterComparisonKey(filter.criteria) === currentKey);
}

function buildFilterComparisonKey(criteria: RecruiterSavedFilterCriteria) {
  const normalized: RecruiterSavedFilterCriteria = {
    ...(criteria.categoryFieldIds?.length ? { categoryFieldIds: normalizeStringArray(criteria.categoryFieldIds) } : {}),
    ...(criteria.universities?.length ? { universities: normalizeStringArray(criteria.universities) } : {}),
    ...(criteria.majors?.length ? { majors: normalizeStringArray(criteria.majors) } : {}),
    ...(criteria.semesterNumbers?.length ? { semesterNumbers: normalizeNumberArray(criteria.semesterNumbers) } : {}),
    ...(typeof criteria.gpaMin === 'number' ? { gpaMin: Math.round(criteria.gpaMin * 100) / 100 } : {}),
    ...(typeof criteria.hasInternship === 'boolean' ? { hasInternship: criteria.hasInternship } : {}),
    ...(criteria.bookmarkedOnly ? { bookmarkedOnly: true } : {}),
    ...(criteria.reviewStatus ? { reviewStatus: criteria.reviewStatus } : {})
  };

  return JSON.stringify(normalized);
}

function normalizeStringArray(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))).sort();
}

function normalizeNumberArray(values: number[]) {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value)))).sort((left, right) => left - right);
}

function getActiveFilterLabels(input: {
  bookmarkedOnly: boolean;
  categoryFieldIds: string[];
  gpaMin: number | undefined;
  hasInternship: boolean | undefined;
  majors: string[];
  reviewStatus: RecruiterCandidateReviewStatus | undefined;
  semesterNumbers: number[];
  universities: string[];
}) {
  return getActiveFilterLabelsFromCriteria({
    bookmarkedOnly: input.bookmarkedOnly || undefined,
    categoryFieldIds: input.categoryFieldIds,
    gpaMin: input.gpaMin,
    hasInternship: input.hasInternship,
    majors: input.majors,
    reviewStatus: input.reviewStatus,
    semesterNumbers: input.semesterNumbers,
    universities: input.universities
  });
}

function getActiveFilterLabelsFromCriteria(criteria: RecruiterSavedFilterCriteria) {
  const categoryLabels = (criteria.categoryFieldIds ?? [])
    .map((fieldId) => academicFields.find((field) => field.id === fieldId)?.label)
    .filter((label): label is string => Boolean(label));
  const semesterLabels = (criteria.semesterNumbers ?? [])
    .map((semesterNumber) => semesterFilterOptions.find((semester) => semester.value === semesterNumber)?.label ?? `Semester ${semesterNumber}`)
    .filter(Boolean);

  return [
    criteria.q ? `Search: ${criteria.q}` : undefined,
    categoryLabels.length > 0 ? `Category: ${categoryLabels.join(', ')}` : undefined,
    criteria.universities?.length ? `University: ${criteria.universities.join(', ')}` : undefined,
    criteria.majors?.length ? `Major: ${criteria.majors.join(', ')}` : undefined,
    semesterLabels.length > 0 ? `Semester: ${semesterLabels.join(', ')}` : undefined,
    criteria.gpaMin ? `GPA >= ${criteria.gpaMin}` : undefined,
    criteria.hasInternship === true ? 'Has internship' : undefined,
    criteria.hasInternship === false ? 'No internship' : undefined,
    criteria.bookmarkedOnly ? 'Bookmarked' : undefined,
    criteria.reviewStatus ? `Review: ${criteria.reviewStatus}` : undefined
  ].filter((value): value is string => Boolean(value));
}

function buildIdealApplicantSummary(criteria: {
  categoryFieldIds: string[];
  gpaMin: number | undefined;
  hasInternship: boolean | undefined;
  majors: string[];
  reviewStatus: RecruiterCandidateReviewStatus | undefined;
  semesterNumbers: number[];
  universities: string[];
}) {
  const hasAnyFilter =
    criteria.categoryFieldIds.length > 0 ||
    criteria.majors.length > 0 ||
    criteria.semesterNumbers.length > 0 ||
    criteria.universities.length > 0 ||
    typeof criteria.gpaMin === 'number' ||
    typeof criteria.hasInternship === 'boolean' ||
    Boolean(criteria.reviewStatus);

  if (!hasAnyFilter) {
    return null;
  }

  const majorPhrase = getJoinedPhrase(criteria.majors);
  const categoryLabels = criteria.categoryFieldIds
    .map((fieldId) => academicFields.find((field) => field.id === fieldId)?.label)
    .filter((label): label is string => Boolean(label));
  const semesterPhrase = getJoinedPhrase(criteria.semesterNumbers.map(getSemesterApplicantLabel).filter(Boolean));
  const universityPhrase = getJoinedPhrase(criteria.universities);
  const base = [semesterPhrase, majorPhrase].filter(Boolean).join(' ');
  const applicantPhrase = `${base ? `${base} ` : ''}applicant`;
  const clauses = [
    universityPhrase ? `from ${universityPhrase}` : undefined,
    typeof criteria.gpaMin === 'number' ? `with GPA ${criteria.gpaMin.toFixed(2)}+` : undefined,
    criteria.hasInternship === true ? 'with internship experience' : undefined,
    criteria.hasInternship === false ? 'without internship experience' : undefined,
    criteria.reviewStatus ? `marked ${criteria.reviewStatus}` : undefined
  ].filter(Boolean);

  return {
    categoryBadges: categoryLabels.slice(0, 2),
    hiddenCategoryCount: Math.max(0, categoryLabels.length - 2),
    text: [capitalizeFirst(applicantPhrase), ...clauses].join(' ')
  };
}

function getSemesterApplicantLabel(semesterNumber: number) {
  if (semesterNumber === 99) return 'graduating';
  if (semesterNumber === 100) return 'graduated';
  if (semesterNumber === 9) return 'year 5+';
  if (semesterNumber === 10) return 'graduate student';

  const year = Math.ceil(semesterNumber / 2);
  const semester = semesterNumber % 2 === 0 ? 2 : 1;
  return `${getOrdinal(year)} year ${getOrdinal(semester)} semester`;
}

function getOrdinal(value: number) {
  const suffix = value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}

function getJoinedPhrase(values: string[]) {
  const normalized = values.filter(Boolean);

  if (normalized.length <= 1) {
    return normalized[0] ?? '';
  }

  if (normalized.length === 2) {
    return `${normalized[0]} or ${normalized[1]}`;
  }

  return `${normalized.slice(0, -1).join(', ')}, or ${normalized[normalized.length - 1]}`;
}

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
