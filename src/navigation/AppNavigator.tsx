import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './navigationTypes';

import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainAppNavigator from './MainAppNavigator';
import PublicOrderTrackingNavigator from './PublicOrderTrackingNavigator'; // Import the new navigator

// For now, let's assume we have a way to determine the initial route.
// This would typically come from an auth state listener or a persisted flag.
const AppState = {
  isLoggedIn: false, // Example: Set to true to skip Auth
  hasCompletedOnboarding: false, // Example: Set to true to skip Onboarding
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  let initialRouteName: keyof RootStackParamList = 'Auth';

  if (AppState.isLoggedIn) {
    if (AppState.hasCompletedOnboarding) {
      initialRouteName = 'MainApp';
    } else {
      initialRouteName = 'Onboarding';
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false}}>
        {/* Group for main app flow */}
        <Stack.Group>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
            <Stack.Screen name="MainApp" component={MainAppNavigator} />
        </Stack.Group>
        
        {/* Group for modals presented over the main app flow */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen 
                name="PublicOrderTrackingModal" 
                component={PublicOrderTrackingNavigator} 
                // options={{ headerShown: false }} // Or customize header for the modal stack
            />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
