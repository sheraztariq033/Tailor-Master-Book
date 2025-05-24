import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';

// Initialize i18next (must be imported before any components that use t function)
import './src/config/i18n';

// Firebase
import firebase from '@react-native-firebase/app';
import { firebaseConfig } from './src/config/firebaseConfig';

import AppNavigator from './src/navigation/AppNavigator';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import { Provider, useSelector } from 'react-redux'; // Added useSelector
import { store, RootState, useAppDispatch } from './src/store'; // Added RootState, useAppDispatch
import * as notificationService from './src/services/notificationService';
import { Alert } from 'react-native'; // To display foreground notifications
import { useTranslation } from 'react-i18next'; // For notification text
import { checkAuthState } from './src/store/slices/authSlice'; // To check auth state

// Initialize Firebase if not already initialized
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig)
    .then(() => console.log('Firebase initialized successfully'))
    .catch(error => console.error('Firebase initialization error', error));
}

// Component to handle notification setup once user is authenticated
const NotificationSetup: React.FC = () => {
    const {t} = useTranslation();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const firebaseUser = useSelector((state: RootState) => state.auth.firebaseUser);

    useEffect(() => {
        if (isAuthenticated && firebaseUser) {
            const setupNotifications = async () => {
                const permissionGranted = await notificationService.requestUserPermission();
                if (permissionGranted) {
                    const token = await notificationService.getFCMToken();
                    if (token) {
                        // TODO: Save token to user profile via a Cloud Function
                        // This would typically involve dispatching a Redux action
                        // which calls a service function (e.g., in authService or userService)
                        // that then calls the Cloud Function.
                        console.log('FCM Token obtained:', token);
                        notificationService.saveFCMTokenToProfile(token); // Placeholder call
                    }

                    // Foreground messages
                    const unsubscribeOnMessage = notificationService.onMessage(message => {
                        Alert.alert(
                            message.notification?.title || t('notifications.newMessageTitle'),
                            message.notification?.body || t('notifications.newMessageBody'),
                        );
                    });

                    // Notification opened app (background)
                    const unsubscribeOnNotificationOpened = notificationService.onNotificationOpenedApp(message => {
                        // Handle navigation or other actions based on message.data
                        console.log('App opened by notification (background):', message);
                        // Example: if (message.data?.navigateTo) navigation.navigate(message.data.navigateTo);
                    });
                    
                    return () => {
                        unsubscribeOnMessage();
                        unsubscribeOnNotificationOpened();
                    };
                } else {
                    console.log('Notification permission denied.');
                }
            };
            setupNotifications();
        }
    }, [isAuthenticated, firebaseUser, t]);
    
    // Check for initial notification if app was opened from quit state
    useEffect(() => {
        notificationService.getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened by initial notification (quit state):', remoteMessage);
                // Handle navigation or other actions
            }
        });
    }, []);


    return null; // This component does not render anything
};


// Main App component that sets up providers
const AppContent: React.FC = () => {
  const {colors, isDarkMode} = useTheme(); // Use our theme context
  const dispatch = useAppDispatch();

  // Check auth state on initial load
  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);


  const backgroundStyle = {
    backgroundColor: colors.background, // Use themed background
    flex: 1,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.statusBar} // Use themed status bar color
      />
      <AppNavigator />
      <NotificationSetup /> {/* Add NotificationSetup here */}
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
