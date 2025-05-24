import React from 'react';
import {View, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';

interface BadgeProps {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'default',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (type) {
      case 'primary':
        return styles.primaryBadge;
      case 'success':
        return styles.successBadge;
      case 'warning':
        return styles.warningBadge;
      case 'error':
        return styles.errorBadge;
      case 'info':
        return styles.infoBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (type) {
      case 'primary':
      case 'success':
      case 'error':
        return styles.lightText; // For darker backgrounds
      case 'warning':
      case 'info':
      case 'default':
        return styles.darkText; // For lighter backgrounds
      default:
        return styles.darkText;
    }
  };

  return (
    <View style={[styles.badgeBase, getBadgeStyle(), style]}>
      <Text style={[styles.textBase, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12, // More rounded for a typical badge look
    alignSelf: 'flex-start', // So it doesn't take full width
    margin: 2,
  },
  textBase: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryBadge: {
    backgroundColor: '#007bff', // Example primary color
  },
  successBadge: {
    backgroundColor: '#28a745', // Example success color
  },
  warningBadge: {
    backgroundColor: '#ffc107', // Example warning color
  },
  errorBadge: {
    backgroundColor: '#dc3545', // Example error color
  },
  infoBadge: {
    backgroundColor: '#17a2b8', // Example info color
  },
  defaultBadge: {
    backgroundColor: '#e0e0e0', // Example default/grey color
  },
  lightText: {
    color: '#ffffff',
  },
  darkText: {
    color: '#333333',
  },
});

export default Badge;
