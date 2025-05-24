import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {CustomersStackParamList} from './navigationTypes';

// Screens
import CustomerListScreen from '../screens/Customers/CustomerListScreen';
import CustomerDetailScreen from '../screens/Customers/CustomerDetailScreen';
import AddEditCustomerScreen from '../screens/Customers/AddEditCustomerScreen';
import AddEditMeasurementScreen from '../screens/Measurements/AddEditMeasurementScreen'; // Import the new screen
import { useTranslation } from 'react-i18next'; // For screen titles

const Stack = createNativeStackNavigator<CustomersStackParamList>();

const CustomersNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator initialRouteName="CustomerList" screenOptions={{headerShown: true}}>
      <Stack.Screen 
        name="CustomerList" 
        component={CustomerListScreen} 
        options={{title: t('customers.title')}} 
      />
      <Stack.Screen 
        name="CustomerDetail" 
        component={CustomerDetailScreen} 
        // Title for CustomerDetail is set dynamically in the screen itself
      />
      <Stack.Screen 
        name="AddEditCustomer" 
        component={AddEditCustomerScreen} 
        // Title for AddEditCustomer is set dynamically in the screen itself
      />
      <Stack.Screen 
        name="AddEditMeasurement" 
        component={AddEditMeasurementScreen} 
        // Title for AddEditMeasurement will be set dynamically in the screen
        // options={{ title: t('measurements.addTitle') }} // Or set dynamically
      />
    </Stack.Navigator>
  );
};

export default CustomersNavigator;
