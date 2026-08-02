import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, controls, radii, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = PropsWithChildren<{
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
}>;

export function Button({ children, disabled = false, fullWidth = false, onPress, style, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'danger' ? styles.danger : null,
        fullWidth ? styles.fullWidth : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' || variant === 'danger' ? styles.inverseText : null,
          variant === 'secondary' ? styles.secondaryText : null
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    minHeight: controls.secondaryButtonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  danger: {
    minHeight: controls.secondaryButtonHeight,
    backgroundColor: colors.danger
  },
  fullWidth: {
    width: '100%'
  },
  disabled: {
    opacity: 0.45
  },
  text: {
    ...typography.button,
    textAlign: 'center'
  },
  inverseText: {
    color: colors.primaryText
  },
  secondaryText: {
    color: colors.text
  }
});
