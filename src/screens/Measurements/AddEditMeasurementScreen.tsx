import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import MeasurementForm, { MeasurementFormData } from '../../components/specific/measurements/MeasurementForm'; // Will create this
import { CustomersStackParamList } from '../../navigation/navigationTypes'; // Assuming it's in CustomersStack
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { 
    addNewMeasurement, 
    updateExistingMeasurement, 
    fetchMeasurementsForCustomer, // To get existing measurement for edit mode
    clearMeasurementError,
    Measurement // For initialData type
} from '../../store/slices/measurementSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<CustomersStackParamList, 'AddEditMeasurement'>;

const AddEditMeasurementScreen: React.FC<Props> = ({route, navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {customerId, measurementId} = route.params;
  const isEditing = !!measurementId;

  const {
    isLoading, 
    error,
    measurementsByCustomerId
  } = useAppSelector(state => state.measurement);
  
  const [initialMeasurementData, setInitialMeasurementData] = useState<Partial<Measurement> | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);


  useEffect(() => {
    if (isEditing && measurementId) {
      navigation.setOptions({ title: t('measurements.editTitle') });
      // Fetch the specific measurement if not already in store or if needing fresh data
      // For simplicity, we'll try to find it in the existing customer's measurements first.
      const customerMeasurements = measurementsByCustomerId[customerId];
      const existingMeasurement = customerMeasurements?.find(m => m.id === measurementId);
      if (existingMeasurement) {
        setInitialMeasurementData(existingMeasurement);
      } else {
        // If not found (e.g., deep link or store not populated), you might need a dedicated fetchMeasurementById thunk
        // For now, we'll assume it's usually pre-loaded or re-fetch the whole list for the customer
        // which might then populate it. This is a fallback.
        setIsFetchingDetails(true);
        dispatch(fetchMeasurementsForCustomer(customerId))
          .then((action) => {
            if(fetchMeasurementsForCustomer.fulfilled.match(action)){
                const currentM = action.payload.measurements.find(m => m.id === measurementId);
                if(currentM) setInitialMeasurementData(currentM);
                else Alert.alert(t('common.error'), t('measurements.notFound'));
            }
          })
          .finally(() => setIsFetchingDetails(false));
      }
    } else {
      navigation.setOptions({ title: t('measurements.addTitle') });
      setInitialMeasurementData(null); // Clear for Add mode
    }
  }, [dispatch, isEditing, measurementId, customerId, navigation, t, measurementsByCustomerId]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(clearMeasurementError());
      };
    }, [dispatch])
  );

  const handleFormSubmit = async (formData: MeasurementFormData) => {
    const dataToSubmit = {
      customerId, // Always required
      outfitType: formData.outfitType,
      measurementValues: formData.measurementValues,
      notes: formData.notes || null,
    };

    let resultAction;
    if (isEditing && measurementId) {
      resultAction = await dispatch(updateExistingMeasurement({ 
        measurementId, 
        customerId, // Needed for re-fetching later
        dataToUpdate: dataToSubmit 
    }));
    } else {
      resultAction = await dispatch(addNewMeasurement({measurementData: dataToSubmit}));
    }

    if (resultAction.meta.requestStatus === 'fulfilled') {
      Alert.alert(
        t(isEditing ? 'measurements.updateSuccessTitle' : 'measurements.addSuccessTitle'),
        t(isEditing ? 'measurements.updateSuccessMessage' : 'measurements.addSuccessMessage', { outfit: dataToSubmit.outfitType })
      );
      // CustomerDetailScreen's useFocusEffect should re-fetch measurements.
      // Or we can pass a refresh param if needed, but focus effect is cleaner.
      navigation.goBack(); 
    } else {
      // Error is handled by the error state variable and displayed below
      // Alert.alert(t('common.error'), error ? String(error) : t('common.unknownError'));
    }
  };
  
  const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 10,
    }
  });

  if ((isEditing && !initialMeasurementData && (isLoading || isFetchingDetails))) {
    return (
      <View style={styles.loaderContainer}>
        <Loader size="large" />
        <Text style={{color: colors.textSecondary, marginTop: 10}}>{t('measurements.loadingDetails')}</Text>
      </View>
    );
  }
  if (isEditing && !initialMeasurementData && !isLoading && !isFetchingDetails) {
    return (
        <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>{t('measurements.notFoundOrError')}</Text>
            <Button title={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
    );
  }

  return (
    <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <MeasurementForm
          initialData={initialMeasurementData} // Pass null for Add mode
          onSubmit={handleFormSubmit}
          isLoading={isLoading && !isFetchingDetails} // Disable form fields only when submitting, not when fetching details for edit
        />
        {error && (
          <Text style={styles.errorText}>{String(error)}</Text>
        )}
        {/* The submit button is now part of MeasurementForm */}
      </View>
    </ScrollView>
  );
};

export default AddEditMeasurementScreen;
