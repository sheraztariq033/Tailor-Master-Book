/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import { backgroundMessageHandler } from './src/services/notificationService'; // Import the handler logic

// Register background handler
// This must be done outside of the component lifecycle, i.e., at the root of your application.
// It must be registered as early as possible.
messaging().setBackgroundMessageHandler(backgroundMessageHandler);


AppRegistry.registerComponent(appName, () => App);
