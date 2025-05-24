import React, {useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import { CustomersStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCustomerDetails, clearSelectedCustomer, clearCustomerError, removeCustomer } from '../../store/slices/customerSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomerDetail'>;

const CustomerDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();
  const {customerId} = route.params;

  const {selectedCustomer, isLoading, error} = useAppSelector(state => state.customer);

  const loadData = useCallback(() => {
    if (customerId) {
      dispatch(fetchCustomerDetails(customerId));
    }
  }, [dispatch, customerId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        // Clear selected customer when screen loses focus,
        // so it's fresh if another customer detail is viewed next.
        // However, if navigating to Edit screen, we might want to keep it.
        // For now, let's clear it. AddEditCustomerScreen will re-fetch if needed.
        dispatch(clearSelectedCustomer());
        dispatch(clearCustomerError());
      };
    }, [dispatch, loadData])
  );

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.id === customerId) {
      navigation.setOptions({ title: selectedCustomer.name });
    } else {
      navigation.setOptions({ title: t('customers.detailTitle') });
    }
  }, [navigation, selectedCustomer, customerId, t]);


  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    Alert.alert(
      t('customers.deleteConfirmTitle', {name: selectedCustomer.name}),
      t('customers.deleteConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            const resultAction = await dispatch(removeCustomer(selectedCustomer.id));
            if (removeCustomer.fulfilled.match(resultAction)) {
              Alert.alert(t('customers.deleteSuccessTitle'), t('customers.deleteSuccessMessage', {name: selectedCustomer.name}));
              navigation.navigate('CustomerList', {refresh: true});
            } else {
              // Error is handled by the customerError state variable
            }
          }
        }
      ]
    );
  };
  
  // Dynamic styles
  const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      padding: 20,
    },
    headerCard: {
      marginBottom: 15,
      padding: 20, // More padding for header
    },
    customerName: {
      ...typography.h2,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    contactInfoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    customerPhone: {
      ...typography.h5,
      color: colors.primary,
      marginBottom: 5,
    },
    customerEmail: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: 10,
      textAlign: 'center'
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 5,
    },
    tagBadge: {
      margin: 3,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.textSecondary,
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 5, // Align with card padding
    },
    detailItem: {
      ...typography.body,
      color: colors.text,
      marginBottom: 8,
    },
    detailLabel: {
        ...typography.body,
        fontWeight: typography.fontWeights.semibold,
        color: colors.textSecondary,
    },
    notesText: {
      ...typography.body,
      color: colors.text,
      fontStyle: 'italic',
      lineHeight: typography.body.fontSize * 1.5,
    },
    actionsContainer: {
      marginTop: 20,
      marginBottom: 20,
    },
    actionButton: {
      marginVertical: 6,
    },
    deleteButtonText: { // Custom style for delete button text
      color: colors.error, 
      fontWeight: typography.fontWeights.bold,
    },
    placeholderText: {
      ...typography.body,
      color: colors.textDisabled,
      textAlign: 'center',
      paddingVertical: 20,
    }
  });


  if (isLoading && !selectedCustomer) {
    return (
      <View style={styles.loaderContainer}>
        <Loader size="large" />
      </View>
    );
  }

  if (error && !selectedCustomer) {
    return <Text style={styles.errorText}>{t('common.errorLoadingDetails', {entity: t('customers.singular')})}: {String(error)}</Text>;
  }

  if (!selectedCustomer) {
    // This might happen briefly or if customerId is invalid
    return (
        <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>{t('customers.notFound')}</Text>
            <Button title={t('common.backToList')} onPress={() => navigation.navigate('CustomerList')} />
        </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <Card style={styles.headerCard}>
        <Text style={styles.customerName}>{selectedCustomer.name}</Text>
        <View style={styles.contactInfoContainer}>
            <Text style={styles.customerPhone}>{selectedCustomer.phoneNumber}</Text>
        </View>
        {selectedCustomer.email && <Text style={styles.customerEmail}>{selectedCustomer.email}</Text>}
        {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
            <View style={styles.tagsContainer}>
            {selectedCustomer.tags.map(tag => (
                <Badge key={tag} label={tag} type="info" style={styles.tagBadge} />
            ))}
            </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{t('customers.form.addressLabel')}</Text>
        <Text style={styles.detailItem}>{selectedCustomer.address || t('common.notSet')}</Text>
      </Card>
      
      <Card>
        <Text style={styles.sectionTitle}>{t('customers.form.notesLabel')}</Text>
        <Text style={styles.notesText}>{selectedCustomer.notes || t('common.noNotes')}</Text>
      </Card>
      
      {/* TODO: Add other info like Created At, Last Updated At if needed from selectedCustomer */}
      {/* <Card>
        <Text style={styles.sectionTitle}>{t('common.activity')}</Text>
        <Text style={styles.detailItem}><Text style={styles.detailLabel}>{t('common.memberSince')}:</Text> {new Date(selectedCustomer.createdAt._seconds * 1000).toLocaleDateString()}</Text>
      </Card> */}


      <Text style={styles.sectionTitle}>{t('measurements.title')}</Text>
      {/* Integrate MeasurementList component here */}
      {selectedCustomer && (
        <MeasurementList 
          customerId={selectedCustomer.id}
          onEditMeasurement={(measurement) => {
            // Navigate to AddEditMeasurementScreen in Edit mode
            navigation.navigate('AddEditMeasurement', {
              customerId: selectedCustomer.id,
              measurementId: measurement.id, // Pass measurementId for edit mode
              // measurementData: measurement, // Pass the whole measurement object
            });
          }}
          onAddNewMeasurement={() => {
            // Navigate to AddEditMeasurementScreen in Add mode
            navigation.navigate('AddEditMeasurement', { customerId: selectedCustomer.id });
          }}
        />
      )}
      {/* The AddNewMeasurement button is now part of MeasurementList when empty, 
          or can be a separate FAB on CustomerDetailScreen if desired for consistency.
          For now, MeasurementList handles its own "Add" button when empty.
          If we want a persistent "Add Measurement" button on CustomerDetailScreen:
      */}
      {selectedCustomer && (
         <Button 
            title={t('measurements.addNewButton')} 
            onPress={() => navigation.navigate('AddEditMeasurement', { customerId: selectedCustomer.id })}
            variant="outline" // Or some other style
            style={{marginHorizontal: 10, marginTop: 10}} // Adjust styling
        />
      )}


      <View style={styles.actionsContainer}>
        <Button 
          title={t('common.editEntity', {entity: t('customers.singular')})} 
          onPress={() => navigation.navigate('AddEditCustomer', {customerId: selectedCustomer.id})} 
          style={styles.actionButton}
        />
        <Button 
          title={t('orders.addNewForCustomer', {customerName: selectedCustomer.name.split(' ')[0]})} 
          onPress={() => console.log("Navigate to Add Order for customerId:", selectedCustomer.id)} // Placeholder
          style={styles.actionButton}
          variant="secondary" 
        />
         <Button 
          title={t('common.deleteEntity', {entity: t('customers.singular')})}
          onPress={handleDeleteCustomer}
          variant="text" 
          style={styles.actionButton}
          textStyle={styles.deleteButtonText}
          disabled={isLoading} // Disable if an operation (like delete) is in progress
        />
      </View>
    </ScrollView>
  );
};

export default CustomerDetailScreen;
