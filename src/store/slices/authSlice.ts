import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as authService from '../../services/authService'; // Will create this service
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Define User interface based on Firestore structure
export interface User {
  id: string; // UID from Firebase Auth
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  businessName?: string | null;
  suitTypes?: string[] | null;
  language?: string | null;
  theme?: string | null;
  isPremium?: boolean | null;
  createdAt?: string | { _seconds: number, _nanoseconds: number } | null; // Firestore timestamp
  updatedAt?: string | { _seconds: number, _nanoseconds: number } | null;
}

export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseAuthTypes.User | null; // Store the raw Firebase user object if needed
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null | unknown; // Allow for unknown error types
  isProfileComplete: boolean | null; // To help with routing to onboarding
}

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isProfileComplete: null,
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({email, password}: authService.EmailPasswordPayload, {dispatch, rejectWithValue}) => {
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      if (firebaseUser) {
        dispatch(fetchAndSetUserProfile(firebaseUser.uid)); // Fetch profile after login
      }
      return firebaseUser; // This will be FirebaseAuthTypes.UserCredential.user
    } catch (error: any) {
      return rejectWithValue(error.message || error.code || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({email, password, name}: authService.RegisterPayload, {dispatch, rejectWithValue}) => {
    try {
      const firebaseUser = await authService.createUserWithEmail(email, password);
      // onUserCreate trigger in Cloud Functions will create the Firestore user document.
      // We can update the profile with the name immediately after if needed, or handle during onboarding.
      if (firebaseUser && name) {
         // Optionally update profile with name right after registration, or handle in onboarding
         // For now, just fetch the profile, onUserCreate trigger should handle default name
        dispatch(fetchAndSetUserProfile(firebaseUser.uid));
      }
      return firebaseUser;
    } catch (error: any) {
      return rejectWithValue(error.message || error.code || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, {rejectWithValue}) => {
    try {
      await authService.signOutUser();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, {dispatch, rejectWithValue}) => {
    try {
      // This promise will resolve with the user object if logged in, or null if not.
      const firebaseUser = await new Promise<FirebaseAuthTypes.User | null>((resolve) => {
        const unsubscribe = authService.onFirebaseAuthStateChanged(user => {
          unsubscribe(); // Unsubscribe after first emission
          resolve(user);
        });
      });

      if (firebaseUser) {
        dispatch(fetchAndSetUserProfile(firebaseUser.uid));
        return firebaseUser; // Return the raw Firebase user object
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auth state check failed');
    }
  }
);

export const sendPasswordResetEmail = createAsyncThunk(
  'auth/sendPasswordResetEmail',
  async ({email}: {email: string}, {rejectWithValue}) => {
    try {
      await authService.sendFirebasePasswordResetEmail(email);
      return true; // Indicate success
    } catch (error: any) {
      return rejectWithValue(error.message || error.code || 'Password reset email failed');
    }
  }
);

export const fetchAndSetUserProfile = createAsyncThunk(
  'auth/fetchAndSetUserProfile',
  async (userId: string, {rejectWithValue}) => {
    try {
      const userProfileResult = await authService.callGetUserProfile() as FirebaseFunctionsTypes.HttpsCallableResult;
      // Assuming the cloud function returns { success: true, profile: User }
      if (userProfileResult && userProfileResult.data && (userProfileResult.data as any).success) {
        return (userProfileResult.data as any).profile as User;
      }
      throw new Error((userProfileResult.data as any).message || 'User profile not found or error fetching.');
    } catch (error: any) {
      console.error("fetchAndSetUserProfile error:", error);
      return rejectWithValue(error.data?.message || error.message || error.code || 'Failed to fetch user profile');
    }
  }
);


// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUserManually: (state, action: PayloadAction<User | null>) => { // For testing or specific cases
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isProfileComplete = !!(action.payload && action.payload.businessName);
    },
    setFirebaseUserManually: (state, action: PayloadAction<FirebaseAuthTypes.User | null>) => {
        state.firebaseUser = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<FirebaseAuthTypes.User | null>) => {
      // isLoading will be set to false by fetchAndSetUserProfile if dispatched
      // state.isAuthenticated = !!action.payload; // Handled by fetchAndSetUserProfile
      state.firebaseUser = action.payload;
      // User profile and isAuthenticated set by fetchAndSetUserProfile
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Login failed';
      state.user = null;
      state.firebaseUser = null;
      state.isAuthenticated = false;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<FirebaseAuthTypes.User | null>) => {
      // isLoading will be set to false by fetchAndSetUserProfile if dispatched
      // state.isAuthenticated = !!action.payload; // Handled by fetchAndSetUserProfile
      state.firebaseUser = action.payload;
      // User profile and isAuthenticated set by fetchAndSetUserProfile
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Registration failed';
      state.user = null;
      state.firebaseUser = null;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.firebaseUser = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isProfileComplete = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Logout failed';
      // Keep user state as is, or clear it depending on desired behavior on failed logout
    });

    // Check Auth State
    builder.addCase(checkAuthState.pending, (state) => {
      state.isLoading = true; // Could be a silent loading state
    });
    builder.addCase(checkAuthState.fulfilled, (state, action: PayloadAction<FirebaseAuthTypes.User | null>) => {
      // isLoading will be set to false by fetchAndSetUserProfile if dispatched
      state.firebaseUser = action.payload;
      if (!action.payload) { // If no firebaseUser, means not authenticated
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.isProfileComplete = null;
      }
      // If action.payload exists, fetchAndSetUserProfile will handle other states
    });
    builder.addCase(checkAuthState.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Auth check failed';
      state.isAuthenticated = false;
      state.user = null;
      state.firebaseUser = null;
      state.isProfileComplete = null;
    });

    // Fetch User Profile
    builder.addCase(fetchAndSetUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAndSetUserProfile.fulfilled, (state, action: PayloadAction<User | null>) => {
      state.isLoading = false;
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
  // Check for profile completeness based on critical onboarding fields
        state.isProfileComplete = !!(
          action.payload.name && // Name is crucial
          action.payload.businessName && // Business name is crucial
          action.payload.suitTypes && // Suit types selection is crucial
          action.payload.suitTypes.length > 0
        );
      } else {
        // This case might happen if the user exists in Firebase Auth but not in Firestore,
        // or if callGetUserProfile returns an error handled as success by the thunk logic.
        state.user = null;
        state.isAuthenticated = false; // If no profile, treat as not fully authenticated
        state.isProfileComplete = false;
        // state.error = 'User profile could not be fetched.'; // Or handle error from payload
      }
    });
    builder.addCase(fetchAndSetUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch profile';
      state.user = null; // Keep firebaseUser as is, but clear local profile
      // isAuthenticated might remain true if firebaseUser exists, but profile is crucial
      // For onboarding, if profile fetch fails, user effectively cannot proceed.
      state.isAuthenticated = !!state.firebaseUser; // Base auth on firebaseUser
      state.isProfileComplete = false;
    });

    // Complete Onboarding
    builder.addCase(completeOnboarding.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    // Fulfilled/rejected for completeOnboarding is handled by fetchAndSetUserProfile which it dispatches

    // Send Password Reset Email
    builder.addCase(sendPasswordResetEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
    });
    builder.addCase(sendPasswordResetEmail.fulfilled, (state) => {
        state.isLoading = false;
        // Optionally set a success message in state if needed by UI
    });
    builder.addCase(sendPasswordResetEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to send password reset email.';
    });
  },
});

export const { clearError, setUserManually, setFirebaseUserManually } = authSlice.actions;


// Selector to get only the required fields for onboarding check
export const selectOnboardingStatus = (state: { auth: AuthState }) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isProfileComplete: state.auth.isProfileComplete,
  isLoading: state.auth.isLoading,
  firebaseUser: state.auth.firebaseUser, // To get UID if needed for initial profile data
  user: state.auth.user, // To pre-fill name if available
});

export default authSlice.reducer;
