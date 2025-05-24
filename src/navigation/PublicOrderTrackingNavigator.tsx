import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PublicOrderTrackingStackParamList} from './navigationTypes';
import { useTranslation } from 'react-i18next';

import EnterOrderTokenScreen from '../screens/PublicOrderTracking/EnterOrderTokenScreen'; // Will create
import PublicOrderDetailScreen from '../screens/PublicOrderTracking/PublicOrderDetailScreen'; // Will create

const Stack = createNativeStackNavigator<PublicOrderTrackingStackParamList>();

const PublicOrderTrackingNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator initialRouteName="EnterOrderToken">
      <Stack.Screen 
        name="EnterOrderToken" 
        component={EnterOrderTokenScreen} 
        options={{ title: t('publicOrderTracking.enterTokenTitle') }} 
      />
      <Stack.Screen 
        name="PublicOrderDetail" 
        component={PublicOrderDetailScreen} 
        options={{ title: t('publicOrderTracking.detailTitle') }}
      />
    </Stack.Navigator>
  );
};

export default PublicOrderTrackingNavigator;
