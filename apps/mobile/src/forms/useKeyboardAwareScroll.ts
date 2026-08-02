import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

const FIELD_TOP_OFFSET = 96;

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView | null>(null);
  const fieldOffsets = useRef<Record<string, number>>({});

  const registerField = useCallback(
    (key: string) => (event: LayoutChangeEvent) => {
      fieldOffsets.current[key] = event.nativeEvent.layout.y;
    },
    []
  );

  const scrollToField = useCallback((key: string) => {
    const y = fieldOffsets.current[key];

    if (typeof y !== 'number') {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - FIELD_TOP_OFFSET),
        animated: true
      });
    });
  }, []);

  const focusField = useCallback(
    (key: string) => {
      setTimeout(() => scrollToField(key), 80);
    },
    [scrollToField]
  );

  return {
    focusField,
    registerField,
    scrollRef,
    scrollToField
  };
}
