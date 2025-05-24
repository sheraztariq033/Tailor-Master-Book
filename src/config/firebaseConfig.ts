// This file contains the Firebase configuration for the Darzi Book mobile app.
// IMPORTANT: Replace placeholder values with your actual Firebase project's web app configuration.
// You can find these details in the Firebase console:
// Project settings > General > Your apps > Web app > SDK setup and configuration > Config

export const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY_PLACEHOLDER", // Replace with actual key
  authDomain: "darzi-book-mobile-app.firebaseapp.com",
  projectId: "darzi-book-mobile-app",
  storageBucket: "darzi-book-mobile-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER", // Replace
  appId: "YOUR_APP_ID_PLACEHOLDER", // Replace
  measurementId: "YOUR_MEASUREMENT_ID_PLACEHOLDER" // Optional, replace if using Google Analytics
};

// You might also want to initialize Firebase here or in a separate service file,
// but for now, this file just exports the configuration object.
// Example (do not uncomment here, typically done in a service file or App.tsx root):
/*
import firebase from '@react-native-firebase/app'; // If using react-native-firebase
// import { initializeApp } from "firebase/app"; // If using Firebase JS SDK v9+

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// For Firebase JS SDK v9+
// const app = initializeApp(firebaseConfig);

export default firebase; // or export app
*/
