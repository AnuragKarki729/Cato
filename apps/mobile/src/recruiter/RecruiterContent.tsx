import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

export function RecruiterContent({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      alwaysBounceVertical={false}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl
  }
});
