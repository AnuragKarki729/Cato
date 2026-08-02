import type { PropsWithChildren, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type ScreenProps = PropsWithChildren<{
  centered?: boolean;
  edgeToEdge?: boolean;
  fullBleed?: boolean;
  scrollBottomPadding?: number;
  scrollRef?: RefObject<ScrollView | null>;
  scroll?: boolean;
}>;

export function Screen({
  centered = false,
  children,
  edgeToEdge = false,
  fullBleed = false,
  scrollBottomPadding,
  scrollRef,
  scroll = false
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <SafeAreaView edges={edgeToEdge ? ['left', 'right'] : ['top', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            alwaysBounceVertical={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollBottomPadding ?? Math.max(36, insets.bottom + 150) },
              centered ? styles.centered : null
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (edgeToEdge) {
    return (
      <View style={styles.safeArea}>
        <View style={[styles.content, fullBleed ? styles.fullBleed : null, centered ? styles.centered : null]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={[styles.content, fullBleed ? styles.fullBleed : null, centered ? styles.centered : null]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardAvoiding: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl
  },
  fullBleed: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  centered: {
    justifyContent: 'center'
  }
});
