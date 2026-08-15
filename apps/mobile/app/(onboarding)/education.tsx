import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { semesters } from '@cato/shared';
import type { University } from '@cato/shared';
import { matchUniversityByEmail, saveEducation, searchUniversities } from '../../src/api/onboarding';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

const semesterOptions = semesters.map((semester) => ({
  ...semester,
  displayLabel: getSemesterDisplayLabel(semester.label)
}));

const semesterPages = [
  semesterOptions.slice(0, 8),
  semesterOptions.slice(8)
];

export default function EducationScreen() {
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const semesterScrollRef = useRef<ScrollView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatchedFromEmail, setIsMatchedFromEmail] = useState(false);
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number>(semesters[0].value);
  const [semesterPage, setSemesterPage] = useState(0);
  const [semesterCarouselWidth, setSemesterCarouselWidth] = useState(0);
  const [hasMoreUniversities, setHasMoreUniversities] = useState(false);

  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.value === semesterNumber) ?? semesters[0],
    [semesterNumber]
  );
  const semesterPageWidth = semesterCarouselWidth || Math.max(240, width - spacing.xxl * 2 - spacing.lg * 2);
  const semesterChipWidth = (semesterPageWidth - spacing.sm - spacing.xs * 2) / 2;
  const selectedSemesterPage = getPageForValue(semesterPages, semesterNumber);

  useEffect(() => {
    setSemesterPage(selectedSemesterPage);
    semesterScrollRef.current?.scrollTo({
      x: selectedSemesterPage * semesterPageWidth,
      animated: false
    });
  }, [selectedSemesterPage, semesterPageWidth]);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    const token = session.access_token;

    searchUniversities(token, '', { limit: 3 }).then((result) => {
      setUniversities(result.universities);
      setHasMoreUniversities(result.pagination.hasMore);
    }).catch((searchError) => {
      setError(searchError instanceof Error ? searchError.message : 'Unable to load universities');
    });

    if (session.user.email) {
      matchUniversityByEmail(token, session.user.email).then((result) => {
        if (result.university) {
          setSelectedUniversity(result.university);
          setIsMatchedFromEmail(true);
          setQuery(result.university.name);
        }
      }).catch((matchError) => {
        setError(matchError instanceof Error ? matchError.message : 'Unable to match university');
      });
    }
  }, [session?.access_token, session?.user.email]);

  useEffect(() => {
    if (!session?.access_token || isMatchedFromEmail) {
      return;
    }

    const timeout = setTimeout(() => {
      searchUniversities(session.access_token, query, { limit: 3 })
        .then((result) => {
          setUniversities(result.universities);
          setHasMoreUniversities(result.pagination.hasMore);
        })
        .catch((searchError) => {
          setError(searchError instanceof Error ? searchError.message : 'Unable to search universities');
        });
    }, 250);

    return () => clearTimeout(timeout);
  }, [isMatchedFromEmail, query, session?.access_token]);

  async function handleSaveEducation() {
    if (!session?.access_token) {
      return;
    }

    if (!selectedUniversity) {
      setError('Select a university.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveEducation(session.access_token, {
        universityUnitId: selectedUniversity.unitId,
        universityName: selectedUniversity.name,
        universityMatchedFromEmail: isMatchedFromEmail,
        semesterLabel: selectedSemester.label,
        semesterNumber: selectedSemester.value
      });
      router.replace('/(onboarding)/resume');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save education');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.screenShell}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Step 1 of 6</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View>
          <Text style={styles.title}>University and semester</Text>
          <Text style={styles.body}>
            {isMatchedFromEmail && selectedUniversity
              ? `${selectedUniversity.name} matched from your email.`
              : 'Select your US university and semester.'}
          </Text>
        </View>

        <View
          onLayout={(event) => setSemesterCarouselWidth(event.nativeEvent.layout.width - spacing.lg * 2)}
          style={styles.formCard}
        >
          <View style={styles.field}>
            <Text style={styles.label}>University</Text>
            <TextInput
              editable={!isMatchedFromEmail}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedUniversity(null);
              }}
              placeholder="Search university"
              style={[styles.input, isMatchedFromEmail ? styles.disabledInput : null]}
              value={query}
            />
          </View>

          {!isMatchedFromEmail ? (
            <View style={styles.results}>
              {!query.trim() ? <Text style={styles.resultHint}>Top university suggestions</Text> : null}
              {universities.map((university) => {
                const selected = selectedUniversity?.unitId === university.unitId;

                return (
                  <Pressable
                    key={university.unitId}
                    onPress={() => {
                      setSelectedUniversity(university);
                      setQuery(university.name);
                    }}
                    style={[styles.result, selected ? styles.selectedResult : null]}
                  >
                    <Text style={[styles.resultName, selected ? styles.selectedResultText : null]}>
                      {university.name}
                    </Text>
                    <Text style={[styles.resultMeta, selected ? styles.selectedResultText : null]}>
                      {university.city}, {university.state}
                    </Text>
                  </Pressable>
                );
              })}
              {hasMoreUniversities ? (
                <Text style={styles.resultHint}>Search to find more universities.</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Semester</Text>
            {semesterCarouselWidth > 0 ? (
              <>
                <ScrollView
                  horizontal
                  onMomentumScrollEnd={(event) => setSemesterPage(getPageFromScroll(event))}
                  pagingEnabled
                  ref={semesterScrollRef}
                  showsHorizontalScrollIndicator={false}
                  style={styles.semesterCarousel}
                >
                  {semesterPages.map((page, index) => (
                    <View key={index} style={[styles.semesterPage, { width: semesterPageWidth }]}>
                      {page.map((semester) => {
                        const selected = semester.value === semesterNumber;
                        return (
                          <Pressable
                            key={semester.value}
                            onPress={() => setSemesterNumber(semester.value)}
                            style={[styles.option, { width: semesterChipWidth }, selected ? styles.selectedOption : null]}
                          >
                            <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>
                              {semester.displayLabel}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.pageDots}>
                  {semesterPages.map((_, index) => (
                    <View key={index} style={[styles.pageDot, index === semesterPage ? styles.pageDotActive : null]} />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View>
          <Pressable disabled={isSubmitting} onPress={handleSaveEducation} style={styles.button}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Continue'}</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.lg
  },
  progressHeader: {
    gap: spacing.sm
  },
  progressText: {
    color: colors.muted,
    ...typography.meta
  },
  progressTrack: {
    overflow: 'hidden',
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted
  },
  progressFill: {
    width: '16.67%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent
  },
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body
  },
  field: {
    gap: spacing.sm
  },
  formCard: {
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  label: {
    color: colors.text,
    ...typography.label
  },
  input: {
    minHeight: controls.inputHeight,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16
  },
  disabledInput: {
    color: colors.muted,
    backgroundColor: colors.surfaceMuted
  },
  results: {
    gap: spacing.sm
  },
  result: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  selectedResult: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  resultMeta: {
    color: colors.muted,
    ...typography.meta
  },
  resultHint: {
    color: colors.muted,
    ...typography.meta
  },
  selectedResultText: {
    color: '#ffffff'
  },
  semesterCarousel: {
    marginHorizontal: -spacing.xs
  },
  semesterPage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs
  },
  option: {
    width: 134,
    minHeight: controls.chipHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  optionText: {
    color: colors.text,
    textAlign: 'center',
    ...typography.meta
  },
  selectedOptionText: {
    color: '#ffffff'
  },
  pageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  pageDotActive: {
    width: 16,
    backgroundColor: colors.text
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
    ...typography.meta
  }
});

function getPageFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const width = event.nativeEvent.layoutMeasurement.width || 1;
  return Math.round(event.nativeEvent.contentOffset.x / width);
}

function getPageForValue<T extends { value: number | string }>(pages: T[][], value: number | string) {
  const pageIndex = pages.findIndex((page) => page.some((item) => item.value === value));
  return pageIndex >= 0 ? pageIndex : 0;
}

function getSemesterDisplayLabel(label: string) {
  return label
    .replace('Year 5+ / Extended undergrad', 'Year 5+')
    .replace('Semester', 'Sem')
    .replace(/\s+/g, ' ')
    .trim();
}
