import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

const DEFAULT_FIELD_TOP_OFFSET = 118;

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView | null>(null);
  const fieldOffsets = useRef<Record<string, number>>({});
  const scrollY = useRef(0);

  const registerField = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      fieldOffsets.current[key] = event.nativeEvent.layout.y;
    },
    []
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollToField = useCallback((key: string, topOffset = DEFAULT_FIELD_TOP_OFFSET) => {
    const focusedInput = (TextInput.State as unknown as { currentlyFocusedInput?: () => unknown })
      .currentlyFocusedInput?.();

    if (focusedInput && typeof (focusedInput as { measureInWindow?: unknown }).measureInWindow === 'function') {
      (focusedInput as { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void })
        .measureInWindow((_x, y) => {
          const nextY = Math.max(0, scrollY.current + y - topOffset);

          scrollRef.current?.scrollTo({
            y: nextY,
            animated: true
          });
        });
      return;
    }

    const y = fieldOffsets.current[key];

    if (typeof y !== 'number') {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - topOffset),
        animated: true
      });
    });
  }, []);

  const focusField = useCallback(
    (key: string, topOffset?: number, options?: { settle?: boolean }) => {
      setTimeout(() => scrollToField(key, topOffset), 120);
      if (options?.settle !== false) {
        setTimeout(() => scrollToField(key, topOffset), 300);
      }
    },
    [scrollToField]
  );

  return {
    focusField,
    handleScroll,
    registerField,
    scrollRef,
    scrollToField
  };
}
