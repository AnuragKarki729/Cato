import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, controls, radii, spacing, typography } from '../theme';

type FieldProps = ComponentProps<typeof TextInput> & {
  error?: string | null;
  label?: string;
};

export function Field({ error, label, style, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.invalidInput : null, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  error: {
    color: colors.danger,
    ...typography.meta
  }
});
