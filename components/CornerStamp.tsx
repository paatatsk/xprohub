import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../constants/theme';

type StampVariant = 'urgent' | 'new';

interface CornerStampProps {
  variant: StampVariant;
}

export default function CornerStamp({ variant }: CornerStampProps) {
  const isUrgent = variant === 'urgent';
  return (
    <View style={[s.stamp, isUrgent ? s.stampUrgent : s.stampNew]}>
      <Text style={[s.text, isUrgent ? s.textUrgent : s.textNew]}>
        {isUrgent ? 'URGENT' : 'NEW'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: -1,
    right: 14,
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
  },
  stampUrgent: {
    backgroundColor: Colors.red,
  },
  stampNew: {
    backgroundColor: Colors.gold,
  },
  text: {
    fontFamily: Fonts.displayB,
    fontSize: 8.5,
    letterSpacing: 2,
  },
  textUrgent: {
    color: Colors.textPrimary,
  },
  textNew: {
    color: '#1A0F00',
  },
});
