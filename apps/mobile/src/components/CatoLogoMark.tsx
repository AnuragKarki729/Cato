import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

type CatoLogoMarkProps = {
  size?: 'md' | 'lg';
};

export function CatoLogoMark({ size = 'md' }: CatoLogoMarkProps) {
  const isLarge = size === 'lg';

  return (
    <View style={[styles.logo, isLarge ? styles.logoLarge : null]}>
      <Text style={[styles.logoText, isLarge ? styles.logoTextLarge : null]}>C</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  logoLarge: {
    width: 56,
    height: 56
  },
  logoText: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900'
  },
  logoTextLarge: {
    fontSize: 32
  }
});
