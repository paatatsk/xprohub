import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Fonts } from '../constants/theme';

type StampVariant = 'urgent' | 'new' | 'new-outline';

interface CornerStampProps {
  variant: StampVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function CornerStamp({ variant, style, accessibilityLabel }: CornerStampProps) {
  const isUrgent = variant === 'urgent';
  const isNewOutline = variant === 'new-outline';
  const stampStyle = isUrgent ? s.stampUrgent : isNewOutline ? s.stampNewOutline : s.stampNew;
  const textStyle = isUrgent ? s.textUrgent : isNewOutline ? s.textNewOutline : s.textNew;

  return (
    <View
      style={[s.stamp, stampStyle, style]}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[s.text, textStyle]}>
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
  stampNewOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    top: 36,
    borderRadius: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
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
  textNewOutline: {
    color: Colors.gold,
  },
});
