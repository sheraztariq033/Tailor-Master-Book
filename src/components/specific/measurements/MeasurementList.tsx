import React, {useEffect, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, Alert} from 'react-native';
import MeasurementListItem from './MeasurementListItem';
import Button from '../../ui/Button'; // For "Add Measurement" button if list is empty
import Loader from '../../ui/Loader';
import { useAppDispatch, useAppSelector } from '../../../store';
import { 
    fetchMeasurementsForCustomer, 
    removeMeasurement,
    clearMeasurementError,
    Measurement 
} from '../../../store/slices/measurementSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

interface MeasurementListProps {
  customerId: string;
  onEditMeasurement: (measurement: Measurement) => void;
  onAddNewMeasurement: () => void; // To navigate to AddEditMeasurementScreen
}

const MeasurementList: React.FC<MeasurementListProps> = ({ 
    customerId, 
    onEditMeasurement,
    onAddNewMeasurement 
}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {
    measurementsByCustomerId, 
    isLoading, 
    error
} = useAppSelector(state => state.measurement);
  
  const customerMeasurements = measurementsByCustomerId[customerId] || [];

  const loadMeasurements = useCallback(() => {
    if (customerId) {
      dispatch(fetchMeasurementsForCustomer(customerId));
    }
  }, [dispatch, customerId]);

  useEffect(() => {
    loadMeasurements();
    return () => {
      dispatch(clearMeasurementError());
    };
  }, [loadMeasurements, dispatch]);

  const handleDeleteMeasurement = (measurementId: string) => {
    Alert.alert(
      t('measurements.deleteConfirmTitle'),
      t('measurements.deleteConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            const resultAction = await dispatch(removeMeasurement({measurementId, customerId}));
            if (removeMeasurement.fulfilled.match(resultAction)) {
              Alert.alert(t('measurements.deleteSuccessTitle'), t('measurements.deleteSuccessMessage'));
              // List will refresh due to thunk dispatching fetchMeasurementsForCustomer
            } else {
              Alert.alert(t('common.error'), String(error || t('common.unknownError')));
            }
          }
        }
      ]
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1, // Take up available space if CustomerDetailScreen allows
      minHeight: 150, // Ensure it has some height even if empty
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      padding: 20,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 30,
      minHeight: 100,
    },
    emptyListText: {
      ...typography.h5,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    listContentContainer: {
      paddingBottom: 10,
    }
  });

  if (isLoading && customerMeasurements.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <Loader size="large" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{t('common.errorLoading', {entity: t('measurements.titleMultiple')})}: {String(error)}</Text>;
  }

  if (customerMeasurements.length === 0) {
    return (
      <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>{t('measurements.noMeasurementsFound')}</Text>
        <Button
            title={t('measurements.addNewButton')}
            onPress={onAddNewMeasurement} // Use callback from props
            variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={customerMeasurements}
        renderItem={({item}) => (
          <MeasurementListItem
            measurement={item}
            onPressEdit={onEditMeasurement}
            onPressDelete={handleDeleteMeasurement}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
        // ListFooterComponent={isLoading ? <Loader /> : null} // If implementing pagination
        // No pull to refresh here, as it's part of a detail screen, not a primary list screen
      />
    </View>
  );
};

export default MeasurementList;
