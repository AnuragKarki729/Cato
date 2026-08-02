import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../theme';

type RecruiterNavProps = {
  active: 'home' | 'feed' | 'search' | 'bookmarks' | 'messages' | 'account';
};

const items = [
  { key: 'home', icon: 'home-outline', label: 'Home', route: '/(recruiter)/dashboard' },
  { key: 'feed', icon: 'play-circle-outline', label: 'Feed', route: '/(recruiter)/feed' },
  { key: 'search', icon: 'search-outline', label: 'Search', route: '/(recruiter)/search' },
  { key: 'bookmarks', icon: 'bookmark-outline', label: 'Bookmarks', route: '/(recruiter)/bookmarks' },
  { key: 'account', icon: 'person-outline', label: 'Account', route: '/(recruiter)/upgrade' }
] as const;

export function RecruiterNav({ active }: RecruiterNavProps) {
  return (
    <View style={styles.nav}>
      {items.map((item) => {
        const selected = item.key === active;

        return (
          <Pressable key={item.key} onPress={() => router.push(item.route)} style={styles.item}>
            <Ionicons color={selected ? colors.primary : colors.muted} name={item.icon} size={20} />
            <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  item: {
    alignItems: 'center',
    gap: 3,
    minWidth: 54
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700'
  },
  selectedLabel: {
    color: colors.primary
  }
});
