import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { SignalPrompt } from '@cato/shared';
import { getSignalPrompts } from '../../src/api/onboarding';
import { selectSignalPrompt } from '../../src/api/signal';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, shadows, spacing, typography } from '../../src/theme';

const promptEmojis = ['🔥', '💡', '🎯', '✨', '🚀', '🌱', '⚡️', '🧭'];

export default function SignalPromptScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<SignalPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;

  const visiblePrompts = prompts.slice(0, 5);
  const activePrompt = visiblePrompts[activeIndex];
  const previousPrompt = visiblePrompts.length
    ? visiblePrompts[(activeIndex - 1 + visiblePrompts.length) % visiblePrompts.length]
    : undefined;
  const nextPrompt = visiblePrompts.length
    ? visiblePrompts[(activeIndex + 1) % visiblePrompts.length]
    : undefined;
  const isSelected = Boolean(activePrompt && selectedPromptId === activePrompt.id);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12,
        onPanResponderMove: Animated.event([null, { dx: slide }], { useNativeDriver: false }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -48) {
            moveCarousel(1);
            return;
          }

          if (gesture.dx > 48) {
            moveCarousel(-1);
            return;
          }

          Animated.spring(slide, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }),
    [activeIndex, visiblePrompts.length]
  );

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getSignalPrompts(session.access_token).then((result) => {
      setPrompts(result.prompts);
    });
  }, [session]);

  function moveCarousel(direction: 1 | -1) {
    if (visiblePrompts.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + direction + visiblePrompts.length) % visiblePrompts.length;

    Animated.timing(slide, {
      toValue: direction === 1 ? -260 : 260,
      duration: 180,
      useNativeDriver: true
    }).start(() => {
      setActiveIndex(nextIndex);
      setSelectedPromptId(visiblePrompts[nextIndex]?.id ?? null);
      slide.setValue(direction === 1 ? 260 : -260);
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true
      }).start();
    });
  }

  async function handleSelectPrompt(prompt: SignalPrompt) {
    if (!session?.access_token) {
      return;
    }

    setError(null);

    try {
      const result = await selectSignalPrompt(session.access_token, {
        promptId: prompt.id
      });
      setSelectedPromptId(prompt.id);
      router.replace({
        pathname: '/(onboarding)/signal-video',
        params: {
          promptText: result.signal?.promptTextSnapshot ?? prompt.text
        }
      });
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Unable to select prompt');
    }
  }

  return (
    <Screen centered>
      <Text style={styles.title}>What moves you?</Text>
      <Text style={styles.body}>
        Record a quick 10-second take that captures what drives you to show up, create change, and inspire.
      </Text>
      <View style={styles.carouselShell}>
        {previousPrompt && visiblePrompts.length > 1 ? (
          <View pointerEvents="none" style={[styles.previewCard, styles.leftPreview]}>
            <Text style={styles.previewIcon}>
              {promptEmojis[(activeIndex - 1 + promptEmojis.length) % promptEmojis.length]}
            </Text>
            <Text numberOfLines={2} style={styles.previewText}>{previousPrompt.text}</Text>
          </View>
        ) : null}
        {activePrompt ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.promptCard,
              isSelected ? styles.selectedPromptCard : null,
              {
                opacity: slide.interpolate({
                  inputRange: [-260, 0, 260],
                  outputRange: [0.32, 1, 0.32]
                }),
                transform: [
                  { translateX: slide },
                  {
                    scale: slide.interpolate({
                      inputRange: [-260, 0, 260],
                      outputRange: [0.92, 1, 0.92]
                    })
                  }
                ]
              }
            ]}
          >
            <Pressable onPress={() => setSelectedPromptId(activePrompt.id)} style={styles.promptPressable}>
              <View style={styles.cardTopRow}>
                <Text style={styles.promptIcon}>{promptEmojis[activeIndex % promptEmojis.length]}</Text>
                {isSelected ? (
                  <View style={styles.selectedLogo}>
                    <Text style={styles.selectedLogoText}>C</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.promptText}>{activePrompt.text}</Text>
              <Text style={styles.selectHint}>{isSelected ? 'Selected prompt' : 'Tap to select'}</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.promptCard}>
            <Text style={styles.promptText}>Loading prompts...</Text>
          </View>
        )}
        {nextPrompt && visiblePrompts.length > 1 ? (
          <View pointerEvents="none" style={[styles.previewCard, styles.rightPreview]}>
            <Text style={styles.previewIcon}>{promptEmojis[(activeIndex + 1) % promptEmojis.length]}</Text>
            <Text numberOfLines={2} style={styles.previewText}>{nextPrompt.text}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.dots}>
        {visiblePrompts.map((prompt, index) => (
          <View key={prompt.id} style={[styles.dot, index === activeIndex ? styles.activeDot : null]} />
        ))}
      </View>
      <Pressable
        disabled={!activePrompt}
        onPress={() => activePrompt ? handleSelectPrompt(activePrompt) : undefined}
        style={[styles.button, isSelected ? styles.selectedButton : null]}
      >
        <Text style={styles.buttonText}>Record My 10s Take</Text>
      </Pressable>
      <Text style={styles.timeHint}>Up to 10 seconds</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxl,
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body
  },
  carouselShell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 264,
    marginTop: spacing.xxl
  },
  promptCard: {
    width: 248,
    minHeight: 238,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card
  },
  promptPressable: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22
  },
  selectedPromptCard: {
    borderColor: colors.accent
  },
  cardTopRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  selectedLogo: {
    position: 'absolute',
    right: 6,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  selectedLogoText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '900'
  },
  promptIcon: {
    fontSize: 34,
    textAlign: 'center'
  },
  promptText: {
    alignSelf: 'center',
    maxWidth: 204,
    marginTop: spacing.xl,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
    flexShrink: 1
  },
  selectHint: {
    marginTop: 18,
    color: colors.muted,
    ...typography.meta,
    textAlign: 'center'
  },
  previewCard: {
    position: 'absolute',
    justifyContent: 'center',
    width: 150,
    minHeight: 178,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.2,
    paddingHorizontal: 14,
    transform: [{ scale: 0.88 }]
  },
  leftPreview: {
    left: -86
  },
  rightPreview: {
    right: -86
  },
  previewIcon: {
    fontSize: 24,
    textAlign: 'center'
  },
  previewText: {
    marginTop: spacing.md,
    color: colors.text,
    ...typography.meta,
    lineHeight: 16,
    textAlign: 'center'
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border
  },
  activeDot: {
    width: 16,
    backgroundColor: colors.accent
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: colors.accent
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  },
  timeHint: {
    marginTop: spacing.lg,
    color: colors.purple,
    ...typography.meta,
    textAlign: 'center'
  },
  error: {
    marginTop: spacing.lg,
    color: colors.danger,
    ...typography.meta
  }
});
