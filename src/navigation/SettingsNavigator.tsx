import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SettingsStackParamList} from './navigationTypes';
import { useTranslation } from 'react-i18next';

import SettingsScreen from '../screens/Settings/SettingsScreen'; // Renamed from SettingsHomeScreen for clarity
import ManageMeasurementTemplatesScreen from '../screens/Settings/ManageMeasurementTemplatesScreen'; // Will create
import AddEditMeasurementTemplateScreen from '../screens/Settings/AddEditMeasurementTemplateScreen'; // Will create

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator initialRouteName="SettingsHome">
      <Stack.Screen 
        name="SettingsHome" 
        component={SettingsScreen} 
        options={{ title: t('settingsScreen.title') }} 
      />
      <Stack.Screen 
        name="ManageMeasurementTemplates" 
        component={ManageMeasurementTemplatesScreen} 
        options={{ title: t('templates.manageTitle') }} 
      />
      <Stack.Screen 
        name="AddEditMeasurementTemplate" 
        component={AddEditMeasurementTemplateScreen} 
        // Title will be set dynamically in the screen (Add New / Edit Template)
      />
      {/* Add other settings-related screens here */}
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
