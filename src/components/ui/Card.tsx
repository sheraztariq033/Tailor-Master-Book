import React, {ReactNode} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  shadow?: boolean; // Optional prop to control shadow
}

const Card: React.FC<CardProps> = ({children, style, shadow = true}) => {
  const {colors, isDarkMode} = useTheme(); // Use the theme context

  // Define styles dynamically based on theme
  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.card, // Use themed background color
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 4,
      borderColor: colors.border, // Use themed border color
      borderWidth: isDarkMode ? 1 : 0, // Example: Add border in dark mode
    },
    shadow: {
      // Basic shadow for Android
      elevation: isDarkMode ? 1 : 3, // Adjust shadow based on theme
      // iOS shadow properties
      shadowColor: colors.text, // Use a text color for shadow to make it visible in dark mode
      shadowOffset: {width: 0, height: isDarkMode ? 1 : 2},
      shadowOpacity: isDarkMode ? 0.15 : 0.1,
      shadowRadius: isDarkMode ? 3 : 4,
    },
  });

  return <View style={[themedStyles.card, shadow && themedStyles.shadow, style]}>{children}</View>;
};

export default Card;
