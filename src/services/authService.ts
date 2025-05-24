import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import { User } from '../store/slices/authSlice'; // Import User type

// Define payload types for clarity, matching authSlice if possible
export interface EmailPasswordPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends EmailPasswordPayload {
  name?: string; // Name might be handled during onboarding or a separate profile update
}

// --- Firebase Auth Functions ---

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.User | null> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error in signInWithEmail:', error.code, error.message);
    throw error; // Re-throw to be caught by Redux thunk
  }
};

export const createUserWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.User | null> => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    // The onUserCreate Cloud Function trigger handles initial Firestore user doc creation.
    return userCredential.user;
  } catch (error: any) {
    console.error('Error in createUserWithEmail:', error.code, error.message);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch (error: any) {
    console.error('Error in signOutUser:', error.code, error.message);
    throw error;
  }
};

export const onFirebaseAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => { // Returns the unsubscribe function
  return auth().onAuthStateChanged(callback);
};

export const sendFirebasePasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error: any) {
    console.error('Error in sendFirebasePasswordResetEmail:', error.code, error.message);
    throw error;
  }
};

export const getCurrentFirebaseUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

// --- Firebase Cloud Functions ---

export const callGetUserProfile = async (): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getUserProfileCallable = functions().httpsCallable('getUserProfile');
    const result = await getUserProfileCallable();
    // Expected result.data: { success: true, profile: User } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callGetUserProfile:', error.code, error.message, error.details);
    throw error; // Re-throw to be caught by Redux thunk
  }
};

export const callUpdateUserProfile = async (profileData: Partial<User>): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateUserProfileCallable = functions().httpsCallable('updateUserProfile');
    const result = await updateUserProfileCallable(profileData);
    // Expected result.data: { success: true, message: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateUserProfile:', error.code, error.message, error.details);
    throw error;
  }
};

// Example of how to update display name directly in Firebase Auth (optional, if not handled by profile)
export const updateFirebaseAuthDisplayName = async (displayName: string): Promise<void> => {
    const user = auth().currentUser;
    if (user) {
        try {
            await user.updateProfile({ displayName });
        } catch (error: any) {
            console.error('Error updating Firebase Auth display name:', error);
            throw error;
        }
    } else {
        throw new Error("No user currently signed in to update display name.");
    }
};
