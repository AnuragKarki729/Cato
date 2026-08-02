import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { semesters } from '@cato/shared';
import type { University } from '@cato/shared';
import { matchUniversityByEmail, saveEducation, searchUniversities } from '../../src/api/onboarding';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function EducationScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatchedFromEmail, setIsMatchedFromEmail] = useState(false);
  const [query, setQuery] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number>(semesters[0].value);
  const [hasMoreUniversities, setHasMoreUniversities] = useState(false);

  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.value === semesterNumber) ?? semesters[0],
    [semesterNumber]
  );

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
  }, [session]);

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
  }, [isMatchedFromEmail, query, session]);

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
    <Screen scroll>
      <Text style={styles.title}>University and semester</Text>
      <Text style={styles.body}>
        {isMatchedFromEmail && selectedUniversity
          ? `${selectedUniversity.name} matched from your email.`
          : 'Select your US university and semester.'}
      </Text>

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
        <View style={styles.optionGrid}>
          {semesters.map((semester) => {
            const selected = semester.value === semesterNumber;

            return (
              <Pressable
                key={semester.value}
                onPress={() => setSemesterNumber(semester.value)}
                style={[styles.option, selected ? styles.selectedOption : null]}
              >
                <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>
                  {semester.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable disabled={isSubmitting} onPress={handleSaveEducation} style={styles.button}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Continue'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    marginTop: spacing.xl,
    gap: spacing.sm
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16
  },
  disabledInput: {
    color: colors.muted,
    backgroundColor: colors.surfaceMuted
  },
  results: {
    marginTop: spacing.lg,
    gap: spacing.sm
  },
  result: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  option: {
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
    ...typography.meta
  },
  selectedOptionText: {
    color: '#ffffff'
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
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
