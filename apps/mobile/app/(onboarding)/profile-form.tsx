import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { roleDepartments, semesters } from '@cato/shared';
import type { SaveInternshipRequest } from '@cato/shared';
import { completeOnboardingProfile, getProfile } from '../../src/api/profile';
import { Screen } from '../../src/components/Screen';
import { formatGpaInput, normalizeGpaInput, parseGpaForSave } from '../../src/forms/gpa';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

type InternshipForm = Omit<SaveInternshipRequest, 'durationMonths'> & {
  durationMonths: string;
  localId: number;
};

function newInternship(localId: number): InternshipForm {
  return {
    localId,
    company: '',
    durationMonths: '',
    roleDepartment: 'Engineering'
  };
}

const standardMajors = [
  'Accounting',
  'Aerospace Engineering',
  'African American Studies',
  'Agricultural Business',
  'Agricultural Economics',
  'Animal Science',
  'Anthropology',
  'Applied Mathematics',
  'Architecture',
  'Art History',
  'Artificial Intelligence',
  'Astronomy',
  'Biochemistry',
  'Bioengineering',
  'Biology',
  'Biomedical Engineering',
  'Business Administration',
  'Business Analytics',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Classics',
  'Cognitive Science',
  'Communication',
  'Computer Engineering',
  'Computer Science',
  'Construction Management',
  'Criminal Justice',
  'Cybersecurity',
  'Data Science',
  'Design',
  'Economics',
  'Education',
  'Electrical Engineering',
  'English',
  'Entrepreneurship',
  'Environmental Engineering',
  'Environmental Science',
  'Ethnic Studies',
  'Finance',
  'Fine Arts',
  'Food Science',
  'Foreign Languages',
  'Gender Studies',
  'Geography',
  'Geology',
  'Graphic Design',
  'Health Sciences',
  'History',
  'Hospitality Management',
  'Human Biology',
  'Human Resources Management',
  'Industrial Engineering',
  'Information Systems',
  'Information Technology',
  'International Business',
  'International Relations',
  'Journalism',
  'Kinesiology',
  'Linguistics',
  'Management',
  'Management Information Systems',
  'Marketing',
  'Materials Science',
  'Mathematics',
  'Mechanical Engineering',
  'Media Studies',
  'Music',
  'Neuroscience',
  'Nursing',
  'Nutrition',
  'Operations Management',
  'Philosophy',
  'Physics',
  'Political Science',
  'Pre-Law',
  'Pre-Medicine',
  'Product Design',
  'Psychology',
  'Public Health',
  'Public Policy',
  'Real Estate',
  'Religious Studies',
  'Robotics',
  'Social Work',
  'Sociology',
  'Software Engineering',
  'Spanish',
  'Sports Management',
  'Statistics',
  'Supply Chain Management',
  'Theater',
  'Urban Planning',
  'Women and Gender Studies'
];

function getSessionNameFallback(session: ReturnType<typeof useSession>['session']) {
  const metadata = session?.user.user_metadata;
  const metadataName =
    typeof metadata?.name === 'string'
      ? metadata.name
      : typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : typeof metadata?.display_name === 'string'
          ? metadata.display_name
          : undefined;

  if (metadataName?.trim()) {
    return metadataName.trim();
  }

  const emailLocalPart = session?.user.email?.split('@')[0];

  if (!emailLocalPart) {
    return '';
  }

  return emailLocalPart
    .split('+')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function ProfileFormScreen() {
  const { session } = useSession();
  const keyboardScroll = useKeyboardAwareScroll();
  const companyInputRefs = useRef<Record<number, TextInput | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universityUnitId, setUniversityUnitId] = useState<string | undefined>();
  const [universityMatchedFromEmail, setUniversityMatchedFromEmail] = useState(false);
  const [semesterNumber, setSemesterNumber] = useState<number>(semesters[7].value);
  const [gpa, setGpa] = useState('3.5');
  const [major, setMajor] = useState('');
  const [isMajorFocused, setIsMajorFocused] = useState(false);
  const [minor, setMinor] = useState('');
  const [internships, setInternships] = useState<InternshipForm[]>([]);
  const [pendingCompanyFocusId, setPendingCompanyFocusId] = useState<number | null>(null);

  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.value === semesterNumber) ?? semesters[7],
    [semesterNumber]
  );
  const displayName = name.trim() ? name.trim().split(/\s+/)[0] : 'there';
  const majorSuggestions = useMemo(() => {
    const query = major.trim().toLowerCase();

    if (!isMajorFocused || query.length < 2) {
      return [];
    }

    return standardMajors
      .filter((standardMajor) => standardMajor.toLowerCase().includes(query))
      .filter((standardMajor) => standardMajor.toLowerCase() !== query)
      .slice(0, 8);
  }, [isMajorFocused, major]);
  const invalidInternship = internships.find((internship) => {
    const parsedDurationMonths = Number(internship.durationMonths);

    return (
      !internship.company.trim() ||
      !Number.isFinite(parsedDurationMonths) ||
      parsedDurationMonths < 1 ||
      !internship.roleDepartment
    );
  });
  const isProfileValid = Boolean(
    name.trim() &&
      universityName.trim() &&
      major.trim() &&
      !invalidInternship &&
      internships.every((internship) => internship.durationMonths.trim().length > 0)
  );

  useEffect(() => {
    if (!session?.access_token) {
      setIsLoadingProfile(false);
      return;
    }

    getProfile(session.access_token)
      .then((profile) => {
        setName(profile.applicant.name ?? getSessionNameFallback(session));
        if (profile.education) {
          setUniversityName(profile.education.universityName);
          setUniversityUnitId(profile.education.universityUnitId);
          setUniversityMatchedFromEmail(profile.education.universityMatchedFromEmail);
          setSemesterNumber(profile.education.semesterNumber);
          setGpa(profile.education.gpa ? String(profile.education.gpa) : '3.5');
          setMajor(profile.education.major ?? '');
          setMinor(profile.education.minor ?? '');
        }
      })
      .catch((profileError) => {
        setError(profileError instanceof Error ? profileError.message : 'Unable to load education profile');
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [session]);

  useEffect(() => {
    if (pendingCompanyFocusId === null) {
      return;
    }

    const timeout = setTimeout(() => {
      companyInputRefs.current[pendingCompanyFocusId]?.focus();
      keyboardScroll.scrollToField(`internship-company-${pendingCompanyFocusId}`);
      setPendingCompanyFocusId(null);
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [keyboardScroll, pendingCompanyFocusId, internships.length]);

  function updateInternship(localId: number, patch: Partial<InternshipForm>) {
    setInternships((current) =>
      current.map((internship) => (internship.localId === localId ? { ...internship, ...patch } : internship))
    );
  }

  function addInternship() {
    const localId = Date.now();

    setInternships((current) => [...current, newInternship(localId)]);
    setPendingCompanyFocusId(localId);
  }

  function removeInternship(localId: number) {
    setInternships((current) => current.filter((internship) => internship.localId !== localId));
  }

  async function handleSubmitProfile() {
    if (!session?.access_token) {
      return;
    }

    const parsedGpa = parseGpaForSave(gpa);

    if (parsedGpa === undefined) {
      setError('GPA must be between 0.00 and 4.00.');
      return;
    }

    if (!universityName.trim()) {
      setError('University is required.');
      return;
    }

    if (!major.trim()) {
      setError('Major is required.');
      return;
    }

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (invalidInternship) {
      setError('Each internship needs a company, duration, and role.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await completeOnboardingProfile(session.access_token, {
        name: name.trim(),
        universityName,
        universityUnitId,
        universityMatchedFromEmail,
        semesterLabel: selectedSemester.label,
        semesterNumber: selectedSemester.value,
        gpa: parsedGpa,
        major: major.trim(),
        minor: minor.trim() || undefined,
        internships: internships.map(({ localId, durationMonths, ...internship }) => ({
          ...internship,
          company: internship.company.trim(),
          durationMonths: Number(durationMonths)
        }))
      });
      router.replace('/(tabs)/home');
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to complete profile');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll scrollRef={keyboardScroll.scrollRef}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>C</Text>
      </View>
      <Text style={styles.title}>Save your profile, keep building you.</Text>
      <Text style={styles.body}>
        {displayName === 'there' ? 'Create your profile' : `Create your profile, ${displayName}`}, track your growth,
        and save new insights.
      </Text>

      <View onLayout={keyboardScroll.registerField('name')} style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          autoCapitalize="words"
          onFocus={() => keyboardScroll.focusField('name')}
          onChangeText={setName}
          placeholder="Your name"
          style={[styles.input, !name.trim() ? styles.invalidInput : null]}
          value={name}
        />
      </View>

      <View onLayout={keyboardScroll.registerField('gpa')} style={styles.field}>
        <Text style={styles.label}>University</Text>
        <View style={styles.universityBadge}>
          <Text style={styles.universityText}>{isLoadingProfile ? 'Loading university' : universityName}</Text>
        </View>
      </View>

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
                <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>{semester.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>GPA</Text>
        <TextInput
          inputMode="decimal"
          keyboardType="decimal-pad"
          onBlur={() => setGpa((current) => formatGpaInput(current))}
          onChangeText={(value) => setGpa(normalizeGpaInput(value))}
          onFocus={() => keyboardScroll.focusField('gpa')}
          placeholder="0.00 - 4.00"
          style={styles.input}
          value={gpa}
        />
      </View>

      <View onLayout={keyboardScroll.registerField('major')} style={styles.field}>
        <Text style={styles.label}>Major</Text>
        <TextInput
          autoCapitalize="words"
          onBlur={() => setIsMajorFocused(false)}
          onChangeText={setMajor}
          onFocus={() => {
            setIsMajorFocused(true);
            keyboardScroll.focusField('major');
          }}
          placeholder="Search major"
          style={[styles.input, !major.trim() ? styles.invalidInput : null]}
          value={major}
        />
        {majorSuggestions.length > 0 ? (
          <View style={styles.suggestionList}>
            {majorSuggestions.map((majorSuggestion) => (
              <Pressable
                key={majorSuggestion}
                onPressIn={() => {
                  setMajor(majorSuggestion);
                  setIsMajorFocused(false);
                }}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>{majorSuggestion}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View onLayout={keyboardScroll.registerField('minor')} style={styles.field}>
        <Text style={styles.label}>Minor</Text>
        <TextInput
          onChangeText={setMinor}
          onFocus={() => keyboardScroll.focusField('minor')}
          placeholder="Optional"
          style={styles.input}
          value={minor}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Internships</Text>
      </View>

      {internships.length === 0 ? (
        <Pressable onPress={addInternship} style={styles.inlineAddButton}>
          <Text style={styles.inlineAddButtonText}>Add +</Text>
        </Pressable>
      ) : null}

      {internships.map((internship, index) => (
        <View key={internship.localId} style={styles.internship}>
          <View style={styles.sectionHeader}>
            <Text style={styles.internshipTitle}>Internship {index + 1}</Text>
            <Pressable onPress={() => removeInternship(internship.localId)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
          <View onLayout={keyboardScroll.registerField(`internship-company-${internship.localId}`)} style={styles.field}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              onChangeText={(company) => updateInternship(internship.localId, { company })}
              onFocus={() => keyboardScroll.focusField(`internship-company-${internship.localId}`)}
              placeholder="Company"
              ref={(input) => {
                companyInputRefs.current[internship.localId] = input;
              }}
              style={[styles.input, !internship.company.trim() ? styles.invalidInput : null]}
              value={internship.company}
            />
          </View>
          <View onLayout={keyboardScroll.registerField(`internship-duration-${internship.localId}`)} style={styles.field}>
            <Text style={styles.label}>Duration (months)</Text>
            <TextInput
              inputMode="numeric"
              keyboardType="number-pad"
              onChangeText={(value) => updateInternship(internship.localId, { durationMonths: value.replace(/\D/g, '') })}
              onFocus={() => keyboardScroll.focusField(`internship-duration-${internship.localId}`)}
              placeholder="Duration in months"
              style={[
                styles.input,
                !internship.durationMonths.trim() || Number(internship.durationMonths) < 1 ? styles.invalidInput : null
              ]}
              value={internship.durationMonths}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.optionGrid}>
              {roleDepartments.map((roleDepartment) => {
                const selected = roleDepartment === internship.roleDepartment;

                return (
                  <Pressable
                    key={roleDepartment}
                    onPress={() => updateInternship(internship.localId, { roleDepartment })}
                    style={[styles.option, selected ? styles.selectedOption : null]}
                  >
                    <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>{roleDepartment}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {index === internships.length - 1 ? (
            <Pressable onPress={addInternship} style={styles.inlineAddButton}>
              <Text style={styles.inlineAddButtonText}>Add +</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Pressable
        disabled={isSubmitting || !isProfileValid}
        onPress={handleSubmitProfile}
        style={[styles.button, isSubmitting || !isProfileValid ? styles.disabledButton : null]}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save My Profile'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  logoText: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '900'
  },
  title: {
    marginTop: spacing.xxl,
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    color: colors.muted,
    ...typography.body,
    marginTop: spacing.sm
  },
  field: {
    gap: spacing.sm,
    marginTop: spacing.lg
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
    ...typography.body
  },
  invalidInput: {
    borderColor: colors.danger
  },
  suggestionList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  suggestionItem: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md
  },
  suggestionText: {
    color: colors.text,
    ...typography.meta
  },
  universityBadge: {
    minHeight: controls.inputHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md
  },
  universityText: {
    color: colors.text,
    ...typography.sectionTitle
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  option: {
    minHeight: controls.chipHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.primaryText
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  internship: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.lg
  },
  internshipTitle: {
    color: colors.text,
    ...typography.sectionTitle
  },
  secondaryButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.meta
  },
  inlineAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  inlineAddButtonText: {
    color: colors.text,
    ...typography.button
  },
  removeText: {
    color: colors.danger,
    ...typography.meta
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  disabledButton: {
    opacity: 0.45
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  },
  error: {
    color: colors.danger,
    ...typography.meta
  }
});
