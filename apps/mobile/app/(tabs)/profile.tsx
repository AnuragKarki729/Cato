import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, PanResponder, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { roleDepartments, semesters } from '@cato/shared';
import type { Internship, ProfileResponse, RecruiterCandidate, SaveInternshipRequest, SoftSkillItem } from '@cato/shared';
import { acceptPrivacyConsent } from '../../src/api/privacy';
import { deleteResume, uploadResume } from '../../src/api/resume';
import {
  createInternship,
  deleteAccount,
  deleteInternship,
  getProfile,
  setProfileImageSource,
  updateApplicant,
  updateEducation,
  updateInternship
} from '../../src/api/profile';
import { deleteVideo } from '../../src/api/signal';
import { FullscreenResumeDialog } from '../../src/components/FullscreenResumeDialog';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { Screen } from '../../src/components/Screen';
import { VideoRecorder } from '../../src/components/VideoRecorder';
import { formatGpaInput, normalizeGpaInput, parseGpaForSave } from '../../src/forms/gpa';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { supabase } from '../../src/lib/supabase';
import { getResumeFileType, readUriAsDataUri } from '../../src/media/fileData';
import { uploadProfileImageToCloudinary } from '../../src/media/profileImageUpload';
import { uploadRecordedVideoToCloudinary } from '../../src/media/videoUpload';
import { RecruiterCandidateSheet } from '../../src/recruiter/RecruiterCandidateSheet';
import { RecruiterVideoFeedCard } from '../../src/recruiter/RecruiterVideoFeedCard';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

type InternshipDraft = Omit<SaveInternshipRequest, 'durationMonths'> & {
  durationMonths: string;
  id?: string;
};

function emptyInternship(): InternshipDraft {
  return {
    company: '',
    durationMonths: '3',
    roleDepartment: 'Engineering'
  };
}

function toDraft(internship: Internship): InternshipDraft {
  return {
    id: internship.id,
    company: internship.company,
    durationMonths: String(internship.durationMonths),
    roleDepartment: internship.roleDepartment
  };
}

function getVideoThumbnailUrl(secureUrl?: string) {
  if (!secureUrl) {
    return undefined;
  }

  return secureUrl.replace('/video/upload/', '/video/upload/so_0,w_480,h_480,c_fill/').replace(/\.[^/.]+$/, '.jpg');
}

function getTraitIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('communication')) {
    return 'chatbubble-ellipses-outline';
  }

  if (normalized.includes('authentic')) {
    return 'sparkles-outline';
  }

  if (normalized.includes('adapt')) {
    return 'shuffle-outline';
  }

  if (normalized.includes('empathy')) {
    return 'heart-outline';
  }

  if (normalized.includes('resilience')) {
    return 'shield-checkmark-outline';
  }

  if (normalized.includes('collaboration')) {
    return 'people-outline';
  }

  if (normalized.includes('critical')) {
    return 'bulb-outline';
  }

  if (normalized.includes('creativity')) {
    return 'color-palette-outline';
  }

  if (normalized.includes('curiosity')) {
    return 'search-outline';
  }

  if (normalized.includes('presence')) {
    return 'radio-button-on-outline';
  }

  if (normalized.includes('warmth')) {
    return 'sunny-outline';
  }

  if (normalized.includes('composure')) {
    return 'leaf-outline';
  }

  if (normalized.includes('awareness')) {
    return 'eye-outline';
  }

  if (normalized.includes('drive') || normalized.includes('ownership')) {
    return 'flag-outline';
  }

  if (normalized.includes('listening')) {
    return 'ear-outline';
  }

  if (normalized.includes('reliability') || normalized.includes('consistency')) {
    return 'checkmark-done-outline';
  }

  if (normalized.includes('humility')) {
    return 'hand-left-outline';
  }

  if (normalized.includes('flexibility')) {
    return 'git-branch-outline';
  }

  if (normalized.includes('inclusivity')) {
    return 'accessibility-outline';
  }

  if (normalized.includes('open mindedness')) {
    return 'aperture-outline';
  }

  if (normalized.includes('thoughtfulness')) {
    return 'flower-outline';
  }

  if (normalized.includes('patience')) {
    return 'hourglass-outline';
  }

  if (normalized.includes('professionalism')) {
    return 'briefcase-outline';
  }

  if (normalized.includes('confidence') || normalized.includes('leadership')) {
    return 'trophy-outline';
  }

  if (normalized.includes('positivity')) {
    return 'happy-outline';
  }

  if (normalized.includes('perspective')) {
    return 'telescope-outline';
  }

  if (normalized.includes('discernment') || normalized.includes('decision')) {
    return 'compass-outline';
  }

  if (normalized.includes('resourcefulness') || normalized.includes('problem')) {
    return 'construct-outline';
  }

  if (normalized.includes('strategic')) {
    return 'map-outline';
  }

  if (normalized.includes('influence')) {
    return 'megaphone-outline';
  }

  if (normalized.includes('originality')) {
    return 'finger-print-outline';
  }

  return 'sparkles-outline';
}

function getStarIcon(star: number, rating: number) {
  if (rating >= star) {
    return 'star';
  }

  if (rating >= star - 0.5) {
    return 'star-half';
  }

  return 'star-outline';
}

export default function ProfileScreen() {
  const { height } = useWindowDimensions();
  const { session } = useSession();
  const keyboardScroll = useKeyboardAwareScroll();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [name, setName] = useState('');
  const [semesterNumber, setSemesterNumber] = useState<number>(semesters[7].value);
  const [gpa, setGpa] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [internshipDrafts, setInternshipDrafts] = useState<InternshipDraft[]>([]);
  const [softSkillDrafts, setSoftSkillDrafts] = useState<SoftSkillItem[]>([]);
  const [recordingMode, setRecordingMode] = useState<'10-second' | '30-second' | null>(null);
  const [showRecruiterPreview, setShowRecruiterPreview] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [previewSheetCandidate, setPreviewSheetCandidate] = useState<RecruiterCandidate | null>(null);

  const selectedSemester = useMemo(
    () => semesters.find((semester) => semester.value === semesterNumber) ?? semesters[7],
    [semesterNumber]
  );
  const tenSecondThumbnail = getVideoThumbnailUrl(profile?.signal?.tenSecondVideo?.secureUrl);
  const thirtySecondThumbnail = getVideoThumbnailUrl(profile?.signal?.thirtySecondVideo?.secureUrl);
  const profileImageUrl =
    profile?.applicant.profileImage?.source === 'uploaded'
      ? profile.applicant.profileImage.secureUrl
      : profile?.applicant.profileImage?.source === 'thirty_second_video'
        ? thirtySecondThumbnail
        : tenSecondThumbnail;
  const hasNameChange = Boolean(profile && name.trim() !== (profile.applicant.name ?? '').trim());
  const recruiterPreviewCandidate = useMemo<RecruiterCandidate | null>(() => {
    if (!profile) {
      return null;
    }

    return {
      id: profile.applicant.id,
      applicantId: profile.applicant.id,
      name: profile.applicant.name,
      email: profile.applicant.email,
      universityName: profile.education?.universityName,
      semesterLabel: profile.education?.semesterLabel,
      semesterNumber: profile.education?.semesterNumber,
      gpa: profile.education?.gpa,
      major: profile.education?.major,
      minor: profile.education?.minor,
      profileImageUrl,
      promptTextSnapshot: profile.signal?.promptTextSnapshot,
      tenSecondElaboration: profile.signal?.tenSecondElaboration,
      signalSummary: profile.signal?.tenSecondElaboration,
      tenSecondVideoUrl: profile.signal?.tenSecondVideo?.secureUrl,
      thirtySecondVideoUrl: profile.signal?.thirtySecondVideo?.secureUrl,
      resumeUrl: profile.resume?.secureUrl,
      resumePreviewUrl: profile.resume?.previewUrl ?? profile.resume?.secureUrl,
      resumeFileName: profile.resume?.originalFileName,
      softSkills: profile.softSkills?.items ?? [],
      internships: profile.internships.map((internship) => ({
        id: internship.id,
        company: internship.company,
        durationMonths: internship.durationMonths,
        roleDepartment: internship.roleDepartment
      })),
      bookmarked: false
    };
  }, [profile, profileImageUrl]);
  const profileImagePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 44) {
            confirmProfileImageSource('ten_second_video');
            return;
          }

          if (gesture.dx < -44) {
            confirmProfileImageSource('thirty_second_video');
          }
        }
      }),
    [tenSecondThumbnail, thirtySecondThumbnail, isBusy]
  );

  function confirmAction(title: string, message: string, onConfirm: () => void, destructive = false) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm, style: destructive ? 'destructive' : 'default' }
    ]);
  }

  function confirmUploadProfileImage() {
    confirmAction('Upload profile picture?', 'This will replace your current profile picture.', handleUploadProfileImage);
  }

  function confirmProfileImageSource(source: 'ten_second_video' | 'thirty_second_video') {
    if (source === 'ten_second_video' && !tenSecondThumbnail) {
      setError('Record your short take before using that frame.');
      return;
    }

    if (source === 'thirty_second_video' && !thirtySecondThumbnail) {
      setError('Record your deeper signal before using that frame.');
      return;
    }

    confirmAction(
      source === 'ten_second_video' ? 'Use short take frame?' : 'Use deeper signal frame?',
      'This will update the image recruiters see on your profile.',
      () => chooseProfileImageSource(source)
    );
  }

  function confirmLogout() {
    confirmAction('Log out?', 'You can sign back in anytime.', handleLogout);
  }

  function confirmDeleteAccount() {
    confirmAction('Delete account?', 'This deletes your account and profile data. This cannot be undone.', handleDeleteAccount, true);
  }

  function handleSemesterChange(nextSemesterNumber: number) {
    setSemesterNumber(nextSemesterNumber);
    Alert.alert(
      'Review GPA?',
      'A new semester can mean your GPA changed. You can update it now or keep the current value.',
      [
        { text: 'Keep current GPA', style: 'cancel' },
        {
          text: 'Review GPA',
          onPress: () => keyboardScroll.focusField('profile-gpa')
        }
      ]
    );
  }

  async function loadProfile() {
    if (!session?.access_token) {
      return;
    }

    setError(null);

    try {
      const result = await getProfile(session.access_token);
      setProfile(result);
      setName(result.applicant.name ?? '');
      setSemesterNumber(result.education?.semesterNumber ?? semesters[7].value);
      setGpa(result.education?.gpa ? String(result.education.gpa) : '');
      setMajor(result.education?.major ?? '');
      setMinor(result.education?.minor ?? '');
      setInternshipDrafts(result.internships.map(toDraft));
      setSoftSkillDrafts(result.softSkills?.items ?? []);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to load profile');
    }
  }

  useEffect(() => {
    loadProfile();
  }, [session]);

  function updateInternshipDraft(index: number, patch: Partial<InternshipDraft>) {
    setInternshipDrafts((current) =>
      current.map((internship, currentIndex) =>
        currentIndex === index ? { ...internship, ...patch } : internship
      )
    );
  }

  async function saveApplicantName() {
    if (!session?.access_token) {
      return;
    }

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await updateApplicant(session.access_token, { name: name.trim() });
      setStatus('Name saved');
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save name');
    } finally {
      setIsBusy(false);
    }
  }

  async function chooseProfileImageSource(source: 'ten_second_video' | 'thirty_second_video' | 'uploaded') {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setIsUploadingProfileImage(true);
    setError(null);

    try {
      await setProfileImageSource(session.access_token, source);
      setStatus('Profile image preference saved');
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile image preference');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUploadProfileImage() {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif', 'image/webp'],
        multiple: false,
        copyToCacheDirectory: true
      });

      if (picked.canceled) {
        return;
      }

      const asset = picked.assets[0];

      await uploadProfileImageToCloudinary(session.access_token, {
        uri: asset.uri,
        contentType: asset.mimeType ?? 'image/jpeg',
        fileSizeBytes: asset.size ?? undefined
      });
      setStatus('Profile image uploaded');
      await loadProfile();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload profile image');
    } finally {
      setIsUploadingProfileImage(false);
      setIsBusy(false);
    }
  }

  async function saveEducation() {
    if (!session?.access_token || !profile?.education) {
      return;
    }

    const parsedGpa = parseGpaForSave(gpa);

    if (gpa.trim() && parsedGpa === undefined) {
      setError('GPA must be between 0.00 and 4.00.');
      return;
    }

    if (!major.trim()) {
      setError('Major is required.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await updateEducation(session.access_token, {
        universityName: profile.education.universityName,
        universityUnitId: profile.education.universityUnitId,
        universityMatchedFromEmail: profile.education.universityMatchedFromEmail,
        semesterLabel: selectedSemester.label,
        semesterNumber: selectedSemester.value,
        gpa: parsedGpa,
        major: major.trim(),
        minor: minor.trim() || undefined
      });
      setStatus('Education saved');
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save education');
    } finally {
      setIsBusy(false);
    }
  }

  async function saveInternship(index: number) {
    if (!session?.access_token) {
      return;
    }

    const internship = internshipDrafts[index];

    if (!internship.company.trim()) {
      setError('Internship company is required.');
      return;
    }

    const durationMonths = Number(internship.durationMonths);

    if (!Number.isFinite(durationMonths) || durationMonths < 1) {
      setError('Internship duration must be at least 1 month.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const body = {
        company: internship.company.trim(),
        durationMonths,
        roleDepartment: internship.roleDepartment
      };

      if (internship.id) {
        await updateInternship(session.access_token, internship.id, body);
      } else {
        await createInternship(session.access_token, body);
      }

      setStatus('Internship saved');
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save internship');
    } finally {
      setIsBusy(false);
    }
  }

  async function removeInternship(index: number) {
    if (!session?.access_token) {
      return;
    }

    const internship = internshipDrafts[index];

    if (!internship.id) {
      setInternshipDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index));
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await deleteInternship(session.access_token, internship.id);
      setStatus('Internship deleted');
      await loadProfile();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete internship');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUploadResume() {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await acceptPrivacyConsent(session.access_token, {
        resume: true,
        privacyPolicy: true
      });
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        multiple: false,
        copyToCacheDirectory: true
      });

      if (picked.canceled) {
        return;
      }

      const asset = picked.assets[0];
      const dataUri = await readUriAsDataUri(asset.uri, asset.mimeType ?? 'application/octet-stream');

      await uploadResume(session.access_token, {
        dataUri,
        originalFileName: asset.name,
        fileType: getResumeFileType(asset.name, asset.mimeType),
        fileSizeBytes: asset.size ?? 1
      });
      setStatus('Resume uploaded');
      await loadProfile();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload resume');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteResume() {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await deleteResume(session.access_token);
      setStatus('Resume deleted');
      await loadProfile();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete resume');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRecorded(video: {
    uri: string;
    contentType: string;
    durationSeconds: number;
    fileSizeBytes?: number | null;
  }) {
    if (!session?.access_token || !recordingMode) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await uploadRecordedVideoToCloudinary(session.access_token, recordingMode, video);
      setStatus('Video uploaded');
      setRecordingMode(null);
      await loadProfile();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload video');
    } finally {
      setIsBusy(false);
    }
  }

  async function startRecording(type: '10-second' | '30-second') {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await acceptPrivacyConsent(session.access_token, {
        video: true,
        privacyPolicy: true
      });
      setRecordingMode(type);
    } catch (consentError) {
      setError(consentError instanceof Error ? consentError.message : 'Unable to record video consent');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteVideo(type: '10-second' | '30-second') {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await deleteVideo(session.access_token, type);
      setStatus('Video deleted');
      await loadProfile();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete video');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!session?.access_token) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await deleteAccount(session.access_token);
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/(auth)/sign-in');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete account');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    setIsBusy(true);
    setError(null);

    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to log out');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Screen scroll scrollBottomPadding={spacing.xxxl} scrollRef={keyboardScroll.scrollRef}>
      <LoadingOverlay message="Uploading profile picture..." visible={isUploadingProfileImage} />
      <FullscreenResumeDialog
        downloadUrl={profile?.resume?.secureUrl}
        fileName={profile?.resume?.originalFileName ?? 'resume'}
        onClose={() => setShowResumePreview(false)}
        url={profile?.resume?.previewUrl ?? profile?.resume?.secureUrl}
        visible={showResumePreview}
      />
      <Text style={styles.title}>Profile</Text>
      {profile ? (
        <>
          <View style={[styles.section, styles.sectionAccount]}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.profileImageRow}>
              <Pressable
                {...profileImagePanResponder.panHandlers}
                disabled={isBusy}
                onPress={confirmUploadProfileImage}
                style={styles.profileImagePressable}
              >
                {profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImageFallback}>
                    <Text style={styles.profileImageFallbackText}>{(profile.applicant.name ?? 'C').charAt(0)}</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.profileImageActions}>
                <Text style={styles.body}>Tap to upload a picture. Swipe right for short take, left for deeper signal.</Text>
              </View>
            </View>
            <Text style={styles.label}>Name</Text>
            <View onLayout={keyboardScroll.registerField('profile-name')}>
              <TextInput
                onChangeText={setName}
                onFocus={() => keyboardScroll.focusField('profile-name')}
                placeholder="Name"
                style={[styles.input, !name.trim() ? styles.invalidInput : null]}
                value={name}
              />
            </View>
            {hasNameChange ? (
              <Pressable
                disabled={isBusy || !name.trim()}
                onPress={saveApplicantName}
                style={[styles.secondaryButton, isBusy || !name.trim() ? styles.disabledButton : null]}
              >
                <Text style={styles.secondaryButtonText}>Save name</Text>
              </Pressable>
            ) : null}
            <Text style={styles.body}>{profile.applicant.email}</Text>
            <Pressable disabled={!recruiterPreviewCandidate} onPress={() => setShowRecruiterPreview(true)} style={styles.button}>
              <Text style={styles.buttonText}>Preview my profile</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            {profile.finishProfilePrompt ? <Text style={styles.prompt}>Finish my profile</Text> : null}
          </View>

          <Modal
            animationType="slide"
            onRequestClose={() => {
              setPreviewSheetCandidate(null);
              setShowRecruiterPreview(false);
            }}
            visible={showRecruiterPreview && Boolean(recruiterPreviewCandidate)}
          >
            <View style={styles.previewModal}>
              {recruiterPreviewCandidate ? (
                <RecruiterVideoFeedCard
                  candidate={recruiterPreviewCandidate}
                  height={height}
                  isActive
                  isPaused={Boolean(previewSheetCandidate)}
                  onKnowMore={setPreviewSheetCandidate}
                />
              ) : null}
              <Pressable
                onPress={() => {
                  setPreviewSheetCandidate(null);
                  setShowRecruiterPreview(false);
                }}
                style={styles.previewCloseButton}
              >
                <Text style={styles.previewCloseText}>Close preview</Text>
              </Pressable>
              <RecruiterCandidateSheet candidate={previewSheetCandidate} onClose={() => setPreviewSheetCandidate(null)} />
            </View>
          </Modal>

          <View style={[styles.section, styles.sectionEducation]}>
            <Text style={styles.universityText}>{profile.education?.universityName ?? 'Not set'}</Text>
            <Text style={styles.label}>Semester</Text>
            <View style={styles.optionGrid}>
              {semesters.map((semester) => {
                const selected = semester.value === semesterNumber;

                return (
                  <Pressable
                    key={semester.value}
                    onPress={() => handleSemesterChange(semester.value)}
                    style={[styles.option, selected ? styles.selectedOption : null]}
                  >
                    <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>
                      {semester.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View onLayout={keyboardScroll.registerField('profile-gpa')}>
              <TextInput
                inputMode="decimal"
                keyboardType="decimal-pad"
                onBlur={() => setGpa((current) => formatGpaInput(current))}
                onChangeText={(value) => setGpa(normalizeGpaInput(value))}
                onFocus={() => keyboardScroll.focusField('profile-gpa')}
                placeholder="GPA 0.00 - 4.00"
                style={styles.input}
                value={gpa}
              />
            </View>
            <View onLayout={keyboardScroll.registerField('profile-major')}>
              <TextInput
                onChangeText={setMajor}
                onFocus={() => keyboardScroll.focusField('profile-major')}
                placeholder="Major"
                style={[styles.input, !major.trim() ? styles.invalidInput : null]}
                value={major}
              />
            </View>
            <View onLayout={keyboardScroll.registerField('profile-minor')}>
              <TextInput
                onChangeText={setMinor}
                onFocus={() => keyboardScroll.focusField('profile-minor')}
                placeholder="Minor optional"
                style={styles.input}
                value={minor}
              />
            </View>
            <Pressable
              disabled={isBusy || !profile.education || !major.trim()}
              onPress={saveEducation}
              style={[styles.button, isBusy || !profile.education || !major.trim() ? styles.disabledButton : null]}
            >
              <Text style={styles.buttonText}>Save education</Text>
            </Pressable>
          </View>

          <View style={[styles.section, styles.sectionInternships]}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Internships</Text>
              <Pressable onPress={() => setInternshipDrafts((current) => [...current, emptyInternship()])}>
                <Text style={styles.linkText}>Add</Text>
              </Pressable>
            </View>
            {internshipDrafts.length === 0 ? <Text style={styles.body}>No internships added</Text> : null}
            {internshipDrafts.map((internship, index) => (
              <View key={internship.id ?? `new-${index}`} style={styles.item}>
                <View onLayout={keyboardScroll.registerField(`profile-internship-company-${index}`)}>
                  <TextInput
                    onChangeText={(company) => updateInternshipDraft(index, { company })}
                    onFocus={() => keyboardScroll.focusField(`profile-internship-company-${index}`)}
                    placeholder="Company"
                    style={[styles.input, !internship.company.trim() ? styles.invalidInput : null]}
                    value={internship.company}
                  />
                </View>
                <View onLayout={keyboardScroll.registerField(`profile-internship-duration-${index}`)}>
                  <TextInput
                    inputMode="numeric"
                    onChangeText={(value) =>
                      updateInternshipDraft(index, { durationMonths: value.replace(/\D/g, '') })
                    }
                    onFocus={() => keyboardScroll.focusField(`profile-internship-duration-${index}`)}
                    placeholder="Duration in months"
                    style={[
                      styles.input,
                      !internship.durationMonths.trim() || Number(internship.durationMonths) < 1
                        ? styles.invalidInput
                        : null
                    ]}
                    value={internship.durationMonths}
                  />
                </View>
                <View style={styles.optionGrid}>
                  {roleDepartments.map((roleDepartment) => {
                    const selected = roleDepartment === internship.roleDepartment;

                    return (
                      <Pressable
                        key={roleDepartment}
                        onPress={() => updateInternshipDraft(index, { roleDepartment })}
                        style={[styles.option, selected ? styles.selectedOption : null]}
                      >
                        <Text style={[styles.optionText, selected ? styles.selectedOptionText : null]}>
                          {roleDepartment}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.row}>
                  <Pressable
                    disabled={
                      isBusy ||
                      !internship.company.trim() ||
                      !internship.durationMonths.trim() ||
                      Number(internship.durationMonths) < 1
                    }
                    onPress={() => saveInternship(index)}
                    style={[
                      styles.secondaryButton,
                      isBusy ||
                      !internship.company.trim() ||
                      !internship.durationMonths.trim() ||
                      Number(internship.durationMonths) < 1
                        ? styles.disabledButton
                        : null
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Save</Text>
                  </Pressable>
                  <Pressable disabled={isBusy} onPress={() => removeInternship(index)}>
                    <Text style={styles.dangerText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.section, styles.sectionResume]}>
            <Text style={styles.sectionTitle}>Resume</Text>
            <Text style={styles.body}>{profile.resume?.originalFileName ?? 'No resume on file'}</Text>
            <View style={styles.row}>
              {profile.resume?.secureUrl ? (
                <>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => setShowResumePreview(true)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>View resume</Text>
                  </Pressable>
                  <Pressable
                    disabled={isBusy}
                    onPress={() =>
                      router.push({
                        pathname: '/media/resume-preview',
                        params: {
                          action: 'download',
                          url: profile.resume?.secureUrl,
                          fileName: profile.resume?.originalFileName ?? 'resume'
                        }
                      })
                    }
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Download resume</Text>
                  </Pressable>
                </>
              ) : null}
              <Pressable disabled={isBusy} onPress={handleUploadResume} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{profile.resume?.secureUrl ? 'Replace resume' : 'Upload resume'}</Text>
              </Pressable>
              {profile.resume?.cloudinaryPublicId ? (
                <Pressable disabled={isBusy} onPress={handleDeleteResume}>
                  <Text style={styles.dangerText}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={[styles.section, styles.sectionVideos]}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <Text style={styles.body}>
              Short take: {profile.signal?.tenSecondVideo ? 'Uploaded' : 'Missing'}
            </Text>
            <Text style={styles.body}>
              Deeper signal: {profile.signal?.thirtySecondVideo ? 'Uploaded' : profile.signal?.thirtySecondVideoSkipped ? 'Skipped' : 'Missing'}
            </Text>
            <View style={styles.row}>
              <Pressable
                disabled={isBusy || !profile.signal?.tenSecondVideo?.secureUrl}
                onPress={() =>
                    router.push({
                      pathname: '/media/video-player',
                      params: { url: profile.signal?.tenSecondVideo?.secureUrl, title: 'My short take' }
                    })
                }
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>My short take</Text>
              </Pressable>
              {profile.signal?.thirtySecondVideo?.secureUrl ? (
                <Pressable
                  disabled={isBusy}
                  onPress={() =>
                    router.push({
                      pathname: '/media/video-player',
                      params: { url: profile.signal?.thirtySecondVideo?.secureUrl, title: 'My deeper signal' }
                    })
                  }
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>My deeper signal</Text>
                </Pressable>
              ) : null}
              <Pressable disabled={isBusy} onPress={() => startRecording('10-second')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Retake short take</Text>
              </Pressable>
              <Pressable disabled={isBusy} onPress={() => startRecording('30-second')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Record deeper signal</Text>
              </Pressable>
            </View>
            <View style={styles.row}>
              <Pressable disabled={isBusy || !profile.signal?.thirtySecondVideo} onPress={() => handleDeleteVideo('30-second')}>
                <Text style={styles.dangerText}>Delete deeper signal</Text>
              </Pressable>
            </View>
            {recordingMode ? (
              <VideoRecorder
                maxDurationSeconds={recordingMode === '10-second' ? 10 : 30}
                onRecorded={handleRecorded}
              />
            ) : null}
          </View>

          <View style={[styles.section, styles.sectionSoftSkills]}>
            <Text style={styles.sectionTitle}>Soft Skills</Text>
            {softSkillDrafts.length === 0 ? <Text style={styles.body}>Soft skills are being prepared.</Text> : null}
            {softSkillDrafts.slice(0, 4).map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.skillCard}>
                <View style={styles.skillCardHeader}>
                  <View style={styles.skillIcon}>
                    <Ionicons color="#0f172a" name={getTraitIcon(item.label)} size={18} />
                  </View>
                  <View style={styles.skillTitleWrap}>
                    <Text style={styles.skillTitle}>{item.label}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          color={item.rating >= star - 0.5 ? colors.accent : '#cbd5e1'}
                          name={getStarIcon(star, item.rating)}
                          size={15}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.skillRating}>{item.rating}/5</Text>
                </View>
                <Text style={styles.skillEvidence}>{item.evidence}</Text>
              </View>
            ))}
          </View>

          <View style={styles.accountActions}>
            <Pressable disabled={isBusy} onPress={confirmLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Log out</Text>
            </Pressable>
            <Pressable disabled={isBusy} onPress={confirmDeleteAccount} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete account</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={styles.body}>Loading profile</Text>
      )}
      {status ? <Text style={styles.meta}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.lg
  },
  sectionAccount: {
    backgroundColor: colors.surface
  },
  sectionEducation: {
    backgroundColor: '#f7fbf0'
  },
  sectionInternships: {
    backgroundColor: '#f7f5ff'
  },
  sectionResume: {
    backgroundColor: '#f4faf9'
  },
  sectionVideos: {
    backgroundColor: '#fff8ef'
  },
  sectionSoftSkills: {
    backgroundColor: '#f8faf4'
  },
  sectionTitle: {
    color: colors.text,
    ...typography.sectionTitle
  },
  profileImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg
  },
  profileImagePressable: {
    borderRadius: 41
  },
  profileImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.surfaceMuted
  },
  profileImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.primary
  },
  profileImageFallbackText: {
    color: colors.accent,
    fontSize: 30,
    fontWeight: '900'
  },
  profileImageActions: {
    flex: 1,
    gap: spacing.md
  },
  previewModal: {
    flex: 1,
    backgroundColor: colors.primary
  },
  previewCloseButton: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
    borderRadius: 999,
    backgroundColor: 'rgba(251,250,247,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  previewCloseText: {
    color: colors.text,
    ...typography.meta
  },
  label: {
    color: colors.text,
    ...typography.label
  },
  body: {
    color: colors.muted,
    ...typography.body
  },
  universityText: {
    color: colors.text,
    ...typography.sectionTitle
  },
  prompt: {
    color: colors.purple,
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
  invalidInput: {
    borderColor: colors.danger
  },
  multiline: {
    minHeight: 84,
    paddingTop: 12,
    textAlignVertical: 'top'
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
    color: colors.primaryText
  },
  item: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md
  },
  skillCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#dbe7d1',
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  skillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eefee0'
  },
  skillTitleWrap: {
    flex: 1,
    gap: 4
  },
  skillTitle: {
    color: colors.text,
    ...typography.label
  },
  starRow: {
    flexDirection: 'row',
    gap: 2
  },
  skillRating: {
    color: colors.text,
    ...typography.meta
  },
  skillEvidence: {
    color: colors.muted,
    ...typography.meta
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
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
  disabledButton: {
    opacity: 0.45
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.button
  },
  chipButton: {
    justifyContent: 'center',
    minHeight: controls.chipHeight,
    borderRadius: radii.sm,
    backgroundColor: '#eefee0',
    paddingHorizontal: spacing.md
  },
  chipButtonText: {
    color: colors.text,
    ...typography.meta
  },
  linkText: {
    color: colors.purple,
    ...typography.label
  },
  dangerText: {
    color: colors.danger,
    ...typography.label
  },
  accountActions: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xxl,
    paddingTop: spacing.xl
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg
  },
  deleteButtonText: {
    color: colors.primaryText,
    ...typography.button
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg
  },
  logoutButtonText: {
    color: colors.danger,
    ...typography.button
  },
  meta: {
    color: colors.success,
    ...typography.meta
  },
  error: {
    color: colors.danger,
    ...typography.meta
  }
});
