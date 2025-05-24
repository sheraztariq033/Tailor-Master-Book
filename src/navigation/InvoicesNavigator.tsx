import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {InvoicesStackParamList} from './navigationTypes';

// Placeholder Screens - these would be in src/screens/Invoices/
import InvoiceListScreen from '../screens/Invoices/InvoiceListScreen';
import InvoiceDetailScreen from '../screens/Invoices/InvoiceDetailScreen';
import ReceiptViewScreen from '../screens/Invoices/ReceiptViewScreen'; // Import ReceiptViewScreen
import FinancialReportScreen from '../screens/Reports/FinancialReportScreen'; // Import FinancialReportScreen
import { useTranslation } from 'react-i18next'; // For screen titles


const Stack = createNativeStackNavigator<InvoicesStackParamList>();

const InvoicesNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator initialRouteName="InvoiceList" screenOptions={{headerShown: true}}>
      <Stack.Screen 
        name="InvoiceList" 
        component={InvoiceListScreen} 
        options={{title: t('invoices.titleMultiple')}}
      />
      <Stack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen} 
        // Title for InvoiceDetail is set dynamically in the screen itself
      />
      <Stack.Screen 
        name="ReceiptView"
        component={ReceiptViewScreen}
        options={{ title: t('invoices.receiptTitle') }} 
      />
      <Stack.Screen
        name="FinancialReport"
        component={FinancialReportScreen}
        options={{ title: t('reports.financialReportTitle') }}
      />
    </Stack.Navigator>
  );
};

export default InvoicesNavigator;
