import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../ui/Card';
import Button from '../../ui/Button'; // For Edit/Delete buttons
import { Measurement } from '../../../store/slices/measurementSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format} from 'date-fns'; // For formatting dates

interface MeasurementListItemProps {
  measurement: Measurement;
  onPressEdit: (measurement: Measurement) => void;
  onPressDelete: (measurementId: string) => void;
}

const MeasurementListItem: React.FC<MeasurementListItemProps> = ({
  measurement,
  onPressEdit,
  onPressDelete,
}) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const takenDate = typeof measurement.takenDate === 'string' 
    ? new Date(measurement.takenDate) 
    : new Date(measurement.takenDate._seconds * 1000);

  const styles = StyleSheet.create({
    card: {
      marginBottom: 10,
      padding: 15,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    outfitType: {
      ...typography.h5,
      color: colors.text,
      flex: 1, // Allow text to take available space
    },
    takenDate: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    measurementValuesContainer: {
      marginBottom: 10,
    },
    measurementPair: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      maxWidth: '80%', // Prevent extremely long values from breaking layout too much
    },
    measurementKey: {
      ...typography.bodySmall,
      fontWeight: typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    measurementValue: {
      ...typography.bodySmall,
      color: colors.text,
    },
    notes: {
      ...typography.bodySmall,
      fontStyle: 'italic',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end', // Align buttons to the right
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    actionButton: {
      marginLeft: 10,
      paddingVertical: 6, // Smaller buttons for list items
      paddingHorizontal: 12,
    },
    deleteButtonText: { // If Button component supports custom textStyle for variants
        color: colors.error,
    }
  });

  // Display a few key measurements or a summary.
  const measurementEntries = Object.entries(measurement.measurementValues || {});
  const displayMeasurements = measurementEntries.slice(0, 4); // Show first 4 for brevity

  return (
    <Card style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.outfitType} numberOfLines={1}>{measurement.outfitType}</Text>
        <Text style={styles.takenDate}>
          {t('common.date')}: {format(takenDate, 'PP')} {/* 'PP' is like 'MMM d, yyyy' */}
        </Text>
      </View>

      {measurementEntries.length > 0 && (
        <View style={styles.measurementValuesContainer}>
          {displayMeasurements.map(([key, value]) => (
            <View key={key} style={styles.measurementPair}>
              <Text style={styles.measurementKey}>{key}:</Text>
              <Text style={styles.measurementValue}>{String(value)}</Text>
            </View>
          ))}
          {measurementEntries.length > 4 && <Text style={styles.measurementKey}>...</Text>}
        </View>
      )}

      {measurement.notes && (
        <Text style={styles.notes} numberOfLines={2}>{t('common.notes')}: {measurement.notes}</Text>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title={t('common.edit')}
          onPress={() => onPressEdit(measurement)}
          variant="text" // Or a small outline button
          style={styles.actionButton}
          textStyle={{color: colors.primary}}
        />
        <Button
          title={t('common.delete')}
          onPress={() => onPressDelete(measurement.id)}
          variant="text"
          style={styles.actionButton}
          textStyle={styles.deleteButtonText}
        />
      </View>
    </Card>
  );
};

export default MeasurementListItem;
