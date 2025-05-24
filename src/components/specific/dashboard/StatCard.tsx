import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Card from '../../ui/Card';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next'; // For potential icon accessibility labels
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example if using icons

interface StatCardProps {
  title: string;
  value: string | number;
  iconName?: string; // Optional: Name of the icon from a library like MaterialCommunityIcons
  iconColor?: string; // Optional: Specific color for the icon
}

const StatCard: React.FC<StatCardProps> = ({ title, value, iconName, iconColor }) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    card: {
      flex: 1, // Allow cards to grow and share space in a row
      padding: 15,
      marginHorizontal: 5,
      alignItems: 'center', // Center content
      minHeight: 120, // Ensure a decent height
      justifyContent: 'center', // Vertically center content
    },
    valueText: {
      ...typography.h1, // Large text for the value
      color: colors.primary, // Use primary color for emphasis
      fontWeight: typography.fontWeights.bold,
      marginBottom: 8,
      textAlign: 'center',
    },
    titleText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: typography.fontWeights.semibold,
    },
    iconContainer: {
      marginBottom: 10,
      // If you add an icon library:
      // backgroundColor: iconColor ? iconColor + '20' : colors.primary + '20', // Light background for icon
      // padding: 10,
      // borderRadius: 25, // Circular background
    }
  });

  return (
    <Card style={styles.card} shadow={true}>
      {iconName && (
        <View style={styles.iconContainer}>
          {/* <Icon name={iconName} size={30} color={iconColor || colors.primary} /> */}
          <Text>ICON</Text>{/* Placeholder if no icon library */}
        </View>
      )}
      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.titleText}>{title}</Text>
    </Card>
  );
};

export default StatCard;
