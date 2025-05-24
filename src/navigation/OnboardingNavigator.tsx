import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from './navigationTypes';

// Placeholder Screens - these would be in src/screens/Onboarding/
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import BusinessTypeScreen from '../screens/Onboarding/BusinessTypeScreen';
import TemplateSelectionScreen from '../screens/Onboarding/TemplateSelectionScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="BusinessType" component={BusinessTypeScreen} />
      <Stack.Screen name="TemplateSelection" component={TemplateSelectionScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
