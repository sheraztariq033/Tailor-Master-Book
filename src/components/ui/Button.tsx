import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style, // Custom style prop
  textStyle, // Custom text style prop
}) => {
  const {colors, typography, isDarkMode} = useTheme(); // Use the theme context

  const getButtonStyles = (): ViewStyle => {
    let baseStyle: ViewStyle = {
        backgroundColor: colors.buttonPrimaryBackground,
    };
    if (disabled) {
        return {backgroundColor: colors.buttonDisabledBackground, opacity: 0.7};
    }
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.buttonPrimaryBackground;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.buttonSecondaryBackground;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.primary;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        break;
    }
    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
     let baseTextStyle: TextStyle = {
        color: colors.buttonPrimaryText,
        ...typography.button, // Apply default button typography
     };
     if (disabled) {
        return {color: colors.buttonDisabledText, ...typography.button};
     }
    switch (variant) {
      case 'primary':
        baseTextStyle.color = colors.buttonPrimaryText;
        break;
      case 'secondary':
        baseTextStyle.color = colors.buttonSecondaryText;
        break;
      case 'text':
        baseTextStyle.color = colors.primary; // Use primary color for text variant
        break;
    }
    return baseTextStyle;
  };

  // Define base styles directly in the component or move them to a function
  const styles = StyleSheet.create({
    buttonBase: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    // textBase is now part of getTextStyle
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.buttonBase,
        getButtonStyles(), // Apply dynamic button styles
        style, // Apply custom styles from props
      ]}>
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
