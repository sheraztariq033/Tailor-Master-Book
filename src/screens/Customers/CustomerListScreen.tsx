import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; // For Search
import CustomerListItem from '../../components/specific/customers/CustomerListItem';
import { CustomersStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCustomers, clearCustomerError, Customer } from '../../store/slices/customerSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import Loader from '../../components/ui/Loader';

type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomerList'>;

const CustomerListScreen: React.FC<Props> = ({navigation, route}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {customers, isLoading, error} = useAppSelector(state => state.customer);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCustomers = useCallback((showLoader = true) => {
    if(showLoader) setIsRefreshing(true);
    dispatch(fetchCustomers())
      .finally(() => {
        if(showLoader) setIsRefreshing(false);
      });
  }, [dispatch]);

  // Fetch customers on initial mount and on focus
  useFocusEffect(
    useCallback(() => {
      loadCustomers(false); // Don't show pull-to-refresh loader on focus, main loader handles it
      return () => {
        dispatch(clearCustomerError());
      };
    }, [loadCustomers, dispatch])
  );
  
  // Handle refresh from route params (e.g., after adding/editing a customer)
  useEffect(() => {
    if (route.params?.refresh) {
      loadCustomers(false);
      navigation.setParams({ refresh: false }); // Reset param
    }
  }, [route.params?.refresh, loadCustomers, navigation]);


  // Local search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = customers.filter(
        customer =>
          customer.name.toLowerCase().includes(lowercasedQuery) ||
          customer.phoneNumber.includes(lowercasedQuery) ||
          (customer.email && customer.email.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
      padding: 20,
    },
    emptyListText: {
      ...typography.h4,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    listContentContainer: {
      paddingHorizontal: 10,
      paddingBottom: 80, // Space for FAB or bottom elements
    },
    searchBarContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: colors.surface, // Or colors.background
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    addButtonContainer: { // For a FAB-like button
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1,
    }
  });

  if (isLoading && customers.length === 0 && !isRefreshing) { // Show full screen loader only on initial load
    return (
      <View style={styles.loaderContainer}>
        <Loader size="large" />
      </View>
    );
  }

  if (error && customers.length === 0) {
    return <Text style={styles.errorText}>{t('common.errorLoading', {entity: t('customers.title')})}: {String(error)}</Text>;
  }

  return (
    <View style={styles.container}>
        <View style={styles.searchBarContainer}>
            <Input
                placeholder={t('customers.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                // Add any other props like clear button if Input supports it
            />
        </View>
      {filteredCustomers.length === 0 && !isLoading ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>{t('customers.noCustomersFound')}</Text>
          <Button
            title={t('customers.addNewButton')}
            onPress={() => navigation.navigate('AddEditCustomer', {})}
          />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={({item}) => (
            <CustomerListItem
              customer={item}
              onPress={() => navigation.navigate('CustomerDetail', {customerId: item.id})}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCustomers(true)}
              colors={[colors.primary]} // Android
              tintColor={colors.primary} // iOS
            />
          }
          ListFooterComponent={isLoading && customers.length > 0 ? <Loader /> : null} // Show loader at bottom if loading more
        />
      )}
      {/* Add Customer Button (FAB style) */}
      <View style={styles.addButtonContainer}>
        <Button 
            title="+" // Or use an Icon component
            onPress={() => navigation.navigate('AddEditCustomer', {})}
            style={{width: 60, height: 60, borderRadius: 30, paddingVertical:0, paddingHorizontal:0, elevation:5 }} // Basic FAB styling
            textStyle={{fontSize: 24, lineHeight: 28, fontWeight: 'bold'}}
        />
      </View>
    </View>
  );
};

export default CustomerListScreen;
